const { Events, ActivityType } = require(`discord.js`);
const { writeLog } = require(`../utils/writeLog.js`);
const { dbInit } = require(`../database/dbInit.js`);
const { updateTwitchAuth } = require(`../auth/updateTwitchAuth.js`);
const { updateKickAuth } = require(`../auth/updateKickAuth.js`);

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		// Sync DB tables once on startup
		await dbInit();

		// Prime runtime auth tokens before stream checks begin.
		writeLog(`[INFO] Priming auth tokens...`);

		await updateTwitchAuth();
		await updateKickAuth();

		// Start all cron jobs
		for (const [name, job] of Object.entries(client.cronJobs)) {
			job.start();
			writeLog(`[INFO] Started cron job: ${name}`);
		}

		// Optional initial status
		client.user.setActivity({
			name: `Initializing...`,
			type: ActivityType.Playing,
		});

		writeLog(`[INFO] Ready! Logged into discord as ${client.user.tag}`);
	},
};
