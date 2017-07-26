"use strict";

const path = require('path'),
	  os = require('os'),
	  fs = require('fs-extra'),
	  logSymbols = require('log-symbols'),
	  chalk = require('chalk'),
	  expect = require('expect.js'),
	  sinon = require('sinon'),
	  Steamer = require('../bin/steamer'),
	  SteamerDoctor = require('../libs/steamer-plugin-doctor'),
	  SteamerConfig = require('../libs/steamer-plugin-config'),
	  SteamerList = require('../libs/steamer-plugin-list'),
	  pluginUtils = require('steamer-pluginutils'),
	  spawnSync = require('child_process').spawnSync;

var utils = new pluginUtils("steamer");


describe("steamer-plugin-doctor", function() {

	it("all pass", function() {

		var log = sinon.stub(console, 'log');

		// var NODE_PATH = process.env['NODE_PATH'];
		// process.env.NODE_PATH = "123";

		let steamer = new Steamer({
			_: ['doctor']
		});

		steamer.init();

		var NODE_PATH = steamer.utils.globalNodeModules;
		steamer.utils.globalNodeModules = "123";

    	expect(console.log.calledTwice).to.be(true);

    	expect(console.log.calledWith(logSymbols.success, " ", chalk.white('NODE_PATH is ' + process.env.NODE_PATH))).to.be(true);
    	expect(console.log.calledWith(logSymbols.success, " ", chalk.white('Node Version is ' + process.version))).to.be(true);

    	// process.env.NODE_PATH = NODE_PATH;
    	steamer.utils.globalNodeModules = NODE_PATH;
    	log.restore();

  	});

	it("fail NODE_PATH", function() {

		var log = sinon.stub(console, 'log');

		var steamerDoctor = new SteamerDoctor();

		var versionCheck = sinon.stub(steamerDoctor, 'isNodePathSet').callsFake(function() {
			return false;
		});

		steamerDoctor.init();

		expect(console.log.calledTwice).to.be(true);
		expect(console.log.calledWith(logSymbols.error, " ", chalk.red('NODE_PATH is undefined\nYou can visit https://github.com/SteamerTeam/steamerjs to see how to set NODE_PATH'))).to.be(true);
    	expect(console.log.calledWith(logSymbols.success, " ", chalk.white('Node Version is ' + process.version))).to.be(true);
		

		versionCheck.restore();
		log.restore();
  	});

  	it("fail NODE version", function() {

		var log = sinon.stub(console, 'log');

		var steamerDoctor = new SteamerDoctor();

		var versionCheck = sinon.stub(steamerDoctor, 'isNodeVerRight').callsFake(function() {
			return false;
		});

		steamerDoctor.init();

		expect(console.log.calledTwice).to.be(true);
		expect(console.log.calledWith(logSymbols.success, " ", chalk.white('NODE_PATH is ' + process.env.NODE_PATH))).to.be(true);
		expect(console.log.calledWith(logSymbols.error, " ", chalk.red('Node Version should be >= 5.0.0'))).to.be(true);
		

		versionCheck.restore();
		log.restore();

  	});

  	it("beforeInit fail NODE_PATH", function() {

  		var log = sinon.stub(console, 'log');

		var steamerDoctor = new SteamerDoctor();

		var versionCheck = sinon.stub(steamerDoctor, 'isNodePathSet').callsFake(function() {
			return false;
		});

		steamerDoctor.init();
		
		log.restore();

		expect(function() {
			steamerDoctor.beforeInit();
		}).to.throwError();
		

  	});

  	it("beforeInit fail NODE version", function() {
  		
  		var steamerDoctor = new SteamerDoctor();

		var versionCheck = sinon.stub(steamerDoctor, 'isNodeVerRight').callsFake(function() {
			return false;
		});

		expect(function() {
			steamerDoctor.beforeInit();
		}).to.throwError();
		
		versionCheck.restore();

  	});

  	it("help", function() {

		var log = sinon.stub(console, 'log');

		let steamer = new Steamer({
			_: ['doctor'],
			h: true,
		});

		steamer.init();

		expect(console.log.calledWith(chalk.green("\nusage: \n") + 'steamer doctor    help you check steamer running environment!\n')).to.be(true);

		log.restore();

  	});

});

