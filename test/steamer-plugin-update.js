'use strict';

const Promise = require('bluebird'),
    expect = require('chai').expect,
    sinon = require('sinon'),
    SteamerUpdate = require('../bin/libs/steamer-plugin-update');

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
            }),
            autoSelectionStub = sinon.stub(update, 'autoSelection');

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

});