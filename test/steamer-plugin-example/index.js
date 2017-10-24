'use strict';

const SteamerPlugin = require('steamer-plugin');

class ExamplePlugin extends SteamerPlugin {
    constructor(args) {
        super(args);
        this.argv = args;
        this.pluginName = 'steamer-plugin-example';
        this.description = 'steamer plugin example';
    }

    init() {
        this.info('This is plugin example.');
    }

    onExit() {
        this.info('This is the end of plugin example');
    }

    help() {
        this.printUsage('steamer plugin example help', 'example');
    }
}

module.exports = ExamplePlugin;
