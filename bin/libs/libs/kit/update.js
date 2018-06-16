/**
 * kit updater
 */

const inquirer = require('inquirer');
const path = require('path');
const _ = require('lodash');
const compareVer = require('compare-versions');
const { spinSuccess, spinFail, readKitConfig, delRequireCache, addVersion } = require('./utils');

/**
 * back up files for project which is about to update
 * @param {Array} files files to copy
 * @param {Array} keepFiles files to keep
 */
exports.backupFiles = function(filesParam, keepFiles) {
    let files = filesParam.filter(item => {
        return !keepFiles.includes(item);
    });

    let ts = Date.now();

    files.forEach(item => {
        let file = path.join(process.cwd(), item);
        if (this.fs.existsSync(file)) {
            this.fs.copySync(
                file,
                path.join(process.cwd(), `backup/${ts}`, item)
            );
        }
    });

    return files;
};

exports.copyUpdateFiles = function(filesParam, kitPath) {
    let files = filesParam.filter(item => {
        return item !== 'package.json' && item !== 'package-lock.json';
    });

    files.forEach(item => {
        let itemPath = path.join(kitPath, item);
        if (this.fs.existsSync(itemPath)) {
            this.fs.copySync(itemPath, path.join(process.cwd(), item));
        }
    });
};

exports.copyUpdatePkgJson = function(kitPath) {
    let pkgLockPath = path.join(process.cwd(), 'package-lock.json');
    if (this.fs.existsSync(pkgLockPath)) {
        this.fs.removeSync(pkgLockPath);
    }

    let oldPkgJsonPath = path.join(process.cwd(), 'package.json');
    let newPkgJsonPath = path.join(kitPath, 'package.json');
    delRequireCache.bind(this)(oldPkgJsonPath);
    delRequireCache.bind(this)(newPkgJsonPath);

    let oldPkgJson = require(oldPkgJsonPath);
    let newPkgJson = require(newPkgJsonPath);

    let pkgJson = _.merge({}, oldPkgJson, {
        version: newPkgJson.version,
        dependencies: newPkgJson.dependencies,
        devDependencies: newPkgJson.devDependencies
    });

    this.fs.writeFileSync(
        path.join(process.cwd(), 'package.json'),
        JSON.stringify(pkgJson, null, 4),
        'utf-8'
    );
};

exports.updateGlobal = function() {
    let kits = this.kitOptions.list;
    let choices = [];
    Object.keys(kits).forEach(key => {
        choices.push({
            name: `${key} - ${kits[key].description}`,
            value: key
        });
    });

    choices.unshift({
        name: 'all starterkits',
        value: 1
    });

    let updateKits = [];
    let prompt = inquirer.createPromptModule();

    prompt([
        {
            type: 'list',
            name: 'kit',
            message: 'Which starterkit do you wanna update: ',
            choices: choices,
            pageSize: 100
        }
    ]).then(answers => {
        updateKits =
            answers.kit === 1
                ? updateKits.concat(Object.keys(kits))
                : [answers.kit];

        let updateAction = [];
        updateKits.forEach(kitName => {
            let action = this.updateGlobalKit(kitName);
            updateAction.push(action);
        });

        return Promise.all(updateAction)
            .then(result => {
                result.forEach(item => {
                    let kit = item.kitName;
                    let ver = item.newVer;

                    this.kitOptions.list[kit].versions = addVersion.bind(this)(
                        this.kitOptions.list[kit].versions,
                        ver
                    );
                    this.kitOptions.list[kit].currentVersion = ver;
                    this.kitOptions.list[kit].latestVersion = ver;
                });
                this.writeKitOptions(this.kitOptions);
            })
            .catch(e => {
                this.error(e.stack);
            });
    });
};

