const SteamerPlugin = require('steamer-plugin');
const path = require('path');

class ConfigPlugin extends SteamerPlugin {
    constructor(args) {
        super(args);
        this.argv = args;
        this.pluginName = 'steamerjs';
        this.description = require('./config').descriptions.config;
    }

    /**
     * create config
     */
    createConfig() {
        // create global config file
        if (!this.fs.existsSync(path.join(this.getGlobalHome(), '.steamer/steamer.js'))) {
            this.createSteamerConfig({}, {
                isGlobal: true
            });
        }

        // create local config file
        this.createSteamerConfig({});

    }

    /**
     * list config key & values, local config extend global config
     */
    list() {
        let config = this.readSteamerConfig();

        for (let key in config) {
            if (config.hasOwnProperty(key)) {
                this.info(key + '=' + config[key] || '');
            }
        }

    }

    /**
     * get key value from command option
     * @return {Object} [key: value pair]
     */
    getKeyValue() {
        let argv = this.argv;
        let kv = argv.set || argv.s;
        let kvArr = (kv && kv !== true) ? kv.split('=') : [];

        let key = (kvArr.length > 0) ? kvArr[0] : '';
        let value = (kvArr.length > 1) ? kvArr[1] : '';

        return { key, value };
    }

    /**
     * set config key value
     */
    set() {

        let kv = this.getKeyValue();
        let config = this.readSteamerConfig({ isGlobal: this.isGlobal });

        config[kv.key] = kv.value;

        this.createSteamerConfig(config, {
            isGlobal: this.isGlobal,
            overwrite: true,
        });

    }

    /**
     * delete config key value
     */
    del() {
        let argv = this.argv;
        let key = argv.del || argv.d;
        let config = this.readSteamerConfig({ isGlobal: this.isGlobal });

        delete config[key];

        this.createSteamerConfig(config, {
            isGlobal: this.isGlobal,
            overwrite: true,
        });
    }

    init() {
        let argv = this.argv;

        this.isGlobal = this.argv.global || this.argv.g;

        if (argv.init || argv.i) {
            this.createConfig();
        }
        else if (argv.set || argv.s) {
            this.set();
        }
        else if (argv.del || argv.d) {
            this.del();
        }
        else if (argv.list || argv.l) {
            this.list();
        }
    }

    help() {
        this.printUsage(this.description, 'config');
        this.printOption([
            {
                option: 'list',
                alias: 'l',
                description: 'list config key=value'
            },
            {
                option: 'init',
                alias: 'i',
                description: 'initiate config in current working directory'
            },
            {
                option: 'set',
                alias: 's',
                value: '<key>=<value> [-g|--global]',
                description: 'set key value in local or global config'
            },
            {
                option: 'del',
                alias: 'd',
                value: '<key> [-g|--global]',
                description: 'delete key value in local or global config'
            }
        ]);
    }

}

module.exports = ConfigPlugin;