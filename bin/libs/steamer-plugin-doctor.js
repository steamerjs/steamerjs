'use strict';

/*
*   This plugin is going to check the node environment.
*   Right now we only check if NODE_PATH variable exists
 */

const path = require('path'),
    fs = require('fs-extra'),
    Promise = require("bluebird"),
    logSymbols = require('log-symbols'),
    semver = require('semver'),
    childProcess = require('child_process'),
    SteamerPlugin = require('steamer-plugin');

/**
 * learn from yo doctor
 * @param {*} filepath 
 */
function fixPath(filepath) {
    let fixedPath = path.resolve(path.normalize(filepath.trim()));

    try {
        fixedPath = fs.realpathSync(fixedPath);
    }
    catch (err) {
        if (err.code !== 'ENOENT') {
            throw err;
        }
    }

    return fixedPath;
}

class DoctorPlugin extends SteamerPlugin {
    constructor(args) {
        super(args);
        this.argv = args;
        this.pluginName = 'steamer-plugin-doctor';
        this.description = 'detect steamerjs problems';
        this.baseVer = '6.4.0';
    }

    checkNodePath() {
        return new Promise((resolve, reject) => {
            childProcess.exec('npm -g root --silent', (err, stdout) => {
                try {
                    if (err) {
                        reject(err);
                    }

                    this.npmRoot = fixPath(stdout);

                    if (this.npmRoot === this.getGlobalModules()) {
                        this.log(`${logSymbols.success}  NODE_PATH is ${this.npmRoot}`);
                    }
                    else {
                        this.log(`${logSymbols.error}  NODE_PATH should equal to ${this.chalk.yellow(this.npmRoot)}. \nPlease run  \'npm root -g\' to get this value. \nYou can visit https://github.com/SteamerTeam/steamerjs to see how to set NODE_PATH`);
                    }
                    resolve();
                }
                catch (e) {
                    reject(e);
                }
            });
        });
    }

    checkNodeVersion() {
        return new Promise((resolve, reject) => {
            let version = semver.valid(process.version);

            if (semver.gt(version, this.baseVer)) {
                this.log(`${logSymbols.success}  Node Version is ${process.version}`);
            }
            else {
                this.log(`${logSymbols.error}  Node Version should be >= ${this.baseVer}`);
            }

            resolve();
        });
    }

    init() {
        return Promise.all([this.checkNodePath(), this.checkNodeVersion()]);
    }

    help() {
        this.printUsage('help you check steamer running environment!', 'doctor');
    }
}

module.exports = DoctorPlugin;
