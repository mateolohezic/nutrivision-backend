const jwt = require('jsonwebtoken');
require('dotenv').config();
const secretToken = process.env.SECRET_TOKEN

const verifyUserToken = async (req, res, next) => {
    
    const {token} = req.body;

    try {
        const verify = jwt.verify(token, secretToken);
        if (verify) {
            return next()
        } else {
            res.status(401).send('Token invalido.');
        }
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            res.status(401).json({ message: 'Token invalido.' });
        } else if (error.name === 'TokenExpiredError') {
            res.status(401).json({ message: 'Su sesión expiro.' });
        } else {
            res.status(401).json({ message: 'Error en el servidor.' });
        }
    }
}
  

module.exports = { verifyUserToken }