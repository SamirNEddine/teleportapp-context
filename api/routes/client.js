const express = require ('express');
const InternalClient = require('../../model/InternalClient');
const {generateAndSaveCredentials} = require('../../helpers/internalClient');

const router = express.Router();

router.post('/internal/generate', async function (req, res) {
    try {
        const client = await InternalClient.findOne({clientId: req.body.clientId});
        if(client.scope === 'admin'){
            const {clientId, clientSecret} = await generateAndSaveCredentials();
            res.json({clientId, clientSecret});
        }else{
            res.status(401).send('Unauthorized!');
        }
    }catch(e){
        console.log(e);
        res.status(400).send('Something went wrong!');
    }
});

module.exports = router;