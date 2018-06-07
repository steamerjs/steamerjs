const SteamerPlugin = require('steamer-plugin');
const config = require('./config');
const path = require('path');

class ListPlugin extends SteamerPlugin {
    constructor(args) {
        super(args);
        this.argv = args;
        this.pluginName = 'steamer-plugin-list';
        this.description = require('./config').descriptions.list;
        this.config = this.readSteamerDefaultConfig();
        this.pluginPrefix = this.config.PLUGIN_PREFIX;
    }

    list() {
        this.printListTitle();

        this.listPlugins();

        this.printListUsage();
    }

    listPlugins() {
        let cmds = this.filterCmds();
        let sortedCmds = cmds.files.sort();

        let maxWidth = 0;
        sortedCmds.forEach((item) => {
            if (item.length > maxWidth) {
                maxWidth = item.length;
            }
        });

        sortedCmds.forEach((item) => {
            let spaceCount = (maxWidth - item.length) + 2;
            let str = `${this.chalk.green('* ' + item)} ${' '.repeat(spaceCount)}-  ${cmds.descriptions[item]}`;
            this.log(str);
        });
    }

    /**
     * get command names
     * @return {Array} [command file]
     */
    filterCmds() {
        let globalModules = this.getGlobalModules();
        if (!globalModules) {
            return [];
        }

        let descriptions = {};

        let files = this.fs.readdirSync(globalModules);

        files = files.filter((item) => {
            return item.indexOf(this.pluginPrefix) === 0;
        });

        let des = this.readDescription(files, globalModules);
        descriptions = des.descriptions;
        files = des.files;

        config.reserveCmd = config.reserveCmd.map((item) => {
            descriptions[item] = config.descriptions[item];
            return item;
        });

        files = files.concat(config.reserveCmd);

        return {
            files,
            descriptions
        };
    }

    /**
     * read plugin description
     * @param {Array} files search for node_modules files
     * @param {String} globalModules global node_modules path
     */
    readDescription(filesParam, globalModules) {
        let descriptions = {};
        let files = filesParam.map((item) => {
            let newItem = item.replace(this.pluginPrefix, '');
            let pkgJson = require(path.join(globalModules, item, 'package.json'));
            descriptions[newItem] = pkgJson.description;
            return newItem;
        });

        return {
            files,
            descriptions
        };
    }

    /**
     * print title
     * @return {String} [title string]
     */
    printListTitle() {
        this.log('Hello! You can use following commands: ');
    }

    /**
     * print usage
     * @return {String} [usage string]
     */
    printListUsage() {
        let msg = '';
        msg += this.printTitle('How to use above commands', 'white');
        msg += this.success('steamer <command>');
        msg += this.success('steamer <command> --[<args>]');
        msg += this.success('steamer <command> -[<args alias>]');
        msg += this.printEnd('white');
        return msg;
    }

    init() {
        this.list();
    }

    help() {
        this.printUsage(this.description, 'list');
    }
}

module.exports = ListPlugin;