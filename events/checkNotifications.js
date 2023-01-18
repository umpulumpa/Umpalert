const {
    EmbedBuilder
} = require('discord.js')
const fs = require('fs')
module.exports = {
    name: 'checkNotifications',
    async execute(client) {
        var dateNow = new Date()
        dateNow.setSeconds(0)
        dateNow.setMilliseconds(0)
        const filePath = "./data/notifications.json"
        var fileData = fs.readFileSync(filePath, "utf8");
        if (fileData != "") {
            fileData = JSON.parse(fileData)
            for (const userKey of Object.keys(fileData)) {
                for (const notificationKey of Object.keys(fileData[userKey])) {
                    if (new Date(fileData[userKey][notificationKey]["time_of_reminder"]) <= dateNow) {
                        var user = await client.users.fetch(userKey)
                        await user.send(fileData[userKey][notificationKey]["message"])
                        delete fileData[userKey][notificationKey]
                    }
                }
            }
        }
        fs.writeFileSync(filePath, JSON.stringify(fileData));
    },
};