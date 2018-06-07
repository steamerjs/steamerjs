// const _ = require('lodash');
const SteamerPlugin = require('steamer-plugin');

let plugin = new SteamerPlugin({});
plugin.pluginName = 'steamerjs';

let config = plugin.readSteamerDefaultConfig();

plugin.createSteamerConfig(config, {
    overwrite: true,
    isGlobal: true
});