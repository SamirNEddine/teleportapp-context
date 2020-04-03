module.exports = class TimeSlot {
    constructor(start, end, status){
        this.start = start;
        this.end = end;
        this.status = status;
        this.duration = end - start;
    }
    inspect(depth, opts) {
        return {start: new Date(this.start), end: new Date(this.end), status: this.status};
    }
    toObject() {
        return {start: this.start, end: this.end, status: this.status};
    }
};