describe("steamer-plugin-list", function() {
	it("list commands", function() {

		var readdirSync = sinon.stub(fs, 'readdirSync').callsFake(function() {
			return [
				'steamer-plugin-a',
				'steamer-plugin-b',
				'cdef'
			]
		});

		var log = sinon.stub(console, 'log');

		let steamer = new Steamer({
			_: ['list']
		});

		steamer.init();

		expect(console.log.calledWith(chalk.bold.white("Hello! You can use following commands: "))).to.be(true);
		expect(console.log.calledWith(chalk.green('a'))).to.be(true);
		expect(console.log.calledWith(chalk.green('b'))).to.be(true);
		expect(console.log.calledWith(chalk.green('config'))).to.be(true);
		expect(console.log.calledWith(chalk.green('list'))).to.be(true);
		expect(console.log.calledWith(chalk.green('doctor'))).to.be(true);
		// expect(console.log.callCount).to.be(11);

		readdirSync.restore();
		log.restore();

  	});

  	it("list commands if globalNodeModules is not set", function() {

		var log = sinon.stub(console, 'log');

		let steamerList = new SteamerList({});
		steamerList.utils.globalNodeModules = undefined;

		steamerList.init();

		expect(steamerList.filterCmds()).to.eql([]);
		// expect(console.log.callCount).to.be(6);
		expect(console.log.calledWith(chalk.bold.white("Hello! You can use following commands: "))).to.be(true);

		log.restore();

  	});

  	it("help", function() {

		var log = sinon.stub(console, 'log');

		let steamer = new Steamer({
			_: ['list'],
			h: true,
		});

		steamer.init();

		expect(console.log.calledWith(chalk.green("\nusage: \n") + 'steamer list    list all available commands\n')).to.be(true);

		log.restore();

  	});
});

describe("steamer-plugin-config", function() {

	var globalPath = path.join(process.cwd(), "./test/global"),
		localPath = path.join(process.cwd(), "./test/local");

	before(function() {
		fs.removeSync(globalPath);
		fs.removeSync(localPath);

		fs.ensureDirSync(globalPath);
		fs.ensureDirSync(localPath);

		process.chdir("./test/local");
	});

	after(function() {
		process.chdir("../../");
	});


	it("init config files", function() {

		let steamerConfig = new SteamerConfig({
			i: true,
		});

		steamerConfig.utils.globalHome = globalPath;

		steamerConfig.init();

		expect(steamerConfig.readConfig()).to.eql({});

  	});

  	it('set local key', function() {

  		// set k1:v1
  		var steamerConfig = new SteamerConfig({
			s: "k1=v1",
		});

		steamerConfig.utils.globalHome = globalPath;

		steamerConfig.init();

		// set k2:v2
		var steamerConfig = new SteamerConfig({
			s: "k2=v2",
		});

		steamerConfig.utils.globalHome = globalPath;

		steamerConfig.init();

		expect(steamerConfig.readConfig()).to.eql({ k1: 'v1', k2: 'v2' });

  	});

  	it('set global key', function() {

  		// set k3:v3
  		var steamerConfig = new SteamerConfig({
			s: "k1=v11",
			g: true
		});

		steamerConfig.utils.globalHome = globalPath;

		steamerConfig.init();

		// set k3:v3
		var steamerConfig = new SteamerConfig({
			s: "k3=v3",
			g: true
		});

		steamerConfig.utils.globalHome = globalPath;

		steamerConfig.init();

		// set k4:v4
		var steamerConfig = new SteamerConfig({
			s: "k4=v4",
			g: true
		});

		steamerConfig.utils.globalHome = globalPath;

		steamerConfig.init();

		// console.log(steamerConfig.readConfig());
		expect(steamerConfig.readConfig()).to.eql({ k1: 'v11', k2: 'v2', k3: 'v3', k4: 'v4'});

  	});

  	it('del local key', function() {

  		// del k2
  		var steamerConfig = new SteamerConfig({
			d: "k2",
		});

		steamerConfig.utils.globalHome = globalPath;

		steamerConfig.init();

		// console.log(steamerConfig.readConfig());
		expect(steamerConfig.readConfig()).to.eql({ k1: 'v11', k3: 'v3', k4: 'v4' });

  	});

  	it('del global key', function() {

  		// del k2
  		var steamerConfig = new SteamerConfig({
			d: "k4",
			g: true
		});

		steamerConfig.utils.globalHome = globalPath;

		steamerConfig.init();

		// console.log(steamerConfig.readConfig());
		expect(steamerConfig.readConfig()).to.eql({ k1: 'v11', k3: 'v3' });

  	});

  	it('list config', function() {


  		var steamerConfig = new SteamerConfig({
			l: true
		});

  		var log = sinon.stub(steamerConfig.utils, 'info');

		steamerConfig.utils.globalHome = globalPath;

		steamerConfig.init();

		expect(log.calledWith("k1=v11")).to.be(true);
		expect(log.calledWith("k3=v3")).to.be(true);

		log.restore();
  	});

  	it('help', function() {


  		var steamerConfig = new SteamerConfig({
			h: true
		});

  		var logSuccess = sinon.stub(steamerConfig.utils, 'success');
  		var log = sinon.stub(console, 'log');

		steamerConfig.utils.globalHome = globalPath;

		steamerConfig.help();

		expect(log.calledWith(chalk.green("\nusage: \n") + "steamer config    steamer config manager\n")).to.be(true);
		
		var optionMsg = chalk.green("options: \n");
		optionMsg += "    --list, -l                               list config key=value\n";
		optionMsg += "    --init, -i                               initiate config in current working directory\n";
		optionMsg += "    --set, -s <key>=<value> [-g|--global]    set key value in local or global config\n";
		optionMsg += "    --del, -d <key> [-g|--global]            delete key value in local or global config\n";

		expect(log.calledWith(optionMsg)).to.be(true);

		log.restore();
  	});

});

