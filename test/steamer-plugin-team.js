const logSymbols = require('log-symbols');
const expect = require('chai').expect;
const sinon = require('sinon');
const SteamerTeam = require('../bin/libs/steamer-plugin-team');

describe('steamer-plugin-team', function() {
    it('add team config', function(done) {
        this.timeout(10000);
        let team = new SteamerTeam({
            add: ['default']
        });

        team.config = {
            NPM: 'npm',
            PLUGIN_PREFIX: 'steamer-plugin-',
            KIT_PREFIX: 'steamer-kit-',
            TEAM_PREFIX: 'steamer-team-',
            TEAM: 'default'
        };

        let existsStub = sinon.stub(team.fs, 'existsSync').callsFake(function(configPath) {
            if (configPath.includes('steamer-team-default')) {
                return false;
            }
            return true;
        });

        let spawnCount = 0;
        let spawnStub = sinon.stub(team.spawn, 'sync').callsFake((npm, args, options) => {
            if (spawnCount === 0) {
                expect(npm).to.eql('npm');
                expect(args).to.eql(['install', '--global', 'steamer-team-default']);
            }
            else if (spawnCount === 1) {
                expect(npm).to.eql('npm');
                expect(args).to.eql(['install', '--global', 'steamer-plugin-example', 'steamer-task-alloyteam']);
            }

            spawnCount++;
            return {
                error: 0
            };
        });
        let getTeamConfigStub = sinon.stub(team, 'getTeamConfig').callsFake(() => {
            return {
                config: {
                    NPM: 'npm',
                    TEAM: 'default'
                },
                kits: [
                    {
                        'name': 'steamer-example',
                        'git': 'https://github.com/steamerjs/steamer-example.git'
                    }
                ],
                tasks: [
                    'steamer-task-alloyteam'
                ],
                plugins: [
                    'steamer-plugin-example'
                ],
                beforeInstall: function() {
                    team.info('beforeInstall');
                },
                afterInstall: function() {
                    team.info('afterInstall');
                }
            };
        });

        let createSteamerConfigStub = sinon.stub(team, 'createSteamerConfig').callsFake((config, options) => {
            expect(config).to.eql({
                NPM: 'npm',
                PLUGIN_PREFIX: 'steamer-plugin-',
                KIT_PREFIX: 'steamer-kit-',
                TEAM_PREFIX: 'steamer-team-',
                TEAM: 'default'
            });
        });

        team.kitPlugin.kitOptions = {
            list: {}
        };

        let kitPluginCloneStub = sinon.stub(team.kitPlugin, 'clone').callsFake(function(repo) {
            expect(repo).to.eql('https://github.com/steamerjs/steamer-example.git');
            return new Promise((resolve) => {
                resolve();
            });
        });

        let kitPluginwriteKitOptionsStub = sinon.stub(team.kitPlugin, 'writeKitOptions').callsFake(function() {
            return () => {
                console.log(123);
            };
        });

        let infoStub = sinon.stub(team, 'info');
        let logStub = sinon.stub(team, 'log');

        team.init().then(() => {
            existsStub.restore();
            spawnStub.restore();
            getTeamConfigStub.restore();
            createSteamerConfigStub.restore();
            kitPluginCloneStub.restore();
            kitPluginwriteKitOptionsStub.restore();
            infoStub.restore();
            logStub.restore();

            expect(logStub.calledWith(`${logSymbols.success} steamer-plugin-example steamer-task-alloyteam installed`)).to.eql(true);
            expect(infoStub.calledWith(`Your team is \'default\'`)).to.eql(true);
            expect(infoStub.calledWith(`You will use \'npm' as your npm command`)).to.eql(true);
            expect(infoStub.calledWith('beforeInstall')).to.eql(true);
            expect(infoStub.calledWith('afterInstall')).to.eql(true);

            done();
        }).catch((e) => {
            console.log(e);
            done();
        });


    });

    it('help', function() {
        let team = new SteamerTeam({
            help: true
        });

        let printUsageStub = sinon.stub(team, 'printUsage');

        team.help();

        expect(printUsageStub.calledWith('manage config for your team', 'team')).to.eql(true);
        expect(printUsageStub.calledOnce).to.eql(true);

        printUsageStub.restore();
    });
});