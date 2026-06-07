const auth = require(`./authKick.js`);
const { updateAuthTokens } = require(`./authTokens.js`);
const { kickClientId, kickSecret } = process.env;
const { writeLog } = require(`../utils/writeLog.js`)

// get a new authorization key and update the runtime auth cache
async function updateKickAuth() {
	// writeLog(`[INFO] Generating new Kick auth token...`)
	const authKey = await auth.getKey(
		kickClientId,
		kickSecret,
	);

	if (!authKey) {
		return;
	}

	updateAuthTokens({ kickAuthToken: authKey });
	// writeLog(`[INFO] New Kick auth token stored.`)
}



module.exports = { updateKickAuth };