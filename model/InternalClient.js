const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InternalClientSchema = Schema({
    clientId: {
        type: String,
        required: true
    },
    clientSecret: {
        type: String,
        required: true
    }
}, {timestamp: true});

module.exports = new mongoose.model('internal client', InternalClientSchema);