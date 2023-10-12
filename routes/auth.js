const express = require('express');
const route = express.Router();
const { login } = require('../controllers/auth');
const { verifyUserToken } = require('../middleware/jwt')

route.post('/', login)

module.exports = route;