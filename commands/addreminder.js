const { getDbUserId, addReminder, getDbUserById, getDbTimeZoneById } = require('../functions/database.js');

const Frequencies = require('../types/frequencies.js');

let dateDatesUpdated = new Date()


const formattedFrequencyTypes = Frequencies.getAllFrequencyTypes().map(type => ({
    name: type.name,
    value: type.id.toString()
}));

Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

Date.prototype.yyyymmdd = function () {
    var mm = this.getMonth() + 1; // getMonth() is zero-based
    var dd = this.getDate();

    return [(dd > 9 ? '' : '0') + dd,
        (mm > 9 ? '' : '0') + mm,
        this.getFullYear()
    ].join('-');
};

function getDates() {
    var dateArray = new Array();
    var currentDate = new Date();
    var stopDate = new Date().setDate(currentDate.getDate() + 90)
    while (currentDate <= stopDate) {
        dateArray.push(new Date(currentDate).yyyymmdd());
        currentDate = currentDate.addDays(1);
    }
    return dateArray;
}

function getTime() {
    var hours = 24
    var interval = 1
    var timeArray = []
    for (let hourIndex = 0; hourIndex < hours; hourIndex++) {
        for (let intervalIndex = 0; intervalIndex < 60 / interval; intervalIndex++) {
            if (intervalIndex < 10) {
                timeArray.push(`${hourIndex}:0${intervalIndex}`)
            } else {
                timeArray.push(`${hourIndex}:${intervalIndex}`)
            }


        }

    }
    return timeArray
}

let dates = getDates()
const time = getTime()

function parseTimeText(remindertime) {
    const remindDate = remindertime
    const remindTime = (remindDate.getTime() - new Date().getTime()) / (1000 * 3600)
    if (remindTime > 24) {
        return `Reminding you in ${Math.floor(remindTime/24)} days`
    }
    return `Reminding you in ${Math.floor(remindTime)} hours`
}

async function addToReminders(interaction) {
    const message = interaction.options.getString("message")
    const frequency = interaction.options.getString("frequency")
    let date = interaction.options.getString("date")

    if (!dates.includes(date)) {
        return "Invalid date. Please choose one of the suggested dates.";
    }
    const reminderTime = interaction.options.getString("remindertime")
    if (!time.includes(reminderTime)) {
        return "Invalid time. Please choose one of the suggested times.";
    }

    const user = await getDbUserById(await getDbUserId(interaction.user.id))
    if (user.timezone_id == null) {
        return "Please set your timezone first using /settimezone"
    }
    const timezone = await getDbTimeZoneById(user.timezone_id)
    date = date.split("-").reverse().join("-")
    const time_of_reminder = new Date(`${date} ${reminderTime} ${timezone.gmt_value}`)
    
    if (await addReminder(user.id, message, frequency, time_of_reminder)) {
        return parseTimeText(time_of_reminder)
    }
    return "Something went wrong"
    
}

module.exports = {
    data: {
        name: "addreminder",
        description: "Adds a reminder.",
        type: 1,
        integration_types: [1],
        contexts: [0, 1, 2],
        options: [{
                type: 3,
                name: 'message',
                description: 'The message you want the bot to remind you of',
                required: true,
            },
            {
                type: 3,
                name: 'date',
                description: 'Day - Month - Year',
                autocomplete: true,
                required: true,
            },
            {
                type: 3,
                name: 'remindertime',
                description: 'Hours : Minutes',
                autocomplete: true,
                required: true,
            },
            {
                type: 3,
                name: 'frequency',
                description: 'Frequency of the reminder',
                choices: formattedFrequencyTypes,
                required: true,
            },
        ],
    },

    async execute(interaction) {
        return await addToReminders(interaction)
    },
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);

        if (focusedOption.name === 'date') {
            if (dateDatesUpdated.getMonth() < new Date().getMonth() || dateDatesUpdated.getDate() < new Date().getDate()) {
                dates = getDates()
                dateDatesUpdated = new Date()
            }
            const filtered = dates.filter(choice => choice.startsWith(focusedOption.value));
            return await interaction.respond(
                filtered.map(choice => ({
                    name: choice,
                    value: choice
                })).slice(0, 25),
            );
        }

        if (focusedOption.name === 'remindertime') {
            const filtered = time.filter(choice => choice.startsWith(focusedOption.value));
            return await interaction.respond(
                filtered.map(choice => ({
                    name: choice,
                    value: choice
                })).slice(0, 25),
            );
        }


    },
}