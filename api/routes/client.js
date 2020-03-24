const express = require ('express');
const InternalClient = require('../../model/InternalClient');
const {generateAndSaveCredentials} = require('../../helpers/internalClient');

const router = express.Router();

router.post('/internal/generate', async function (req, res) {
    try {
        const {clientId, clientSecret} = await generateAndSaveCredentials();
        const client = InternalClient({clientId, clientSecret});
        await client.save();
        res.json({clientId, clientSecret});
    }catch(e){
        console.log(e);
        res.status(400).send('Something went wrong');
    }
    const user = await User.findOne({_id: req.payload._id});
    if (!user) return res.status(400).send('Something went wrong');

    res.json({posts: `You are now receiving posts for user ${user.name}`});
});

module.exports = router;