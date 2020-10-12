const router = require('express').Router();
const {
  readCards, deleteCard, createCard, setLike, removeLike,
} = require('../controllers/cards');

router.post('/cards', createCard);

router.get('/cards', readCards);

router.delete('/cards/:id', deleteCard);

router.put('/cards/:id/likes', setLike);

router.delete('/cards/:id/likes', removeLike);

module.exports = router;
