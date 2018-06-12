const SteamerPlugin = require('steamer-plugin');
const path = require('path');
const ora = require('ora');
const Rx = require('rxjs');
const inquirer = require('inquirer');
const _ = require('lodash');
const git = require('simple-git');
const compareVer = require('compare-versions');
const klawSync = require('klaw-sync');
const spawn = require('cross-spawn');
const {
    delRequireCache,
    getNameSpace,
    getKitName,
    getPkgJson,
    addVersion,
    getVersion,
    checkEmpty,
    help,
} = require('./utils/kit/index');

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
        // 读取一些全局默认的配置，如默认npm命令等
        this.config = this.readSteamerDefaultConfig();

        // 脚手架下载目录
        this.kitHomePath = path.join(
            this.getGlobalHome(),
            '.steamer',
            'starterkits'
        );
        // 脚手架配置路径
        this.kitOptionsPath = path.join(this.kitHomePath, 'starterkits.js');
        // 脚手架配置
        this.kitOptions = this.getKitOptions();
        // 忽略目录
        this.ignoreFiles = ['.git', '.svn'];

        this.spinner = ora('Loading unicorns');
        this.spawn = spawn;
        this.git = git;
    }

    init(argv) {
        let argvs = argv || this.argv; // command argv
        let isAdd = argvs.add;
        let isTag = argvs.tag;
        let isUpdate = argvs.update || argvs.u;
        let isAlias = argvs.alias || null;
        let isGlobal = argvs.global || argvs.g;
        let isRemove = argvs.remove || argvs.r;
        let isTemplate = argvs.template || argvs.t;
        let isList = argvs.list || argvs.l;
        let isDevelop = argvs.develop || argvs.d;

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
        else if (isDevelop) {
            this.develop(isDevelop);
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
        this.clone(repo, tag, alias)
            .then(() => {
                // console.log(this.kitOptions);
                this.writeKitOptions(this.kitOptions);
            })
            .catch(e => {
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
        let nameSpace = getNameSpace.bind(this)(repo);
        let kitName = alias || getKitName.bind(this)(nameSpace);
        let localPath = path.join(this.kitHomePath, kitName);

        let opt = {
            repo,
            kitName,
            localPath,
            tag
        };

        // starterkit exist and not add another version
        if (this.kitOptions.list.hasOwnProperty(kitName) && !tag) {
            this.error(
                `${kitName} exists. Please change the name useing --alias.`
            );
            return Promise.resolve();
        }
        else {
            if (!this.kitOptions.list.hasOwnProperty(kitName)) {
                // if the repo is not in config, but repo localPath exist, delete it and reinstall
                if (this.fs.existsSync(localPath)) {
                    this.fs.removeSync(localPath);
                }

                // init starterkit config
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
        let { repo, kitName, localPath } = options;
        return new Promise((resolve, reject) => {
            this.git()
                .silent(true)
                .exec(() => {
                    this.spinner.start();
                    this.spinner.color = 'cyan';
                    this.spinner.text = `installing ${kitName}`;
                })
                .clone(repo, localPath, '--depth=1', (err) => {
                    this.spinFail(kitName, err, reject);
                })
                .exec(() => {
                    let pkgJson = {};
                    try {
                        pkgJson = getPkgJson.bind(this)(localPath);
                        this.kitOptions.list[kitName] = this._.merge(
                            {},
                            this.kitOptions.list[kitName],
                            {
                                description: pkgJson.description,
                                currentVersion: pkgJson.version,
                                latestVersion: pkgJson.version,
                                versions: [pkgJson.version]
                            }
                        );
                    }
                    catch (e) {
                        reject(e);
                    }
                    this.checkoutLatest({
                        localPath,
                        pkgJson,
                        kitName,
                        resolve,
                        reject
                    });
                });
        });
    }

    /**
     * checkout latest branch after clone the latest from repo
     * @param {Object} options
     */
    checkoutLatest({ localPath, pkgJson, kitName, resolve, reject }) {
        this.git(localPath)
            .silent(true)
            .branch([pkgJson.version], err => {
                this.spinFail(kitName, err, reject);
            })
            .checkout(pkgJson.version, err => {
                err ?
                    this.spinFail(kitName, err, reject)
                    : this.spinSuccess(`${kitName}@${pkgJson.version} installed`);
            })
            .branch(['-D', 'master'], err => {
                err ? reject(err) : resolve();
            });
    }

    // fetch specific tag https://stackoverflow.com/questions/45338495/fetch-a-single-tag-from-remote-repository
    // git branch new_branch tag_name
    cloneTag({ repo, kitName, localPath, tag }) {
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
                    let isGitFolderExists = this.fs.existsSync(
                        path.join(localPath, '.git')
                    );

                    if (!isGitFolderExists) {
                        this.spawn.sync('git', ['init'], { cwd: localPath });
                        this.spawn.sync('git', ['remote', 'add', 'origin', repo], {
                            cwd: localPath
                        });
                    }
                })
                .fetch([
                    'origin',
                    `refs/tags/${tag}:refs/tags/${tag}`,
                    '--depth=1'
                ], (err) => {
                    if (err) {
                        this.spinFail(kitName, err, reject);
                        return;
                    }
                    this.checkoutTag({
                        tag,
                        localPath,
                        kitName,
                        resolve,
                        reject
                    });
                });
        });
    }

    /**
     * checkout tag branch after fetch that tag repo
     * @param {Object} options
     */
    checkoutTag({ tag, localPath, kitName, resolve, reject }) {
        let version = getVersion.bind(this)(tag);
        this.git(localPath)
            .silent(true)
            .branch([`${version}`, `${tag}`], (err) => {
                this.spinFail(kitName, err, reject);
            })
            .checkout(`${version}`, () => {
                this.spinSuccess(
                    `${kitName}@${version} installed`
                );
                let pkgJson = getPkgJson.bind(this)(localPath);
                let versions = addVersion.bind(this)(
                    this.kitOptions.list[kitName].versions,
                    pkgJson.version
                );

                this.kitOptions.list[kitName] = this._.merge(
                    {},
                    this.kitOptions.list[kitName],
                    {
                        description: pkgJson.description,
                        currentVersion: pkgJson.version,
                        latestVersion: versions[0],
                        versions: versions
                    }
                );
                resolve();
            });
    }

    /**
     * update starterkit globally or locally
     * @param {Boolean} isGlobal whether to update global or local starterkit
     */
    update(isGlobal) {
        if (isGlobal) {
            this.updateGlobal();
        }
        else if (!isGlobal) {
            this.updateLocal();
        }
    }

    updateGlobal() {
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
                    result.forEach((item) => {
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
                    this.spinFail(kitName, err);
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
                                err && this.spinFail(kitName, err);
                            })
                            .checkout(newVer, err => {
                                err && this.spinFail(kitName, err);
                            })
                            .branch(['-D', 'master'], () => {
                                this.spinSuccess(
                                    `${kitName}@${newVer} installed`
                                );
                                resolve({
                                    kitName,
                                    newVer
                                });
                            });
                    }
                    else {
                        this.git(kitOptions.path)
                            .silent(true)
                            .checkout(newVer, err => {
                                err && this.spinFail(kitName, err);
                            })
                            .branch(['-D', 'master'], () => {
                                this.spinSuccess(
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
    }

    updateLocal() {
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
        let kitConfigPath = path.join(kitPath, `.steamer/${kit}.js`);
        let kitConfig = this.readKitConfig(kitConfigPath);

        if (compareVer(curVer, kitOptions.latestVersion) >= 0) {
            return this.info(
                'Your project has already used the latest starterkit.'
            );
        }

        pluginConfig.version = kitOptions.latestVersion; // 更新当前项目的脚手架版本
        let keepFiles = ['src', 'config', 'tools'];
        let files = this.fs.readdirSync(kitPath);
        files = files.filter(item => {
            return !this.ignoreFiles.includes(item);
        });

        this.git(kitPath).checkout(kitOptions.latestVersion, (err) => {
            if (err) {
                return this.error(err);
            }

            let copyFiles = this.backupFiles(files, keepFiles);
            // 复制文件前的自定义行为
            if (kitConfig.beforeUpdateCopy && _.isFunction(kitConfig.beforeUpdateCopy)) {
                kitConfig.beforeUpdateCopy.bind(this)();
            }

            this.copyUpdateFiles(copyFiles, kitPath);

            // 复制文件后的自定义行为
            if (kitConfig.afterUpdateCopy && _.isFunction(kitConfig.afterUpdateCopy)) {
                kitConfig.afterUpdateCopy.bind(this)();
            }

            this.copyUpdatePkgJson(kitPath); // 更新项目package.json

            this.createConfig(pluginConfig, { overwrite: true }); // 更新项目.steamer/steamer-plugin-kit.js插件配置

            // beforeUpdateDep 的自定义行为
            if (kitConfig.beforeUpdateDep && _.isFunction(kitConfig.beforeUpdateDep)) {
                kitConfig.beforeUpdateDep.bind(this)();
            }

            this.spawn.sync(this.config.NPM, ['install'], {
                stdio: 'inherit',
                cwd: process.cwd()
            });

            if (kitConfig.afterUpdateDep && _.isFunction(kitConfig.afterUpdateDep)) {
                kitConfig.afterUpdateDep.bind(this)();
            }

            this.success(
                `The project has been updated to ${kitOptions.latestVersion}`
            );
        });
    }

    /**
     * back up files for project which is about to update
     * @param {Array} files files to copy
     * @param {Array} keepFiles files to keep
     */
    backupFiles(filesParam, keepFiles) {
        let files = filesParam.filter(item => {
            return !keepFiles.includes(item);
        });

        let ts = Date.now();

        files.forEach(item => {
            let file = path.join(process.cwd(), item);
            if (this.fs.existsSync(file)) {
                this.fs.copySync(file, path.join(process.cwd(), `backup/${ts}`, item));
            }
        });

        return files;
    }

    copyUpdateFiles(filesParam, kitPath) {
        let files = filesParam.filter(item => {
            return item !== 'package.json' && item !== 'package-lock.json';
        });

        files.forEach(item => {
            let itemPath = path.join(kitPath, item);
            if (this.fs.existsSync(itemPath)) {
                this.fs.copySync(itemPath, path.join(process.cwd(), item));
            }
        });
    }

    copyUpdatePkgJson(kitPath) {
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
    }

    /**
     * Create page from template
     */
    template() {
        let localConfig = this.readConfig();
        // let kit = localConfig.kit || null;
        // let folder = path.resolve();

        // this.checkConfigExist(localConfig);

        let pkgJsonPath = path.join(process.cwd(), 'package.json');

        // 如果 localConfig 为空，则创建，兼容直接 git clone 脚手架的情况
        if (
            this.fs.existsSync(pkgJsonPath) &&
            !Object.keys(localConfig).length
        ) {
            this.pkgJson =
                require(path.join(process.cwd(), 'package.json')) || {};

            localConfig.kit = this.pkgJson.name;
            localConfig.version = this.pkgJson.version;

            this.createPluginConfig(localConfig, process.cwd());
        }

        if (
            !localConfig.template ||
            !localConfig.template.src ||
            !localConfig.template.dist
        ) {
            inquirer
                .prompt([
                    {
                        type: 'text',
                        name: 'src',
                        message: 'type the template source folder:',
                        default: './tools/template'
                    },
                    {
                        type: 'input',
                        name: 'dist',
                        message: 'type your template destination folder: ',
                        default: './src/page'
                    },
                    {
                        type: 'input',
                        name: 'npm',
                        message: 'type your npm command(npm|tnpm|cnpm etc): ',
                        default: 'npm'
                    }
                ])
                .then(answers => {
                    localConfig.template = {};
                    localConfig.template.src = answers.src;
                    localConfig.template.dist = answers.dist;
                    localConfig.template.npm = answers.npm;

                    this.createPluginConfig(localConfig, path.resolve());

                    this.listTemplate(localConfig);
                })
                .catch(e => {
                    this.error(e.statck);
                });
        } else {
            this.listTemplate(localConfig);
        }
    }

    /**
     * list all templates
     * @param {*} localConfig
     */
    listTemplate(localConfig) {
        let templateFolder = path.resolve(localConfig.template.src);
        let templateInfo = this.fs.readdirSync(templateFolder);

        templateInfo = templateInfo.filter(item => {
            return this.fs
                .statSync(path.join(templateFolder, item))
                .isDirectory();
        });

        inquirer
            .prompt([
                {
                    type: 'list',
                    name: 'template',
                    message: 'which template do you like: ',
                    choices: templateInfo
                },
                {
                    type: 'input',
                    name: 'path',
                    message: 'type in your page name: '
                }
            ])
            .then(answers => {
                if (!answers.path) {
                    return this.error('Please type in your page name.');
                }

                let targetFolder = path.resolve(
                    localConfig.template.dist,
                    answers.path
                );
                let srcFolder = path.resolve(
                    localConfig.template.src,
                    answers.template
                );

                if (this.fs.existsSync(targetFolder)) {
                    return this.error(
                        'Target folder already exist. Please change another page name.'
                    );
                }

                this.fs.copySync(srcFolder, targetFolder);

                this.walkAndReplace(
                    targetFolder,
                    ['.js', '.jsx', '.ts', '.tsx', '.html'],
                    {
                        Title: answers.path.replace(/^[a-z]/, l =>
                            l.toUpperCase()
                        ),
                        title: answers.path.replace(/^[A-Z]/, L =>
                            L.toLowerCase()
                        )
                    }
                );

                this.installDependency(
                    path.resolve(localConfig.template.src),
                    answers.template,
                    localConfig.template.npm
                );
            })
            .catch(e => {
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
            files = files.filter(item => {
                let ext = path.extname(item.path);
                return extensions.includes(ext);
            });
        }

        files.forEach(file => {
            let content = this.fs.readFileSync(file.path, 'utf-8');

            Object.keys(replaceObj).forEach(key => {
                content = content.replace(
                    new RegExp('<% ' + key + ' %>', 'g'),
                    function (match) {
                        return replaceObj[key];
                    }
                );
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

        Object.keys(dependencies).forEach(item => {
            cmd += item + '@' + dependencies[item] + ' ';
        });

        if (cmd) {
            this.spawn.sync(npmCmd, ['install', '--save', cmd], {
                stdio: 'inherit',
                shell: true
            });
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
            this.fs.writeFileSync(
                this.kitOptionsPath,
                `module.exports = ${JSON.stringify(options, null, 4)};`,
                'utf-8'
            );
        }

        delRequireCache.bind(this)(this.kitOptionsPath);

        let kitOptions = require(this.kitOptionsPath);

        return kitOptions;
    }

    /**
     * write starterkit options
     * @param {Object} options starter kit options
     */
    writeKitOptions(options = {}) {
        try {
            // let updatedOptions = this.getKitOptions();

            // updatedOptions.timestamp = Date.now();
            this.fs.ensureFileSync(this.kitOptionsPath);
            this.fs.writeFileSync(
                this.kitOptionsPath,
                `module.exports = ${JSON.stringify(options, null, 4)};`,
                'utf-8'
            );
        } catch (e) {
            this.error(e.stack);
        }
    }

    spinSuccess(msg) {
        this.spinner.stop().succeed([msg]);
    }

    spinFail(kitName, err = null, reject = null) {
        if (err) {
            this.spinner.stop().fail([`${kitName} ${err}`]);
            reject && reject(err);
        }
    }

    list() {
        this.log('You can use following starterkits: ');
        let kits = this.kitOptions.list;
        Object.keys(kits).forEach(key => {
            let kit = kits[key];
            this.success(this.chalk.bold(`* ${key}`));
            this.log(`    - ver: ${kit.currentVersion}`);
            this.log(`    - des: ${kit.description}`);
            this.log(`    - url: ${kit.url}`);
        });
    }

    /**
     * develop starterkit and make it on starterkit list
     * @param {String} kitNameParam starterkit name
     */
    develop(kitNameParam = null) {

        let kitHomePath = this.kitHomePath;
        let kitOptions = this.kitOptions;
        let curPath = process.cwd();
        let packageJsonPath = path.join(curPath, 'package.json');

        delRequireCache.bind(this)(packageJsonPath);
        let packageJson = require(packageJsonPath);
        let kitName = (kitNameParam && kitNameParam !== true) ? kitNameParam : packageJson.name;
        let linkPath = path.join(kitHomePath, kitName);
        let ver = packageJson.version;

        if (kitOptions.list.hasOwnProperty(kitName)) {
            return this.error(
                `${kitName} exists. Please change the name useing --alias.`
            );
        }

        this.git()
            .silent(true)
            .branch([ver], (err) => {
                let errMsg = `already exists.`;
                if (err.includes(errMsg)) {
                    this.fs.symlinkSync(path.join(curPath), path.join(kitHomePath, kitName));

                    // init starterkit config
                    kitOptions.list[kitName] = {
                        url: null,
                        path: linkPath,
                        description: packageJson.description,
                        versions: [ver],
                        currentVersion: ver,
                        latestVersion: ver
                    };

                    this.writeKitOptions(kitOptions);

                    this.success(`${kitName}@${ver} installed.`);
                }
                else {
                    this.error(err);
                }
            });
    }

    install() {
        let kits = this.kitOptions.list;
        // let questions = [];
        let choices = [];

        Object.keys(kits).forEach(key => {
            choices.push({
                name: `${key} - ${kits[key].description}`,
                value: key
            });
        });

        let answers = {};
        let prompts = new Rx.Subject();
        inquirer.prompt(prompts).ui.process.subscribe(
            obj => {
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
                            message: 'Which folder is your project in: '
                        });
                        answers.ver = obj.answer;
                        break;
                    }
                    case 'folder': {
                        answers.folder = obj.answer.trim();
                        prompts.next({
                            type: 'text',
                            name: 'projectName',
                            message: 'type your project name:',
                            default: path.basename(answers.folder)
                        });

                        prompts.complete();
                        break;
                    }
                    case 'projectName':
                        answers.projectName = obj.answer.trim();
                        break;
                }
            },
            () => { },
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

    /**
     *  read starterkit config
     * @param {String} kitConfigPath
     */
    readKitConfig(kitConfigPath) {
        delRequireCache.bind(this)(kitConfigPath);
        return require(kitConfigPath);
    }

    installKit(options) {
        let { kit, ver, folder, projectName } = options;

        let kitPath = path.join(this.kitHomePath, kit);
        let kitConfigPath = path.join(kitPath, `.steamer/${kit}.js`);
        let kitConfig = {};
        let isSteamerKit = false;
        let folderPath = path.join(process.cwd(), folder);
        let kitQuestions = [];
        let files = [];

        this.git(kitPath).checkout(ver, () => {
            // 查看是否能获取steamer规范的脚手架配置
            if (this.fs.existsSync(kitConfigPath)) {
                kitConfig = this.readKitConfig(kitConfigPath);
                files = new Set(kitConfig.installFiles || kitConfig.files);
                files.add('package.json');
                kitQuestions = kitConfig.options || [];
                isSteamerKit = true;
            }
            else {
                files = new Set(this.fs.readdirSync(kitPath));
            }

            // 做去重
            files = Array.from(files);

            let isEmpty = checkEmpty.bind(this)(folderPath, this.ignoreFiles);
            let overwriteQuestion = [];

            if (!isEmpty) {
                overwriteQuestion.push({
                    type: 'text',
                    name: 'overwrite',
                    message: 'The foler is not empty, do you wanna overwrite?',
                    default: 'n'
                });
            }

            let prompt = inquirer.createPromptModule();
            prompt(overwriteQuestion)
                .then(answers => {
                    if (
                        !answers.hasOwnProperty('overwrite') ||
                        (answers.overwrite && answers.overwrite === 'y')
                    ) {
                        this.copyFiles({
                            files,
                            kitQuestions,
                            folderPath,
                            kitPath,
                            kit,
                            ver,
                            isSteamerKit,
                            projectName,
                            kitConfig
                        });
                    }
                })
                .catch(e => {
                    this.error(e.stack);
                });
        });
    }

    /**
     * copy starterkit files to project folder
     */
    copyFiles({
        files,
        kitQuestions,
        folderPath,
        kitPath,
        kit,
        ver,
        isSteamerKit,
        projectName,
        kitConfig
    }) {
        // 脚手架相关配置问题
        let prompt = inquirer.createPromptModule();
        prompt(kitQuestions)
            .then((answersParam) => {

                let answers = Object.assign({}, answersParam, {
                    projectName
                });

                // 复制文件前的自定义行为
                if (kitConfig.beforeInstallCopy && _.isFunction(kitConfig.beforeInstallCopy)) {
                    kitConfig.beforeInstallCopy.bind(this)(answers, folderPath);
                }

                let newFiles = files.filter(item => {
                    return !this.ignoreFiles.includes(item);
                });

                newFiles.forEach((item) => {
                    let srcFiles = path.join(kitPath, item);
                    let destFile = path.join(folderPath, item);

                    if (this.fs.existsSync(srcFiles)) {
                        this.fs.copySync(srcFiles, destFile);
                    }
                });

                if (answers.webserver) {
                    this.fs.ensureFileSync(
                        path.join(folderPath, 'config/steamer.config.js')
                    );
                    this.fs.writeFileSync(
                        path.join(folderPath, 'config/steamer.config.js'),
                        'module.exports = ' + JSON.stringify(answers, null, 4)
                    );
                }

                // 复制文件后的自定义行为
                if (kitConfig.afterInstallCopy && _.isFunction(kitConfig.afterInstallCopy)) {
                    kitConfig.afterInstallCopy.bind(this)(answers, folderPath);
                }

                if (isSteamerKit) {
                    this.createPluginConfig(
                        {
                            kit: kit,
                            version: ver
                        },
                        folderPath
                    );
                }

                // 替换项目名称
                if (projectName) {
                    const oldPkgJson = getPkgJson.bind(this)(folderPath);
                    let pkgJson = _.merge({}, oldPkgJson, {
                        name: projectName
                    });
                    this.fs.writeFileSync(
                        path.join(folderPath, 'package.json'),
                        JSON.stringify(pkgJson, null, 4),
                        'utf-8'
                    );
                }
                // beforeInstall 自定义行为
                if (kitConfig.beforeInstallDep && _.isFunction(kitConfig.beforeInstallDep)) {
                    kitConfig.beforeInstallDep.bind(this)(answers, folderPath);
                }

                // 安装项目node_modules包
                this.spawn.sync(this.config.NPM, ['install'], {
                    stdio: 'inherit',
                    cwd: folderPath
                });

                // afterInstall 自定义行为
                if (kitConfig.afterInstallDep && _.isFunction(kitConfig.afterInstallDep)) {
                    kitConfig.afterInstallDep.bind(this)(answers, folderPath);
                }

                this.success(
                    `The project is initiated success in ${folderPath}`
                );
            })
            .catch(e => {
                this.error(e.stack);
            });
    }

    createPluginConfig(conf, folder) {
        let config = conf;

        this.createConfig(config, {
            folder: folder,
            overwrite: true
        });
    }

    /**
     * get package.json
     * @param {String} localPath package.json location
     */
    getPkgJson(localPath) {
        return getPkgJson.bind(this)(localPath);
    }

    /**
     * [help]
     */
    help() {
        help.bind(this)();
    }
}

module.exports = KitPlugin;
