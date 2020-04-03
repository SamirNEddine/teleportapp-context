const util = require('util');

module.exports = class TimeSlot {
    start = 0;
    end = 0;
    duration = 0;
    constructor(start, end, status){
        this.start = start;
        this.end = end;
        this.status = status;
        this.duration = end - start;
    }
    formatDuration() {
        const numberOfHours = Math.floor(this.duration / (60*60*1000));
        const numberOfMinutes = ((this.duration / (60*60*1000)) % 1)*60;
        return `${numberOfHours > 0 ? numberOfHours.toString() + ' hours' + (numberOfMinutes > 0 ? ' and ' : '') : ''}${numberOfMinutes > 0 ? numberOfMinutes.toString() + ' minutes' : ''}`;
    }
    [util.inspect.custom](depth, opts) {
        return {start: new Date(this.start), end: new Date(this.end), status: this.status, duration: this.formatDuration()};
    }
    toObject() {
        return {start: this.start, end: this.end, status: this.status};
    }
    valueOf(timeSlot) {
        return this.start;
    }
};