exports.updateGlobalKit = function(kitName) {
    let kits = this.kitOptions.list;

    if (!kits.hasOwnProperty(kitName)) {
        return this.error(`The starterkit ${kitName} does not exist.`);
    }

    let kitOptions = kits[kitName];

    return new Promise((resolve, reject) => {
        this.git(kitOptions.path)
            .silent(true)
            .exec(() => {
                this.spinner.start();
                this.spinner.color = 'cyan';
                this.spinner.text = `updating ${kitName}`;
            })
            .fetch(['origin', 'master:master'], err => {
                spinFail.bind(this)(kitName, err);
            })
            .checkout('master')
            .exec(() => {
                let curKitOptions = require(path.join(
                    this.kitHomePath,
                    kitName,
                    'package.json'
                ));
                let oldVer = kitOptions.latestVersion;
                let newVer = curKitOptions.version;

                if (compareVer(newVer, oldVer) > 0) {
                    this.git(kitOptions.path)
                        .silent(true)
                        .branch([newVer, 'master'], err => {
                            err && spinFail.bind(this)(kitName, err);
                        })
                        .checkout(newVer, err => {
                            err && spinFail.bind(this)(kitName, err);
                        })
                        .branch(['-D', 'master'], () => {
                            spinSuccess.bind(this)(
                                `${kitName}@${newVer} installed`
                            );
                            resolve({
                                kitName,
                                newVer
                            });
                        });
                } else {
                    this.git(kitOptions.path)
                        .silent(true)
                        .checkout(newVer, err => {
                            err && spinFail.bind(this)(kitName, err);
                        })
                        .branch(['-D', 'master'], () => {
                            spinSuccess.bind(this)(
                                `${kitName}@${newVer} installed`
                            );
                            resolve({
                                kitName,
                                newVer
                            });
                        });
                }
            });
    });
};

exports.updateLocal = function() {
    let pluginConfig = this.readConfig();
    if (!pluginConfig.hasOwnProperty('kit')) {
        return this.error(
            '.steamer/steamer-plugin-kit.js does not have current project kit value.'
        );
    }

    let kit = pluginConfig.kit;
    let curVer = pluginConfig.version;

    if (!this.kitOptions.list.hasOwnProperty(kit)) {
        return this.error(
            `Please install ${kit} starterkit before you update.`
        );
    }

    let kitOptions = this.kitOptions.list[kit];
    let kitPath = kitOptions.path;
    let kitConfigFileName = kitOptions.originalName || kit;
    let kitConfigPath = path.join(kitPath, `.steamer/${kitConfigFileName}.js`);
    let kitConfig = readKitConfig.bind(this)(kitConfigPath);

    if (compareVer(curVer, kitOptions.latestVersion) >= 0) {
        return this.info(
            'Your project has already used the latest starterkit.'
        );
    }

    pluginConfig.version = kitOptions.latestVersion; // 更新当前项目的脚手架版本
    let keepFiles = ['src', 'config', 'tools'];
    let files = kitConfig.installFiles || kitConfig.files;
    files = files.filter(item => {
        return !this.ignoreFiles.includes(item);
    });

    this.git(kitPath).checkout(kitOptions.latestVersion, err => {
        if (err) {
            return this.error(err);
        }

        let copyFiles = exports.backupFiles.bind(this)(files, keepFiles);

        // 复制文件前的自定义行为
        if (
            kitConfig.beforeUpdateCopy &&
            _.isFunction(kitConfig.beforeUpdateCopy)
        ) {
            kitConfig.beforeUpdateCopy.bind(this)();
        }

        exports.copyUpdateFiles.bind(this)(copyFiles, kitPath);

        // 复制文件后的自定义行为
        if (
            kitConfig.afterUpdateCopy &&
            _.isFunction(kitConfig.afterUpdateCopy)
        ) {
            kitConfig.afterUpdateCopy.bind(this)();
        }

        exports.copyUpdatePkgJson.bind(this)(kitPath); // 更新项目package.json

        this.createConfig(pluginConfig, { overwrite: true }); // 更新项目.steamer/steamer-plugin-kit.js插件配置

        // beforeUpdateDep 的自定义行为
        if (
            kitConfig.beforeUpdateDep &&
            _.isFunction(kitConfig.beforeUpdateDep)
        ) {
            kitConfig.beforeUpdateDep.bind(this)();
        }

        this.spawn.sync(this.config.NPM, ['install'], {
            stdio: 'inherit',
            cwd: process.cwd()
        });

        if (
            kitConfig.afterUpdateDep &&
            _.isFunction(kitConfig.afterUpdateDep)
        ) {
            kitConfig.afterUpdateDep.bind(this)();
        }

        this.success(
            `The project has been updated to ${kitOptions.latestVersion}`
        );
    });
};

/**
 * update starterkit globally or locally
 * @param {Boolean} isGlobal whether to update global or local starterkit
 */
exports.update = function (isGlobal) {
    if (isGlobal) {
        this.updateGlobal();
    } else if (!isGlobal) {
        this.updateLocal();
    }
};
