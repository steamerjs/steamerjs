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
            logSub = sinon.stub(list, 'log');

        list.init();

        expect(list.filterCmds().sort()).to.eql([
            'a',
            'b',
            'config',
            'develop',
            'doctor',
            'kit',
            'list',
            'update',
        ]);

        readdirSyncStub.restore();
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