const express = require ('express');
const apiAuth = require('./middleware/apiAuth');
const availabilityRoute = require('./routes/availability');
const integrationRoute = require('./routes/integration');

const router = express.Router();

/** Auth **/
router.use('/', apiAuth);

/** Routes **/
router.use('/availability', availabilityRoute);
router.use('/integration', integrationRoute);


module.exports = router;