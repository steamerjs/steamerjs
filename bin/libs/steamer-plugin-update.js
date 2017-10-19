'use strict';

const SteamerPlugin = require('steamer-plugin'),
    npmCheck = require('npm-check'),
    semVer = require('semver'),
    inquirer = require('inquirer'),
    spawn = require('cross-spawn');

class UpdatePlugin extends SteamerPlugin {
    constructor(args) {
        super();
        this.argv = args;
        this.pluginName = 'steamer-plugin-update';
        this.description = 'update steamerjs commands and starterkits';
    }

    init() {
        this.config = this.readSteamerConfig();
        this.npm = this.config.npm || 'npm';
        this.checkUpdate();
    }

    /**
	 * check latest pkgs
	 */
    checkUpdate() {

        process.env.NPM_CHECK_INSTALLER = this.npm;

        npmCheck({
            update: true,
            spinner: true,
            global: true,
            ignore: ['!steamer*'],
            installer: this.npm,
        }).then((currentState) => {
            let pacakges = currentState.get('packages');

            if (pacakges.length) {
                let updatePkgs = [];

                pacakges.forEach((item) => {
                    if (item.installed && item.latest && semVer.lt(item.installed, item.latest)) {
                        let updatePkg = {
                            name: item.moduleName,
                            oldVer: item.installed,
                            latestVer: item.latest,
                            homepage: item.homepage
                        };
                        updatePkgs.push(updatePkg);
                    }
                });

                this.autoSelection(updatePkgs);
            }
        }).catch((e) => {
            this.error(e.stack);
        });
    }

    /**
	 * interactive update
	 */
    autoSelection(updatePkgs) {

        if (!updatePkgs.length) {
            this.info('All plugins or starterkits are latest.');
            return;
        }

        this.info('Following plugins or starterkits have latest versions:');

        let pkgs = [];

        updatePkgs.map((item, key) => {
            pkgs.push({
                name: this.chalk.yellow(item.name) + '  ' + this.chalk.white(item.oldVer) + ' > '
      + this.chalk.white.bold(item.latestVer) + ' ' + this.chalk.blue(item.homepage),
                value: key
            });
        });

        inquirer.prompt([{
            type: 'checkbox',
            name: 'pkgs',
            message: 'Choose which packages to update.',
            choices: pkgs,
        }]).then((answers) => {
            let chosenPkgs = answers.pkgs || [];

            this.startUpdate(updatePkgs, chosenPkgs);

        }).catch((e) => {
            this.error(e.stack);
        });
    }

    /**
	 * start updating
	 */
    startUpdate(updatePkgs, selectedPkgs) {
        let execStr = '';

        selectedPkgs.forEach((key) => {
            let item = updatePkgs[key];
            execStr += (item.name + '@' + item.latestVer + ' ');
        });

        if (execStr) {
            let result = spawn.sync(this.npm, ['install', '-g', execStr], { stdio: 'inherit' });

            if (result.error) {
                this.error(result.error);
            }
        }
    }

    help() {
        this.printUsage('update steamerjs commands and starterkits', 'update');
    }

}

module.exports = UpdatePlugin;