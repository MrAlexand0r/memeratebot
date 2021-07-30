require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const markov = require('./markov');
const polls = require('./data');

const bot = new TelegramBot(process.env.token, {
    polling: true
});

var timeoutDate;


bot.on("polling_error", (msg) => console.log(msg));


bot.on("message", (msg) => {
    handleCommands(msg);
    if (msg.text)
        handleMarkov(msg);
});


function handleMarkov(msg) {
    markov.addSentenceToUser(msg.from.id, msg.text);
    if (Math.random() > 0.8 && (timeoutDate && timeoutDate < new Date())) {
        console.log("sending generated message for user" + msg.from.id);
        bot.sendMessage(msg.chat.id, markov.generateSentence(msg.from.id));
    }
}

bot.onText(/\/random (.+)/, (msg, match) => {
    const options = match[1].split(',');
    const pick = Math.floor(Math.random() * options.length);
    bot.sendMessage(msg.chat.id, options[pick]);
});

bot.onText(/\/timeout (.+)/, (msg, match) => {
    const timeout = match[1] - 0;
    if (timeout) {
        timeoutDate = new Date(new Date().getTime() + timeout * 60000);
        bot.sendMessage(msg.chat.id, `timed out bot until ${timeoutDate} (${timeout} minutes)` );
    } else {
        bot.sendMessage(msg.chat.id, "invalid parameter");
    }
});

bot.onText(/\/[A-z]+/, (msg, match) => {
    const resp = match[0].split('/')[1];
    let poll = findPoll(resp);
    if (poll)
        bot.sendPoll(msg.chat.id, '😎', poll.answers);
});

bot.on('photo', (msg) => {
    const chatId = msg.chat.id;

    let poll;
    let sendPoll = true;
    if (msg.caption && msg.caption.indexOf('rating:') === 0) {
        let name = msg.caption.split('rating:')[1].trim();
        let options = name.split(" ");
        if (name === 'none') {
            sendPoll = false;
        } else if (options.length > 1) {
            sendPoll = false;
            bot.sendPoll(chatId, '😎', options);
        } else {
            poll = findPoll(name);
        }
    }
    if (sendPoll) {
        bot.sendPoll(chatId, '😎', poll ? poll.answers : polls[0].answers);
    }
});

function findPoll(name) {
    return polls.find(p => p.name === name);
}

function handleCommands(msg) {
    if (msg.entities && msg.entities.some(e => e.type === 'url')) {
        let rating = msg.text.match(/rating:\ *[A-z]+\ */);
        if (rating) {
            let name = rating[0].split(':')[1].trim();
            let poll = findPoll(name);
            bot.sendPoll(msg.chat.id, '😎', poll.answers);
        }
    }
}