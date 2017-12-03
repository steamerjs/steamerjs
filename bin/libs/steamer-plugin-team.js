'use strict';

/*
*   This plugin is going to check the node environment.
*   Right now we only check if NODE_PATH variable exists
 */

const path = require('path'),
    spawnSync = require('child_process').spawnSync,
    SteamerPlugin = require('steamer-plugin'),
    KitPlugin = require('./steamer-plugin-kit');

let emptyFunc = () => {};

class TeamPlugin extends SteamerPlugin {
    constructor(args) {
        super(args);
        this.argv = args;
        this.config = this.readSteamerConfig();
        this.teamPrefix = this.config.TEAM_PREFIX || 'steamer-team-';
        this.pluginName = 'steamer-plugin-team';
        this.description = 'steamerjs team config';
    }

    init() {
        let isAdd = this.argv.add;

        if (isAdd) {
            this.addTeam(isAdd);
        }
    }

    addTeam(team) {
        this.teamPrefix = (team === 'default') ? 'steamer-team-' : this.teamPrefix;
        let teamPath = path.join(this.getGlobalModules(), `${this.teamPrefix}${team}`),
            teamConfig = {};

        try {
            teamConfig = require(teamPath);
        }
        catch (e) {
            if (e.code === 'MODULE_NOT_FOUND' && team === 'default') {
                teamConfig = require(`${this.teamPrefix}${team}`);
            }
            else {
                return this.error('The team configuration is not found.');
            }
        }

        let newConfig = this._.merge({}, this.config, teamConfig.config || {}),
            kits = teamConfig.kits || [],
            plugins = teamConfig.plugins || [],
            beforeInstall = teamConfig.beforeInstall || emptyFunc,
            afterInstall = teamConfig.afterInstall || emptyFunc;

        beforeInstall();
        this.info(`Your team is \'${team}\'`);
        this.info('You will use \'npm\' as your npm command');


        this.createSteamerConfig(newConfig, {
            overwrite: true,
            isGlobal: true
        });

        let installPlugins = plugins.join(' ');
        this.info(`Installing ${installPlugins}`);
        spawnSync(newConfig.NPM, ['install', '--global', installPlugins], { stdio: 'inherit', shell: true });

        let kitPlugin = new KitPlugin({}),
            kitConfigs = kitPlugin.kitOptions;

        let cloneAction = [];

        kits.forEach(item => {
            let kit = item.name,
                repo = item.git;
            if (!kitConfigs.list.hasOwnProperty(kit)) {
                cloneAction.push(kitPlugin.clone(repo));
            }
            else {
                this.info(`${kit} has been installed`);
            }
        });


        Promise.all(cloneAction).then((value) => {
            kitPlugin.writeKitOptions(kitConfigs);
        }).catch((e) => {
            this.error(e);
        });

        afterInstall();
    }

    help() {
        this.printUsage('help you initiate any config, plugins or starterkits for your team', 'teamer');
    }
}

module.exports = TeamPlugin;
