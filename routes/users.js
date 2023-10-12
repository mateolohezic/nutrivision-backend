const express = require('express');
const route = express.Router();
const { createUser, checkEmailExists, getUser, editProfileUser, deleteUser, getUserEspecifico, getUserEspecificoId, passwordRecovery, changePassword, changeUserStatus, searchResults } = require('../controllers/users');
const { verifyUserToken } = require('../middleware/jwt')

route.get('/', getUser);
route.get('/:token', getUserEspecifico);
route.get('/id/:id', getUserEspecificoId);
route.post('/', createUser)
route.post('/check-email', checkEmailExists)
route.put(`/:id`, editProfileUser);
route.patch(`/status/:id`, changeUserStatus);
route.delete(`/delete-user`, deleteUser);
route.post(`/password-recovery`, passwordRecovery);
route.post('/password-recovery/new-password', changePassword)
route.get('/search/:search', searchResults);

module.exports = route;