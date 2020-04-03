const {TimeSlot} = require('./index');
const ROUND_FACTOR = 15;//in minutes

const insertTimeSlotIntoList = function (timeSlot, list) {
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
            if(!insertionIndex){
                insertionIndex = i;
            }
        }
    }
    list.splice(insertionIndex ? insertionIndex : i, 0, timeSlot);
};

const removeIntersectionsWithList = function (timeSlot, list) {
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

const updateUnassignedList = function (timeSlot, list) {
    let i = 0;
    while(i < list.length) {
        const ts = list[i];
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
            list.splice(i, 1);
            if(T1.end > T1.start){
                list.splice(i, 0, T1);
                i++;
            }
            if(T2.end > T2.start){
                list.splice(i, 0, T2);
            }
            timeSlot.start = intersection.end;
            i++;
        }
    }
};

const availabilityFromCalendar = function (events, startTime, endTime=Number.POSITIVE_INFINITY) {
    const busyTimeSlots = [];
    const focusTimeSlots = [];
    const availableTimeSlots = [];
    const unassignedTimeSlots = [new TimeSlot(startTime, endTime, 'unassigned')];
    events.forEach(event => {
        const timeSlot = new TimeSlot(
            event.startDateTime.getTime() < startTime ? startTime : event.startDateTime.getTime(),
            event.endDateTime.getTime() > endTime ? endTime : event.endDateTime.getTime(),
            event.status);
        updateUnassignedList(new TimeSlot(timeSlot.start, timeSlot.end, timeSlot.status), unassignedTimeSlots);
        if(timeSlot.status === 'busy') {
            insertTimeSlotIntoList(timeSlot, busyTimeSlots);
        }else {
            //Remove busy intersections
            const remainingSlotsWithoutBusy = removeIntersectionsWithList(timeSlot, busyTimeSlots);
            remainingSlotsWithoutBusy.forEach( ts => {
                if(timeSlot.status === 'focus'){
                    insertTimeSlotIntoList(ts, focusTimeSlots);
                }else{
                    //Remove focus intersections
                    const remainingSlotsWithoutBusyAndFocus = removeIntersectionsWithList(ts, focusTimeSlots);
                    remainingSlotsWithoutBusyAndFocus.forEach( ts => {
                        insertTimeSlotIntoList(ts, availableTimeSlots);
                    });
                }
            });
        }
    });
    return {busyTimeSlots, focusTimeSlots, availableTimeSlots, unassignedTimeSlots};
};

module.exports = availabilityFromCalendar;