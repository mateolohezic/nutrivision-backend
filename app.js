const express = require('express')
const app = express();
require('dotenv').config();
const port = process.env.PORT;
const cors = require('cors');
app.use(express.json());
require('./database/db');

app.use(cors());

app.use('/api/user', require('./routes/users'))
app.use('/api/auth', require('./routes/auth'))

app.listen(port, () =>  {
    console.log(`Working on port ${port}`);
});