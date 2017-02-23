"use strict";

// npm link

const path = require('path'),
	  pluginUtils = require('steamer-pluginutils'),
	  sinon = require('sinon'),
	  fs = require('fs-extra');

var utils = new pluginUtils();
const pluginPrefix = "steamer-plugin-";

const Steamer = require('../bin/steamer'),
	PluginList = require('../libs/steamer-plugin-list'),
	ConfigList = require('../libs/steamer-plugin-config');

const testFolder = "./spec/test",
	  resultFolder = "./spec/result/";

// remove test files
fs.removeSync(testFolder);
fs.ensureDirSync(testFolder);
// argv example: { _: [ 'list' ], install: true, '$0': 'steamer' }

function reset() {
	let configPlugin1 = new ConfigList({ _: [ 'config' ], s: "http-proxy=", '$0': 'steamer' });
	configPlugin1.localConfigFolder = process.cwd();
	configPlugin1.set();

	let configPlugin2 = new ConfigList({ _: [ 'config' ], s: "http-proxy=", g: true, '$0': 'steamer' });
	configPlugin2.set();

	let configPlugin3 = new ConfigList({ _: [ 'config' ], s: "https-proxy=", g: true, '$0': 'steamer' });
	configPlugin3.set();
}

describe("steamer list", function() {
	it("list all available commands", function() {

		let pluginList = new PluginList();

		let files = pluginList.filterCmds();

		let resultfiles = fs.readdirSync(utils.globalNodeModules);

		resultfiles = files.filter((item, key) => {
			return item.indexOf(pluginPrefix) === 0;
		});

		let reserverCmds = require('../libs/config').cmds;

		resultfiles = resultfiles.concat(reserverCmds);

		expect(files).toEqual(resultfiles);
  	});
});

describe("steamer config init", function() {
	it("init local steamerjs config", function() {

		process.chdir("./spec/test");

		let steamer = new Steamer({ _: [ 'config' ], i: true, '$0': 'steamer' });
		steamer.init();

		let config = require("./test/.steamer/steamer.js"),
			resultConfig = require(path.join(utils.globalNodeModules, 'steamerjs/.steamer/steamertemplate.js'));

		expect(JSON.stringify(config)).toEqual(JSON.stringify(resultConfig));
  	});
});

describe("steamer config list", function() {
	it("list steamerjs local config", function() {


		let configPlugin = new ConfigList({ _: [ 'config' ], l: true, '$0': 'steamer' });
		let config = configPlugin.readConfig(),
			resultConfig = require(path.join(utils.globalNodeModules, 'steamerjs/.steamer/steamertemplate.js'));

		expect(JSON.stringify(config)).toEqual(JSON.stringify(resultConfig.config));
  	});
});

describe("steamer config list", function() {
	it("list steamerjs global config", function() {


		let configPlugin = new ConfigList({ _: [ 'config' ], l: true, g: true, '$0': 'steamer' });
		let config = configPlugin.readConfig(),
			resultConfig = require(path.join(utils.globalNodeModules, 'steamerjs/.steamer/steamer.js'));

		expect(JSON.stringify(config)).toEqual(JSON.stringify(resultConfig.config));
  	});
});


describe("steamer config set1", function() {
	it("set steamerjs local config", function() {


		let configPlugin = new ConfigList({ _: [ 'config' ], s: "http-proxy=123", '$0': 'steamer' });
		configPlugin.localConfigFolder = process.cwd();

		configPlugin.set();
		let config = configPlugin.readConfig(),
			resultConfig = require(path.join(utils.globalNodeModules, 'steamerjs/.steamer/steamertemplate.js'));

		resultConfig.config["http-proxy"] = "123";

		expect(JSON.stringify(config)).toEqual(JSON.stringify(resultConfig.config));
  	});
});

describe("steamer config set2", function() {
	it("set steamerjs global config", function() {


		let configPlugin = new ConfigList({ _: [ 'config' ], s: "http-proxy=123", g: true, '$0': 'steamer' });
		configPlugin.set();

		let config = configPlugin.readConfig(),
		resultConfig = require(path.join(utils.globalNodeModules, 'steamerjs/.steamer/steamer.js'));

		resultConfig.config["http-proxy"] = "123";
		
		expect(JSON.stringify(config)).toEqual(JSON.stringify(resultConfig.config));
  	});
});

describe("steamer config setback1", function() {
	// just to revert the value before tests have set
	it("set back steamerjs local config", function() {

		reset();

		expect(true).toBe(true);
  	});
});

describe("steamer config del1", function() {
	it("del steamerjs local config", function() {

		let configPlugin = new ConfigList({ _: [ 'config' ], d: "https-proxy", '$0': 'steamer' });

		configPlugin.localConfigFolder = process.cwd();

		configPlugin.del();

		let config = configPlugin.readConfig(),
			resultConfig = require(path.join(utils.globalNodeModules, 'steamerjs/.steamer/steamertemplate.js'));

		delete resultConfig.config["https-proxy"];
		
		expect(JSON.stringify(config)).toEqual(JSON.stringify(resultConfig.config));
  	});
});

describe("steamer config del2", function() {
	it("del steamerjs global config", function() {

		let configPlugin = new ConfigList({ _: [ 'config' ], d: "https-proxy", g: true, '$0': 'steamer' });

		configPlugin.del();

		let config = configPlugin.readConfig(),
			resultConfig = require(path.join(utils.globalNodeModules, 'steamerjs/.steamer/steamer.js'));

		delete resultConfig.config["https-proxy"];

		expect(JSON.stringify(config)).toEqual(JSON.stringify(resultConfig.config));
  	});
});

describe("steamer config setback2", function() {
	// just to revert the value before tests have set
	it("set back steamerjs local config", function() {

		reset();

		expect(true).toBe(true);
  	});
});

describe("steamer doctor check environment", function() {
	beforeEach(function () {
	    this.sandbox = sinon.sandbox.create();
	    this.beforePath = process.env.NODE_PATH;
	});

	afterEach(function () {
	    this.sandbox.restore();
	    process.env.NODE_PATH = this.beforePath;
	});

	it("del global NODE_PATH", function() {
		delete process.env.NODE_PATH;
		expect(function() {
			let steamer = new Steamer();
			steamer.init();
		}).toThrow();
	});

	it("set global NODE_PATH", function() {
		expect(function() {
			let steamer = new Steamer();
			steamer.init();
		}).not.toThrow();
	});
});

