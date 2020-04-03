const util = require('util');

module.exports = class Availability {
    busyTimeSlots = [];
    focusTimeSlots = [];
    availableTimeSlots = [];
    unassignedTimeSlots = [];
    schedule = [];
    totalTimeBusy = 0;
    totalTimeFocus = 0;
    totalTimeAvailable = 0;
    totalTimeUnassigned = 0;
    totalTimeScheduled = 0;
    constructor() {
    }
    addTimeSlot(timeSlot){
        switch (timeSlot.status) {
            case 'busy':
            {
                this.busyTimeSlots.insertASCSorted(timeSlot);
                this.totalTimeBusy += timeSlot.duration;
                break;
            }
            case 'focus':
            {
                this.focusTimeSlots.insertASCSorted(timeSlot);
                this.totalTimeFocus += timeSlot.duration;
                break;
            }
            case 'available':
            {
                this.availableTimeSlots.insertASCSorted(timeSlot);
                this.totalTimeAvailable += timeSlot.duration;
                break;
            }
            default: {
                this.unassignedTimeSlots.insertASCSorted(timeSlot);
                this.totalTimeUnassigned += timeSlot.duration;
            }
            this.schedule.insertASCSorted(timeSlot);
            this.totalTimeScheduled += timeSlot.duration;
        }
    };
};