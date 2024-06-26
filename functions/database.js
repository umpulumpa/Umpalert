const sqlite3 = require('sqlite3').verbose();
const Frequencies = require('../types/frequencies.js');
// Connect to the SQLite database
const db = new sqlite3.Database('./data/umpalert.db');

function isSameDate(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

// Function to get the user ID from the database or create a new record if it doesn't exist
function getDbUserId(discordUserId) {
    return new Promise((resolve, reject) => {
        // Check if the user exists in the database
        db.get("SELECT id FROM users WHERE discord_id = ?", [discordUserId], (err, row) => {
            if (err) {
                reject(err);
            } else if (row) {
                // User exists in the database, return their user ID
                resolve(row.id);
            } else {
                // User doesn't exist, insert them into the database and return the new user ID
                db.run("INSERT INTO users (discord_id) VALUES (?)", [discordUserId], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(this.lastID); // Return the ID of the inserted row
                    }
                });
            }
        });
    });
}

function getDbUserById(userId) {
    return new Promise((resolve, reject) => {
        // Check if the user exists in the database
        db.get("SELECT * FROM users WHERE id = ?", [userId], (err, row) => {
            if (err) {
                reject(err);
            } else if (row) {
                // User exists in the database, return their user ID
                resolve(row);
            }
        });
    });
}

function getDbTimeZoneById(timezoneId) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM timezones WHERE id = ?", [timezoneId], (err, row) => {
            if (err) {
                reject(err);
            } else if (row) {
                resolve(row);
            }
        });
    });
}

function getTimeZones() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM timezones", (err, rows) => {
            if (err) {
                reject(err);
            } else if (rows) {
                resolve(rows);
            }
        });
    });
}

function setDbUserTimezone(userId, timezoneId) {
    return new Promise((resolve, reject) => {
        db.run("UPDATE users SET timezone_id = ? WHERE id = ?", [timezoneId, userId], function(err) {
            if (err) {
                resolve(false);
            } else {
                resolve(true); // Return true if the update was successful
            }
        });
    });
}

function addReminder(userId, text, frequencyId, triggerTime) {
    const utcTriggerTime = new Date(triggerTime).toISOString();

    return new Promise((resolve, reject) => {
        db.run("INSERT INTO reminders (user_id, text, frequency_id, trigger_time) VALUES (?, ?, ?, ?)",
            userId, text, frequencyId, utcTriggerTime, (err) => {
                if (err) {
                    resolve(false); // Resolve the promise with false when an error occurs
                } else {
                    resolve(true); // Resolve the promise with true when added successfully
                }
            });
    });
}

function triggerReminder(reminderId) {
    return new Promise((resolve, reject) => {
        const currentDate = new Date();
        const currentDateString = currentDate.toISOString().split('T')[0];
        db.run("UPDATE reminders SET last_triggered_at = ? WHERE id = ?", currentDateString, reminderId, (err) => {
                if (err) {
                    resolve(false); // Resolve the promise with false when an error occurs
                } else {
                    resolve(true); // Resolve the promise with true when added successfully
                }
            });
    });

    
}

function deleteReminder(reminderId) {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM reminders WHERE id = ?", reminderId, (err) => {
                if (err) {
                    resolve(false); // Resolve the promise with false when an error occurs
                } else {
                    resolve(true); // Resolve the promise with true when added successfully
                }
            });
    });
}



function getRemindersToTrigger() {
    return new Promise((resolve, reject) => {
        const currentDate = new Date();
        const currentDateString = currentDate.toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
        const currentHour = currentDate.getHours();
        const currentMinute = currentDate.getMinutes();

        db.all("SELECT reminders.id, reminders.user_id, users.discord_id, reminders.text, reminders.frequency_id, reminders.trigger_time, reminders.last_triggered_at FROM reminders JOIN users ON reminders.user_id = users.id WHERE DATE(reminders.last_triggered_at) != ? OR reminders.last_triggered_at IS NULL", currentDateString, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                const filteredReminders = rows.filter(reminder => {
                    const triggerTime = new Date(reminder.trigger_time); // Convert trigger time to local time
                    const lastTriggeredDate = reminder.last_triggered_at ? new Date(reminder.last_triggered_at) : null;

                    // Adjust triggerTime and lastTriggeredDate to local time
                    triggerTime.setMinutes(triggerTime.getMinutes() + triggerTime.getTimezoneOffset());
                    if (lastTriggeredDate) {
                        lastTriggeredDate.setMinutes(lastTriggeredDate.getMinutes() + lastTriggeredDate.getTimezoneOffset());
                    }
                    if (reminder.frequency_id === Frequencies.ONE_TIME.id) { // One time
                        // Check if the trigger time has passed today and if it hasn't been triggered yet today
                        const triggerDayOfMonth = triggerTime.getDate();
                        const triggerMonthOfYear = triggerTime.getMonth();
                        return (currentHour >= triggerTime.getHours() && currentMinute >= triggerTime.getMinutes()) && (currentDate.getDate() === triggerDayOfMonth)  && (currentDate.getMonth() === triggerMonthOfYear) && (!lastTriggeredDate || !isSameDate(lastTriggeredDate, currentDate));;
                    }else if (reminder.frequency_id === Frequencies.DAILY.id || reminder.frequency_id === Frequencies.ONE_TIME.id) { // Daily
                        // Check if the trigger time has passed today and if it hasn't been triggered yet today
                        return (currentHour >= triggerTime.getHours() && currentMinute >= triggerTime.getMinutes()) && (!lastTriggeredDate || !isSameDate(lastTriggeredDate, currentDate));
                    } else if (reminder.frequency_id === Frequencies.WEEKLY.id) { // Weekly
                        // Check if the trigger time has passed today and if it hasn't been triggered yet today
                        const triggerDayOfWeek = triggerTime.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
                        return (currentHour >= triggerTime.getHours() && currentMinute >= triggerTime.getMinutes()) && (currentDate.getDay() === triggerDayOfWeek) && (!lastTriggeredDate || !isSameDate(lastTriggeredDate, currentDate));
                    } else if (reminder.frequency_id === Frequencies.MONTHLY.id) { // Monthly
                        // Check if the trigger time has passed today and if it hasn't been triggered yet today
                        const triggerDayOfMonth = triggerTime.getDate();
                        return (currentHour >= triggerTime.getHours() && currentMinute >= triggerTime.getMinutes()) && (currentDate.getDate() === triggerDayOfMonth) && (!lastTriggeredDate || !isSameDate(lastTriggeredDate, currentDate));
                    } else {
                        // For other frequencies, just include the reminder
                        return true;
                    }
                });

                resolve(filteredReminders);
            }
        });
    });
}



function getRemindersByUserId(userId) {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM reminders WHERE user_id = ?", userId, (err, rows) => {
            if (err) {
                console.error("Error retrieving reminders:", err);
                reject(err); // Reject the promise with the error
            } else {
                resolve(rows); // Resolve the promise with the retrieved rows
            }
        });
    });
}


// Close the database connection when the program exits
process.on('exit', () => {
    db.close();
});

module.exports = { getDbUserId, getDbUserById, getDbTimeZoneById, getTimeZones, setDbUserTimezone, addReminder, triggerReminder, deleteReminder, getRemindersToTrigger, getRemindersByUserId };
