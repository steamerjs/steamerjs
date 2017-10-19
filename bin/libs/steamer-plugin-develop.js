'use strict';

/*
 *   This plugin is going to kickstart plugin or starterkit development.
 */

const path = require('path'),
    downloadGit = require('download-git-repo'),
    SteamerPlugin = require('steamer-plugin');

const pluginPrefix= 'steamer-plugin-',
    kitPrefix = 'steamer-';

class DevelopPlugin extends SteamerPlugin {
    constructor(args) {
        super(args);
        this.argv = args;
        this.pluginName = 'steamer-plugin-develop';
        this.description = 'develop steamer plugins and starterkits';
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

    plugin(plugin) {
        let pluginName = `${pluginPrefix}${plugin}`,
            projectPath = path.join(process.cwd(), pluginName);

        if (this.fs.existsSync(projectPath)) {
            return this.folderExist(projectPath);
        }

        this.info('Waiting to download...');
        
        downloadGit('https://github.com:steamerjs/steamer-plugin-example#master', projectPath, { clone: true }, (err) => {
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

        if (this.fs.existsSync(indexFile)) {
            let indexContent = this.fs.readFileSync(indexFile, 'utf-8'),
                pluginClass = `${this._.upperFirst(plugin)}Plugin`;

            indexContent = indexContent.replace(regex1, `${pluginPrefix}${plugin}`);
            indexContent = indexContent.replace(regex2, pluginClass);
            this.fs.writeFileSync(indexFile, indexContent);
        }

    }

    kit() {

    }

    folderExist(projectPath) {
        throw new Error(`${projectPath} exists.`);
    }

    help() {
        this.utils.printUsage('help you check steamer running environment!', 'develop');
    }
}

module.exports = DevelopPlugin;
