'use strict';

const fs = require('fs-extra'),
    path = require('path'),
    expect = require('chai').expect,
    sinon = require('sinon'),
    SteamerConfig = require('../bin/libs/steamer-plugin-config');


describe('steamer-plugin-config', function() {
    let globalPath = path.join(process.cwd(), './test/global'),
        localPath = path.join(process.cwd(), './test/local');

    let returnGlobalPath = function() {
        return globalPath;
    };

    before(function() {
        fs.removeSync(globalPath);
        fs.removeSync(localPath);

        fs.ensureDirSync(globalPath);
        fs.ensureDirSync(localPath);

        process.chdir('./test/local');
    });

    after(function() {
        process.chdir('../../');
    });

    it('init config files', function() {
        let sConfig = new SteamerConfig({
            i: true,
        });

        let globalHomeStub = sinon.stub(sConfig, 'getGlobalHome').callsFake(returnGlobalPath);

        sConfig.init();

        expect(sConfig.readConfig()).to.eql({});

        globalHomeStub.restore();
    });

    it('set local key', function() {
        let sConfig1 = new SteamerConfig({
                s: 'k1=v1',
            }),
            sConfig2 = new SteamerConfig({
                s: 'k2=v2',
            });

        let globalHomeStub1 = sinon.stub(sConfig1, 'getGlobalHome').callsFake(returnGlobalPath),
            globalHomeStub2 = sinon.stub(sConfig2, 'getGlobalHome').callsFake(returnGlobalPath);

        sConfig1.init();
        sConfig2.init();

        expect(sConfig2.readSteamerConfig()).to.eql({ k1: 'v1', k2: 'v2' });

        globalHomeStub1.restore();
        globalHomeStub2.restore();
    });

    it('set global key', function() {
        let sConfig1 = new SteamerConfig({
                s: 'k1=v111',
                g: true,
            }),
            sConfig2 = new SteamerConfig({
                s: 'k2=v22',
            }),
            sConfig3 = new SteamerConfig({
                s: 'k3=v3',
            }),
            sConfig4 = new SteamerConfig({
                s: 'k3=v33',
                g: true,
            });

        let globalHomeStub1 = sinon.stub(sConfig1, 'getGlobalHome').callsFake(returnGlobalPath),
            globalHomeStub2 = sinon.stub(sConfig2, 'getGlobalHome').callsFake(returnGlobalPath),
            globalHomeStub3 = sinon.stub(sConfig3, 'getGlobalHome').callsFake(returnGlobalPath),
            globalHomeStub4 = sinon.stub(sConfig4, 'getGlobalHome').callsFake(returnGlobalPath);

        sConfig1.init();
        sConfig2.init();
        sConfig3.init();
        sConfig4.init();

        expect(sConfig4.readSteamerConfig()).to.eql({ k1: 'v1', k3: 'v3', k2: 'v22' });

        globalHomeStub1.restore();
        globalHomeStub2.restore();
        globalHomeStub3.restore();
        globalHomeStub4.restore();
    });

    it('del local key', function() {
        let sConfig1 = new SteamerConfig({
            d: 'k3',
        });

        let globalHomeStub1 = sinon.stub(sConfig1, 'getGlobalHome').callsFake(returnGlobalPath);

        sConfig1.init();

        expect(sConfig1.readSteamerConfig()).to.eql({ k1: 'v1', k3: 'v33', k2: 'v22' });

        globalHomeStub1.restore();
    });

    it('del global key', function() {
        let sConfig1 = new SteamerConfig({
            d: 'k3',
            g: true
        });

        let globalHomeStub1 = sinon.stub(sConfig1, 'getGlobalHome').callsFake(returnGlobalPath);

        sConfig1.init();

        expect(sConfig1.readSteamerConfig()).to.eql({ k1: 'v1', k2: 'v22' });

        globalHomeStub1.restore();
    });

    it('list config', function() {
        let sConfig1 = new SteamerConfig({
            l: true
        });

        let globalHomeStub1 = sinon.stub(sConfig1, 'getGlobalHome').callsFake(returnGlobalPath),
            log = sinon.stub(sConfig1, 'info');

        sConfig1.init();

        expect(log.calledWith('k1=v1')).to.eql(true);
        expect(log.calledWith('k2=v22')).to.eql(true);

        globalHomeStub1.restore();
        log.restore();
    });

    it('help', function() {
        let sConfig = new SteamerConfig({
            help: true
        });

        let printUsageStub = sinon.stub(sConfig, 'printUsage'),
            printOptionstUB = sinon.stub(sConfig, 'printOption');

        sConfig.help();

        expect(printUsageStub.calledWith('steamer config manager', 'config')).to.eql(true);
        expect(printUsageStub.calledOnce).to.eql(true);

        printUsageStub.restore();
        printOptionstUB.restore();
    });

});