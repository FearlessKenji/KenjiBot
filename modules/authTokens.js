const path = require(`node:path`);
const fs = require(`node:fs`);

const authFolder = path.join(process.cwd(), `auth`);
const authFile = path.join(authFolder, `tokens.json`);

function getAuthTokens() {
	if (!fs.existsSync(authFile)) {
		return {};
	}

	return JSON.parse(fs.readFileSync(authFile, `utf8`));
}

function updateAuthTokens(tokens) {
	if (!fs.existsSync(authFolder)) {
		fs.mkdirSync(authFolder, { recursive: true });
	}

	const currentTokens = getAuthTokens();

	fs.writeFileSync(authFile, JSON.stringify({
		...currentTokens,
		...tokens,
		updatedAt: new Date().toISOString(),
	}, null, 2));
}

module.exports = { getAuthTokens, updateAuthTokens };