describe("steamerjs", function() {

	before(function() {
		try {
			process.chdir(path.join(process.cwd(), 'test/steamer-plugin-example'));

			process.env.steamer_test = true;

			spawnSync('npm', ['link'], {
				stdio: 'inherit',
			});

			process.chdir(path.join(process.cwd()));
		}
		catch(e) {
			console.log(e);
		}
	});

	after(function() {

		process.env.steamer_test = true;

		spawnSync('npm', ['unlink'], {
			stdio: 'inherit',
		});

		process.chdir('../../');
	});

	it('version steamerjs', function() {


  		var Steamerjs = new Steamer({
  			_: [],
			v: true
		});

  		var utilInfo = sinon.stub(Steamerjs.utils, 'info');

		Steamerjs.init();

		var pkgJson = require("../package.json");

		expect(utilInfo.calledWith(pkgJson.name + "@" + pkgJson.version)).to.be(true);

		utilInfo.restore();
  	});

  	it('version list', function() {


  		var Steamerjs = new Steamer({
  			_: ['list'],
			v: true
		});

  		var utilInfo = sinon.stub(Steamerjs.utils, 'info');
  		
		Steamerjs.init();

		var pkgJson = require("../package.json");

		expect(utilInfo.calledWith("built-in plugin: steamer-plugin-list\n" + pkgJson.name + "@" + pkgJson.version)).to.be(true);

		utilInfo.restore();
  	});

  	it('version exampmle1', function() {


  		var Steamerjs = new Steamer({
  			_: ['example1'],
			v: true
		});

  		var utilInfo = sinon.stub(Steamerjs.utils, 'info');
  		
		Steamerjs.init();

		expect(utilInfo.calledWith("steamer-plugin-example1@1.0.1")).to.be(true);

		utilInfo.restore();
  	});

  	it('help', function() {


  		var Steamerjs = new Steamer({
  			_: [],
			h: true,
		});

  		var utilInfo = sinon.stub(Steamerjs.utils, 'info');
  		
		Steamerjs.init();

		utilInfo.restore();
  	});

  	it('pkg not exist', function() {


  		var Steamerjs = new Steamer({
  			_: ['123'],
		});

  		var utilError = sinon.stub(Steamerjs.utils, 'error');
  		
  		Steamerjs.init();
			
  		expect(!!~utilError.firstCall.args[0].indexOf('steamer-plugin-123 is not installed.')).to.be(true);
		
		utilError.restore();
  	});

});

describe("steamer-plugin-update", function() {

	it('update steamer pkgs', function() {

  		var Steamerjs = new Steamer({
  			_: ['update'],
		});
  	});

});