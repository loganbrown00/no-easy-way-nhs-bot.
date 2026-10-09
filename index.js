require('dotenv').config();
const http = require('node:http');
const { spawn } = require('node:child_process');
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { join } = require('node:path');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
let busy = false, stopping = false, disconnectedAt = null;
function fatal(message) { console.error(message); process.exit(1); }
if (!process.env.DISCORD_TOKEN || !/^\d{17,20}$/.test(process.env.GUILD_ID || '')) fatal('Set DISCORD_TOKEN and a valid GUILD_ID in host variables.');
const server = http.createServer((req, res) => {
  const ready = client.isReady() && !stopping;
  res.writeHead(ready ? 200 : 503, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ready, setupRunning: busy, uptimeSeconds: Math.floor(process.uptime()) }));
});
server.on('error', () => fatal('Health server failed. Check PORT.'));
server.listen(Number(process.env.PORT || 3000), '0.0.0.0');
client.once('clientReady', async () => {
  try {
    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    if (guild.ownerId !== process.env.OWNER_ID && process.env.OWNER_ID) fatal('OWNER_ID must match the Discord server owner.');
    await guild.commands.set([
      { name: 'preview', description: 'Owner only: preview NHS roles and channels' },
      { name: 'setup', description: 'Owner only: create missing NHS roles and channels' },
      { name: 'status', description: 'Check NHS bot uptime and connection' }
    ]);
    client.user.setActivity('No Easy Way | NHS', { type: ActivityType.Watching });
    console.log('No Easy Way NHS bot connected; commands registered.');
  } catch { fatal('Startup failed. Check guild ID, bot invitation and applications.commands scope.'); }
});
client.on('error', () => console.error('Discord client error; connection recovery in progress.'));
client.on('shardError', () => console.error('Discord gateway error; reconnecting.'));
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand() || interaction.guildId !== process.env.GUILD_ID) return;
  try {
    if (interaction.commandName === 'status') return await interaction.reply({ content: `NHS bot online. Uptime: ${Math.floor(process.uptime()/60)} minutes. Setup: ${busy ? 'running' : 'idle'}.`, ephemeral: true });
    const guild = await client.guilds.fetch(interaction.guildId);
    if (interaction.user.id !== guild.ownerId) return await interaction.reply({ content: 'Only the server owner can use setup commands.', ephemeral: true });
    if (!['setup','preview'].includes(interaction.commandName)) return;
    if (busy) return await interaction.reply({ content: 'Setup is already running. Please wait.', ephemeral: true });
    busy = true;
    await interaction.deferReply({ ephemeral: true });
    const args = [join(__dirname, 'setup.js')];
    if (interaction.commandName === 'setup') args.push('--apply');
    const child = spawn(process.execPath, args, { cwd: __dirname, env: process.env, stdio: ['ignore','pipe','pipe'] });
    let output = '';
    child.stdout.on('data', chunk => { output = (output + chunk.toString()).slice(-20000); });
    child.stderr.on('data', () => console.error('Builder reported an error. Check permissions and role hierarchy.'));
    const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); });
    busy = false;
    await interaction.editReply({ content: code === 0 ? (interaction.commandName === 'setup' ? 'NHS layout created. Existing items were kept. Review permissions and assign ranks before opening recruitment.' : 'Preview complete. No changes made. Attached is the layout preview.' ) : 'Setup stopped. Check bot permissions and role hierarchy, then retry. Completed items are preserved.', ...(code === 0 ? {files:[{attachment:Buffer.from(output),name:'nhs-setup-result.txt'}]} : {}) });
  } catch {
    busy = false;
    console.error('Command failed; bot remains online.');
    const msg = { content: 'Command failed. Check bot permissions and try again.' };
    try { if (interaction.deferred || interaction.replied) await interaction.editReply(msg); else await interaction.reply({...msg,ephemeral:true}); } catch {}
  }
});
// discord.js reconnects transient gateway failures. Restart if recovery stalls.
setInterval(() => {
  if (client.isReady()) disconnectedAt = null;
  else { disconnectedAt ??= Date.now(); if (Date.now() - disconnectedAt > 300000) fatal('Discord unavailable for five minutes; restarting.'); }
}, 30000).unref();
function shutdown() { if (stopping) return; stopping = true; client.destroy(); server.close(() => process.exit(0)); setTimeout(() => process.exit(0),5000).unref(); }
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('unhandledRejection', () => fatal('Unhandled async error; restarting safely.'));
process.on('uncaughtException', () => fatal('Unexpected runtime error; restarting safely.'));
client.login(process.env.DISCORD_TOKEN).catch(() => fatal('Discord login failed. Check the token privately in hosting variables.'));
