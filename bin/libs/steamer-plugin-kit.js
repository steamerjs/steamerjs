const SteamerPlugin = require('steamer-plugin');
const path = require('path');
const ora = require('ora');
const git = require('simple-git');

const spawn = require('cross-spawn');
const {
    getPkgJson,
    help,
    getKitOptions,
    writeKitOptions,
    walkAndReplace,
    readKitConfig
} = require('./libs/kit/utils');

const initProject = require('./libs/kit/init');
const installKit = require('./libs/kit/install');
const updateKit = require('./libs/kit/update');
const uninstallKit = require('./libs/kit/uninstall');
const template = require('./libs/kit/template');
const listKit = require('./libs/kit/list');
const developKit = require('./libs/kit/develop');

/**
 * // .steamer/steamer.plugin-kit.js
     module.exports = {
        'plugin': 'steamer-plugin-kit',
        'config': {
            'kit': 'steamer-react'
        }
    }
*/

class KitPlugin extends SteamerPlugin {
    constructor(args) {
        super(args);

        // 成员合并
        this.help = help.bind(this);
        this.getKitOptions = getKitOptions.bind(this);
        this.writeKitOptions = writeKitOptions.bind(this);
        this.clone = installKit.clone.bind(this);
        this.cloneLatest = installKit.cloneLatest.bind(this);
        this.cloneTag = installKit.cloneTag.bind(this);
        this.updateGlobalKit = updateKit.updateGlobalKit.bind(this);
        this.updateGlobal = updateKit.updateGlobal.bind(this);
        this.updateLocal = updateKit.updateLocal.bind(this);
        this.getPkgJson = getPkgJson.bind(this);
        this.walkAndReplace = walkAndReplace.bind(this);
        this.readKitConfig = readKitConfig.bind(this);

        this.argv = args;
        this.pluginName = 'steamer-plugin-kit';
        this.description = 'manage starterkits';
        // 读取一些全局默认的配置，如默认npm命令等
        this.config = this.readSteamerDefaultConfig();

        // 脚手架下载目录
        this.kitHomePath = path.join(
            this.getGlobalHome(),
            '.steamer',
            'starterkits'
        );
        // 脚手架配置路径
        this.kitOptionsPath = path.join(this.kitHomePath, 'starterkits.js');
        // 脚手架配置
        this.kitOptions = this.getKitOptions();
        // 忽略目录
        this.ignoreFiles = ['.git', '.svn'];

        this.spinner = ora('Loading unicorns');
        this.spawn = spawn;
        this.git = git;
    }

    init(argv) {
        let argvs = argv || this.argv; // command argv
        let isAdd = argvs.add;
        let isTag = argvs.tag;
        let isUpdate = argvs.update || argvs.u;
        let isAlias = argvs.alias || null;
        let isGlobal = argvs.global || argvs.g;
        let isRemove = argvs.remove || argvs.r;
        let isTemplate = argvs.template || argvs.t;
        let isList = argvs.list || argvs.l;
        let isDevelop = argvs.develop || argvs.d;

        if (isAdd) {
            installKit.installKit.bind(this)(isAdd, isTag, isAlias);
        } else if (isUpdate) {
            updateKit.update.bind(this)(isGlobal);
        } else if (isRemove) {
            uninstallKit.bind(this)(isRemove);
        } else if (isTemplate) {
            template.bind(this)();
        } else if (isList) {
            listKit.bind(this)();
        } else if (isDevelop) {
            developKit.bind(this)(isDevelop);
        }
        // ignore other command options
        else if (Object.keys(argvs).length <= 4) {
            initProject.bind(this)();
        }
    }
}

module.exports = KitPlugin;
