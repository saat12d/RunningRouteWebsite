const express = require('express');
const app = express();
const path = require('path');
const routePlanner = require('./routes/routes');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
require('dotenv').config();
app.use(express.static('public'));

app.use('/api/route', routePlanner);

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_CONNECTION_URL, {})

const connection = mongoose.connection
connection.once('open', () => {
    console.log("DB connected.");
})

app.get('/', (req, res) => {
    res.render('index.ejs')
})

app.listen(8000, () => {
    console.log('Server running on port 8000');
})