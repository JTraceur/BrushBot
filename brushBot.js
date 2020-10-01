//Imports:
const Discord = require('discord.js');
const client = new Discord.Client();
const auth = require('./auth.json');
const database = require('./brushbotDatabase');

//Emojis
const emojiUpvote = '621563033809977354';
//Get Channels:
const critiqueChannel = '621553313997127680'; //209534461535191040 - Actual channel id
const wipChannel = '376412827595833346';

const serverID = '209534267934507008';

const levelArray = [10, 20, 40, 80, 160, 320];
const levelRoleNames = ['Poster', 'Frequent Poster', 'Painter', 'Dedicated Painter', 'Experienced Painter', 'Artist'];

//Log in
console.log('Logging in...');
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});
client.login(auth.token);

function addTracking(message) {

    //React to message:
    message.react(emojiUpvote);

    //State goal:
    message.reply('Beep Boop Art detected! An Upvote reaction has been added to track votes for the next 10 hours. \nIf you wish to remove this, add **!notrack** to your post.');

    //Track users points:
    database.trackMessage(message);
    
    collector = message.createReactionCollector((reaction, user) => reaction.emoji.id === emojiUpvote && user.id !== message.author.id && user.id !== client.user.id, {time: "36000000", dispose: true});
    collector.on('collect', (reaction, user) => {
        database.addPoints(new database.messageObj(message.id, message.author.id, 0) , 1).then((userData) => { // Add points
            verifyLevel(new database.userObj(userData.id, userData.points, userData.level), levelArray);
        }); 
    });
    collector.on('dispose', (reaction, user) => {
        database.addPoints(new database.messageObj(message.id, message.author.id, 0), -1).then((userData) => { // Remove points
            verifyLevel(new database.userObj(userData.id, userData.points, userData.level), levelArray);
        }); 
    });
}

function testPoints (){
    msgObj = new database.messageObj('761157369433686016', '191215243073028096', 0);
    promise = database.addPoints(msgObj, 10);
    promise.then((userData) => {
        verifyLevel(new database.userObj(userData.id, userData.points, userData.level), levelArray);
    });
}

async function verifyLevel(userObj, levelIntervals){

    level = 0;

    for (pointsAmount of levelIntervals){
        if (userObj.points >= pointsAmount){
            level += 1;
        }
    }

    //Update level if needed:
    if (level != userObj.level){

        database.updateLevel(userObj, level).then(() => console.log(`Updated user ${userObj.id} to level ${level}`));
        guild = await client.guilds.fetch(serverID);

        //Give level role to user:
        user = await guild.members.fetch(userObj.id);
        roleName = levelRoleNames[level - 1];
        dsRole = guild.roles.cache.find(role => role.name === roleName);
        user.roles.add(dsRole);
    }
}

//Wait for message:
client.on('message', msg => {
    if (msg.content.indexOf('!notrack') === -1 && msg.channel.id === critiqueChannel && msg.attachments.size > 0) {

        addTracking(msg);
        console.log(`Tracking message: ${msg.id}`)
    }
});

//Wait for edited post
client.on('messageUpdate', (oldMessage, newMessage) => {

    //Validate command:
    if (oldMessage.channel.id === critiqueChannel && oldMessage.attachments.size > 0){

        //Remove tracking
        if (newMessage.content.indexOf('!notrack') !== -1) {
            //Remove upvote emoji
            newMessage.react(emojiUpvote);
            newMessage.reply('I have removed tracking. From your post.');
        }

        //Add tracking back
        if (oldMessage.content.indexOf('!notrack') !== -1 && newMessage.content.indexOf('!notrack') === -1) {
            newMessage.react(emojiUpvote);
            newMessage.reply('Tracking added again. \nIf you wish to remove this, add **!notrack** to your post.');
        }
        console.log(`Tracking status changed on message: ${newMessage.id}`);
    }
    else{
        newMessage.reply('**!notrack** has no effect on this message.');
    }
});


//Test function
module.exports.testFunc = testPoints;