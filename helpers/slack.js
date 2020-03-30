const axios = require('axios');

const slackAPIBaseURL = process.env.SLACK_API_BASE_URL;


const generateSlackStatus = function(status) {
    let text = null;
    let emoji = null;
    let snoozeNotification = false;

    switch (status) {
        case 'busy':
        {
            text = 'Busy - write me somewhere I can read later';
            emoji = ':briefcase:';
            break;
        }
        case 'focus':
        {
            text = 'My brain is in full power - only emergencies';
            emoji = ':brain:';
            break;
        }
        case 'available':
        {
            text = 'Ready to talk';
            emoji = ':woman-raising-hand::skin-tone-2:';
            break;
        }
    }
    return {text, emoji, snoozeNotification}
};

module.exports.updateUserStatus = async function (integrationData, status, endTimestamp) {
    const {text, emoji, snoozeNotification} = generateSlackStatus(status);
    const request = {
        method: "POST",
        url: `${slackAPIBaseURL}/users.profile.set`,
        headers: {
            'Authorization': `Bearer ${integrationData.access_token}`
        },
        data: {
            profile: {
                status_text: text,
                status_emoji: emoji,
                status_expiration: Math.floor(endTimestamp/1000)
            }
        }
    };
    const response = await axios(request);
    if(!response.data.ok){
        throw ApiError.BAD_REQUEST_ERROR(`Bad request: ${response.data.error}`);
    }
};