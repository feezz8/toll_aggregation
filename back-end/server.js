require('dotenv').config();
const https = require('https');
const app = require('./app');
const fs = require('fs');

// Load SSL certificate and key
const options = {
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("cert.pem"),
};

// Create the HTTPS server
https.createServer(options, app).listen(9115, () => {
    console.log("Server running on https://localhost:9115");
});
