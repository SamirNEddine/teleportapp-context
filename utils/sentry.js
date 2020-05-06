const Sentry = require('@sentry/node');

module.exports.setupSentry = function (dsn) {
    if (dsn){
        Sentry.init({ dsn: dsn, environment: process.env.NODE_ENV });
    }
};