var markov = require('../markov/markov.js');

var LIMIT = 16;

var cooldown = {};

module.exports = {
    analyzer: {
        parser: function(room, message) {
            var words = message.split(' ');

            var toParse = [];
            for (var i = 0; i < words.length; i++) {
                if (!/( ?https?:\/\/.*\.[^ ]* ?)|\[.*\]|<<.*>>/.test(words[i]) && toId(words[i]).length) {
                    toParse.push(words[i].replace(/``|__|\*\*|~~/g, ''));
                }
            }

            if (toParse.length < 3) return;

            if (!Markov[room]) {
                Markov[room] = markov(2);

                if (Data.markov[room]) {
                    Markov[room].db = Data.markov[room];
                }
            }
            if (!Data.markov[room]) {
                Data.markov[room] = Markov[room].db;
            }

            Markov[room].seed(toParse.join(' '));

            Handler.writeMarkov();
        }
    },

    commands: {
        say: function(symbol, room, message) {
            if (!canUse(symbol, 1)) return {pmreply: "Permission denied."};
            if (room && cooldown[room]) return {pmreply: "Please wait before using this again."};

            var generator = message;
            if (!generator) generator = room;

            if (generator === 'staff' && !(room === 'staff' || (!room && canUse(symbol, 2)))) return {pmreply: "I'm not leaking staff to you."};

            if (!Markov[generator]) {
                if (!Data.markov[generator]) return {pmreply: "Invalid room."};

                Markov[generator] = markov(2);
                Markov[generator].db = Data.markov[generator];
            }

            if (room) {
                cooldown[room] = true;
                setTimeout(() => delete cooldown[room], 10 * 1000);
            }
            return {reply: Markov[generator].fill(Markov[generator].pick(), 16).join(' ')};
        },
        reply: function(symbol, room, message) {
            if (!canUse(symbol, 1)) return {pmreply: "Permission denied."};
            if (room && cooldown[room]) return {pmreply: "Please wait before using this again."};
            if (!message) return {pmreply: "Please enter a message to get a reply for."};

            var generator = room;
            if (!generator) {
                var rooms = Object.keys(Data.markov);
                if (rooms.indexOf('staff') > -1) rooms.splice(rooms.indexOf('staff'), 1);
                generator = rooms[Math.floor(Math.random() * rooms.length)];
            }

            if (!Markov[generator]) {
                if (!Data.markov[generator]) return {pmreply: "Invalid room."};

                Markov[generator] = markov(2);
                Markov[generator].db = Data.markov[generator];
            }

            if (room) {
                cooldown[room] = true;
                setTimeout(() => delete cooldown[room], 10 * 1000);
            }
            return {reply: Markov[generator].respond(message, 16).join(' ')};
        }
    }
};
