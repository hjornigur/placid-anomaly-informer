import 'dotenv/config';
import axios from 'axios';
import { Client, GatewayIntentBits, Message, TextChannel } from 'discord.js';

import { JsonDB } from 'node-json-db';
import { Config } from 'node-json-db/dist/lib/JsonDBConfig';

// The first argument is the database filename. If no extension, '.json' is assumed and automatically added.
// The second argument is used to tell the DB to save after each push
// If you put false, you'll have to call the save() method.
// The third argument is to ask JsonDB to save the database in an human readable format. (default false)
// The last argument is the separator. By default it's slash (/)
const db = new JsonDB(new Config('anomalies', true, false, '/'));

// Це клієнт діскорду. Штука, через яку можна звертатися до нашого діскорд-серверу;
// Читати інформацію про канали, повідомлення, ролі, будь-що;
// І також писати повідомлення і робити все те, що можна робити через додаток діскорду руками.
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Коли ("on") client під'єднався до серверу (подія "ready"), запустити наступну функцію
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log('Database configuration:');
    console.log(db);
});

const valuableAnomalies = {
    gas: {
        'Bright Nebula': 'Небагато Viridian Mykoserocin',
        'Sparkling Nebula': ':sparkles: Багато Viridian Mykoserocin',
        'Glass Nebula': ':sparkles: Багато Celadon Mykoserocin',
        'Calabash Nebula': 'Небагато Celadon Mykoserocin',
    },
    data: {
        'Core Runner Drop Distribution': '',
        'Serpentis Gas Processing Site': '',
        'Standard Sleeper Cache': '',
        'Superior Sleeper Cache': ':sparkles:',
    },
    combat: {
        'Serpentis Drug Outlet': '1/10',
        'Serpentis Live Cargo Distribution Facilities': '2/10',
        'Serpentis Narcotic Warehouses': '3/10',
        'Serpentis Phi-Outpost': ':sparkles: 4/10',
        'Serpentis Corporation Hydroponics Site': ':sparkles: 5/10',
    },
    scc: {
        'SCC Secure Key Storage': '',
    },
};

// Коли ("on") на сервері створено будь-яке повідомлення (подія "messageCreate"), запустити наступну функцію;
// У функцію діскорд надасть нам повідомлення (параметр "msg"), яке було створене.
client.on('messageCreate', async (msg: Message) => {
    // Ми хочемо реагувати тільки на повідомлення в певному каналі.
    // 1010597177128652940 це ID каналу  #input в категорії "new anomalies"
    if (msg.channelId !== '1010597177128652940') {
        // Якщо це повідомлення не з цього каналу - виходимо із функції, нічого далі не робимо.
        return;
    }

    // console.log(msg.content)
    console.log(msg.attachments);
    const attachment = Array.from(msg.attachments)[0];
    if (attachment) {
        console.log('Attachments present');
        const fileUrl = attachment[1].url;
        const rawBookmarksData: string = (await axios.get(fileUrl)).data;
        const anomalies = rawBookmarksData
            .split('\n')
            .map(row => row.split('\t'))
            .filter(splittedRow => splittedRow[0].match(/\w{3}-\d{3} .*/g))
            .reverse();
        for (let [bookmarkName, , , system, region, , date, , creator] of anomalies) {
            for (let anomalyCategory in valuableAnomalies) {
                const anomalyCategoryMapping = valuableAnomalies[anomalyCategory];
                for (let anomalyName in anomalyCategoryMapping) {
                    if (bookmarkName.includes(anomalyName)) {
                        const id = bookmarkName.split(' ')[0];
                        try {
                            const saved = await db.getData(`/${id}`);
                        } catch (err) {
                            console.log(
                                `New ${anomalyName} has been found in ${system} by ${creator}`,
                            );
                            const anomalyInfo = anomalyCategoryMapping[anomalyName];
                            const channel = client.channels.cache.find(
                                (ch: TextChannel) => ch.name === anomalyCategory,
                            );
                            await (channel as TextChannel).send({
                                content: `@here\n**${creator}** знайшов шось цікаве:\n**${anomalyName}** ${
                                    anomalyInfo ? '(' + anomalyInfo + ')' : ''
                                }\nSystem: **${system}** Sig: ${id}\nЧас знахідки: ${date} EVE time\n-----`,
                            });
                            await db.push(`/${id}`, anomalyName);
                        }
                    }
                }
            }
        }
    }
});

//make sure this line is the last line
// Під'єднатися до серверу, використовуючи токен нашого бота (він створюється в спец панелі в діскорді)
client.login(process.env.CLIENT_TOKEN); //login bot using token
