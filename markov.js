const redis = require('redis');
const Markov = require('ez-markov');

const userMarkov = [];

require('dotenv').config();
const client = redis.createClient({
    port: process.env.redisPort,
    host: process.env.redisDB,
    password: process.env.redisPW
});


client.on("error", function (error) {
    console.error(error);
});

function getMarkov(user) {
    return userMarkov.find(m => m.id === user);
}

function getMarkovForUser(user, initCorpus) {
    let markov = getMarkov(user);
    if (!userMarkov.length || !markov) {
        console.log("init markov for user " + user);
        markov = {id: user, markov: new Markov()};
        userMarkov.push(markov);

        if (initCorpus)
            markov.markov.addCorpus(initCorpus);
    }
    return markov.markov;
}

function addSentenceToUser(user, sentence) {
    client.get(user, (err, msg) => {
        if (!err) {
            client.append(user, ". " + sentence);
        } else {
            client.set(user, sentence);
        }
        const markov = getMarkovForUser(user, msg);
        markov.addSentence(sentence);
    });
}

function generateSentence(id) {
    return getMarkov(id).markov.getSentence();
}

module.exports = {
    addSentenceToUser: addSentenceToUser,
    generateSentence: generateSentence
};