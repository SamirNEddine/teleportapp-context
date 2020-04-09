const TimeSlot = require('./TimeSlot');

//minFocus is in minutes
const canAssignFocusToSlot = function (timeSlot, minFocus) {
    return timeSlot.duration / (minFocus * 60 * 1000) >= 1;
};
const canAssignAvailableToSlot = function (timeSlot, minFocus) {
    return timeSlot.duration / (minFocus * 60 * 1000) < 1 || timeSlot.duration / (minFocus * 60 * 1000) >= 2;
};
const insertAvailableSlotsInFocusSlotIfRelevant = function (focusTimeSlot, minFocus, minAvailable) {
    const result = [];
    if(focusTimeSlot.duration /  (minFocus * 60 * 1000) > 2) {
        if (focusTimeSlot.duration /  (minFocus * 60 * 1000) < 6){
            //One available in the middle
            const availableSlotStart = focusTimeSlot.start + Math.floor((focusTimeSlot.duration /  (minFocus * 60 * 1000)) / 2)*minFocus*60*1000 + ( ((focusTimeSlot.duration /  (minFocus * 60 * 1000)) / 2)%1 >=0.5 ? minFocus*60*1000 - minAvailable*60*1000 : 0 );
            const availableSlot = new TimeSlot(availableSlotStart, availableSlotStart+minAvailable*60*1000, 'available');
            result.push(new TimeSlot(focusTimeSlot.start, availableSlot.start, 'focus'));
            result.push(availableSlot);
            result.push(new TimeSlot(availableSlot.end, focusTimeSlot.end, 'focus'));
        }else{
            //One available every 2 focus units
            const numberOfAvailableSlotsToInsert = Math.floor((focusTimeSlot.duration /  (minFocus * 60 * 1000)) / 2) - 1;
            for(let i=0;i<numberOfAvailableSlotsToInsert; i++){
                const availableSlotStart = focusTimeSlot.start + 2*minFocus * 60 * 1000;
                const availableSlot = new TimeSlot(availableSlotStart, availableSlotStart+minAvailable*60*1000, 'available');
                result.push(new TimeSlot(focusTimeSlot.start, availableSlot.start, 'focus'));
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
//minAvailable and minFocus are in minutes
const computeAvailabilitySuggestionsFromUnassignedSlots = function (availability, minAvailable, minFocus) {
    const unassignedTimeSlots = [...availability.unassignedTimeSlots];
    unassignedTimeSlots.forEach(timeSlot => {
        let focusTimeSlotCandidate = null;
        let availableTimeSlotCandidate = null;
        if(canAssignFocusToSlot(timeSlot, minFocus)){
            focusTimeSlotCandidate = new TimeSlot(timeSlot.start, timeSlot.end, 'focus');
        }
        if(canAssignAvailableToSlot(timeSlot, minFocus)){
            availableTimeSlotCandidate = new TimeSlot(timeSlot.start, timeSlot.start + minAvailable*60*1000, 'available');
            if(focusTimeSlotCandidate){
                focusTimeSlotCandidate.start = availableTimeSlotCandidate.end;
            }
        }
        if(availableTimeSlotCandidate){
            availability.addTimeSlot(availableTimeSlotCandidate);
        }
        if(focusTimeSlotCandidate){
            const slots = insertAvailableSlotsInFocusSlotIfRelevant(focusTimeSlotCandidate, minFocus, minAvailable);
            slots.forEach(slot => {
                availability.addTimeSlot(slot);
            });
        }
    });
    return availability;
};

module.exports = computeAvailabilitySuggestionsFromUnassignedSlots;