'use strict';

const expect = require('chai').expect,
    sinon = require('sinon'),
    SteamerList = require('../bin/libs/steamer-plugin-list');


describe('steamer-plugin-list', function() {
    it('list all commands', function() {

        let list = new SteamerList({
            _: ['list']
        });

        let readdirSyncStub = sinon.stub(list.fs, 'readdirSync').callsFake(function() {
                return [
                    'steamer-plugin-a',
                    'steamer-plugin-b',
                    'cdef'
                ];
            }),
            readDescriptionStub = sinon.stub(list, 'readDescription').callsFake(function() {
                return {
                    files: [
                        'a',
                        'b',
                    ],
                    descriptions: {
                        a: 'plugin a',
                        b: 'plugin b',
                        config: 'config manager',
                        develop: 'develop plugins and starterkits',
                        doctor: 'help you check running environment',
                        jb: 'commands for AlloyTeam JB system',
                        kit: 'manage starterkits',
                        list: 'list all available commands',
                        team: 'manage config for your team',
                        update: 'update command plugins'
                    }
                }
            }),
            logSub = sinon.stub(list, 'log');

        list.init();

        expect(list.filterCmds()).to.eql({
            files:[ 
                'a',
                'b',
                'config',
                'develop',
                'doctor',
                'kit',
                'list',
                'task',
                'team',
                'update'
            ],
            descriptions: {
                a: 'plugin a',
                b: 'plugin b',
                config: 'config manager',
                develop: 'develop plugins and starterkits',
                doctor: 'help you check running environment',
                jb: 'commands for AlloyTeam JB system',
                kit: 'manage starterkits',
                list: 'list all available commands',
                task: 'run tasks parallelly or serially',
                team: 'manage config for your team',
                update: 'update command plugins'
            }
        });

        readdirSyncStub.restore();
        readDescriptionStub.restore();
        logSub.restore();
    });

    it('help', function() {
        let list = new SteamerList({
            help: true
        });

        let printUsageStub = sinon.stub(list, 'printUsage');

        list.help();

        expect(printUsageStub.calledWith('list all available commands', 'list')).to.eql(true);
        expect(printUsageStub.calledOnce).to.eql(true);

        printUsageStub.restore();
    });
});