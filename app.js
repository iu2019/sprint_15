const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();

const urlPattern = '/http[s]?://((([w-]+.)*w{2,3})|((([1-9][0-9]{0,1}|1[0-9]{2}|2[0-4][0-9]|25[0-5]).){3}([1-9][0-9]{0,1}|1[0-9]{2}|2[0-4][0-9]|25[0-5])))(:[1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]{1}|6553[0-5])?((/[w-]+)*/?#?)/';

const { celebrate, Joi } = require('celebrate');
const { errors } = require('celebrate');
const cookieParser = require('cookie-parser');

const auth = require('./middlewares/auth');

const readUsers = require('./routes/users');
const readCards = require('./routes/cards');
const { login, createUser } = require('./controllers/users');

const { requestLogger, errorLogger } = require('./middlewares/logger');

const { PORT = 3000 } = process.env;
const app = express();

app.use(requestLogger);
app.use(cookieParser());

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
  login);
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
app.use('/', readCards);
// app.use('/', (req, res) => {
//   res.set({ 'content-type': 'application/json; charset=utf-8' });
//   res.status(404).end(JSON.stringify({ message: 'Запрашиваемый ресурс не найден' }), 'utf8');
// });

app.use(errorLogger); // подключаем логгер ошибок

app.use(errors()); // обработчик ошибок celebrate

app.use((err, req, res) => { // Централизованный обработчик ошибок. Добавь next, если понадобится
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
