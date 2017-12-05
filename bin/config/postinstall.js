const _ = require('lodash'),
    SteamerPlugin = require('steamer-plugin');

let plugin = new SteamerPlugin({});
plugin.pluginName = 'steamerjs';

let config = plugin.readSteamerDefaultConfig();

plugin.createSteamerConfig(config, {
    overwrite: true,
    isGlobal: true
});