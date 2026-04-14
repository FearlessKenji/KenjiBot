const { Servers, Channels } = require('../database/dbObjects.js');
const { EmbedBuilder } = require('discord.js');
const { writeLog } = require('./writeLog.js');
const channelData = require('./channelData.js');
const fs = require('node:fs');

/**
 * Fetch Twitch stream info for multiple channels in parallel.
 * Only fetches once per unique Twitch username.
 */
async function getTwitchDataBatch(channelNames, clientID, authKey) {
	const promises = channelNames.map(async (name) => {
		const url = `https://api.twitch.tv/helix/streams?user_login=${name}`;
		const headers = { 'Client-ID': clientID, 'Authorization': `Bearer ${authKey}` };
		try {
			const res = await fetch(url, { headers });
			if (!res.ok) {
				const text = await res.text();
				throw new Error(`HTTP ${res.status} - ${text}`);
			}

			const data = await res.json();
			return { name, data: data.data[0] ?? null }; // null if offline
		}
		catch (err) {
			console.error(writeLog(`Failed to fetch Twitch data for ${name}:`, err));
			return { name, data: null };
		}
	});

	return Promise.all(promises);
}

/**
 * Main Twitch check function.
 * - Loops through all servers
 * - Fetches Twitch info per channel globally
 * - Updates or sends Discord messages accordingly
 */
async function checkTwitch(client) {
	let config;
	try {
		config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
	}
	catch (err) {
		console.error(writeLog('Failed to read config.json:', err));
		return;
	}

	// Fetch all servers from DB
	const servers = await Servers.findAll({ raw: true });

	for (const server of servers) {
		const guild = client.guilds.cache.get(server.guildId);
		// console.log(writeLog(`Checking channels for ${guild?.name ?? 'Unknown guild'} (ID: ${server.guildId})`));

		// Fetch all channels for this server
		const channels = await Channels.findAll({ where: { guildId: server.guildId }, raw: true });
		const channelNames = channels
			.map(c => c.channelName?.toLowerCase().trim())
			.filter(name => name && /^[a-z0-9_]+$/.test(name));


		// Batch fetch Twitch data globally per channel name
		const streamsData = await getTwitchDataBatch(channelNames, config.twitchClientId, config.authToken);

		// Process each channel in the server
		const channelPromises = channels.map(async (chan) => {
			const streamInfo = streamsData.find(s => s.name === chan.channelName)?.data;

			// Determine which Discord channel to post in
			const discordChannelId = chan.isSelf ? server.selfChannelId : server.affiliateChannelId;
			const discordChannel = client.channels.cache.get(discordChannelId);
			if (!discordChannel) {
				console.error(writeLog(`Twitch updates cannot be sent to ${discordChannelId} channel in server ${guild?.name} (ID: ${server.guildId}).`));
				return;
			}

			// Mention the appropriate role if available
			const roleMention = chan.isSelf
				? server.selfRoleId ? `<@&${server.selfRoleId}> ` : ''
				: server.affiliateRoleId ? `<@&${server.affiliateRoleId}> ` : '';

			if (!streamInfo) {
				// Stream is offline → remove messageId so it won't be edited again
				if (chan.messageId) {
					try {
						return
						//await Channels.update({ messageId: null, streamId: null }, { where: { id: chan.id } });
					}
					catch (err) {
						console.error(writeLog(`Failed to clear offline messageId for ${chan.channelName}:`, err));
					}
				}
				return; // nothing else to do for offline stream
			}


			// Stream is live → fetch Twitch channel data (thumbnail, etc.)
			const twitchChannel = await channelData.getData(chan.channelName, config.twitchClientId, config.authToken);
			if (!twitchChannel) return;

			const startTime = new Date(streamInfo.started_at).toLocaleString();
			const editTime = new Date().toLocaleString();

			// Build embed fields
			const fields = [
				{ name: 'Playing', value: streamInfo.game_name, inline: true },
				{ name: 'Viewers', value: streamInfo.viewer_count.toString(), inline: true },
				{ name: 'Twitch', value: `[Watch stream](https://www.twitch.tv/${streamInfo.user_login})` },
			];
			if (chan.discordUrl) fields.push({ name: 'Discord Server', value: `[Join here](${chan.discordUrl})` });

			const sendEmbed = new EmbedBuilder()
				.setTitle(`${streamInfo.user_name} is now live`)
				.setDescription(streamInfo.title)
				.setURL(`https://www.twitch.tv/${streamInfo.user_login}`)
				.setColor(0xF00F7D)
				.setFields(fields)
				.setFooter({ text: `Started ${startTime}. Last edited ${editTime}.` })
				.setThumbnail(twitchChannel.thumbnail_url)
				.setImage(`https://static-cdn.jtvnw.net/previews-ttv/live_user_${streamInfo.user_login}-640x360.jpg?cacheBypass=${Math.random()}`);

			const content = chan.isSelf
				? `${roleMention}I just went live! I'm streaming ${streamInfo.game_name}!`
				: `${roleMention}An affiliate has gone live! They're streaming ${streamInfo.game_name}!`;

			// Send or edit Discord message
			try {
				if (chan.messageId && chan.streamId === streamInfo.id) {
					// Edit existing live message
					const existingMessage = await discordChannel.messages.fetch(chan.messageId).catch(() => null);
					if (existingMessage) {
						await existingMessage.edit({ content, embeds: [sendEmbed] });
						return;
					}

					// Send new live message
					const message = await discordChannel.send({ content, embeds: [sendEmbed] });
					// Update DB with new messageId
					await Channels.update({ messageId: message.id, streamId: streamInfo.id }, { where: { id: chan.id } });
				}
			}
			catch (err) {
				console.error(writeLog(`Failed to send/edit Twitch message for ${chan.channelName}:`, err));
			}
		});

		// Process all channels for this server concurrently
		await Promise.allSettled(channelPromises);
	}
}

module.exports = { checkTwitch };