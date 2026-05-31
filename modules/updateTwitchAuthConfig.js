const config = require(`../config.json`);
const auth = require(`./authTwitch.js`);
const authTokens = require(`./authTokens.js`);

// get a new authorization key and update the runtime auth cache
async function updateTwitchAuthConfig() {
	// get the auth key
	const authKey = await auth.getKey(config.twitchClientId, config.twitchSecret);
	if (!authKey) {
		return;
	}

	authTokens.updateAuthTokens({ twitchAuthToken: authKey });
}
module.exports = { updateTwitchAuthConfig };
