module.exports = class TimeSlot {
    constructor(start, end, status){
        this.start = start;
        this.end = end;
        this.status = status;
    }
    inspect(depth, opts) {
        return {start: new Date(this.start), end: new Date(this.end), status: this.status};
    }
};