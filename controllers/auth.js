const User = require('../model/users');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();
const secretToken = process.env.SECRET_TOKEN

const login = async (req, res) => {
    const { email, password } = req.body;
  
    if (!email) {
      return res.status(400).json({ error:"Email can't be empty" });
    }
  
    if (!password) {
      return res.status(400).json({ error:"Password can't be empty" });
    }
  
    try {
      const user = await User.findOne({ email });
      
      if (!user || !user.status ) {
          return res.status(401).json({ error:"Datos incorrectos." });
      }
  
      const validPassword = bcrypt.compareSync(password, user.password);
      if (!validPassword) {
          return res.status(401).json({ error:"Datos incorrectos." });
      }
  
      const token = jwt.sign({ userId: user._id, permissions: user.permissions }, secretToken, { expiresIn: '1y' });
      
      res.status(200).json({ token });
  
    } catch (error) {
      console.log(error);
      res.status(500).json({
          error: error.message,
      });
    }
}

  module.exports = { login }