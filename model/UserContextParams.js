const mongoose = require('mongoose');
const {getTimestampFromLocalTodayTime} = require('../utils/timezone');
const Schema = mongoose.Schema;

const UserContextParamsSchema = Schema({
    userId: {
        type: Schema.Types.ObjectID,
        required: true,
        unique: true,
        dropDups: true
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
    lunchDurationInMinutes: {
        type: Number,
        required: true,
        default: 60
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
    },
    IANATimezone: {
        type: String,
        required: true
    },
    //Date without time
    lastScheduledAvailabilityDate: {
        type: String
    }
}, {timestamp: true});

/** UserContextParamsScheme virtual properties **/
UserContextParamsSchema.virtual('todayStartWorkTimestamp').get(function() {
    return getTimestampFromLocalTodayTime(this.startWorkTime, this.IANATimezone);
});
UserContextParamsSchema.virtual('todayEndWorkTimestamp').get(function() {
    return getTimestampFromLocalTodayTime(this.endWorkTime, this.IANATimezone);
});
UserContextParamsSchema.virtual('todayLunchTimestamp').get(function() {
    return getTimestampFromLocalTodayTime(this.lunchTime, this.IANATimezone);
});
UserContextParamsSchema.virtual('todayDailySetupTimestamp').get(function() {
    return getTimestampFromLocalTodayTime(this.dailySetupTime, this.IANATimezone);
});

/** Export **/
module.exports = new mongoose.model('user context params', UserContextParamsSchema);
