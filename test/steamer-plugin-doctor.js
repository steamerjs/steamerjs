'use strict';

const path = require('path'),
    logSymbols = require('log-symbols'),
    expect = require('chai').expect,
    sinon = require('sinon'),
    SteamerDoctor = require('../bin/libs/steamer-plugin-doctor');


describe('steamer-plugin-doctor', function() {
    it('all pass', function(cb) {

        let doctor = new SteamerDoctor({
            _: ['doctor']
        });

        let logSub = sinon.stub(doctor, 'log');

        doctor.init().then(function (value) {
            expect(doctor.log.calledWith(`${logSymbols.success}  NODE_PATH is ${doctor.getGlobalModules()}`)).to.equal(true);
            expect(doctor.log.calledWith(`${logSymbols.success}  Node Version is ${process.version}`)).to.equal(true);
            logSub.restore();
            cb();
        }).catch((e) => {
            cb(e);
        });

    });

    it('all failed', function(cb) {

        let doctor = new SteamerDoctor({
            _: ['doctor']
        });

        let NODE_PATH = process.env.NODE_PATH,
            baseVer = doctor.baseVer;

        process.env.NODE_PATH = path.resolve();
        doctor.baseVer = '20.0.0';

        let logSub = sinon.stub(doctor, 'log');

        doctor.init().then(function (value) {
            expect(doctor.log.calledWith(`${logSymbols.error}  NODE_PATH should equal to ${doctor.chalk.yellow(doctor.npmRoot)}. \nPlease run  \'npm root -g\' to get this value. \nYou can visit https://github.com/SteamerTeam/steamerjs to see how to set NODE_PATH`)).to.equal(true);
            expect(doctor.log.calledWith(`${logSymbols.error}  Node Version should be >= ${doctor.baseVer}`)).to.equal(true);
            
            // restore
            logSub.restore();
            process.env.NODE_PATH = NODE_PATH;
            doctor.baseVer = baseVer;
            cb();
        }).catch((e) => {
            cb(e);
        });

    });
});