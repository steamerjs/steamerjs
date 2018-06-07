const Promise = require('bluebird');
const expect = require('chai').expect;
const sinon = require('sinon');
const SteamerUpdate = require('../bin/libs/steamer-plugin-update');

describe('steamer-plugin-update', function() {

    it('update steamer pkgs', function(cb) {

        let update = new SteamerUpdate({
            _: ['update'],
        });

        let npmCheckStub = sinon.stub(update, 'npmCheck').usingPromise(Promise.Promise).resolves({
            get: function() {
                return [
                    {
                        moduleName: 'steamer-plugin-a',
                        homepage: 'https://www.qq.com',
                        latest: '2.5.0',
                        installed: '2.0.0',
                    },
                    {
                        moduleName: 'steamer-plugin-b',
                        homepage: 'https://www.qq.com',
                        latest: '1.9.0',
                        installed: '2.0.0',
                    },
                    {
                        moduleName: 'steamer-plugin-c',
                        homepage: 'https://www.qq.com',
                        latest: '2.0.0',
                        installed: '2.0.0',
                    },
                    {
                        moduleName: 'abc',
                        homepage: 'https://www.qq.com',
                        latest: '1.9.0',
                        installed: '2.0.0',
                    }
                ];
            }
        });
        let autoSelectionStub = sinon.stub(update, 'autoSelection').callsFake((updatePkgs) => {
            expect(updatePkgs).to.eql([
                {
                    name: 'steamer-plugin-a',
                    oldVer: '2.0.0',
                    latestVer: '2.5.0',
                    homepage: 'https://www.qq.com'
                }
            ]);
        });

        update.init().then((pkgs) => {
            try {
                expect(pkgs).to.deep.eql([{
                    name: 'steamer-plugin-a',
                    latestVer: '2.5.0',
                    oldVer: '2.0.0',
                    homepage: 'https://www.qq.com'
                }]);
                cb();
            }
            catch (e) {
                console.log(e);
                cb();
            }

            npmCheckStub.restore();
            autoSelectionStub.restore();
        });
    });

    it('startUpdate', function() {
        let update = new SteamerUpdate({
            _: ['update'],
        });
        let updatePkgs = [{
            name: 'steamer-plugin-jb',
            oldVer: '2.0.3',
            latestVer: '2.0.4',
            homepage: 'https://github.com/steamerjs/steamer-plugin-jb#readme'
        }];
        let selectedPkgs = [0];

        let spawnStub = sinon.stub(update.spawn, 'sync').callsFake((npm, args) => {
            expect(npm).to.eql('npm');
            expect(args).to.eql(['install', '-g', 'steamer-plugin-jb@2.0.4 '])
            return {
                error: 0,
            };
        });

        update.startUpdate(updatePkgs, selectedPkgs);

        spawnStub.restore();
    });

    it('help', function() {
        let update = new SteamerUpdate({
            help: true
        });

        let printUsageStub = sinon.stub(update, 'printUsage');

        update.help();

        expect(printUsageStub.calledWith('update command plugins', 'update')).to.eql(true);
        expect(printUsageStub.calledOnce).to.eql(true);

        printUsageStub.restore();
    });

});