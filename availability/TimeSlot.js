const util = require('util');

module.exports = class TimeSlot {
    status = 'unassigned';
    constructor(start, end, status) {
        this._start = start;
        this._end = end;
        this._duration = end - start;
        this.status = status ? status : 'unassigned';
    }
    set start(newStart) {
        this._start = newStart;
        this._duration = this._end - this._start;
    }
    get start() {
        return this._start;
    }
    set end(newEnd) {
        this._end = newEnd;
        this._duration = this._end - this._start;
    }
    get end() {
        return this._end;
    }
    get duration() {
        return this._duration;
    }
    set duration(newDuration) {
        //Do nothing
    }
    formatDuration() {
        const numberOfHours = Math.floor(this._duration / (60*60*1000));
        const numberOfMinutes = ((this._duration / (60*60*1000)) % 1)*60;
        return `${numberOfHours > 0 ? numberOfHours.toString() + ' hours' + (numberOfMinutes > 0 ? ' and ' : '') : ''}${numberOfMinutes > 0 ? numberOfMinutes.toString() + ' minutes' : ''}`;
    }
    [util.inspect.custom](depth, opts) {
        return {start: new Date(this._start), end: new Date(this._end), status: this.status, duration: this.formatDuration()};
    }
    toObject() {
        return {start: this._start, end: this._end, status: this.status};
    }
    valueOf(timeSlot) {
        return this._start;
    }
    toJSON() {
        return this.toObject();
    }
};