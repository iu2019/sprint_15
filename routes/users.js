const router = require('express').Router();
const { celebrate, Joi } = require('celebrate');

const {
  readUsers, readUserById, updateUser, updateUserAvatar,
} = require('../controllers/users');

const urlPattern = new RegExp(/^http[s]?:\/\/((([\w-]+\.)*\w{2,3})|((([1-9][0-9]{0,1}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([1-9][0-9]{0,1}|1[0-9]{2}|2[0-4][0-9]|25[0-5])))(:[1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]{1}|6553[0-5])?((\/[\w-]+)*\/?#?)/);

// router.post('/', createUser);

router.get('/:id',
  celebrate({
    params: Joi.object().keys({
      id: Joi.string().hex().length(24),
    }).unknown(true),
  }),
  readUserById);

router.get('/', readUsers);

router.patch('/me',
  celebrate({
    body: Joi.object().keys({
      name: Joi.string().required().min(2).max(30),
      about: Joi.string().required().min(2).max(30),
    }),
  }),
  updateUser);

router.patch('/me/avatar',
  celebrate({
    body: Joi.object().keys({
      avatar: Joi.string().required().pattern(urlPattern),
    }),
  }),
  updateUserAvatar);

module.exports = router;
