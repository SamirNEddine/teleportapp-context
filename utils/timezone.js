const {DateTime} = require("luxon");

// NB: Time here is a string representation  of the time in 24 hours format with a leading digit. Example: 8:30 a.m. => 0830
const getTimestampFromLocalTodayTime = function(timeStringRepresentation, IANATimezone) {
    const localDateTime  = DateTime.utc().setZone(IANATimezone);
    const hour = parseInt(timeStringRepresentation.slice(0,2));
    const minute = parseInt(timeStringRepresentation.slice(2));
    const {year, month, day} = localDateTime;
    const dateTime = DateTime.fromObject({year, month, day, hour, minute, zone:IANATimezone });
    return dateTime.toMillis();
};

module.exports.getTimestampFromLocalTodayTime = getTimestampFromLocalTodayTime;
