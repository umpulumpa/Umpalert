const { Events } = require('discord.js');
module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
        if (interaction.isChatInputCommand()) {


            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }
    
            try {
                await interaction.deferReply({ephemeral: true});
                const commandResponse = await command.execute(interaction)
                if (commandResponse != "noReply") {
                    await interaction.editReply(commandResponse);
                }
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        } else if(interaction.isAutocomplete()) {
            // AUTOCOMPLETE
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }
        
            try {
                await command.autocomplete(interaction);
            } catch (error) {
                console.error(error);
            }
        }

	},
};
