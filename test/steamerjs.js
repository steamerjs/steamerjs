'use strict';

const path = require('path'),
    chalk = require('chalk'),
    expect = require('chai').expect,
    sinon = require('sinon'),
    Steamer = require('../bin/steamer'),
    spawnSync = require('child_process').spawnSync;

describe('steamerjs', function() {

    before(function() {
        try {
            process.chdir(path.join(process.cwd(), 'test/steamer-plugin-example'));

            process.env.steamer_test = true;

            spawnSync('npm', ['link'], {
                stdio: 'inherit',
            });

            process.chdir(path.join(process.cwd()));
        }
        catch (e) {
            console.log(e);
        }
    });

    after(function() {

        process.env.steamer_test = false;

        spawnSync('npm', ['unlink'], {
            stdio: 'inherit',
        });

        process.chdir('../../');
    });

    it('version', function() {

        let Steamerjs = new Steamer({
            _: [],
            v: true
        });

        let info = sinon.stub(Steamerjs, 'info');

        Steamerjs.init();

        let pkgJson = require('../package.json');

        expect(info.calledWith(pkgJson.name + '@' + pkgJson.version)).to.eql(true);

        info.restore();
    });

    it('steamer list version', function() {


        let Steamerjs = new Steamer({
            _: ['list'],
            ver: true
        });

        let info = sinon.stub(Steamerjs, 'info');

        Steamerjs.init();

        let pkgJson = require('../package.json');

        expect(info.calledWith('built-in plugin: steamer-plugin-list\n' + pkgJson.name + '@' + pkgJson.version)).to.eql(true);

        info.restore();
    });

    it('init exampmle1', function() {
        let Steamerjs = new Steamer({
            _: ['example1'],
        });

        let logStub = sinon.stub(console, 'info');

        Steamerjs.init();

        expect(logStub.calledWith(chalk['cyan']('This is plugin example.'))).to.eql(true);

        logStub.restore();
    });

    it('version exampmle1', function() {

        let Steamerjs = new Steamer({
            _: ['example1'],
            ver: true
        });

        let info = sinon.stub(Steamerjs, 'info');

        Steamerjs.init();

        expect(info.calledWith('steamer-plugin-example1@1.0.1')).to.eql(true);

        info.restore();
    });

    it('help exampmle1', function() {
        let Steamerjs = new Steamer({
            _: ['example1'],
            help: true
        });

        Steamerjs.init();

    });

    it('help', function() {
        let Steamerjs = new Steamer({
            _: [],
            h: true,
        });

        let info = sinon.stub(Steamerjs, 'info');

        Steamerjs.init();

        info.restore();
    });

    it('pkg not exist', function() {
        let Steamerjs = new Steamer({
            _: ['123'],
        });

        let warnStub = sinon.stub(Steamerjs, 'warn'),
            errorStub = sinon.stub(Steamerjs, 'error');

        Steamerjs.init();

        expect(!!~warnStub.calledWith('Please run \"steamer doctor\" to detect the problem 1 & 2. ')).to.eql(true);

        warnStub.restore();
        errorStub.restore();
    });

});