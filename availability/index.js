module.exports.getCurrentAvailability = require('./currentAvailability').getCurrentAvailability;
module.exports.getNextAvailability = require('./currentAvailability').getNextAvailability;
module.exports.setCurrentAvailability = require('./currentAvailability').setCurrentAvailability;
module.exports.hasScheduledAvailabilityForToday = require('./todayAvailability').hasScheduledAvailabilityForToday;
module.exports.getSuggestedAvailabilityForToday = require('./todayAvailability').getSuggestedAvailabilityForToday;
module.exports.scheduleAvailabilityForToday = require('./todayAvailability').scheduleAvailabilityForToday;
module.exports.getAvailabilityForToday = require('./todayAvailability').getAvailabilityForToday;
module.exports.getAvailabilityForFullToday = require('./todayAvailability').getAvailabilityForFullToday;