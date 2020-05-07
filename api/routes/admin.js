const express = require ('express');
const {cleanCacheForUser} = require('../../utils/redis');
const {clearDataForUser} = require('../../utils/database');
const {cleanStatusChangeJobsForUser} = require('../../jobs/status');
const router = express.Router();

router.post('/deleteAccount', async function (req, res) {
    try {
        const {userId} = req.body;
        if(userId) {
            //Clean scheduled jobs
            await cleanStatusChangeJobsForUser(userId);
            //Clean cache
            await cleanCacheForUser(userId);
            //Clean database
            await clearDataForUser(userId);
            res.send('ok');
        }else{
            res.status(400).send('Bad request!');
        }
    }catch(e){
        console.log(e);
        res.status(400).send('Something went wrong!');
    }
});

module.exports = router;