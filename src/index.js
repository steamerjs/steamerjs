#!/usr/bin/env node

var SteamerPlugin = require('steamer-plugin');

export default class Steamer extends SteamerPlugin {
	constructor() {
		super();
	}

	init() {
		console.log("!!!");
	}
};

const steamer = new Steamer();
steamer.init();
