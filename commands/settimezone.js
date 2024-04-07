const { getDbUserId, addReminder, getDbUserById, getDbTimeZoneById, getTimeZones, setDbUserTimezone } = require('../functions/database.js');

const Frequencies = require('../types/frequencies.js');

let dateDatesUpdated = new Date()


const formattedFrequencyTypes = Frequencies.getAllFrequencyTypes().map(type => ({
    name: type.name,
    value: type.id.toString()
}));


let timezones = []

async function setupTimezones() {
    timezones = await getTimeZones()
}

setupTimezones()

async function setTimezone(interaction) {
    const timezone = interaction.options.getString("timezone")
    const selectedTimezone = timezones.filter(atimezone => atimezone.id == timezone)

    if (!selectedTimezone.length > 0) {
        return "Invalid timezone. Please choose one of the suggested timezones.";
    }
   
    if(await setDbUserTimezone(await getDbUserId(interaction.user.id), selectedTimezone[0].id)) {
        return `Timezone set to ${selectedTimezone[0].name} - ${selectedTimezone[0].gmt_value.toUpperCase()}.`
    }
    return `Something went wrong.`
}

module.exports = {
    data: {
        name: "settimezone",
        description: "Sets your timezone.",
        type: 1,
        integration_types: [1],
        contexts: [0, 1, 2],
        options: [{
                type: 3,
                name: 'timezone',
                description: 'The timezone you wanna set',
                autocomplete: true,
                required: true,
            }
        ],
    },

    async execute(interaction) {
        return await setTimezone(interaction)
    },
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);

        if (focusedOption.name === 'timezone') {
            const filtered = timezones.filter(choice => choice.name.toLowerCase().startsWith(focusedOption.value.toLowerCase()));
            return await interaction.respond(
                filtered.map(choice => ({
                    name: `${choice.name} - ${choice.gmt_value.toUpperCase()}`,
                    value: choice.id.toString()
                })).slice(0, 25),
            );
        }


    },
}