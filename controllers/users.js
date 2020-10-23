/* eslint-disable no-console */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const ServerError = require('../errors/server-err');
const RequestError = require('../errors/request-err');
const NotFoundError = require('../errors/not-found-err');
const DuplicateError = require('../errors/duplicate-err');
// const AuthError = require('../errors/auth-err');

const { NODE_ENV, JWT_SECRET } = process.env;

const readUsers = (req, res, next) => {
  User.find({})
    .then((user) => {
      if (!user) {
        throw new ServerError('На сервере произошла ошибка');
      }
      res.send({ data: user });
    })
    .catch(next);
};

const readUserById = (req, res, next) => {
  User.findById(req.params.id)
    .orFail(() => {
      throw new NotFoundError('Нет пользователя с таким id');
    })
    .then((user) => res.send({ data: user }))
    .catch(next);
};

const createUser = (req, res, next) => {
  const {
    name, about, avatar, email, password,
  } = req.body;
  if (
    password.length < 8
    || password.split('').every(
      (elem, index, array) => elem === array[0],
    )
  ) {
    res.status(400).send({ message: 'Пароль не соответствует требованиям' });
    return;
  }

  bcrypt.hash(password, 10)
    .then((hash) => User.create({
      name, about, avatar, email, password: hash,
    }))
    .then((user) => res.status(201).send({
      data: {
        name: user.name, about: user.about, avatar: user.avatar, email: user.email,
      },
    }))
    .catch((err) => {
      // let error;
      if (err.name === 'MongoError' && err.code === 11000) {
        next(new DuplicateError('Повторный email'));
      } else {
        next(new RequestError('Ошибка валидации полей пользователя'));
      }
    });
  // .catch((err) => {
  //   let errStatus;
  //   let errMessage;
  //   if (err.name === 'MongoError' && err.code === 11000) {
  //     errStatus = 409;
  //     errMessage = 'Повторный email';
  //   } else {
  //     errStatus = 400;
  //     errMessage = 'Ошибка валидации полей пользователя';
  //   }
  //   res.status(errStatus).send({ message: errMessage });
  // });
};

const updateUser = (req, res, next) => {
  const { name, about } = req.body;

  User.findByIdAndUpdate(req.user._id, { name, about })
    .orFail(() => {
      throw new ServerError('Ошибка сервера - обновление не удалось сохранить');
    })
    .then(() => res.status(200).send({ data: { name, about } }))
    .catch(next);
};

const updateUserAvatar = (req, res, next) => {
  const { avatar } = req.body;

  User.findByIdAndUpdate(req.user._id, { avatar })
    .orFail(() => {
      throw new ServerError('Ошибка сервера - обновление не удалось сохранить');
    })
    .then(() => res.status(200).send({ data: { avatar } }))
    .catch(next);
};

const login = (req, res, next) => {
  const { email, password } = req.body;

  return User.findUserByCredentials(email, password)
    // .orFail(() => {
    //   throw new AuthError('Пользователь не найден');
    // })
    .then((user) => {
      // if (!user) {
      //   throw new AuthError('Пользователь не найден');
      // }
      const token = jwt.sign({ _id: user.id },
        NODE_ENV === 'production' ? JWT_SECRET : 'dev-super-duper-secret',
        { expiresIn: '7d' });
      res.cookie('jwt', token, {
        maxAge: 3600000 * 24 * 7,
        httpOnly: true,
        sameSite: true,
      })
        .status(200)
        .send({ message: 'Удачный логин' });
    })
    .catch(next);
};

module.exports = {
  readUsers, readUserById, createUser, updateUser, updateUserAvatar, login,
};
