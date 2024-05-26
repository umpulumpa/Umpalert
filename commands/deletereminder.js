
const { getDbUserId, getRemindersByUserId, deleteReminder } = require('../functions/database.js');

async function deleteReminderFromDb(interaction) {
    const selectedReminder = interaction.options.getString("reminder")
    const reminders = await getRemindersByUserId(await getDbUserId(interaction.user.id))
    const validReminderIds = reminders.map(reminder => reminder.id);
    console.log(validReminderIds);
    console.log(parseInt(selectedReminder));
    if (!validReminderIds.includes(parseInt(selectedReminder))) {
        return `Please select a valid reminder`
    }


    if (await deleteReminder(reminders)) {
        return `Reminder deleted successfully`
    }
    return `Something went wrong`
}

module.exports = {
    data: {
        name: "deletereminder",
        description: "Deletes a reminder.",
        type: 1,
        integration_types: [1],
        contexts: [0, 1, 2],
        options: [
            {
                type: 3,
                name: 'reminder',
                description: 'Name of the reminder',
                autocomplete: true,
                required: true,
            },
        ]
    },
    async execute(interaction) {
        return await deleteReminderFromDb(interaction)
    },
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);

        if (focusedOption.name === 'reminder') {
            const reminders = await getRemindersByUserId(await getDbUserId(interaction.user.id))
            const filtered = reminders.filter(choice => choice.text.startsWith(focusedOption.value));
            return await interaction.respond(
                filtered.map(choice => ({
                    name: choice.text,
                    value: choice.id.toString()
                })).slice(0, 25),
            );
        }


    },
}