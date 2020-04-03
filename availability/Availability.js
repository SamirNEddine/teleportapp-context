const util = require('util');
const TimeSlot = require('./TimeSlot');

const ROUND_FACTOR = 15;//in minutes

module.exports = class Availability {
    busyTimeSlots = [];
    focusTimeSlots = [];
    availableTimeSlots = [];
    unassignedTimeSlots;
    schedule = [];
    totalTimeBusy = 0;
    totalTimeFocus = 0;
    totalTimeAvailable = 0;
    totalTimeUnassigned = 0;
    totalTimeScheduled = 0;
    constructor(startTime, endTime) {
        const timeSlot = new TimeSlot(startTime, endTime, 'unassigned');
        this.unassignedTimeSlots = [timeSlot];
        this.totalTimeUnassigned = timeSlot.duration;
    }

    /** Private methods **/
    _insertTimeSlotIntoList(timeSlot, list) {
        let i = 0;
        let insertionIndex = null;
        while(i < list.length) {
            const ts = list[i];
            if(timeSlot.end < ts.start){
                if(!insertionIndex){
                    insertionIndex = i;
                }
                break;
            }else if(timeSlot.start > ts.end){
                i++;
            }else {
                //Merge the two intervals
                timeSlot.start = timeSlot.start < ts.start ? timeSlot.start : ts.start;
                timeSlot.end = timeSlot.end > ts.end ? timeSlot.end : ts.end;
                //Remove the existing one from the list to avoid redundancy
                list.splice(i, 1);
                this.totalTimeScheduled -= ts.duration;
                this.schedule = this.schedule.filter( t => {return !(t.start === ts.start && t.end === ts.end)});
                if(!insertionIndex){
                    insertionIndex = i;
                }
            }
        }
        list.splice(insertionIndex ? insertionIndex : i, 0, timeSlot);
        this.totalTimeScheduled += timeSlot.duration;
        this.schedule.insertASCSorted(timeSlot);
    };
    _removeIntersectionsWithList (timeSlot, list) {
        const result = [];
        for(let i=0; i<list.length; i++) {
            const ts = list[i];
            if((timeSlot.start >= ts.start && timeSlot.end <= ts.end) || (timeSlot.start === timeSlot.end) ){
                timeSlot = null;
                break;
            }else if(timeSlot.end < ts.start){
                //List is sorted, no need to continue
                break;
            }else if(ts.end > timeSlot.start){
                const intersection = {
                    start: ts.start > timeSlot.start ? ts.start : timeSlot.start,
                    end: ts.end < timeSlot.end ? ts.end : timeSlot.end
                };
                if(intersection.start > timeSlot.start){
                    //Push the first part of the timeSlot divided by the intersection
                    result.push(new TimeSlot(timeSlot.start, intersection.start, timeSlot.status));
                }
                timeSlot.start = intersection.end;
            }
        }
        if(timeSlot){
            result.push(timeSlot);
        }
        return result;
    };
     _updateUnassignedListWithAssignedTimeSlot(timeSlot) {
        let i = 0;
        while(i < this.unassignedTimeSlots.length) {
            const ts = this.unassignedTimeSlots[i];
            if(timeSlot.end === timeSlot.start || timeSlot.end < ts.start){
                break;
            }else if(timeSlot.start > ts.end){
                i++;
            }else {
                const intersection = {
                    start: ts.start > timeSlot.start ? ts.start : timeSlot.start,
                    end: ts.end < timeSlot.end ? ts.end : timeSlot.end
                };
                const T1 = new TimeSlot(ts.start, intersection.start, 'unassigned');
                const T2 = new TimeSlot(intersection.end, ts.end, 'unassigned');
                this.unassignedTimeSlots.splice(i, 1);
                if(T1.end > T1.start){
                    this.unassignedTimeSlots.splice(i, 0, T1);
                    this.totalTimeUnassigned -= T1.duration;
                    i++;
                }
                if(T2.end > T2.start){
                    this.unassignedTimeSlots.splice(i, 0, T2);
                    this.totalTimeUnassigned -= T2.duration;
                }
                timeSlot.start = intersection.end;
                i++;
            }
        }
     };

     /** Public methods **/
     addTimeSlot(timeSlot) {
         this._updateUnassignedListWithAssignedTimeSlot(new TimeSlot(timeSlot.start, timeSlot.end, timeSlot.status));
         if (timeSlot.status === 'busy') {
            this._insertTimeSlotIntoList(timeSlot, this.busyTimeSlots);
         } else {
            //Remove busy intersections
            const remainingSlotsWithoutBusy = this._removeIntersectionsWithList(timeSlot, this.busyTimeSlots);
            remainingSlotsWithoutBusy.forEach(ts => {
                if (timeSlot.status === 'focus') {
                    this._insertTimeSlotIntoList(ts, this.focusTimeSlots);
                } else {
                    //Remove focus intersections
                    const remainingSlotsWithoutBusyAndFocus = this._removeIntersectionsWithList(ts, this.focusTimeSlots);
                    remainingSlotsWithoutBusyAndFocus.forEach(ts => {
                        this._insertTimeSlotIntoList(ts, this.availableTimeSlots);
                    });
                }
            });
         }
     };
     toObject() {
         return {
             busyTimeSlots: this.busyTimeSlots.map( ts => {return ts.toObject()}),
             focusTimeSlots: this.focusTimeSlots.map( ts => {return ts.toObject()}),
             availableTimeSlots: this.availableTimeSlots.map( ts => {return ts.toObject()}),
             unassignedTimeSlots: this.unassignedTimeSlots.map( ts => {return ts.toObject()}),
             schedule:this.schedule.map( ts => {return ts.toObject()}),
             totalTimeBusy: this.totalTimeBusy,
             totalTimeFocus: this.totalTimeFocus,
             totalTimeAvailable: this.totalTimeAvailable,
             totalTimeUnassigned: this.totalTimeUnassigned,
             totalTimeScheduled: this.totalTimeScheduled
         }
     }
};