const { getRemindersToTrigger, triggerReminder, deleteReminder } = require('../functions/database.js');
const Frequencies = require('../types/frequencies.js');

function formatReminder(user, data) {
    let message = `Hi ${user.username}! \rThis is a reminder for:\r\r **${data.text}**`
    switch (data.frequency_id) {
        case Frequencies.DAILY.id:
            message += `\r\r This reminder will repeat every day`
            break;        
        case Frequencies.WEEKLY.id:
            message += `\r\r This reminder will repeat every week`
            break;
        case Frequencies.MONTHLY.id:
            message += `\r\r This reminder will repeat every month`
            break;
        default:
            break;
    }
    return message
}


module.exports = {
    name: 'checkReminders',
    async execute(client) {
        
        getRemindersToTrigger().then(rows => {
            rows.forEach(async row => {
                let user = await client.users.cache.get(row.discord_id)
                if (user == undefined) {
                    user = await client.users.fetch(row.discord_id)
                }
                if (row.frequency_id === Frequencies.ONE_TIME.id) {
                    await deleteReminder(row.id)
                } else {
                    await triggerReminder(row.id)
                }
                await user.send(formatReminder(user, row))
            });
            
        }).catch(err => {
            console.error("Error:", err);
        }); 
        
    },
};