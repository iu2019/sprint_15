const router = require('express').Router();
const { celebrate, Joi } = require('celebrate');

const {
  readCards, deleteCard, createCard, setLike, removeLike,
} = require('../controllers/cards');

const urlPattern = new RegExp(/^http[s]?:\/\/((([\w-]+\.)*\w{2,3})|((([1-9][0-9]{0,1}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([1-9][0-9]{0,1}|1[0-9]{2}|2[0-4][0-9]|25[0-5])))(:[1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]{1}|6553[0-5])?((\/[\w-]+)*\/?#?)/);

router.post('/',
  celebrate({
    body: Joi.object().keys({
      name: Joi.string().required().min(2).max(30),
      link: Joi.string().required().pattern(urlPattern),
    }),
  }),
  createCard);

router.get('/', readCards);

router.delete('/:id',
  celebrate({
    params: Joi.object().keys({
      id: Joi.string().hex().length(24),
    }).unknown(true),
  }),
  deleteCard);

router.put('/:id/likes',
  celebrate({
    params: Joi.object().keys({
      id: Joi.string().hex().length(24),
    }).unknown(true),
  }),
  setLike);

router.delete('/:id/likes',
  celebrate({
    params: Joi.object().keys({
      id: Joi.string().hex().length(24),
    }).unknown(true),
  }),
  removeLike);

module.exports = router;
