const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CalendarEventSchema = Schema({
    userId:{
        type: Schema.Types.ObjectID,
        required: true
    },
    startDateTime:{
        type: Date,
        required: true
    },
    endDateTime:{
        type: Date,
        required: true
    },
    status:{
        type: String,
        enum: ['available', 'focus', 'busy'],
        required: true,
        default: 'busy'
    },
    externalIdentifier: {
        type: String,
        required: true
    },
    externalDescription: {
        type: String
    }
});

module.exports = new mongoose.model('calendar event', CalendarEventSchema);