'use strict';

const fs = require('fs');

const databases = require('../databases.js');
const utils = require('../utils.js');

const WIFI_ROOM = 'wifi';
const INGAME_ROOM = 'sunmoon';

const FC_REGEX = /[0-9]{4}[- ]?[0-9]{4}[- ]?[0-9]{4}/;

let friendcodes;

function loadFriendcodes() {
	let data;
	try {
		data = require('../data/friendcodes.json');
	} catch (e) {}

	if (typeof data !== 'object' || Array.isArray(data)) data = {};

	return data;
}

function writeFriendcodes() {
	let toWrite = JSON.stringify(friendcodes);
	fs.writeFileSync('./data/friendcodes.json', toWrite);
}

databases.addDatabase('friendcodes', loadFriendcodes, writeFriendcodes);
friendcodes = databases.getDatabase('friendcodes');

module.exports = {
	commands: {
		addfc: {
			rooms: [WIFI_ROOM, INGAME_ROOM],
			action(message) {
				if (!this.canUse(2)) {
					let hasPermission = false;
					if (this.userlists[WIFI_ROOM] && this.userid in this.userlists[WIFI_ROOM]) {
						this.auth = this.userlists[WIFI_ROOM][this.userid][0];
						hasPermission = this.canUse(2);
					}
					if (!hasPermission && this.userlists[INGAME_ROOM] && this.userid in this.userlists[INGAME_ROOM]) {
						this.auth = this.userlists[INGAME_ROOM][this.userid][0];
						hasPermission = this.canUse(2);
					}
					if (!hasPermission) {
						return this.pmreply(`You need to be in either the ${WIFI_ROOM} or ${INGAME_ROOM} room and have % or above in that room to use this command.`);
					}
				}

				let [name, fc] = message.split(',');
				if (!(name && fc)) return this.pmreply("Syntax: ``.addfc name, fc``");

				name = toId(name);
				if (!FC_REGEX.test(fc.trim())) return "Invalid formatting for Friend Code. format: ``1111-2222-3333``";
				fc = toId(fc);
				fc = fc.substr(0, 4) + '-' + fc.substr(4, 4) + '-' + fc.substr(8, 4);
				if (!utils.validateFc(fc)) return "The Friend code you entered is invalid";

				friendcodes[name] = fc;
				databases.writeDatabase('friendcodes');
			},
		},
		deletefc: {
			rooms: [WIFI_ROOM, INGAME_ROOM],
			action(message) {
				if (!this.canUse(2)) {
					let hasPermission = false;
					if (this.userlists[WIFI_ROOM] && this.userid in this.userlists[WIFI_ROOM]) {
						this.auth = this.userlists[WIFI_ROOM][this.userid][0];
						hasPermission = this.canUse(2);
					}
					if (!hasPermission && this.userlists[INGAME_ROOM] && this.userid in this.userlists[INGAME_ROOM]) {
						this.auth = this.userlists[INGAME_ROOM][this.userid][0];
						hasPermission = this.canUse(2);
					}
					if (!hasPermission) {
						return this.pmreply(`You need to be in either the ${WIFI_ROOM} or ${INGAME_ROOM} room and have % or above in that room to use this command.`);
					}
				}

				let name = toId(message);

				if (!(name in friendcodes)) return this.pmreply("This person doesn't have a friend code registered.");

				delete friendcodes[name];
				databases.writeDatabase('friendcodes');
			},
		},
		fc: {
			rooms: [WIFI_ROOM, INGAME_ROOM],
			action(message) {
				if (message) {
					message = toId(message);
				} else {
					message = this.userid;
				}

				let self = message === this.userid;

				if (!(message in friendcodes)) return this.pmreply((self ? "You don't" : "This person doesn't") + " have a friend code registered.");

				if (this.canUse(1) || self) {
					this.reply((self ? "Your" : message + "'s") + " friend code: " + friendcodes[message]);
				} else {
					this.pmreply(message + "'s friend code: " + friendcodes[message]);
				}
			},
		},
	},
};