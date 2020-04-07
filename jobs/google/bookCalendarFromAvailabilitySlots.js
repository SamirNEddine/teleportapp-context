require('../../utils').config();
require('dotenv').config();
const UserIntegration = require('../../model/UserIntegration');
const {connectToDb, disconnectFromDb} = require('../../utils/mongoose');
const {bookCalendarEventsFromTimeSlots} = require('../../helpers/google');
const {CALENDAR_BOOK_FROM_AVAILABILITY_JOB, syncCalendarForUser} = require('./index');

module.exports = async function (job, done) {
    console.log('\n');
    console.log('#####################################################');
    console.log('#####################################################');
    console.log(`${CALENDAR_BOOK_FROM_AVAILABILITY_JOB} :::: START`);
    console.log('#####################################################');
    console.log('#####################################################');
    console.log('\n');

    await connectToDb();
    const {userId, timeSlots} = job.data;
    const integrationData = await UserIntegration.findOne({name:'google', userId});
    await bookCalendarEventsFromTimeSlots(integrationData, timeSlots);
    syncCalendarForUser(userId);
    await disconnectFromDb();

    console.log('\n');
    console.log('#####################################################');
    console.log('#####################################################');
    console.log(`${CALENDAR_BOOK_FROM_AVAILABILITY_JOB} :::: END`);
    console.log('#####################################################');
    console.log('#####################################################');
    console.log('\n');
    done();
};