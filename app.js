const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();

const urlPattern = new RegExp(/^http[s]?:\/\/((([\w-]+\.)*\w{2,3})|((([1-9][0-9]{0,1}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([1-9][0-9]{0,1}|1[0-9]{2}|2[0-4][0-9]|25[0-5])))(:[1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]{1}|6553[0-5])?((\/[\w-]+)*\/?#?)/);

const { celebrate, Joi, errors } = require('celebrate');

const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const auth = require('./middlewares/auth');

const readUsers = require('./routes/users');
const readCards = require('./routes/cards');
const { login, createUser } = require('./controllers/users');

const { requestLogger, errorLogger } = require('./middlewares/logger');

const { PORT = 3000 } = process.env;
const app = express();
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

const RequestError = require('./errors/request-err');

app.use(apiLimiter);
app.use(helmet());

app.use(requestLogger);
app.use(cookieParser());

app.get('/crash-test', () => {
  setTimeout(() => {
    throw new Error('Сервер сейчас упадёт');
  }, 0);
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect('mongodb://localhost:27017/mestodb', {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
});
mongoose.set('runValidators', true);

app.post('/signin',
  celebrate({
    body: Joi.object().keys({
      email: Joi.string().required().email(),
      password: Joi.string().required().pattern(/\S+/),
    }),
  }), login);

app.post('/signup',
  celebrate({
    body: Joi.object().keys({
      name: Joi.string().required().min(2).max(30),
      about: Joi.string().required().min(2).max(30),
      avatar: Joi.string().required().pattern(urlPattern),
      email: Joi.string().required().email(),
      password: Joi.string().required().min(8),
    }),
  }),
  createUser);

app.use(auth);

app.use('/users', readUsers);
app.use('/cards', readCards);

app.use(errorLogger); // подключаем логгер ошибок

app.use('*', () => {
  throw new RequestError('Ошибка в формате запроса');
});

app.use(errors()); // обработчик ошибок celebrate

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => { // Централизованный обработчик ошибок.
  const { statusCode = 500, message } = err;

  res.status(statusCode)
    .send({
      message: statusCode === 500
        ? 'На сервере произошла ошибка'
        : message,
    });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`App listening on port ${PORT}`);
});
