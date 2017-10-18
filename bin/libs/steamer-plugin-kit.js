'use strict';

const SteamerPlugin = require('steamer-plugin').default,
    path = require('path'),
    inquirer = require('inquirer'),
    _ = require('lodash'),
    klawSync = require('klaw-sync'),
    spawnSync = require('child_process').spawnSync;

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
        super();
        this.argv = args;
        this.pluginName = 'steamer-plugin-kit';
        this.description = 'manage starterkits';
        this.globalNodeModules = this.getGlobalModules();

        this.prefix = 'steamer-';

        this.pkgJson = {};
        // 旧的项目pkgjson内容，在脚手架更新的时候有用。
        this.oldPkgJson = {};
    }

    init(argv) {

        let argvs = argv || this.argv; // command argv

        // command argv
        let isInstall = argvs.install || argvs.i || false,
            isUpdate = argvs.update || argvs.u || false,
            isList = argvs.list || argvs.l || false,
            isTemplate = argvs.template || argvs.t || false;

        if (isInstall && isInstall !== true) {
            return this.install({
                isInstall,
                argvs
            });
        }
        else if (isUpdate) {
            return this.update({
                isUpdate
            });
        }
        else if (isList) {
            return this.list();
        }
        else if (isTemplate) {
            return this.template({

            });
        }
        else {
            return this.auto();
        }
    }

    /**
     * [install kit]
     * @param  {Object} opts [options]
     */
    install(opts) {
        let argvs = opts.argvs,
            isInstall = opts.isInstall,
            kit = this.getKitName(isInstall),  // kit name, for example, steamer-react
            kitPath = path.join(this.globalNodeModules, kit),  // steamer-react global module
            folder = argvs.path || argvs.p || this.getFolderName(kit); // target folder

        this.checkFolderExist(folder);

        let kitConfig = this.getKitConfig(kit),
            copyAndBackupFiles = this.copyAndBackup(kitConfig),
            cpyFiles = copyAndBackupFiles.cpyFiles,
            inquirerConfig = kitConfig.options;

        this.pkgJson = this.getPkgJson(kitPath);

        let config = null;

        inquirerConfig.push({
            type: 'input',
            name: 'npm',
            message: 'npm install command(npm, cnpm, yarn, tnpm, etc)',
            default: 'npm'
        });

        inquirer.prompt(
            inquirerConfig
        ).then((answers) => {
            let npm = answers.npm;
            delete answers['npm'];

            // init config
            answers.webserver = answers.webserver || '//localhost:9000/';
            answers.cdn = answers.cdn || '//localhost:8000/';
            answers.port = answers.port || 9000;

            config = _.merge({}, answers);

            // copy template files
            this.copyFiles(kitPath, cpyFiles, folder, config);

            this.copyPkgJson(folder, 'install');

            // create config file, for example in ./.steamer/steamer-plugin-kit.js
            this.createPluginConfig({
                kit: kit,
            }, folder);

            this.info(kit + ' install success');
            this.info('The project path is: ' + path.resolve(folder));

            this.installPkg(folder, npm);

        }).catch((e) => {
            this.error(e.stack);
        });
    }

    /**
     * [get kit name]
     * @param  {String} pkg [starter kit name]
     * @return {String}     [kit name]
     */
    getKitName(pkg) {
        let pkgArr = pkg.split('/');

        if (pkgArr.length === 2) {
            pkgArr[1] = (~pkgArr[1].indexOf(this.prefix)) ? pkgArr[1] : this.prefix + pkgArr[1];
        }
        else if (pkgArr.length === 1) {
            pkgArr[0] = (~pkgArr[0].indexOf(this.prefix)) ? pkgArr[0] : this.prefix + pkgArr[0];
        }

        pkg = pkgArr.join('/');

        return pkg;
    }

    getFolderName(kit) {
        let pkgArr = kit.split('/');

        if (pkgArr.length === 2) {
            return pkgArr[1];
        }
        else if (pkgArr.length === 1) {
            return pkgArr[0];
        }

    }

    getKitConfig(kit) {
        let kitConfig = {},
            kitPath;

        try {
            kitPath = path.join(this.globalNodeModules, kit);

            if (this.fs.existsSync(kitPath)) {
                kitConfig = require(kitPath);
            }
            else {
                kitConfig = require(kit);
            }
        }
        catch (e) {

            if (e.code === 'MODULE_NOT_FOUND') {
                this.info(kit + ' is not found. Start installing...');
            }

            spawnSync('npm', ['install', '--global', kit], { stdio: 'inherit', shell: true });

            try {
                kitConfig = require(kitPath);
            }
            catch (e) {
                if (e.code === 'MODULE_NOT_FOUND') {
                    this.error(kit + ' is not installed. One of following three reasons may cause this issue: ');
                    this.warn('1. You do not install this starterkit.');
                    this.warn('2. The starterkit is not in global node_modules.');
                    this.warn('3. You install the starterkit but forget to set NODE_PATH which points to global node_modules.');
                    throw new Error(kit + ' is not installed. ');
                }
            }
        }

        return kitConfig;
    }

    copyAndBackup(kitConfig) {
        let cpyFiles = this.filterCopyFiles(kitConfig.files), // files needed to be copied
            bkFiles = _.merge([], kitConfig.files, ['package.json']); // backup files

        return {
            cpyFiles,
            bkFiles
        };
    }

    filterCopyFiles(files) {
        let f = [];
        f = f.concat(files);
        // default copied files and folders
        f.push('src', 'tools', 'config', 'README.md');
        f = _.uniq(f);

        return f;
    }

    /**
     * [get info from package.json]
     * @param  {String} kitPath [starter kit global path]
     */
    getPkgJson(kitPath) {
        let pkgJsonFile = path.resolve(kitPath, 'package.json');

        return JSON.parse(this.fs.readFileSync(pkgJsonFile, 'utf-8'));
    }

    /**
     * [copy files]
     * @param  {String} kitPath [kit global module path]
     * @param  {String} folder  [target folder]
     * @param  {String} tpl     [config template]
     */
    copyFiles(kitPath, cpyFiles, folder, config) {

        cpyFiles.map((item) => {
            try {
                let srcFile = path.join(kitPath, item),
                    destFile = path.join(folder, item);

                if (this.fs.existsSync(srcFile)) {
                    this.fs.copySync(srcFile, destFile);
                }
            }
            catch (e) {
                this.error(e.stack);
            }
        });

        this.fs.ensureFileSync(path.join(folder, 'config/steamer.config.js'));
        this.fs.writeFileSync(path.join(folder, 'config/steamer.config.js'), 'module.exports = ' + JSON.stringify(config, null, 4));
    }

    /**
     * [create package.json]
     * @param  {String} kitPath [starter kit global path]
     * @param  {String} folder [new package.json destination folder]
     */
    copyPkgJson(folder, status) {
        let pkgJson = {
            'name': '',
            'version': '',
            'description': '',
            'scripts': {},
            'author': '',
        };

        let pkgJsonSrc = this.pkgJson;

        pkgJson.name = pkgJsonSrc.name;
        pkgJson.version = pkgJsonSrc.version;
        pkgJson.main = pkgJsonSrc.main || '';
        pkgJson.bin = pkgJsonSrc.bin || '';
        pkgJson.description = pkgJsonSrc.description || '';
        pkgJson.repository = pkgJsonSrc.repository || '';
        pkgJson.scripts = pkgJsonSrc.scripts;
        pkgJson.author = pkgJsonSrc.author || '';
        pkgJson.dependencies = pkgJsonSrc.dependencies || {};
        pkgJson.devDependencies = pkgJsonSrc.devDependencies || {};
        pkgJson.peerDependencies = pkgJsonSrc.peerDependencies || {};
        pkgJson.engines = pkgJsonSrc.engines || {};

        let pkgJsonFile = path.join(folder, 'package.json');

        if (status === 'update') {
            pkgJson = _.merge({}, this.oldPkgJson, {
                version: pkgJson.version,
                dependencies: pkgJson.dependencies,
                devDependencies: pkgJson.devDependencies,
            });
        }
        else {
            if (this.fs.existsSync(pkgJsonFile)) {
                let pkgJsonContent = JSON.parse(this.fs.readFileSync(pkgJsonFile, 'utf-8') || '{}');
                pkgJson = _.merge({}, pkgJsonContent, pkgJson);
            }
        }

        this.fs.writeFileSync(path.join(folder, 'package.json'), JSON.stringify(pkgJson, null, 4), 'utf-8');
    }

    /**
     * [create steamer-plugin-kit config]
     * @param  {String} kit    [kit name]
     * @param  {String} folder [target folder]
     * @param  {Object} config [config object]
     */
    createPluginConfig(conf, folder) {
        let config = conf;

        if (!config.version) {
            config.version = this.pkgJson.version;
        }

        this.createConfig(config, {
            folder: folder,
            overwrite: true,
        });
    }

    /**
     * [run npm install]
     * @param  {String} folder [destination folder]
     * @param  {String} folder [destination folder]
     */
    installPkg(folder, npmCmd) {
        let npmCommand = npmCmd || 'npm';

        this.info('we run ' + npmCommand + ' install for you');

        process.chdir(path.resolve(folder));

        let result = spawnSync(npmCommand, ['install'], { stdio: 'inherit', shell: true });

        if (result.error) {
            this.error('command ' + npmCommand + ' is not found or other error has occurred');
        }
    }

    /**
     * [update kit]
     * @param  {Object} opts [options]
     */
    update(opts) {
        let isUpdate = opts.isUpdate,
            localConfig = this.readConfig(),
            kit = localConfig.kit || null,
            kitPath = null,
            kitConfig = {},
            folder = path.resolve();

        // suuport update for starter kit without .steamer/steamer-plugin-kit.js
        if (isUpdate && isUpdate !== true) {
            localConfig = {};
            localConfig.kit = this.getKitName(isUpdate);
            kit = localConfig.kit;

            kitConfig = this.getKitConfig(kit);
            kitPath = this.getKitPath(this.globalNodeModules, kit);
            this.pkgJson = this.getPkgJson(kitPath);

            this.createPluginConfig({
                kit: localConfig.kit,
            }, folder);
        }
        else {
            kitConfig = this.getKitConfig(kit);
            kitPath = path.join(this.globalNodeModules, kit);
            this.pkgJson = this.getPkgJson(kitPath);
        }

        let copyAndBackupFiles = this.copyAndBackup(kitConfig);

        // check if config exist
        this.checkConfigExist(localConfig);

        // backup files
        this.backupFiles(folder, copyAndBackupFiles.bkFiles);

        // copy files excluding src
        this.copyFilterFiles(kitPath, folder, copyAndBackupFiles.bkFiles);

        // copy package.json
        this.copyPkgJson(folder, 'update');

        this.info(kit + ' update success');
    }

    getKitPath(globalNodeModules, kit) {
        let kitPath = path.join(__dirname, '../../', kit);

        if (!this.fs.existsSync(kitPath)) {
            kitPath = path.join(globalNodeModules, kit);
        }

        // console.log(kitPath);
        return kitPath;
    }

    /**
     * [backup files while updating]
     * @param  {String} folder  [target folder]
     * @param  {Array} bkFiles [files needed backup]
     */
    backupFiles(folder, bkFiles) {
        let destFolder = 'backup/' + Date.now();
        bkFiles.forEach((item) => {
            let file = path.join(folder, item);

            if (this.fs.existsSync(file)) {
                this.fs.copySync(file, path.join(folder, destFolder, item));

                if (item === 'package.json') {
                    this.oldPkgJson = require(file);
                }

                this.fs.removeSync(file);
            }
        });
    }

    /**
     * [copy files while updating]
     * @param  {String} kitPath [kit global module path]
     * @param  {String} folder  [target folder]
     * @param  {String} tpl     [config template]
     * @param  {Array} bkFiles  [files needed backup]
     */
    copyFilterFiles(kitPath, folder, bkFiles) {
        bkFiles.forEach((item) => {
            let file = path.join(kitPath, item);

            if (this.fs.existsSync(file)) {
                this.fs.copySync(file, path.join(folder, item));
            }
        });
    }

    /**
     * list avaialbe starter kits
     * @param  {Object} opts [options]
     */
    list() {
        let kits = this.listKit();

        this.warn('steamer starterkit:');
        kits.map((kit) => {
            this.info(kit.name);
        });
    }

    /**
     * [search available starter kits]
     * @return {Array}       [starter kits]
     */
    listKit() {
        let globalNodeModules = this.globalNodeModules || '';
        let pkgs = this.fs.readdirSync(globalNodeModules),
            kits = [];

        pkgs = pkgs.filter((item) => {
            return (!!~item.indexOf('steamer-') && !~item.indexOf('steamer-plugin')) || item.indexOf('@') === 0;
        });

        let scopes = [];

        pkgs.forEach((item, key) => {
            if (item.indexOf('@') === 0) {
                scopes.push(item);
                pkgs.slice(key, 1);
            }
            else {
                let pkgJson = require(path.join(globalNodeModules, item, 'package.json')),
                    keywords = pkgJson.keywords || [],
                    des = pkgJson.description || '';

                // console.log(item, keywords);
                if (~keywords.indexOf('steamer starterkit')) {
                    kits.push({
                        name: item + ': ' + des,
                        value: item
                    });
                }
            }
        });


        scopes.forEach((item1) => {
            let pkgs = this.fs.readdirSync(path.join(globalNodeModules, item1));

            pkgs.filter((item2) => {
                return !!~item2.indexOf('steamer-') && !~item2.indexOf('steamer-plugin');
            });

            pkgs.forEach((item2) => {
                let pkgJson = require(path.join(globalNodeModules, item1, item2, 'package.json')),
                    keywords = pkgJson.keywords || [],
                    des = pkgJson.description || '';

                if (~keywords.indexOf('steamer starterkit')) {
                    kits.push({
                        name: item1 + '/' + item2 + ': ' + des,
                        value: item1 + '/' + item2
                    });
                }
            });

        });

        kits = kits.map((item) => {
            item.name = item.name.replace('steamer-', '');
            return item;
        });

        return kits;
    }

    /**
     * create page based on templates
     */
    template() {

        let localConfig = this.readConfig(),
            kit = localConfig.kit || null,
            folder = path.resolve();

        // if .steamer/steamer-plugin-kit.js not exist
        // let kitConfigPath = path.join(process.cwd(), './.steamer/steamer-plugin-kit.js');

        this.checkConfigExist(localConfig);

        // if (!this.fs.existsSync(kitConfigPath)) {

        let pkgJsonPath = path.join(process.cwd(), 'package.json');

        if (this.fs.existsSync(pkgJsonPath)) {
            this.pkgJson = require(path.join(process.cwd(), 'package.json')) || {};

            this.createPluginConfig({
                kit: this.pkgJson.name,
            }, process.cwd());
        }
        // }

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
            spawnSync(npmCmd, ['install', '--save-dev', cmd], { stdio: 'inherit', shell: true });
        }
    }

    /**
     * auto install
     */
    auto() {
        let kits = this.listKit();

        // if (!kits.length) {
        // 	this.printIfKitEmpty();
        // }

        kits = this.addOfficialKits(kits);

        if (kits[0].type !== 'separator') {
            kits.unshift(new inquirer.Separator('Local installed Starter Kits:'));
        }

        inquirer.prompt([{
            type: 'list',
            name: 'kit',
            message: 'which starterkit do you like: ',
            choices: kits,
            pageSize: 50,
        }, {
            type: 'input',
            name: 'path',
            message: 'type in your project name: ',
        }]).then((answers) => {
            let kit = answers.kit,
                projectPath = answers.path;

            if (kit) {
                this.init({
                    install: kit,
                    path: projectPath,
                });
            }

        }).catch((e) => {
            this.error(e.stack);
        });
    }

    addOfficialKits(kits) {

        kits.push(new inquirer.Separator('Other official Starter Kits:'));

        let officialKits = [
            {
                name: 'simple: alloyteam frameworkless starterkit',
                value: 'steamer-simple'
            },
            {
                name: 'react: alloyteam react starterkit',
                value: 'steamer-react',
            },
            {
                name: 'vue: alloyteam vue starterkit',
                value: 'steamer-vue',
            },
            {
                name: 'simple-component: alloyteam frameworkless component development starterkit',
                value: 'steamer-simple-component',
            },
            {
                name: 'react-component: alloyteam react component development starterkit',
                value: 'steamer-react-component',
            },
            {
                name: 'vue-component: alloyteam vue component development starterkit',
                value: 'steamer-vue-component',
            },
        ];

        kits = _.uniqBy(kits.concat(officialKits), 'value');

        return kits;
    }

    printIfKitEmpty() {
        this.warn('No starter kits are found. There may be two reasons:');
        this.warn('1. You have not set Node_PATH.');
        this.warn('2. You do not install any starter kits.');
    }

    /**
     * [help]
     */
    help() {
        this.printUsage('steamer kit manager', 'kit');
        this.printOption([
            {
                option: 'list',
                alias: 'l',
                description: 'list all available starter kits'
            },
            {
                option: 'install',
                alias: 'i',
                value: '<starter kit> [--path|-p] <project path>',
                description: 'install starter kit'
            },
            {
                option: 'update',
                alias: 'u',
                value: '[<starter kit>]',
                description: 'update starter kit for project'
            }
        ]);
    }

    checkFolderExist(folder) {
        if (this.fs.existsSync(folder)) {
            throw new Error(folder + ' has existed.');  // avoid duplicate folder
        }
    }

    checkConfigExist(localConfig) {
        if (!localConfig || !localConfig.kit) {
            this.printIfConfigNotFound();
            throw new Error('./steamer/steamer-plugin-kit.js not found or empty.');
        }
    }

    printIfConfigNotFound() {
        this.error('The config file ./steamer/steamer-plugin-kit.js is required');
        this.error('There may be 2 reasons:');
        this.error('1. You are not in the right folder after installation.');
        this.error('2. You really do not have .steamer folder in the project.\n\n');
    }
}

module.exports = KitPlugin;