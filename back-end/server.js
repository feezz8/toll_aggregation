require('dotenv').config();
const express = require('express');

const app = express();

const PORT = process.env.PORT || 9115;

app.listen(PORT, () => console.log(`Server running on ${PORT}!`));

app.get('/', (req, res) => {
    res.send({message: "'Hello World!' from Express"});
})