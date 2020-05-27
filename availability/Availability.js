const util = require('util');
const TimeSlot = require('./TimeSlot');

const ROUND_FACTOR = 15;//in minutes

module.exports = class Availability {
    startTime;
    lunchTime;
    lunchDurationInMinutes;
    endTime;
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
    constructor(startTime, lunchTime, lunchDurationInMinutes, endTime) {
        const initTimeSlot = new TimeSlot(startTime, endTime, 'unassigned');
        this.unassignedTimeSlots = [initTimeSlot];
        this.totalTimeUnassigned = initTimeSlot.duration;
        this.startTime = startTime;
        this.endTime = endTime;
        this.lunchTime = lunchTime;
        this.lunchDurationInMinutes = lunchDurationInMinutes;
        this.addTimeSlot(new TimeSlot(lunchTime, lunchTime+lunchDurationInMinutes*60*1000, 'lunch'));
    }

    /** Private methods **/
    _addTotalTimeForStatus(time, status) {
        switch (status) {
            case 'busy':
            case 'lunch':
            {
                this.totalTimeBusy += time;
                break;
            }
            case 'focus':
            {
                this.totalTimeFocus += time;
                break;
            }
            case 'available':
            {
                this.totalTimeAvailable += time;
                break;
            }
            case 'unassigned':
            {
                this.totalTimeUnassigned += time;
                break;
            }
        }
    };
    _insertTimeSlotIntoList(timeSlot, list, mergeIfNeeded=true) {
        if(mergeIfNeeded){
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
                    this._addTotalTimeForStatus(-ts.duration, ts.status);
                    if(!insertionIndex){
                        insertionIndex = i;
                    }
                }
            }
            list.splice(insertionIndex ? insertionIndex : i, 0, timeSlot);
            this.totalTimeScheduled += timeSlot.duration;
        }else{
            list.insertASCSorted(timeSlot);
        }
        this.schedule.insertASCSorted(timeSlot);
        this._addTotalTimeForStatus(timeSlot.duration, timeSlot.status);
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
                this._addTotalTimeForStatus(-ts.duration, 'unassigned');
                if(T1.end > T1.start){
                    this.unassignedTimeSlots.splice(i, 0, T1);
                    this._addTotalTimeForStatus(T1.duration, 'unassigned');
                    i++;
                }
                if(T2.end > T2.start){
                    this.unassignedTimeSlots.splice(i, 0, T2);
                    this._addTotalTimeForStatus(T2.duration, 'unassigned');
                }
                timeSlot.start = intersection.end;
                i++;
            }
        }
     };
     _endOfDayTimeSlotRepresentation() {
         return new TimeSlot(this.endTime, this.endTime, 'end');
     }
     /** Public methods **/
     addTimeSlot(timeSlot) {
         this._updateUnassignedListWithAssignedTimeSlot(new TimeSlot(timeSlot.start, timeSlot.end, timeSlot.status));
         if (timeSlot.status === 'busy' || timeSlot.status === 'lunch') {
            this._insertTimeSlotIntoList(timeSlot, this.busyTimeSlots, false);
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
             totalTimeScheduled: this.totalTimeScheduled,
             startTime: this.startTime,
             endTime: this.endTime
         }
     }
     current() {
         let result = null;
         const now = new Date().getTime();
         if(now >= this.endTime && (this.schedule.length === 0 || this.schedule[this.schedule.length -1].end <= this.endTime)) {
             result = this._endOfDayTimeSlotRepresentation();
         }else if (now < this.startTime && (this.schedule.length === 0 || this.schedule[0].start >= this.startTime)){
             result = new TimeSlot(now, this.startTime, 'start');
         }else {
             let nearestNextSlot = null;
             for(let i=0; i<this.schedule.length; i++){
                 const timeSlot = this.schedule[i];
                 if(now >= timeSlot.start && now < timeSlot.end) {
                     result = timeSlot;
                     break;
                 }else if (timeSlot.start > now){
                     if (!nearestNextSlot || timeSlot.start < nearestNextSlot.start || (timeSlot.start === nearestNextSlot.start && timeSlot.end > nearestNextSlot.end) ) {
                         nearestNextSlot = timeSlot;
                     }
                 }
             }
             if(!result){
                 //It means it's in an assigned slot: The end time is either the start of the nearest next slot or the end of the last unassigned slot.
                 const endTime = nearestNextSlot ? nearestNextSlot.start : this.unassignedTimeSlots[this.unassignedTimeSlots.length -1].end;
                 result = new TimeSlot(now, endTime, 'unassigned');
             }
         }
         return result;
     }
     next() {
         let result = null;
         const now = new Date().getTime();
         let currentSlot = this.current();
         if(currentSlot.status === 'end'){
             result = this._endOfDayTimeSlotRepresentation();
         }else if(currentSlot.status === 'start' && this.schedule.length > 0){
            //Get the first TimeSlot in the schedule
             result = this.schedule[0];
         }else{
             for(let i=0; i<this.schedule.length; i++){
                 const timeSlot = this.schedule[i];
                 if(now >= timeSlot.start && now < timeSlot.end) {
                     if(i+1 < this.schedule.length){
                         result = this.schedule[i+1];
                         break;
                     }
                 }else{
                     if( now < timeSlot.start){
                         result = timeSlot;
                         break;
                     }
                 }
             }
         }
         if(!result){
             //Means it's the end of day
             result = this._endOfDayTimeSlotRepresentation();
         }
         return result;
     }
};