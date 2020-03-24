const mongoose = require('mongoose');

const Schema = mongoose.Schema;

/** Custom getters **/
const getIntegrationData = function (data) {
    return Object.fromEntries(data);
};

const UserIntegrationSchema = Schema({
    userId: {
        type: Schema.Types.ObjectID,
        required: true
    },
    name: {
        type: String,
        required: true,
        enum: ['slack', 'google']
    },
    data: {
        type: Map,
        of: String,
        required: true,
        get: getIntegrationData
    },
}, {timestamp: true});

module.exports = new mongoose.model('user integration', UserIntegrationSchema);