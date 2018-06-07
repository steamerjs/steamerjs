const fs = require('fs-extra');
const path = require('path');
const expect = require('chai').expect;
const sinon = require('sinon');
const SteamerDevelop = require('../bin/libs/steamer-plugin-develop');

describe('steamer-plugin-develop', function() {

    let pluginPath = path.join(process.cwd(), './test/develop/plugin/');
    let kitPath = path.join(process.cwd(), './test/develop/kit/');
    let teamPath = path.join(process.cwd(), './test/develop/team/');

    before(function() {
        fs.removeSync(pluginPath);
        fs.removeSync(kitPath);
        fs.removeSync(teamPath);

        fs.ensureDirSync(pluginPath);
        fs.ensureDirSync(kitPath);
        fs.ensureDirSync(teamPath);
    });

    it('init plugin development template', function() {

        process.chdir('./test/develop/plugin');

        let develop = new SteamerDevelop({
            plugin: 'tool'
        });

        let fakeGit = {
            git: function(projectPath) {
                // console.log(projectPath);
                return this;
            },
            silent: function() {
                return this;
            },
            clone: function(pluginTemplateRepo, projectPath, options, cb) {
                fs.copySync(path.join(path.join(process.cwd(), '../../template/plugin')), path.join(pluginPath, 'steamer-plugin-tool'));
                cb(null);
                return this;
            }
        };

        let downloadGitStub = sinon.stub(develop, 'git').callsFake(fakeGit.git.bind(fakeGit));


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

        // let downloadGitStub = sinon.stub(develop, 'downloadGit').callsFake(function(url, projectPath, option, cb) {
        //     fs.copySync(path.join(path.join(process.cwd(), '../../template/kit')), path.join(kitPath, 'steamer-tool'));
        //     cb(null);
        // });

        let fakeGit = {
            git: function(projectPath) {
                // console.log(projectPath);
                return this;
            },
            silent: function() {
                return this;
            },
            clone: function(pluginTemplateRepo, projectPath, options, cb) {
                fs.copySync(path.join(path.join(process.cwd(), '../../template/kit')), path.join(kitPath, 'steamer-kit-tool'));
                cb(null);
                return this;
            }
        };

        let downloadGitStub = sinon.stub(develop, 'git').callsFake(fakeGit.git.bind(fakeGit));

        develop.init();

        downloadGitStub.restore();

        process.chdir('./../../../');

        expect(fs.existsSync(path.join(kitPath, './steamer-kit-tool/.steamer/steamer-kit-tool.js'))).to.eql(true);
        expect(fs.readFileSync(path.join(process.cwd(), './test/template/result/kit/package.json'), 'utf8')).to.eql(fs.readFileSync(path.join(kitPath, './steamer-kit-tool/package.json'), 'utf8'));
    });

    it('init team development template', function() {

        process.chdir('./test/develop/team');

        let develop = new SteamerDevelop({
            team: 'alloyteam'
        });

        let fakeGit = {
            git: function(projectPath) {
                return this;
            },
            silent: function() {
                return this;
            },
            clone: function(pluginTemplateRepo, projectPath, options, cb) {
                fs.copySync(path.join(path.join(process.cwd(), '../../template/team')), path.join(teamPath, 'steamer-team-alloyteam'));
                cb(null);
                return this;
            }
        };

        let downloadGitStub = sinon.stub(develop, 'git').callsFake(fakeGit.git.bind(fakeGit));

        develop.init();

        downloadGitStub.restore();

        process.chdir('./../../../');

        expect(fs.readFileSync(path.join(process.cwd(), './test/template/result/team/index.js'), 'utf8')).to.eql(fs.readFileSync(path.join(teamPath, './steamer-team-alloyteam/index.js'), 'utf8'));
        expect(fs.readFileSync(path.join(process.cwd(), './test/template/result/team/package.json'), 'utf8')).to.eql(fs.readFileSync(path.join(teamPath, './steamer-team-alloyteam/package.json'), 'utf8'));
    });

    it('help', function() {

        let develop = new SteamerDevelop({
            help: true
        });

        let printUsageStub = sinon.stub(develop, 'printUsage');

        develop.help();

        expect(printUsageStub.calledWith('develop plugins and starterkits', 'develop')).to.eql(true);
        expect(printUsageStub.calledOnce).to.eql(true);
        printUsageStub.restore();

    });
});