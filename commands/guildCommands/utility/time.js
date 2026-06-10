const { SlashCommandBuilder } = require(`discord.js`);

module.exports = {
	data: new SlashCommandBuilder()
		.setName(`time`)
		.setDescription(`Replies with the current time and date.`)
		.setDefaultMemberPermissions(0),

	async execute(interaction) {
		const epoch = Math.floor(Date.now() / 1000);
		const discordTime = `<t:${epoch}:t>`;
		const discordDate = `<t:${epoch}:d>`;
		await interaction.reply({ content: `It is currently ${discordTime}, ${discordDate}.` });
	},
};
