require('dotenv').config(); //initialize dotenv
const { default: axios } = require('axios');
const { Client, GatewayIntentBits } = require('discord.js'); //import discord.js

const { JsonDB } = require('node-json-db');
const { Config } = require('node-json-db/dist/lib/JsonDBConfig');

// The first argument is the database filename. If no extension, '.json' is assumed and automatically added.
// The second argument is used to tell the DB to save after each push
// If you put false, you'll have to call the save() method.
// The third argument is to ask JsonDB to save the database in an human readable format. (default false)
// The last argument is the separator. By default it's slash (/)
const db = new JsonDB(new Config("anomalies", true, false, '/'));


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
}); //create new client

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  console.log('Database configuration:');
  console.log(db);
});

const valuableAnomalies = {
    gas: {
        'Bright Nebula': 'Небагато Viridian Mykoserocin',
        'Sparkling Nebula': 'Багато Viridian Mykoserocin',
        'Glass Nebula': 'Багато Celadon Mykoserocin',
        'Calabash Nebula': 'Небагато Celadon Mykoserocin'
    },
    data: {
        'Core Runner Drop Distribution': '',
        'Serpentis Gas Processing Site': '',
        'Standard Sleeper Cache': '',
        'Superior Sleeper Cache': ''
    },
    combat: {
        'Serpentis Drug Outlet': '1/10',
        'Serpentis Live Cargo Distribution Facilities': '2/10',
        'Serpentis Narcotic Warehouses': '3/10',
        'Serpentis Phi-Outpost': '4/10',
        'Serpentis Corporation Hydroponics Site': '5/10'
    }
}

client.on('messageCreate', async msg => {
    // console.log(msg)
    if (msg.channelId === '1010597177128652940') {
        // console.log(msg.content)
        // console.log(msg.attachments)
        if (msg.attachments) {
            const fileUrl = Array.from(msg.attachments)[0][1].url;
            const rawBookmarksData = (await axios.get(fileUrl)).data;
            const anomalies = rawBookmarksData.split('\n')
                                  .map(row => row.split('\t'))
                                  .filter(row => row[0].match(/\w{3}-\d{3} .*/g))
                                  .reverse();
            for (let [bookmarkName,,,system,region,,,date,creator] of anomalies) {
                for (let anomalyCategory in valuableAnomalies) {
                    for (let anomalyName in valuableAnomalies[anomalyCategory]) {
                        if (bookmarkName.includes(anomalyName)) {
                            const id = bookmarkName.split(' ')[0];
                            try {
                                const saved = await db.getData(`/${id}`);
                            } catch(err) {
                                console.log(`New ${anomalyName} has been found in ${system} by ${creator}`);
                                const channel = client.channels.cache.find(ch => ch.name === anomalyCategory);
                                await channel.send({ content: `**${creator}** знайшов шось цікаве:\n**${anomalyName}**\nSystem: **${system}**\n-----` });
                                await db.push(`/${id}`, anomalyName);
                            };
                            
                        }
                    }
                }
            }
        }
    }
})


//make sure this line is the last line
client.login(process.env.CLIENT_TOKEN); //login bot using token
