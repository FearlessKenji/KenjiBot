const { SlashCommandBuilder, MessageFlags, InteractionContextType } = require('discord.js');
const { Servers, Channels } = require('../../../database/dbObjects.js');
const { writeLog } = require('../../../modules/writeLog.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stream')
		.setDescription('Stream options.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('add')
				.setDescription('Add a channel.')
				.addStringOption(option =>
					option.setName('name')
						.setDescription('Username.')
						.setRequired(true),
				)
				.addStringOption(option =>
					option.setName('discord')
						.setDescription('Discord invite URL for the channel.'),
				)
				.addBooleanOption(option =>
					option.setName('self')
						.setDescription('Default false. Set true if this is your own stream.'),
				)
				.addBooleanOption(option =>
					option.setName('twitch')
						.setDescription('Default true. Set to false if you do not want Twitch notifications.'),
				)
				.addBooleanOption(option =>
					option.setName('kick')
						.setDescription('Default true. Set to false if you do not want Kick notifications.'),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('delete')
				.setDescription('Delete a channel from the list.')
				.addStringOption(option =>
					option.setName('name')
						.setDescription('Username to delete.')
						.setRequired(true),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('list')
				.setDescription('List all channels for this server.'),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('setup')
				.setDescription('Configure channel and role settings.')
				.addChannelOption(option =>
					option.setName('self-channel')
						.setDescription('Discord channel for notifications when a specific channel goes live. Typically your own.')
						.setRequired(true),
				)
				.addChannelOption(option =>
					option.setName('affiliate-channel')
						.setDescription('Discord channel for notifications when people you like go live.')
						.setRequired(true),
				)
				.addRoleOption(option =>
					option.setName('self-role')
						.setDescription('Notification role for when a specific channel goes live. Typically your own.')
						.setRequired(true),
				)
				.addRoleOption(option =>
					option.setName('affiliate-role')
						.setDescription('Notification role for when people you like go live.'),
				),
		)
		.setDefaultMemberPermissions(0) // Restrict to admins or bot owner,
		.setContexts(InteractionContextType.Guild),

	async execute(interaction) {
		const affiliateChannelId = interaction.options.getChannel('affiliate-channel')?.id || null;
		const affiliateRoleId = interaction.options.getRole('affiliate-role')?.id || null;
		const selfChannelId = interaction.options.getChannel('self-channel')?.id || null;
		const selfRoleId = interaction.options.getRole('self-role')?.id || null;
		const subcommand = interaction.options.getSubcommand();
		const guildId = interaction.guild.id;

		if (subcommand === 'setup') {
			try {
				await Servers.upsert({
					guildId,
					selfChannelId,
					affiliateChannelId,
					selfRoleId,
					affiliateRoleId,
				});
				await interaction.reply({
					content: `Server settings updated accordingly:
### **When you go live:**
-Role: <@&${selfRoleId}>
-Channel: <#${selfChannelId}>
### When someone you know goes live:
-Role: <@&${affiliateRoleId}>
-Channel: <#${affiliateChannelId}>`,
					flags: MessageFlags.Ephemeral,
				});
			}
			catch (error) {
				console.error(writeLog('Failed to update server settings:', error));
				await interaction.reply({ content: 'Failed to update server settings.', flags: MessageFlags.Ephemeral });
			}
		}
		else if (subcommand === 'add') {
			const twitchNotif = interaction.options.getBoolean('twitch') ?? true;
			const discordUrl = interaction.options.getString('discord') || null;
			const kickNotif = interaction.options.getBoolean('kick') ?? true;
			const isSelf = interaction.options.getBoolean('self') ?? false;
			const channelName = interaction.options.getString('name');

			try {
				await Servers.upsert({ guildId });
				await Channels.upsert({
					channelName,
					discordUrl,
					isSelf,
					guildId,
					twitchNotif,
					kickNotif
				});

				await interaction.reply({
					content: `Added **${channelName}** successfully.`,
					flags: MessageFlags.Ephemeral,
				});
			}
			catch (error) {
				console.error(writeLog(`Failed to add channel **${channelName}**:`, error));
				await interaction.reply({
					content: `Failed to add **${channelName}**.`,
					flags: MessageFlags.Ephemeral,
				});
			}
		}

		else if (subcommand === 'delete') {
			const channelName = interaction.options.getString('name');

			try {
				const deleted = await Channels.destroy({
					where: { channelName, guildId },
				});

				if (!deleted) {
					return interaction.reply({
						content: `Channel **${channelName}** not found in database.`,
						flags: MessageFlags.Ephemeral,
					});
				}

				await interaction.reply({
					content: `Deleted **${channelName}** successfully.`,
					flags: MessageFlags.Ephemeral,
				});
			}
			catch (error) {
				console.error(writeLog(`Failed to delete **${channelName}**:`, error));
				await interaction.reply({
					content: `Failed to delete **${channelName}**.`,
					flags: MessageFlags.Ephemeral,
				});
			}
		}

		else if (subcommand === 'list') {
			try {
				const channels = await Channels.findAll({
					where: { guildId },
					raw: true,
				});

				if (!channels.length) {
					return interaction.reply({
						content: 'No Twitch channels configured.',
						flags: MessageFlags.Ephemeral,
					});
				}

				const list = channels.map(chan =>
					`• **${chan.channelName}** ${chan.isSelf ? '(self)' : '(affiliate)'} ${chan.twitchNotif ? '(Twitch notify)' : null} ${chan.kickNotif ? '(Kick notify)' : null}`,
				);

				await interaction.reply({
					content: `**Twitch Channels:**\n${list.join('\n')}`,
					flags: MessageFlags.Ephemeral,
				});
			}
			catch (error) {
				console.error(writeLog('An error occurred while fetching the channel list:', error));
				await interaction.reply({
					content: 'An error occurred while fetching the channel list.',
					flags: MessageFlags.Ephemeral,
				});
			}
		}
	},
};