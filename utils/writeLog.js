const { dateToString } = require(`./dateToString.js`);
const path = require(`node:path`);
const fs = require(`node:fs`);

const logsFolder = path.join(__dirname, `../logs`);
const logFile = path.join(logsFolder, `console.log`);

function initLog() {
	const header = `=== KenjiB0t Console Log ===`;
	const separator = `============================`;
	const timestamp = dateToString(Date.now());
	return `${header}\n${separator}\n[${timestamp}] Log file created.\n${separator}\n`;
}

function getErrorFile(err) {
	if (!err?.stack) return `unknown`;

	const match = err.stack.match(/\((.*?):\d+:\d+\)/);
	return match ? path.basename(match[1]) : `unknown`;
}

function writeLog(message, err, { includeStack = false, includeCause = true } = {}) {

	try {
		if (!fs.existsSync(logsFolder)) {
			fs.mkdirSync(logsFolder, { recursive: true });
		}
		if (!fs.existsSync(logFile)) {
			fs.writeFileSync(logFile, initLog());
		}

		const timestamp = dateToString(Date.now());

		let errorText = ``;

		if (err) {
			if (includeStack) {
				errorText = err.stack || err.message || String(err);

				if (includeCause && err.cause) {
					errorText += `\nCause: ${err.cause.stack || err.cause.message || err.cause
						}`;
				}
			} else {
				errorText = `Error: ${err.message} inside ${getErrorFile(err)}.`;

				if (includeCause && err.cause) {
					errorText += `\nCause: ${err.cause.message || String(err.cause)
						}`;
				}
			}
		}

		const logData =
			`[${timestamp}] ${message}` +
			(errorText ? `\n${errorText}` : ``) +
			`\n`;

		fs.appendFileSync(logFile, logData);

		const trimmedLog = logData.trim();

		if (err || message.includes(`[ERROR]`)) {
			console.error(trimmedLog);
		} else if (message.includes(`[WARNING]`)) {
			console.warn(trimmedLog);
		} else {
			console.log(trimmedLog);
		}

		return logData.trim();
	} catch (fsErr) {
		const failMessage = `[writeLog] Failed to write log: ${fsErr.stack || fsErr}`;
		console.error(failMessage);
		return failMessage;
	}
}

module.exports = { writeLog };
