const express = require('express');
const route = express.Router();
const { createUser, checkEmailExists, getUser, editProfileUser, deleteUser, getUserEspecifico, getUserEspecificoId, loginUser, passwordRecovery, changePassword, changeUserStatus, searchResults, getRankingTMD } = require('../controllers/users');
const { verifyAdminTokenDirect, verifyUserTokenDirect, verifyAdminToken, verifyUserToken } = require('../middleware/jwt')

route.get('/get-users', getUser);
route.get('/ranking', getRankingTMD);
route.get('/:token', getUserEspecifico);
route.get('/id/:id', getUserEspecificoId);
route.post(`/login-user`, loginUser);
route.post('/', createUser)
route.post('/check-email', checkEmailExists)
route.put(`/:id`, editProfileUser);
route.patch(`/change-user-status`, changeUserStatus);
route.delete(`/delete-user`, deleteUser);
route.post(`/password-recovery`, passwordRecovery);
route.post('/password-recovery/new-password', changePassword)
route.get('/search/:search', searchResults);

module.exports = route;