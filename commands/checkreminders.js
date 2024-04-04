
const { getDbUserId, getRemindersByUserId } = require('../functions/database.js');

async function checkReminders(interaction) {
    const reminders = await getRemindersByUserId(await getDbUserId(interaction.user.id))
    let message = `## Your reminders:` 
    for (const reminder of reminders) {
        message += `\r${reminder.text}`
    }
    return message
}

module.exports = {
    data: {
        name: "checkreminders",
        description: "Lists your active reminders.",
        type: 1,
        integration_types: [1],
        contexts: [0, 1, 2]
    },
    async execute(interaction) {
        return await checkReminders(interaction)
    },
}