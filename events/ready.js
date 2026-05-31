const { Events, ActivityType } = require(`discord.js`);
const { writeLog } = require(`../modules/writeLog.js`);
const { dbInit } = require(`../modules/dbInit.js`);
const twitchAuth = require(`../modules/updateTwitchAuthConfig.js`);
const kickAuth = require(`../modules/updateKickAuthConfig.js`);

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		// Sync DB tables once on startup
		await dbInit();

		console.log(writeLog(`Ready! Logged in as ${client.user.tag}`));

		// Prime runtime auth tokens before stream checks begin.
		await twitchAuth.updateTwitchAuthConfig();
		await kickAuth.updateKickAuthConfig();

		// Start all cron jobs
		for (const [name, job] of Object.entries(client.cronJobs)) {
			job.start();
			console.log(writeLog(`Started cron job: ${name}`));
		}

		// Optional initial status
		client.user.setActivity({
			name: `Initializing...`,
			type: ActivityType.Playing,
		});
	},
};
