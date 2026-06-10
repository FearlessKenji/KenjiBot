const auth = require(`./authKick.js`);
const { updateAuthTokens } = require(`./authTokens.js`);
const { kickClientId, kickSecret } = process.env;

// Refresh the runtime Kick auth token cache.
async function updateKickAuth() {
	const authKey = await auth.getKey(
		kickClientId,
		kickSecret,
	);

	if (!authKey) {
		return;
	}

	updateAuthTokens({ kickAuthToken: authKey });
}

module.exports = { updateKickAuth };
