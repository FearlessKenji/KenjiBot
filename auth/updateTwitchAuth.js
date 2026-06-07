const auth = require(`./authTwitch.js`);
const { updateAuthTokens } = require(`./authTokens.js`);
const { twitchClientId, twitchSecret } = process.env;
const { writeLog } = require(`../utils/writeLog.js`)

// get a new authorization key and update the runtime auth cache
async function updateTwitchAuth() {
	// writeLog(`[INFO] Generating new Twitch auth token...`)
	const authKey = await auth.getKey(
		twitchClientId,
		twitchSecret,
	);

	if (!authKey) {
		return;
	}

	updateAuthTokens({ twitchAuthToken: authKey });
	// writeLog(`[INFO] New Twitch auth token stored.`)
}

module.exports = { updateTwitchAuth };