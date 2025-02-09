const express = require('express');
const cors = require('cors');

/*import routes*/
const toll_station = require('./routes/toll_station');
const admin = require('./routes/admin');

const app = express();
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*Routes used*/
app.use('/api', toll_station);
app.use('/api/admin', admin);


app.use((req, res, next) => { res.status(404).json({ message: 'Endpoint not found' }) });

module.exports = app;