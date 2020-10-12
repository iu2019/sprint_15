const Card = require('../models/card');

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

const readCards = (req, res) => {
  Card.find({})
    .then((card) => res.send({ data: card }))
    .catch(() => res.status(500).send({ message: 'На сервере произошла ошибка' }));
};

const createCard = (req, res) => {
  const { name, link } = req.body;
  Card.create({ name, link, owner: req.user._id })
    .then((card) => res.status(201).send({ data: card }))
    .catch(() => res.status(400).send({ message: 'Ошибка валидации полей карточки' }));
};

const deleteCard = (req, res) => {
  let errStatus = 400;
  Card.findById(req.params.id)
    .orFail(() => {
      errStatus = 404;
      throw new ValidationError('Нет карточки с таким id');
    })
    .then((card) => {
      if (req.user._id === card.owner._id.toString()) {
        const cardDeleted = card;
        Card.deleteOne(card)
          .orFail(() => {
            errStatus = 500;
            throw new ValidationError('Сбой сервера - удаление неуспешно');
          })
          .then(() => res.send({ data: cardDeleted }))
          .catch((err) => res.status(errStatus).send({ message: err.message }));
      } else {
        errStatus = 409;
        throw new Error('Нельзя удалить чужую карточку');
      }
    })
    .catch((err) => res.status(errStatus).send({ message: err.message }));
};

const setLike = (req, res) => {
  let errStatus = 400;
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
      errStatus = 404;
      throw new ValidationError('Нет карточки с таким id');
    })
    .then((card) => res.status(200).send({ data: card }))
    .catch((err) => res.status(errStatus).send({ message: err.message }));
};

const removeLike = (req, res) => {
  let errStatus = 400;
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
      errStatus = 404;
      throw new ValidationError('Нет карточки с таким id');
    })
    .then((card) => res.status(200).send({ data: card }))
    .catch((err) => res.status(errStatus).send({ message: err.message }));
};

module.exports = {
  readCards, createCard, deleteCard, setLike, removeLike,
};
