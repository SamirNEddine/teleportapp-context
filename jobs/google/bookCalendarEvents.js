require('../../utils').config();
require('dotenv').config();
require('../../utils/sentry').setupSentry(process.env.SENTRY_BOOK_CALENDAR_EVENTS_JOB);
const UserIntegration = require('../../model/UserIntegration');
const {connectToDb, disconnectFromDb} = require('../../utils/mongoose');
const {bookCalendarEvents} = require('../../helpers/google');
const {CALENDAR_BOOK_JOB, syncCalendarForUser} = require('./index');

module.exports = async function (job, done) {
    console.log('\n');
    console.log('#####################################################');
    console.log('#####################################################');
    console.log(`${CALENDAR_BOOK_JOB} :::: START`);
    console.log('#####################################################');
    console.log('#####################################################');
    console.log('\n');

    await connectToDb();
    const {userId, calendarEvents} = job.data;
    const integrationData = await UserIntegration.findOne({name:'google', userId});
    await bookCalendarEvents(integrationData, calendarEvents);
    syncCalendarForUser(userId);
    await disconnectFromDb();

    console.log('\n');
    console.log('#####################################################');
    console.log('#####################################################');
    console.log(`${CALENDAR_BOOK_JOB} :::: END`);
    console.log('#####################################################');
    console.log('#####################################################');
    console.log('\n');
    done();
};