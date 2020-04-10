module.exports.computeAvailabilitySuggestionsFromUnassignedSlots = require('./availabilityFromUnassignedSlots');
module.exports.updateCalendarWithTimeSlots = require('./calendarFromAvailability');
module.exports.availabilityFromCalendarEvents = require('./availabilityFromCalendar').availabilityFromCalendarEvents;
module.exports.getCurrentAvailability = require('./currentAvailability').getCurrentAvailability;
module.exports.setCurrentAvailability = require('./currentAvailability').setCurrentAvailability;
module.exports.getSuggestedAvailabilityForToday = require('./todayAvailability').getSuggestedAvailabilityForToday;
module.exports.scheduleAvailabilityForToday = require('./todayAvailability').scheduleAvailabilityForToday;
module.exports.getAvailabilityForToday = require('./todayAvailability').getAvailabilityForToday;