'use strict';

/*
 * This plugin is going to kickstart plugin or starterkit development.
 */

const path = require('path'),
    downloadGit = require('download-git-repo'),
    SteamerPlugin = require('steamer-plugin');

const pluginPrefix = 'steamer-plugin-',
    kitPrefix = 'steamer-';

class DevelopPlugin extends SteamerPlugin {
    constructor(args) {
        super(args);
        this.argv = args;
        this.pluginName = 'steamer-plugin-develop';
        this.description = 'develop steamer plugins and starterkits';
        this.downloadGit = downloadGit;
    }

    init() {
        let argv = this.argv,
            isPlugin = argv.plugin || argv.p || false,
            isKit = argv.kit || argv.k || false;

        if (isPlugin && isPlugin !== false) {
            this.plugin(isPlugin);
        }
        else if (isKit && isKit !== false) {
            this.kit(isKit);
        }
    }

    /**
     * install plugin template
     * @param {String} plugin 
     */
    plugin(plugin) {
        let pluginName = `${pluginPrefix}${plugin}`,
            projectPath = path.join(process.cwd(), pluginName);

        if (this.fs.existsSync(projectPath)) {
            return this.folderExist(projectPath);
        }

        this.info('Waiting to download...');

        this.downloadGit('https://github.com:steamerjs/steamer-plugin-example#master', projectPath, { clone: true }, (err) => {
            if (err) {
                this.error(err);
            }
            else {
                this.processPlugin(projectPath, plugin);
                this.info(`Installation success! \nYou can develop the plugin inside ${projectPath}`);
            }
        });
    }

    /**
     * replace steamer-plugin-example & ExamplePlugin
     * @param {String} projectPath project path
     * @param {String} plugin plugin short name
     */
    processPlugin(projectPath, plugin) {
        let pkgJson = path.join(projectPath, 'package.json'),
            indexFile = path.join(projectPath, 'index.js'),
            regex1 = new RegExp(`steamer-plugin-example`, 'ig'),
            regex2 = new RegExp(`ExamplePlugin`, 'ig');

        if (this.fs.existsSync(pkgJson)) {
            let pkgJsonContent = this.fs.readFileSync(pkgJson, 'utf-8');

            pkgJsonContent = pkgJsonContent.replace(regex1, `${pluginPrefix}${plugin}`);
            this.fs.writeFileSync(pkgJson, pkgJsonContent);
        }
        else {
            this.fileNotExist(projectPath);
        }

        if (this.fs.existsSync(indexFile)) {
            let indexContent = this.fs.readFileSync(indexFile, 'utf-8'),
                pluginClass = `${this._.upperFirst(plugin)}Plugin`;

            indexContent = indexContent.replace(regex1, `${pluginPrefix}${plugin}`);
            indexContent = indexContent.replace(regex2, pluginClass);
            this.fs.writeFileSync(indexFile, indexContent);
        }
        else {
            this.fileNotExist(projectPath);
        }

    }

    /**
     * install starterkit template
     * @param {String} kit 
     */
    kit(kit) {
        let pluginName = `${kitPrefix}${kit}`,
            projectPath = path.join(process.cwd(), pluginName);

        if (this.fs.existsSync(projectPath)) {
            return this.folderExist(projectPath);
        }

        this.info('Waiting to download...');

        this.downloadGit('https://github.com:steamerjs/steamer-example#master', projectPath, { clone: true }, (err) => {
            if (err) {
                this.error(err);
            }
            else {
                this.processKit(projectPath, kit);
                this.info(`Installation success! \nYou can develop the starterkit inside ${projectPath}`);
            }
        });
    }

    /**
     * replace steamer-example and create ./steamer/steamer-xxx.js
     * @param {String} projectPath 
     * @param {String} kit 
     */
    processKit(projectPath, kit) {
        let pkgJson = path.join(projectPath, 'package.json'),
            kitConfig = path.join(projectPath, './.steamer/steamer-example.js'),
            regex1 = new RegExp(`steamer-example`, 'ig');

        if (this.fs.existsSync(pkgJson)) {
            let pkgJsonContent = this.fs.readFileSync(pkgJson, 'utf-8');

            pkgJsonContent = pkgJsonContent.replace(regex1, `${kitPrefix}${kit}`);
            this.fs.writeFileSync(pkgJson, pkgJsonContent);
        }

        this.fs.copySync(kitConfig, path.join(projectPath, `./.steamer/${kitPrefix}${kit}.js`));
        this.fs.removeSync(kitConfig);
    }

    folderExist(projectPath) {
        throw new Error(`${projectPath} exists.`);
    }

    fileNotExist(projectPath) {
        throw new Error(`${projectPath} not exists.`);
    }

    help() {
        this.utils.printUsage('help you check steamer running environment!', 'develop');
    }
}

module.exports = DevelopPlugin;
