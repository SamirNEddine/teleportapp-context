const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserContextParams = Schema({
    userId: {
        type: Schema.Types.ObjectID,
        required: true
    },
    startWorkTime: {
        type: String,
        required: true
    },
    endWorkTime: {
        type: String,
        required: true
    },
    lunchTime: {
        type: String,
        required: true
    },
    dailySetupTime: {
        type: String,
        required: true
    },
    minAvailableSlotInMinutes: {
        type: Number,
        required: true
    },
    minFocusSlotInMinutes: {
        type: Number,
        required: true
    }
}, {timestamp: true});

module.exports = new mongoose.model('user context params', UserContextParams);