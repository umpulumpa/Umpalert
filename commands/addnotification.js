const {
    SlashCommandBuilder
} = require('discord.js');
const NodeCache = require( "node-cache");
const crypto  = require( "crypto");
const fs = require( "fs");
const myCache = new NodeCache();

Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

Date.prototype.yyyymmdd = function() {
    var mm = this.getMonth() + 1; // getMonth() is zero-based
    var dd = this.getDate();
  
    return [(dd>9 ? '' : '0') + dd,
            (mm>9 ? '' : '0') + mm,
            this.getFullYear()
           ].join('-');
  };

function getDates() {
    var dateArray = new Array();
    var currentDate = new Date ();
    var stopDate = new Date().setDate(currentDate.getDate() + 90)
    while (currentDate <= stopDate) {
        dateArray.push(new Date (currentDate).yyyymmdd());
        currentDate = currentDate.addDays(1);
    }
    return dateArray;
}

function getTime() {
    var hours = 24
    var interval = 1
    var timeArray = []
    for (let hourIndex = 0; hourIndex < hours; hourIndex++) {
        for (let intervalIndex = 0; intervalIndex < 60/interval; intervalIndex++) {
            if (intervalIndex < 10) {
                timeArray.push(`${hourIndex}:0${intervalIndex}`)
            } else {
                timeArray.push(`${hourIndex}:${intervalIndex}`)
            }
            
            
        }
        
    }
    return timeArray
}

function setCache() {
    const dates = getDates()
    myCache.set("dates", dates)
    const time = getTime()
    myCache.set("time", time)
}
setCache()

function parseTimeText(date, remindertime) {
    var text = ""
    var dateNow = new Date()
    date = date.split("-").reverse().join("-")
    var remindDate = new Date(date + " " + remindertime)
    var remindTime = (remindDate.getTime() - dateNow.getTime()) / (1000 * 3600)
    if (remindTime > 24) {
        text = `Reminding you in ${Math.floor(remindTime/24)} days`
    } else {
        text = `Reminding you in ${Math.floor(remindTime)} hours`
    }
    return text
}
function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }

async function addToNotifications(userId, message, date, reminderTime) {
    const uuid = uuidv4()
    date = date.split("-").reverse().join("-")
    var time_of_reminder = new Date(date + " " + reminderTime)
    const filePath = "./data/notifications.json"
    var fileData = fs.readFileSync(filePath, "utf8");
    if (fileData != "") {
        fileData = JSON.parse(fileData)
        if (!fileData[userId]){
            fileData[userId] = {}
        }
        fileData[userId][uuid] = {}
        fileData[userId][uuid]["id"] = uuid
        fileData[userId][uuid]["userid"] = userId
        fileData[userId][uuid]["message"] = message
        fileData[userId][uuid]["time_of_reminder"] = time_of_reminder
    }
    
    fs.writeFileSync(filePath, JSON.stringify(fileData));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addnotification')
        .setDescription('Adds a notification.')
        .addStringOption(option =>
			option
				.setName('message')
				.setDescription('The message you want the bot to remind you of')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('date')
                .setDescription('Day - Month - Year')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(option =>
            option
                .setName('remindertime')
                .setDescription('Hours : Minutes')
                .setRequired(true)                
                .setAutocomplete(true)
        ),
    async execute(client, interaction) {
        const message = interaction.options.getString('message');
        const date = interaction.options.getString('date');
        const remindertime = interaction.options.getString('remindertime');
        addToNotifications(interaction.user.id, message, date, remindertime)
        interaction.reply(parseTimeText(date, remindertime))
    },
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        let choices;

		if (focusedOption.name === 'date') {
			choices = myCache.get("dates");
		}
        if (focusedOption.name === 'remindertime') {
			choices = myCache.get("time");
		}
		const filtered = choices.filter(choice => choice.startsWith(focusedOption.value));
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })).slice(0,25),
		);
	},
}