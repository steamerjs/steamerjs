'use strict';

const SteamerPlugin = require('steamer-plugin'),
    path = require('path'),
    url = require('url'),
    ora = require('ora'),
    Rx = require('rxjs'),
    inquirer = require('inquirer'),
    _ = require('lodash'),
    git = require('simple-git'),
    compareVer = require('compare-versions'),
    klawSync = require('klaw-sync'),
    spawn = require('cross-spawn');

/**
 * // .steamer/steamer.plugin-kit.js
     module.exports = {
        'plugin': 'steamer-plugin-kit',
        'config': {
            'kit': 'steamer-react'
        }
    }
*/

class KitPlugin extends SteamerPlugin {
    constructor(args) {
        super(args);
        this.argv = args;
        this.pluginName = 'steamer-plugin-kit';
        this.description = 'manage starterkits';
        // this.globalNodeModules = this.getGlobalModules();

        this.config = _.merge({}, {
            NPM: 'npm',
            TEAM: 'default'
        }, this.readSteamerConfig());

        this.kitHomePath = path.join(this.getGlobalHome(), '.steamer', 'starterkits');
        this.kitOptionsPath = path.join(this.kitHomePath, 'starterkits.js');
        this.spinner = ora('Loading unicorns');
        this.kitOptions = this.getKitOptions();
        this.ignoreFiles = ['.git', '.svn'];

        this.git = git;
    }

    init(argv) {
        let argvs = argv || this.argv; // command argv
        let isAdd = argvs.add;
        let isTag = argvs.tag;
        let isUpdate = argvs.update || argvs.u;
        let isAlias = argvs.alias || null;
        let isGlobal = argvs.global || argvs.g;
        let isRemove = argvs.remove;
        let isTemplate = argvs.template || argvs.t;
        let isList = argvs.list || argvs.l;

        if (isAdd) {
            this.add(isAdd, isTag, isAlias);
        }
        else if (isUpdate) {
            this.update(isGlobal);
        }
        else if (isRemove) {
            this.remove(isRemove);
        }
        else if (isTemplate) {
            this.template();
        }
        else if (isList) {
            this.list();
        }
        // ignore other command options
        else if (Object.keys(argvs).length <= 4) {
            this.install();
        }
    }

    /**
     * add starterkit to $Home/.steamer/starterkits
     * @param {String} repo repo url
     * @param {String} tag tag name
     * @param {String} alias alias name
     */
    add(repo, tag, alias) {
        this.clone(repo, tag, alias).then(() => {
            // console.log(this.kitOptions);
            this.writeKitOptions(this.kitOptions);
        }).catch((e) => {
            this.error(e.stack);
        });
    }

    /**
     * start cloning starterkit
     * @param {String} repo repo url
     * @param {String} tag tag name
     * @param {String} alias alias name
     */
    clone(repo, tag = null, alias) {
        let nameSpace = this.getNameSpace(repo),
            kitName = alias || this.getKitName(nameSpace),
            localPath = path.join(this.kitHomePath, kitName);

        let opt = {
            repo,
            kitName,
            localPath,
            tag,
        };

        // starterkit exist and not add another version
        if (this.kitOptions.list.hasOwnProperty(kitName) && !tag) {
            this.error(`${kitName} exists. Please change the name useing --alias.`);
            return Promise.resolve();
        }
        else {
            if (!this.kitOptions.list.hasOwnProperty(kitName)) {
                this.kitOptions.list[kitName] = {
                    url: repo,
                    path: localPath,
                    versions: []
                };
            }
            if (opt.tag) {
                return this.cloneTag(opt);
            }
            else {
                return this.cloneLatest(opt);
            }
        }
    }

