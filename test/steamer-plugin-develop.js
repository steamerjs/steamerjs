'use strict';

const fs = require('fs-extra'),
    path = require('path'),
    expect = require('chai').expect,
    sinon = require('sinon'),
    SteamerDevelop = require('../bin/libs/steamer-plugin-develop');

describe('steamer-plugin-develop', function() {

    let pluginPath = path.join(process.cwd(), './test/develop/plugin/'),
        kitPath = path.join(process.cwd(), './test/develop/kit/');

    before(function() {
        fs.removeSync(pluginPath);
        fs.removeSync(kitPath);

        fs.ensureDirSync(pluginPath);
        fs.ensureDirSync(kitPath);
    });

    it('init plugin development template', function() {

        process.chdir('./test/develop/plugin');

        let develop = new SteamerDevelop({
            plugin: 'tool'
        });

        let downloadGitStub = sinon.stub(develop, 'downloadGit').callsFake(function(url, projectPath, option, cb) {
            fs.copySync(path.join(path.join(process.cwd(), '../../template/plugin')), path.join(pluginPath, 'steamer-plugin-tool'));
            cb(null);
        });

        develop.init();

        downloadGitStub.restore();

        process.chdir('./../../../');

        expect(fs.readFileSync(path.join(process.cwd(), './test/template/result/plugin/package.json'), 'utf8')).to.eql(fs.readFileSync(path.join(pluginPath, './steamer-plugin-tool/package.json'), 'utf8'));
        expect(fs.readFileSync(path.join(process.cwd(), './test/template/result/plugin/index.js'), 'utf8')).to.eql(fs.readFileSync(path.join(pluginPath, './steamer-plugin-tool/index.js'), 'utf8'));
    });

    it('init starterkit development template', function() {

        process.chdir('./test/develop/kit');

        let develop = new SteamerDevelop({
            kit: 'tool'
        });

        let downloadGitStub = sinon.stub(develop, 'downloadGit').callsFake(function(url, projectPath, option, cb) {
            fs.copySync(path.join(path.join(process.cwd(), '../../template/kit')), path.join(kitPath, 'steamer-tool'));
            cb(null);
        });

        develop.init();

        downloadGitStub.restore();

        process.chdir('./../../../');

        expect(fs.existsSync(path.join(kitPath, './steamer-tool/.steamer/steamer-tool.js'))).to.eql(true);
        expect(fs.readFileSync(path.join(process.cwd(), './test/template/result/kit/package.json'), 'utf8')).to.eql(fs.readFileSync(path.join(kitPath, './steamer-tool/package.json'), 'utf8'));
    });

    it('help', function() {

        let develop = new SteamerDevelop({
            help: true
        });

        let printUsageStub = sinon.stub(develop, 'printUsage');

        develop.help();

        expect(printUsageStub.calledWith('help you check steamer running environment!', 'develop')).to.eql(true);
        expect(printUsageStub.calledOnce).to.eql(true);
        printUsageStub.restore();

    });
});