const auth = require(`./authTwitch.js`);
const { updateAuthTokens } = require(`./authTokens.js`);
const { twitchClientId, twitchSecret } = process.env;

// Refresh the runtime Twitch auth token cache.
async function updateTwitchAuth() {
	const authKey = await auth.getKey(
		twitchClientId,
		twitchSecret,
	);

	if (!authKey) {
		return;
	}

	updateAuthTokens({ twitchAuthToken: authKey });
}

module.exports = { updateTwitchAuth };
