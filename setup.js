require('dotenv').config();
const {Client,GatewayIntentBits,ChannelType,PermissionFlagsBits:P} = require('discord.js');
const client = new Client({intents:[GatewayIntentBits.Guilds]});
const roles = {
  command:['NHS Director','Deputy NHS Director','Chief Medical Officer','Head of Ambulance Service','Operations Commander'],
  supervisor:['Clinical Lead','Duty Manager','Ambulance Supervisor','Senior Paramedic'],
  medical:['Consultant','Doctor','Junior Doctor','Advanced Paramedic','Paramedic','Emergency Medical Technician','Emergency Care Assistant','Student Paramedic'],
  specialist:['HEMS','HART','Critical Care','Rapid Response','Ambulance Control','Air Ambulance'],
  training:['Head of Training','NHS Trainer','NHS Trainee'],
  recruitment:['Recruitment Lead','Recruitment Officer'],
  staff:['NHS Staff','NHS Probation','NHS Applicant'],
  status:['On Duty','Off Duty','Leave of Absence','Suspended']
};
const sections = [
 ['📌 NHS INFORMATION','public',['welcome','nhs-announcements','nhs-rules','nhs-handbook','rank-structure','uniform-guide','vehicle-guide','important-links']],
 ['🚑 NHS RECRUITMENT','public',['recruitment-status','how-to-apply','nhs-applications','application-questions','interview-information','recruitment-results']],
 ['💬 NHS COMMUNITY','public',['nhs-general','nhs-media','questions-and-help','suggestions','bot-commands']],
 ['🏥 NHS OPERATIONS','staff',['duty-rota','clock-in-out','dispatch','active-units','patient-handover-rp','incident-reports','vehicle-requests','shift-reports']],
 ['🩺 NHS DEPARTMENTS','staff',['ambulance-service','hospital-staff','hart-operations','hems-operations','critical-care','rapid-response','control-room']],
 ['📚 NHS TRAINING','staff',['training-announcements','training-bookings','training-resources','training-results','probation-reviews']],
 ['🔒 NHS STAFF ONLY','staff',['staff-chat','staff-notices','staff-resources','leave-of-absence','staff-feedback']],
 ['👑 NHS COMMAND','command',['command-chat','command-announcements','application-reviews','promotions','disciplinary-records','management-decisions','staff-activity']],
 ['🎫 NHS SUPPORT','public',['open-a-ticket','ticket-information','ticket-logs']],
 ['🔊 NHS VOICE','staff',['NHS General VC','Dispatch Radio','Ambulance Radio 1','Ambulance Radio 2','Training Room','Command Meeting']]
];
const dry = !process.argv.includes('--apply');
client.once('ready',async()=>{
 try {
 const guild = await client.guilds.fetch(process.env.GUILD_ID);
 await guild.roles.fetch(); await guild.channels.fetch();
 const bot = await guild.members.fetchMe();
 if (!dry && (!bot.permissions.has(P.ManageRoles)||!bot.permissions.has(P.ManageChannels))) throw Error('Bot needs Manage Roles and Manage Channels');
 console.log(`${dry?'PREVIEW':'APPLY'} for ${guild.name}; existing items are never deleted or edited.`);
 const ids={};
 for(const [group,names] of Object.entries(roles)) for(const name of names){
  const full=`NHS | ${name}`; let role=guild.roles.cache.find(r=>r.name===full);
  if(!role && !dry){role=await guild.roles.create({name:full,color:({command:0x9b1c31,supervisor:0xc47f16,medical:0x178e58,specialist:0x2479ae,training:0x8358a6,recruitment:0x348c90,staff:0x73808b,status:0x66717d})[group],permissions:0n,reason:'No Easy Way NHS setup'});}
  ids[name]=role?.id; console.log(`${role?'EXISTS':'NEW ROLE'} ${full}`);
 }
 const accessNames={staff:[...roles.command,...roles.supervisor,...roles.medical,...roles.specialist,...roles.training,...roles.recruitment,'NHS Staff','NHS Probation'],command:[...roles.command]};
 for(const [title,visibility,names] of sections){
  let category=guild.channels.cache.find(c=>c.type===ChannelType.GuildCategory&&c.name===title);
  const overwrites=visibility==='public'?[{id:guild.id,allow:[P.ViewChannel]}]:[{id:guild.id,deny:[P.ViewChannel]},{id:bot.id,allow:[P.ViewChannel,P.SendMessages,P.Connect]},...accessNames[visibility].filter(n=>ids[n]).map(n=>({id:ids[n],allow:[P.ViewChannel]}))];
  if(!category && !dry) category=await guild.channels.create({name:title,type:ChannelType.GuildCategory,permissionOverwrites:overwrites,reason:'No Easy Way NHS setup'});
  console.log(`${category?'EXISTS':'NEW CATEGORY'} ${title}`);
  for(const name of names){
   const voice=title==='🔊 NHS VOICE';
   const existing=category?guild.channels.cache.find(c=>c.parentId===category.id&&c.name===name):null;
   if(!existing&&!dry) {
    const confidential=['nhs-applications','recruitment-results','training-results','probation-reviews','ticket-logs','Command Meeting'].includes(name);
    const readOnly=visibility==='public'&&!['nhs-general','nhs-media','questions-and-help','suggestions','bot-commands'].includes(name);
    const permissionOverwrites=confidential?[{id:guild.id,deny:[P.ViewChannel]},{id:bot.id,allow:[P.ViewChannel,P.SendMessages,P.Connect]},...roles.command.filter(n=>ids[n]).map(n=>({id:ids[n],allow:[P.ViewChannel,P.SendMessages,P.Connect]}))]:readOnly?[{id:guild.id,allow:[P.ViewChannel],deny:[P.SendMessages]},{id:bot.id,allow:[P.ViewChannel,P.SendMessages]},...roles.command.filter(n=>ids[n]).map(n=>({id:ids[n],allow:[P.ViewChannel,P.SendMessages]}))]:undefined;
    await guild.channels.create({name,type:voice?ChannelType.GuildVoice:ChannelType.GuildText,parent:category.id,...(permissionOverwrites?{permissionOverwrites}:{}),reason:'No Easy Way NHS setup'});
   }
   console.log(`  ${existing?'EXISTS':'NEW CHANNEL'} ${name}`);
  }
 }
 console.log(dry?'Preview complete. Run with --apply to create.':'Completed. Review access and arrange role hierarchy manually.');
 }catch(err){console.error(err);process.exitCode=1;}finally{client.destroy();}
});
client.login(process.env.DISCORD_TOKEN).catch(()=>{console.error('Discord login failed: check DISCORD_TOKEN.');process.exitCode=1;client.destroy();});
