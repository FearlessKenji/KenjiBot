const config = require(`../config.json`);
const auth = require(`./authKick.js`);
const authTokens = require(`./authTokens.js`);

// get a new authorization key and update the runtime auth cache
async function updateKickAuthConfig() {
	// get the auth key
	const authKey = await auth.getKey(config.kickClientId, config.kickSecret);
	if (!authKey) {
		return;
	}

	authTokens.updateAuthTokens({ kickAuthToken: authKey });
}
module.exports = { updateKickAuthConfig };
