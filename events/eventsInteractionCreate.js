const { Events, MessageFlags } = require(`discord.js`);
const { writeLog } = require(`../utils/writeLog.js`)

module.exports = {
	name: Events.InteractionCreate,

	async execute(interaction) {
		if (interaction.isChatInputCommand()) {
			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				writeLog(`[WARNING] No command matching ${interaction.commandName} was found.`);
				return;
			}

			try {
				await command.execute(interaction);
			} catch (error) {
				writeLog(`[ERROR] Error executing ${interaction.commandName}`);
				writeLog(error);
			}

			return;
		}

		if (
			interaction.isButton() ||
			interaction.isStringSelectMenu() ||
			interaction.isChannelSelectMenu() ||
			interaction.isRoleSelectMenu()
		) {
			// setup:self
			// setup:affiliate
			// setup:self:twitchChannel
			const [commandName] = interaction.customId.split(`:`);

			const command = interaction.client.commands.get(commandName);

			if (!command?.handleComponent) {
				return;
			}

			try {
				await command.handleComponent(interaction);
			} catch (error) {
				writeLog(`[ERROR] Error handling interaction:`, error);

				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({
						content: `Something went wrong.`,
						flags: MessageFlags.Ephemeral,
					});
				} else {
					await interaction.reply({
						content: `Something went wrong.`,
						flags: MessageFlags.Ephemeral,
					});
				}
			}
		}
	},
};