    /**
     * clone latest starterkit
     * @param {Object``} options
     */
    cloneLatest(options) {
        let {
            repo,
            kitName,
            localPath,
        } = options;
        return new Promise((resolve, reject) => {
            this.git()
                .silent(true)
                .exec(() => {
                    this.spinner.start();
                    this.spinner.color = 'cyan';
                    this.spinner.text = `installing ${kitName}`;
                })
                .clone(repo, localPath, '--depth=1', (err) => {
                    err && this.spinFail(kitName, err);
                    if (err) {
                        reject(err);
                    }
                })
                .exec(() => {
                    let pkgJson = {};
                    try {
                        pkgJson = this.getPkgJson(localPath);
                        this.kitOptions.list[kitName] = this._.merge({}, this.kitOptions.list[kitName], {
                            description: pkgJson.description,
                            currentVersion: pkgJson.version,
                            latestVersion: pkgJson.version,
                            versions: [
                                pkgJson.version
                            ]
                        });
                    }
                    catch (e) {
                        reject(e);
                    }
                    this.git(localPath)
                        .silent(true)
                        .branch([pkgJson.version], (err) => {
                            err && this.spinFail(kitName, err);
                            if (err) {
                                reject(err);
                            }
                        })
                        .checkout(pkgJson.version, (err) => {
                            if (err) {
                                this.spinFail(kitName, err);
                                reject(err);
                            }
                            else {
                                this.spinSuccess(`${kitName}@${pkgJson.version} installed`);
                            }
                        })
                        .branch(['-D', 'master'], (err) => {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve();
                            }
                        });
                });
        });
    }

    // fetch specific tag https://stackoverflow.com/questions/45338495/fetch-a-single-tag-from-remote-repository
    // git branch new_branch tag_name
    cloneTag(options) {
        let {
            repo,
            kitName,
            localPath,
            tag
        } = options;

        this.fs.ensureDirSync(localPath);

        return new Promise((resolve, reject) => {
            this.git(localPath)
                .silent(true)
                .exec(() => {
                    this.spinner.start();
                    this.spinner.color = 'cyan';
                    this.spinner.text = `installing ${kitName}`;
                })
                .exec(() => {
                    let isGitFolderExists = this.fs.existsSync(path.join(localPath, '.git'));

                    if (!isGitFolderExists) {
                        spawn.sync('git', ['init'], { cwd: localPath });
                        spawn.sync('git', ['remote', 'add', 'origin', repo], { cwd: localPath });
                    }
                })
                .fetch(['origin', `refs/tags/${tag}:refs/tags/${tag}`, '--depth=1'], (err) => {
                    if (err) {
                        this.spinFail(kitName, err);
                        reject(err);
                        return;
                    }
                    let version = this.getVersion(tag);
                    this.git(localPath)
                        .silent(true)
                        .branch([`${version}`, `${tag}`], (err) => {
                            err && this.spinFail(kitName, err);
                            if (err) {
                                reject(err);
                            }
                        })
                        .checkout(`${version}`, () => {
                            this.spinSuccess(`${kitName}@${version} installed`);
                            let pkgJson = this.getPkgJson(localPath),
                                versions = this.addVersion(this.kitOptions.list[kitName].versions, pkgJson.version);

                            this.kitOptions.list[kitName] = this._.merge({}, this.kitOptions.list[kitName], {
                                description: pkgJson.description,
                                currentVersion: pkgJson.version,
                                latestVersion: versions[0],
                                versions: versions
                            });
                            resolve();
                        });
                });
        });
    }

    update(isGlobal) {
        if (isGlobal) {
            this.updateGlobal();
        }
        else if (!isGlobal) {
            this.updateLocal();
        }
    }

    updateLocal() {
        let pluginConfig = this.readConfig();
        if (!pluginConfig.hasOwnProperty('kit')) {
            return this.error('.steamer/steamer-plugin-kit.js does not have current project kit value.');
        }

        let kit = pluginConfig.kit,
            curVer = pluginConfig.version;

        if (!this.kitOptions.list.hasOwnProperty(kit)) {
            return this.error(`Please install ${kit} starterkit before you update.`);
        }

        let kitOptions = this.kitOptions.list[kit],
            kitPath = kitOptions.path;

        if (compareVer(curVer, kitOptions.latestVersion) >= 0) {
            return this.info('Your project has already used the latest starterkit.');
        }

        let keepFiles = ['src', 'config', 'tools'];

        let files = this.fs.readdirSync(kitPath);
        files = files.filter((item) => {
            return !this.ignoreFiles.includes(item);
        });

        this.git(kitPath)
            .checkout(kitOptions.latestVersion, (err) => {
                if (err) {
                    return this.error(err);
                }

                let copyFiles = this.backupFiles(files, keepFiles, kitPath);

                this.copyUpdateFiles(copyFiles, kitPath);

                this.copyUpdatePkgJson(kitPath);

                spawn.sync(this.config.NPM, ['install'], { stdio: 'inherit', cwd: process.cwd() });

                this.success(`The project has been updated to ${kitOptions.latestVersion}`);
            });


    }

    backupFiles(files, keepFiles, kitPath) {
        files = files.filter((item) => {
            return !keepFiles.includes(item);
        });

        let ts = Date.now();

        files.forEach((item) => {
            this.fs.copySync(path.join(kitPath, item), path.join(process.cwd(), `backup/${ts}`, item));
        });

        return files;
    }

    copyUpdateFiles(files, kitPath) {
        files = files.filter((item) => {
            return item !== 'package.json' && item !== 'package-lock.json';
        });

        files.forEach((item) => {
            this.fs.copySync(path.join(kitPath, item), path.join(process.cwd(), item));
        });
    }

    copyUpdatePkgJson(kitPath) {
        this.fs.removeSync(path.join(process.cwd(), 'package-lock.json'));


        let oldPkgJsonPath = path.join(process.cwd(), 'package.json');
        let newPkgJsonPath = path.join(kitPath, 'package.json');
        this.delRequireCache(oldPkgJsonPath);
        this.delRequireCache(newPkgJsonPath);

        let oldPkgJson = require(oldPkgJsonPath);
        let newPkgJson = require(newPkgJsonPath);

        let pkgJson = _.merge({}, oldPkgJson, {
            version: newPkgJson.version,
            dependencies: newPkgJson.dependencies,
            devDependencies: newPkgJson.devDependencies,
        });

        this.fs.writeFileSync(path.join(process.cwd(), 'package.json'), JSON.stringify(pkgJson, null, 4), 'utf-8');
    }

    updateGlobal() {
        let kits = this.kitOptions.list,
            questions = [],
            choices = [];

        Object.keys(kits).forEach((key) => {
            choices.push({
                name: `${key} - ${kits[key].description}`,
                value: key
            });
        });

        choices.unshift({
            name: 'all starterkits',
            value: 1
        });

        let updateKits = [],
            prompt = inquirer.createPromptModule();

        prompt([{
            type: 'list',
            name: 'kit',
            message: 'Which starterkit do you wanna update: ',
            choices: choices,
            pageSize: 100
        }]).then((answers) => {
            updateKits = (answers.kit == 1) ? updateKits.concat(Object.keys(kits)) : [answers.kit];

            let updateAction = [];
            updateKits.forEach((kitName) => {
                let action = this.updateGlobalKit(kitName);
                updateAction.push(action);
            });

            return Promise.all(updateAction).then((result) => {
                result.map((item) => {
                    let kit = item.kitName;
                    let ver = item.newVer;

                    this.kitOptions.list[kit].versions = this.addVersion(this.kitOptions.list[kit].versions, ver);
                    this.kitOptions.list[kit].currentVersion = ver;
                    this.kitOptions.list[kit].latestVersion = ver;
                });
                this.writeKitOptions(this.kitOptions);
            }).catch((e) => {
                this.error(e.stack);
            });
        });

    }

    updateGlobalKit(kitName) {
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
                .fetch(['origin', 'master:master'], (err) => {
                    err && this.spinFail(kitName, err);
                })
                .checkout('master')
                .exec(() => {
                    let curKitOptions = require(path.join(this.kitHomePath, kitName, 'package.json')),
                        oldVer = kitOptions.latestVersion,
                        newVer = curKitOptions.version;

                    if (compareVer(newVer, oldVer) > 0) {
                        this.git(kitOptions.path)
                            .silent(true)
                            .branch([newVer, 'master'], (err) => {
                                err && this.spinFail(kitName, err);
                            })
                            .checkout(newVer, (err) => {
                                err && this.spinFail(kitName, err);
                            })
                            .branch(['-D', 'master'], () => {
                                this.spinSuccess(`${kitName}@${newVer} installed`);
                                resolve({
                                    kitName,
                                    newVer
                                });
                            });
                    }
                    else {
                        this.git(kitOptions.path)
                            .silent(true)
                            .checkout(newVer, (err) => {
                                err && this.spinFail(kitName, err);
                            })
                            .branch(['-D', 'master'], () => {
                                this.spinSuccess(`${kitName}@${newVer} installed`);
                                resolve({
                                    kitName,
                                    newVer
                                });
                            });
                    }
                });
        });
    }

    /**
     * Create page from template
     */
    template() {

        let localConfig = this.readConfig(),
            kit = localConfig.kit || null,
            folder = path.resolve();

        // this.checkConfigExist(localConfig);

        let pkgJsonPath = path.join(process.cwd(), 'package.json');

        // 如果 localConfig 为空，则创建，兼容直接 git clone 脚手架的情况
        if (this.fs.existsSync(pkgJsonPath) && !Object.keys(localConfig).length) {
            this.pkgJson = require(path.join(process.cwd(), 'package.json')) || {};

            localConfig.kit = this.pkgJson.name;
            localConfig.version = this.pkgJson.version;

            this.createPluginConfig(localConfig, process.cwd());
        }

        if (!localConfig.template || !localConfig.template.src || !localConfig.template.dist) {
            inquirer.prompt([{
                type: 'text',
                name: 'src',
                message: 'type the template source folder:',
                default: './tools/template',
            }, {
                type: 'input',
                name: 'dist',
                message: 'type your template destination folder: ',
                default: './src/page',
            }, {
                type: 'input',
                name: 'npm',
                message: 'type your npm command(npm|tnpm|cnpm etc): ',
                default: 'npm',
            }]).then((answers) => {

                localConfig.template = {};
                localConfig.template.src = answers.src;
                localConfig.template.dist = answers.dist;
                localConfig.template.npm = answers.npm;

                this.createPluginConfig(localConfig, path.resolve());

                this.listTemplate(localConfig);
            }).catch((e) => {
                this.error(e.statck);
            });
        }
        else {
            this.listTemplate(localConfig);
        }
    }

    /**
     * list all templates
     * @param {*} localConfig
     */
    listTemplate(localConfig) {
        let templateFolder = path.resolve(localConfig.template.src),
            templateInfo = this.fs.readdirSync(templateFolder);

        templateInfo = templateInfo.filter((item) => {
            return this.fs.statSync(path.join(templateFolder, item)).isDirectory();
        });

        inquirer.prompt([{
            type: 'list',
            name: 'template',
            message: 'which template do you like: ',
            choices: templateInfo,
        }, {
            type: 'input',
            name: 'path',
            message: 'type in your page name: ',
        }]).then((answers) => {

            if (!answers.path) {
                return this.error('Please type in your page name.');
            }

            let targetFolder = path.resolve(localConfig.template.dist, answers.path),
                srcFolder = path.resolve(localConfig.template.src, answers.template);

            if (this.fs.existsSync(targetFolder)) {
                return this.error('Target folder already exist. Please change another page name.');
            }

            this.fs.copySync(srcFolder, targetFolder);

            this.walkAndReplace(targetFolder, ['.js', '.html'], { title: answers.path });

            this.installDependency(path.resolve(localConfig.template.src), answers.template, localConfig.template.npm);

        }).catch((e) => {
            this.error(e.statck);
        });
    }

    /**
     * loop files and replace placeholder
     * @param {String} folder
     * @param {*} extensions
     * @param {*} replaceObj
     */
    walkAndReplace(folder, extensions = [], replaceObj = {}) {

        let files = klawSync(folder, { nodir: true });

        if (extensions.length) {
            files = files.filter((item) => {
                let ext = path.extname(item.path);
                return extensions.includes(ext);
            });
        }

        files.forEach((file) => {
            let content = this.fs.readFileSync(file.path, 'utf-8');

            Object.keys(replaceObj).forEach((key) => {
                content = content.replace(new RegExp('<% ' + key + ' %>', 'ig'), function (match) {
                    return replaceObj[key];
                });
            });

            this.fs.writeFileSync(file.path, content, 'utf-8');
        });
    }

    /**
     * Install template dependency
     * @param {*} templateFolder
     * @param {*} templateName
     * @param {*} npmCmd
     */
    installDependency(templateFolder, templateName, npmCmd = 'npm') {
        let dependencyJson = path.join(templateFolder, 'dependency.js');

        if (!this.fs.existsSync(dependencyJson)) {
            return;
        }

        let dependencies = require(dependencyJson) || {};
        dependencies = dependencies[templateName] || {};

        let cmd = '';

        Object.keys(dependencies).forEach((item) => {
            cmd += (item + '@' + dependencies[item] + ' ');
        });

        if (cmd) {
            this.spawn.sync(npmCmd, ['install', '--save', cmd], { stdio: 'inherit', shell: true });
        }
    }

    /**
     * remove starterkit
     * @param {String} kit
     */
    remove(kit) {
        let kits = this.kitOptions.list;

        if (!kits.hasOwnProperty(kit)) {
            return this.error(`The starterkit ${kit} does not exist.`);
        }

        this.fs.removeSync(this.kitOptions.list[kit].path);
        delete this.kitOptions.list[kit];
        this.writeKitOptions(this.kitOptions);
        this.success(`The kit ${kit} is removed.`);
    }

    /**
     * get starterkit options from $Home/.steamer/starterkits/starterkits.js
     */
    getKitOptions() {

        if (!this.fs.existsSync(this.kitOptionsPath)) {
            let options = {
                list: {},
                timestamp: Date.now()
            };
            this.fs.ensureFileSync(this.kitOptionsPath);
            this.fs.writeFileSync(this.kitOptionsPath, `module.exports = ${JSON.stringify(options, null, 4)};`, 'utf-8');
        }

        this.delRequireCache(this.kitOptionsPath);

        let kitOptions = require(this.kitOptionsPath);

        return kitOptions;
    }

    /**
     * write starterkit options
     * @param {Object} options starter kit options
     * @param {String} key starterkit name
     */
    writeKitOptions(options, key) {
        try {
            let updatedOptions = this.getKitOptions();

            if (key) {
                updatedOptions.list[key] = options.list[key];
            }

            updatedOptions.timestamp = Date.now();
            this.fs.writeFileSync(this.kitOptionsPath, `module.exports = ${JSON.stringify(updatedOptions, null, 4)};`, 'utf-8');

        }
        catch (e) {
            this.error(e.stack);
        }
    }

    addVersion(oldVers, newVer) {
        for (let i = 0, len = oldVers.length; i < len; i++) {
            if (compareVer(newVer, oldVers[i]) > 0) {
                oldVers.unshift(newVer);
                return oldVers;
            }
        }

        oldVers.push(newVer);
        return oldVers;
    }

    getPkgJson(localPath) {
        let pkgJsonPath = path.join(localPath, 'package.json');
        if (this.fs.existsSync(pkgJsonPath)) {
            this.delRequireCache(pkgJsonPath);
            return require(pkgJsonPath);
        }
        else {
            throw new Error('package.json does not exist');
        }
    }

    getNameSpace(repo) {
        let localPath = '';
        if (repo.indexOf('http') >= 0) {
            repo = url.parse(repo);
            if (!repo.host) {
                return this.error('Please input correct repo url');
            }
            localPath = `${repo.host}${repo.pathname.replace('.git', '')}`;
        }
        else if (repo.indexOf('git@') === 0) {
            localPath = repo.replace('git@', '').replace('.git', '').replace(':', '/');
        }
        else if (typeof this.kitOptions.list[repo] !== 'undefined') {
            localPath = this.getNameSpace(this.kitOptions.list[repo].url);
        }

        return localPath;
    }

    getKitName(ns) {
        let kit = null;
        if (ns.split('/').length === 3) {
            kit = ns.split('/')[2];
        }
        return kit;
    }

    getVersion(tag) {
        return tag.replace(/[a-zA-Z]+/ig, '');
    }

    spinSuccess(msg) {
        this.spinner.stop().succeed([
            msg
        ]);
    }

    spinFail(kitName, err) {
        this.spinner.stop().fail([
            `${kitName} ${err}`
        ]);
    }

    list() {
        this.log('You can use following starterkits: ');
        let kits = this.kitOptions.list;
        Object.keys(kits).forEach((key) => {
            let kit = kits[key];
            this.success(this.chalk.bold(`* ${key}`));
            this.log(`    - ver: ${kit.currentVersion}`);
            this.log(`    - des: ${kit.description}`);
            this.log(`    - url: ${kit.url}`);
        });
    }

    install() {
        let kits = this.kitOptions.list,
            questions = [],
            choices = [];

        Object.keys(kits).forEach((key) => {
            choices.push({
                name: `${key} - ${kits[key].description}`,
                value: key
            });
        });

        let answers = {};
        let prompts = new Rx.Subject();
        inquirer.prompt(prompts).ui.process.subscribe(
            (obj) => {
                switch (obj.name) {
                    case 'kit': {
                        prompts.next({
                            type: 'list',
                            name: 'ver',
                            message: 'Which version do you need: ',
                            choices: kits[obj.answer].versions
                        });
                        answers.kit = obj.answer;
                        break;
                    }
                    case 'ver': {
                        prompts.next({
                            type: 'text',
                            name: 'folder',
                            default: './',
                            message: 'Which folder is your project in: ',
                        });
                        answers.ver = obj.answer;
                        prompts.complete();
                        break;
                    }
                    case 'folder': {
                        answers.folder = obj.answer.trim();
                        break;
                    }
                }
            },
            () => {
            },
            () => {
                this.installKit(answers);
            }
        );

        prompts.next({
            type: 'list',
            name: 'kit',
            message: 'Which starterkit do you wanna install: ',
            choices: choices,
            pageSize: 100
        });
    }

    installKit(options) {
        let {
            kit,
            ver,
            folder
        } = options;

        let kitPath = path.join(this.kitHomePath, kit),
            kitConfigPath = path.join(kitPath, `.steamer/${kit}.js`),
            kitConfig = {},
            isSteamerKit = false,
            folderPath = path.join(process.cwd(), folder),
            kitQuestions = [],
            files = [];

        this.git(kitPath)
            .checkout(ver, () => {
                // 查看是否能获取steamer规范的脚手架配置
                if (this.fs.existsSync(kitConfigPath)) {
                    this.delRequireCache(kitConfigPath);
                    kitConfig = require(kitConfigPath);
                    files = kitConfig.installFiles || kitConfig.files;
                    files.push('package.json'),
                    kitQuestions = kitConfig.options;
                    isSteamerKit = true;
                }
                else {
                    files = this.fs.readdirSync(kitPath);
                }

                let isEmpty = this.checkEmpty(folderPath),
                    overwriteQuestion = [];

                if (!isEmpty) {
                    overwriteQuestion.push({
                        type: 'text',
                        name: 'overwrite',
                        message: 'The foler is not empty, do you wanna overrite?',
                        default: 'n'
                    });
                }

                let prompt = inquirer.createPromptModule();
                prompt(overwriteQuestion).then((answers) => {
                    if (!answers.hasOwnProperty('overwrite')
                        || answers.overwrite && answers.overwrite === 'y') {
                        this.copyFiles({ files, kitQuestions, folderPath, kitPath, kit, ver, isSteamerKit });
                    }
                }).catch((e) => {
                    this.error(e.stack);
                });
            });
    }

    /**
     * copy starterkit files to project folder
     */
    copyFiles(options) {
        let {
            files,
            kitQuestions,
            folderPath,
            kitPath,
            kit,
            ver,
            isSteamerKit
        } = options;
        // 脚手架相关配置问题
        let prompt = inquirer.createPromptModule();
        prompt(kitQuestions).then((answers) => {
            if (answers.webserver) {
                this.fs.ensureFileSync(path.join(folderPath, 'config/steamer.config.js'));
                this.fs.writeFileSync(path.join(folderPath, 'config/steamer.config.js'), 'module.exports = ' + JSON.stringify(answers, null, 4));
            }

            files = files.filter((item) => {
                return !this.ignoreFiles.includes(item);
            });

            files.forEach((item) => {
                let srcFiles = path.join(kitPath, item),
                    destFile = path.join(folderPath, item);
                this.fs.copySync(srcFiles, destFile);
            });

            if (isSteamerKit) {
                this.createPluginConfig({
                    kit: kit,
                    version: ver
                }, folderPath);
            }

            // 安装项目node_modules包
            spawn.sync(this.config.NPM, ['install'], { stdio: 'inherit', cwd: folderPath });
            this.success(`The project is initiated success in ${folderPath}`);
        }).catch((e) => {
            this.error(e.stack);
        });

    }

    /**
     * check folder empty or not
     * @param {*} folderPath
     */
    checkEmpty(folderPath) {
        // 查看目标目录是否为空
        if (path.resolve(folderPath) === process.cwd()) {
            let folderInfo = this.fs.readdirSync(folderPath);
            folderInfo = folderInfo.filter((item) => {
                return !this.ignoreFiles.includes(item);
            });
            return !folderInfo.length;
        }
        else {
            return !this.fs.existsSync(folderPath);
        }
    }

    createPluginConfig(conf, folder) {
        let config = conf;

        this.createConfig(config, {
            folder: folder,
            overwrite: true,
        });
    }

    delRequireCache(filePath) {
        let realpath = this.fs.realpathSync(filePath);
        if (require.cache[realpath]) {
            delete require.cache[realpath];
        }
    }

    /**
     * [help]
     */
    help() {
        this.printUsage(this.description, 'kit');
        this.printOption([
            {
                option: 'list',
                alias: 'l',
                description: 'list all available starter kits'
            },
            {
                option: 'add',
                alias: 'i',
                value: '[<git repo>|<git repo> --tag <tag name>|--alias <starterkit name>]',
                description: 'install starter kit'
            },
            {
                option: 'update',
                alias: 'u',
                value: '[--global]',
                description: 'update starter kit for project or update global starterkit'
            },
            {
                option: 'remove',
                value: '<starterkit name>',
                description: 'remove starterkit'
            }
        ]);
    }
}

module.exports = KitPlugin;