'use strict';

/*
*   This plugin is going to check the node environment.
*   Right now we only check if NODE_PATH variable exists
 */

const path = require('path'),
    fs = require('fs-extra'),
    logSymbols = require('log-symbols'),
    semver = require('semver'),
    childProcess = require('child_process'),
    baseVer = '6.11.4',
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

class DoctortPlugin extends SteamerPlugin {
    constructor(args) {
        super();
        this.argv = args;
        this.pluginName = 'steamer-plugin-doctor';
        this.description = 'detect steamerjs problems';
    }

    checkNodePath() {
        childProcess.exec('npm -g root --silent', (err, stdout) => {
            if (err) {
                return this.error(err);
            }

            let npmRoot = fixPath(stdout);

            if (npmRoot === this.getGlobalModules()) {
                this.log(`${logSymbols.success}  NODE_PATH is ${this.getGlobalModules()}`);
            }
            else {
                this.log(`${logSymbols.error}  NODE_PATH should equal to ${this.chalk.yellow(npmRoot)}. \nPlease run  \'npm root -g\' to get this value. \nYou can visit https://github.com/SteamerTeam/steamerjs to see how to set NODE_PATH`);
            }
        });
    }

    throwNodePathError() {
        throw new Error('You must set NODE_PATH correctly!!! Now it\'s undefined or empty\nYou can visit https://github.com/steamerjs/steamerjs to see how to set NODE_PATH');
    }

    checkNodeVersion() {
        let version = semver.valid(process.version);

        if (semver.gt(version, baseVer)) {
            this.log(logSymbols.success + '  Node Version is ' + process.version);
        }
        else {
            this.log(logSymbols.error + '    Node Version should be >= ' + baseVer);
        }
    }

    throwNodeVerError() {
        throw new Error('Node version should be >= ' + baseVer);
    }

    init() {
        this.checkNodePath();
        this.checkNodeVersion();
    }

    help() {
        this.utils.printUsage('help you check steamer running environment!', 'doctor');
    }
}

module.exports = DoctortPlugin;
