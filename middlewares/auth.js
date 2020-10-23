const jwt = require('jsonwebtoken');
const AuthError = require('../errors/auth-err');

const { NODE_ENV, JWT_SECRET } = process.env;

// eslint-disable-next-line consistent-return
module.exports = (req, res, next) => {
  const { authorization } = req.headers;
  try {
    if (!authorization || !authorization.startsWith('Bearer')) {
      throw new AuthError('Необходима авторизация');
    }
    const token = authorization.replace('Bearer ', '');

    const payload = jwt.verify(token,
      NODE_ENV === 'production' ? JWT_SECRET : 'dev-super-duper-secret');
    if (!payload) {
      throw new AuthError('Необходима авторизация');
    } else {
      req.user = payload;
    }
  } catch (err) { next(err); }
};
