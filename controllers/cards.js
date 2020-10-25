const Card = require('../models/card');
const ServerError = require('../errors/server-err');
const RequestError = require('../errors/request-err');
const NotFoundError = require('../errors/not-found-err');
const ForbiddenError = require('../errors/forbidden-err');

const readCards = (req, res, next) => {
  Card.find({})
    .then((card) => {
      if (!card) {
        throw new ServerError('На сервере произошла ошибка');
      }
      res.send({ data: card });
    })
    .catch(next);
};

const createCard = (req, res, next) => {
  const { name, link } = req.body;
  const id = req.user._id;

  Card.create({ name, link, owner: id })
    .then((card) => {
      res.status(201).send({ data: card });
    })
    .catch(() => {
      next(new RequestError('Ошибка валидации полей пользователя'));
    });
};

const deleteCard = (req, res, next) => {
  Card.findById(req.params.id)
    .orFail(() => {
      throw new NotFoundError('Нет карточки с таким id');
    })
    .then((card) => {
      if (req.user._id === card.owner._id.toString()) {
        const cardDeleted = card;
        Card.deleteOne(card)
          .orFail(() => {
            throw new ServerError('Сбой сервера - удаление неуспешно');
          })
          .then(() => res.send({ data: cardDeleted }))
          .catch(next);
      } else {
        throw new ForbiddenError('Нельзя удалить чужую карточку');
      }
    })
    .catch(next);
};

const setLike = (req, res, next) => {
  Card.findByIdAndUpdate(
    req.params.id,
    {
      $addToSet: { // добавить _id в массив, если его там нет
        likes: req.user._id,
      },
    },
    { new: true },
  )
    .orFail(() => {
      throw new NotFoundError('Нет карточки с таким id');
    })
    .then((card) => res.status(200).send({ data: card }))
    .catch(next);
};

const removeLike = (req, res, next) => {
  Card.findByIdAndUpdate(
    req.params.id,
    {
      $pull: { // убрать _id из массива
        likes: req.user._id,
      },
    },
    { new: true },
  )
    .orFail(() => {
      throw new NotFoundError('Нет карточки с таким id');
    })
    .then((card) => res.status(200).send({ data: card }))
    .catch(next);
};

module.exports = {
  readCards, createCard, deleteCard, setLike, removeLike,
};
