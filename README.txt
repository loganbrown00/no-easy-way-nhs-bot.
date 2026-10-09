NO EASY WAY | NHS — ALWAYS-ON BOT + SERVER LAYOUT

QUICK START ON RAILWAY
1. Extract this ZIP. Upload the contents of the london-central-nhs folder to a private GitHub repository, then connect that repository to a Railway service. package.json, index.js, Dockerfile and railway.json must be at the repository root.
2. In Railway Variables add DISCORD_TOKEN and GUILD_ID. Get GUILD_ID by enabling Discord Developer Mode and copying your NEW server's ID. Never post your token in chat or commit .env.
3. In Discord Developer Portal invite the bot using BOTH bot and applications.commands scopes. Give Manage Roles, Manage Channels, View Channels, Send Messages and Attach Files. Administrator and privileged gateway intents are not required.
4. Place the bot's role above NHS roles and below your owner role.
5. Deploy. Start Command must be npm start (remove any old node src/index.js override). Keep one replica. Confirm restart policy Always, Serverless/App Sleeping OFF, and healthcheck /health. The supplied railway.json sets these preferences; check the service dashboard after deployment.
6. Wait for the bot to appear online. As server OWNER run /preview, then /setup. /status checks uptime. Setup runs only when requested, never on restart. If interrupted, retry /setup; existing exact-name items are skipped.
7. Assign ranks yourself. Review the new channels using View Server As Role before inviting staff. Existing channels are never repaired automatically; if an older setup left public logs, restrict those manually.

24/7 RELIABILITY
The bot remains connected after setup, uses Discord's gateway reconnection, reports readiness on the Railway PORT, and exits for a host restart if recovery stalls for five minutes. Unexpected fatal errors exit rather than continue in a broken state. Ordinary command errors are caught. SIGTERM closes connections cleanly. Railway's Always policy restarts a stopped process.
Use an active hosting plan with enough balance and resources. Railway/Discord outages, expired tokens, account limits and cancelled hosting can still interrupt uptime. No bot can guarantee zero crashes or 100% uptime. The health endpoint supports deployment readiness; it is not itself a continuous external monitor.
Do not run two replicas or two copies of this bot against the same server. A process lock prevents overlapping setup commands within this single running instance.

INCLUDED LAYOUT
35 roles across command, supervisors, medical, specialists, training, recruitment, staff and duty status.
10 categories and 60 text/voice channels covering information, recruitment, community, operations, departments, training, staff, command, support and radios.
Roles have no server-wide administrative powers. Staff ranks see staff areas; command ranks see command areas. Public information channels are read-only except for command and bot access. Applications, recruitment results, training results, probation reviews, ticket logs and Command Meeting are restricted to command and bot. Existing roles/channels and their permissions are preserved. No members are automatically assigned roles.
Specialist sections currently share NHS staff access. Suspended is a label, not an automatic access ban: remove all access-granting ranks from suspended members. Administrator users can always see private channels.

WHAT THE BOT DOES
/setup builds missing roles/channels; /preview describes the build; /status checks uptime. These build commands are server-owner only.
Application channels, ticket channels, clock-in/out and logs are layout placeholders. This package does not yet collect applications, open tickets, record duty time, moderate users, or send promotion/disciplinary logs. Connect a suitable bot or configure those workflows before use. Use roleplay-only patient information.

LOCAL OPTION
Install Node.js 22.12 or later. Run npm install, copy .env.example to .env and fill in its values, then npm start. A local computer must stay on for the bot to stay online.

TROUBLESHOOTING
Missing /setup: reinvite with applications.commands and check GUILD_ID.
Role creation fails: move bot role above NHS roles; confirm Manage Roles/Channels.
Cannot send preview: grant Send Messages and Attach Files in the command channel.
Login failure: reset token in Developer Portal and update Railway variables privately.
MODULE_NOT_FOUND /app/src/index.js: replace the old start command with npm start and ensure files are at service root.
