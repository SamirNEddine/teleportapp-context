const {computeAvailabilityFromCalendarEvents} = require('./index');

//minFocus is in minutes
const canAssignFocusToSlot = function (timeSlot, minFocus) {
    const duration = timeSlot.start - timeSlot.end;
    return duration / (minFocus * 60 * 1000) >= 1;
};
const canAssignAvailableToSlot = function (timeSlot, minFocus) {
    const duration = timeSlot.start - timeSlot.end;
    return duration / (minFocus * 60 * 1000) < 1 || duration / (minFocus * 60 * 1000) > 2;
};
const insertAvailableSlotsInFocusSlotIfRelevant = function (focusTimeSlot, minFocus, minAvailable) {
    const result = [];
    const duration = focusTimeSlot.start - focusTimeSlot.end;
    if(duration /  (minFocus * 60 * 1000) > 2) {
        if (duration /  (minFocus * 60 * 1000) < 6){
            //One available in the middle
            const availableSlotStart = focusTimeSlot.start + Math.floor(duration /  (minFocus * 60 * 1000)) + ( (duration /  (minFocus * 60 * 1000))%1 >=0.5 ? 1 : 0);
            const availableSlot = {start: availableSlotStart, end: availableSlotStart+minAvailable*60*1000, status: 'available'};
            result.push({start: focusTimeSlot.start, end: availableSlot.start, status: 'focus'});
            result.push(availableSlot);
            result.push({start: availableSlot.end, end: availableSlot.end, status: 'focus'});
        }else{
            //One available every 2 focus units
            const numberOfAvailableSlotsToInsert = Math.floor((duration /  (minFocus * 60 * 1000)) / 2);
            for(let i=0;i<numberOfAvailableSlotsToInsert; i++){
                const availableSlotStart = focusTimeSlot.start + 2*minFocus * 60 * 1000;
                const availableSlot = {start: availableSlotStart, end: availableSlotStart+minAvailable*60*1000, status: 'available'};
                result.push({start: focusTimeSlot.start, end: availableSlot.start, status: 'focus'});
                result.push(availableSlot);
                focusTimeSlot.start = availableSlot.end;
            }
            //Add the last branch remaining from the focus slot
            result.push(focusTimeSlot);
        }
    }else {
        result.push(focusTimeSlot);
    }

    return result;
};
const calendarEventForTimeSlot = function (timeSlot, calendarIntegrationName, priority=0) {

};

//minAvailable, minFocus, totalAvailable and totalFocus are in minutes
const computeCalendarSuggestionFromAvailability = async function (calendarIntegrationName, availability, minAvailable, minFocus, totalAvailable) {
    const {unassigned} = availability;
    const suggestedCalendarSchedule = [];
    let currentTotalAvailable = 0;//in minutes
    unassigned.forEach(timeSlot => {
        let focusTimeSlotCandidate = null;
        let availableTimeSlotCandidate = null;
        if(canAssignFocusToSlot(timeSlot, minFocus)){
            focusTimeSlotCandidate = {start: timeSlot.start, end: timeSlot.end, status: 'focus'};
        }
        if(canAssignAvailableToSlot(timeSlot, minFocus)){
            availableTimeSlotCandidate = {start: timeSlot.start, end: timeSlot.start + minAvailable*60*1000, status: 'available'};
            if(focusTimeSlotCandidate){
                focusTimeSlotCandidate.start = availableTimeSlotCandidate.end;
            }
        }
        if(availableTimeSlotCandidate){
            suggestedCalendarSchedule.push(calendarEventForTimeSlot(availableTimeSlotCandidate, calendarIntegrationName, 1));
            currentTotalAvailable += minAvailable;
        }
        if(focusTimeSlotCandidate){
            const slots = insertAvailableSlotsInFocusSlotIfRelevant(focusTimeSlotCandidate, minFocus, minAvailable);
            slots.forEach(slot => {
                suggestedCalendarSchedule.push(calendarEventForTimeSlot(availableTimeSlotCandidate, calendarIntegrationName, 2));
                if (slot.status === 'available') {
                    currentTotalAvailable += minAvailable;
                }
            });
        }
    });
    return suggestedCalendarSchedule;
};