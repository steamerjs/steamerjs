const _ = require('lodash'),
    SteamerPlugin = require('steamer-plugin');

let plugin = new SteamerPlugin({});
plugin.pluginName = 'steamerjs';

let config = plugin.readSteamerConfig(),
    defaultConfig = require('./default.js'),
    newConfig = _.merge({}, defaultConfig, config);

plugin.createSteamerConfig(newConfig, {
    overwrite: true,
    isGlobal: true
});