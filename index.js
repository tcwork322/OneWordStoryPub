const Discord = require('discord.js');
require('dotenv').config();

const client = new Discord.Client({
    disableEveryone: true
});

client.on('ready', () => {
    console.log('StoryBot is online!');
    client.user.setActivity('sb!help', { type: 'LISTENING' });
});


// Variables
let storyArray = [];
let storyActive = false;
let channelId = '';
let authorArray = [];
let preventCons = [];
let coolDown = false;
let oneWord = true;
let storyTitle;
let botMessageCounter = [];

client.on('message', async message => {
    // Checks to stop spam and bugs
    const lcMsg = message.content.toLowerCase();
    if (message.author.bot) return;
    if (!message.guild) return;
    // Code to move bot to designated channel, assigns channel ID to variable
    if (lcMsg === 'sb!movehere') {
        channelId = message.channel.id;
        message.channel.send('Okay, I\'m here!');
    }
    // Help command
    if (lcMsg.startsWith('sb!help')) {
        message.channel.send({ embed: {
            color: 8359053,
            title: 'Hi, I am 1-WordStory',
            fields: [{
                name: 'Author',
                value: 'http://tcportfolio.xyz/'
                },
                {
                name: 'Commands :',
                value: 'sb!movehere, sb!startstory (title), sb!fin, sb!help'
                },
                {
                name: 'About this bot :',
                value: 'This bot was designed to serve the purpose of having an easy way to create and compile "one word" stories. To use the bot, move the bot to your selected channel, start a story, have seperate users send messages one by one and finish the story when you\'re done.'
            },
        ],
            timestamp: new Date(),
            footer: {
                icon_url: client.user.avatarURL,
                text: '© 1-WordStory',
            }
        }
    });
}
    // Function to check if only one word is being sent.
    // Checks if messages are being sent in the correct channel
    if (message.channel.id === channelId) {
    console.log(`${message.author.username} said: ${message.content}`);
        // Starts story if there is no story active
        if (lcMsg.startsWith('sb!startstory') && storyActive === false) {
            let storyTitleArr = message.content.split(' ');
            if (storyTitleArr.length === 1) {
                message.channel.send('You need to specify a story title! sb!startstory (title)');
                storyTitleArr = [];
                return;
            }
            const storyTitleArrSlice = storyTitleArr.slice(1);
            storyTitle = storyTitleArrSlice.join(' ');
            message.channel.send('Story has started, when you want to finish, type \'sb!fin\'');
            setTimeout(() => { storyActive = true; }, 1000);
        }
        // Warning for story already active
        if (lcMsg === 'sb!startstory' && storyActive === true) {
            message.channel.send(
                `${message.author.username}, please finish this story before starting a new one.`);
                if (message.deletable) message.delete();
        }
        // Attempting to count bot messages for cleanup, proving tricky so far because of return to prevent inf loop
        if (message.author.bot && storyActive === true) {
            botMessageCounter.push(message.content);
        }
        // Checks string for multiple words, returns false if more than one words
        if (storyActive === true) {
            const oneWordCheck = message.content.split(' ');
            oneWord = oneWordCheck.length === 1;
        }

        // Pushes message content to story array
        if (storyActive === true && coolDown === false && oneWord === true) {
        authorArray.push(message.author.username);
        coolDown = true;
        setTimeout(() => { coolDown = false; }, 50);
            // Prevents consecutive messages from single user.
            if (preventCons.length === 0 || message.author.id === preventCons[0]) {
                preventCons.push(message.author.id);
            } else if (message.author.id !== preventCons[0]) {
                preventCons.length = 0;
                preventCons.splice(0, 1, message.author.id);
            }
            if (message.author.id === preventCons[2] && lcMsg !== 'sb!fin') {
                if (message.deletable) message.delete();
                    return;
            } else if (message.author.id === preventCons[1] && lcMsg !== 'sb!fin') {
                if (message.deletable) message.delete();
                message.channel.send(
                    `${message.author.username}, you can't write a story by yourself.`);
                    return;
            }
        // Next line starts message cooldown to prevent two message accidents.
        } else if (storyActive === true && coolDown === true) {
            if (message.deletable) message.delete();
            message.channel.send(
                'Messages are being sent too quickly.');
                return;
        // Gives warning if user writes more than one word
        } else if (storyActive === true && coolDown === false && oneWord === false) {
            if (message.deletable) message.delete();
            message.channel.send(
                `${message.author.username}, you can only write one word at a time.`);
                return;
        }
        // Pushes message content if the code gets this far
        storyArray.push(message.content);

        // Sends an embed message containing story content/title/author
        if (lcMsg === 'sb!fin' && storyActive === true) {
            // Filters story array for commands and author array for duplicates
            storyArray = storyArray.filter(v => !v.includes('sb!'));
            authorArray = authorArray.filter((item, index) => authorArray.indexOf(item === index));
            const bulkDeleteLength = storyArray.length + botMessageCounter.length;
            preventCons = [];
            // Joins arrays into formatted text
            const storyPeriod = `${storyArray.join(' ')}.`;
            const story = storyPeriod.charAt(0).toUpperCase() + storyPeriod.slice(1);
            const uniqueAuthor = [...new Set(authorArray)];
            const authors = uniqueAuthor.join(', ');
            console.log(storyArray.join(' '));
            message.channel.send({ embed: {
                color: 8359053,
                title: storyTitle,
                fields: [{
                    name: 'Authors: ',
                    value: authors
                    },
                    {
                    name: `${storyTitle}: `,
                    value: story
                    }
                    ],
                timestamp: new Date(),
                footer: {
                    icon_url: client.user.avatarURL,
                    text: '© 1-WordStory'
                }
            }
            });
            console.log(bulkDeleteLength);
            console.log(botMessageCounter);
            //message.channel.bulkDelete(bulkDeleteLength);
            storyArray = [];
            authorArray = [];
            botMessageCounter = [];
            setTimeout(() => { storyActive = false; }, 1000);
        } else if (lcMsg === 'sb!fin' && storyActive === false) {
            message.channel.send(`${message.author.username}, there is no story active.`);
        }
    }
});
// Discord Login
client.login(process.env.DISCORD_TOKEN);
