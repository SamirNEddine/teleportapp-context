const TimeSlot = require('../availability/TimeSlot');

const timeSlotsFromObject = function (timeSlotObject) {
    return new TimeSlot(parseInt(timeSlotObject.start), parseInt(timeSlotObject.end), timeSlotObject.status);
};
const timeSlotsListFromObjectsList = function (objectsList) {
    return objectsList.map(timeSlotObject => {
        return timeSlotsFromObject(timeSlotObject);
    });
};

module.exports.timeSlotsFromObject = timeSlotsFromObject;
module.exports.timeSlotsListFromObjectsList = timeSlotsListFromObjectsList;