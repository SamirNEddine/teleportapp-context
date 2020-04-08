const express = require ('express');
const apiAuth = require('./middleware/apiAuth');
const availabilityRoute = require('./routes/availability');
const integrationRoute = require('./routes/integration');
const clientRoute = require('./routes/client');
const contextParamsRoute = require('./routes/userContextParams');

const router = express.Router();

/** Auth **/
router.use('/', apiAuth);

/** Routes **/
router.use('/availability', availabilityRoute);
router.use('/integration', integrationRoute);
router.use('/client', clientRoute);
router.use('/userContextParams', contextParamsRoute);

module.exports = router;