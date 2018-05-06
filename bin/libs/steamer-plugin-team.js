'use strict';

/*
*   This plugin is going to check the node environment.
*   Right now we only check if NODE_PATH variable exists
 */

const path = require('path'),
    spawn = require('cross-spawn'),
    logSymbols = require('log-symbols'),
    ora = require('ora'),
    SteamerPlugin = require('steamer-plugin'),
    KitPlugin = require('./steamer-plugin-kit');

let emptyFunc = () => {};

class TeamPlugin extends SteamerPlugin {
    constructor(args) {
        super(args);
        this.spawn = spawn;
        this.argv = args;
        this.config = this.readSteamerDefaultConfig();
        this.kitPlugin = new KitPlugin({});
        this.teamPrefix = this.config.TEAM_PREFIX;
        this.pluginName = 'steamer-plugin-team';
        this.description = require('./config').descriptions.team;
    }

    init() {
        let isAdd = this.argv.add;

        if (isAdd) {
            return this.addTeam(isAdd);
        }
    }

    getTeamConfig(teamPath) {
        return require(teamPath);
    }

    addTeam(team) {
        this.teamPrefix = (team === 'default') ? 'steamer-team-' : this.teamPrefix;
        let teamPath = path.join(this.getGlobalModules(), `${this.teamPrefix}${team}`),
            teamConfig = {};

        if (!this.fs.existsSync(teamPath)) {
            this.info(`Installing ${this.teamPrefix}${team}`);
            this.spawn.sync(this.config.NPM, ['install', '--global', `${this.teamPrefix}${team}`], { stdio: 'inherit' });
            this.info(`${this.teamPrefix}${team} installed`);
        }

        try {
            teamConfig = this.getTeamConfig(teamPath);
        }
        catch (e) {
            if (e.code === 'MODULE_NOT_FOUND' && team === 'default') {
                teamConfig = this.getTeamConfig(`${this.teamPrefix}${team}`);
            }
            else {
                return this.error(`The team configuration '${this.teamPrefix}${team}' is not found.\nPlease use npm install -g ${this.teamPrefix}${team} to install it first.`);
            }
        }

        let newConfig = this._.merge({}, this.config, teamConfig.config || {}),
            kits = teamConfig.kits || [],
            plugins = teamConfig.plugins || [],
            tasks = teamConfig.tasks || ['steamer-task-alloyteam'],
            beforeInstall = teamConfig.beforeInstall || emptyFunc,
            afterInstall = teamConfig.afterInstall || emptyFunc;
        
        beforeInstall();
        this.info(`Your team is \'${newConfig.TEAM}\'`);
        this.info(`You will use \'${newConfig.NPM}\' as your npm command`);

        this.createSteamerConfig(newConfig, {
            overwrite: true,
            isGlobal: true
        });

        let installPlugins = plugins.join(' ');
        let installTasks = tasks.join(' ');

        this.log('\n');
        this.info(`Installing plugins and tasks: `);
        let action = ['install', '--global'];
        action = action.concat(plugins, tasks);
        let result = this.spawn.sync(newConfig.NPM, action, { stdio: 'inherit' });
        
        if (!result.error) {
            this.log(`${logSymbols.success} ${installPlugins} ${installTasks} installed`);
        }
        else {
            this.log(`${logSymbols.error} ${installPlugins} ${installTasks} installed error: ${result.error}`);
        }

        this.log('\n');
        this.info(`Installing starterkits: `);
        // this.kitPlugin = new KitPlugin({});
        let kitConfigs = this.kitPlugin.kitOptions;

        let cloneAction = [];

        kits.forEach(item => {
            let kit = item.name,
                repo = item.git;
            if (!kitConfigs.list.hasOwnProperty(kit)) {
                cloneAction.push(this.kitPlugin.clone(repo));
            }
            else {
                this.log(`${logSymbols.success} ${kit}@${kitConfigs.list[kit].latestVersion} installed`);
            }
        });

        return new Promise((resolve) => {
            Promise.all(cloneAction).then((value) => {
                this.kitPlugin.writeKitOptions();
                afterInstall();
                resolve();
            }).catch((e) => {
                this.error(e);
            });
        });
    }

    help() {
        this.printUsage(this.description, 'team');
        this.printOption([
            {
                option: 'add',
                description: 'add config and install plugins or starterkits for your team'
            }
        ]);
    }
}

module.exports = TeamPlugin;