require('./utils').config();
require('dotenv').config();
require('./utils/sentry').setupSentry(process.env.SENTRY_CONTEXT_SERVICE);
const fs = require('fs');
if (fs.existsSync('./.env.secrets')) require('dotenv').config({path: './.env.secrets'});
require('./jobs').config();
const {connectToDb} = require('./utils/mongoose');
const api = require('./api');
const bodyParser = require('body-parser');
const express = require('express');

/** Connect to the database **/
connectToDb();

/** Express app **/
const app = express();

/** api router **/
app.use('/api', bodyParser.json());
app.use('/api', api);

/** Server status endpoint **/
app.use('/status', function (req, res) {
    res.status(200).send("200 OK: Server is up and running!");
});

/** Start server **/
const port = process.env.MAIN_SERVER_PORT ? process.env.MAIN_SERVER_PORT : 4001;
const server = app.listen(port, function(){
    console.info('Server is successfully launched and can be reached on port:' + port);
});
