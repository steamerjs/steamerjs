const fs = require('fs-extra');
const path = require('path');
const url = require('url');
const compareVer = require('compare-versions');

/**
 * delete require cache from filePath
 * @param {String} filePath file path
 */
let delRequireCache = function(filePath) {
    let realpath = fs.realpathSync(filePath);
    if (require.cache[realpath]) {
        delete require.cache[realpath];
    }
};
exports.delRequireCache = delRequireCache;

/**
 * get name space from repo url for starterkit
 * @param {String} repoParam repo url
 */
let getNameSpace = function(repoParam) {
    let localPath = '';
    if (repoParam.indexOf('http') >= 0) {
        let repo = url.parse(repoParam);
        if (!repo.host) {
            return this.error('Please input correct repo url');
        }
        localPath = `${repo.host}${repo.pathname.replace('.git', '')}`;
    }
    else if (repoParam.indexOf('git@') === 0) {
        localPath = repoParam
            .replace('git@', '')
            .replace('.git', '')
            .replace(':', '/');
    }
    else if (typeof this.kitOptions.list[repoParam] !== 'undefined') {
        localPath = getNameSpace(this.kitOptions.list[repoParam].url);
    }

    return localPath;
};
exports.getNameSpace = getNameSpace;

/**
 * get starterkit name from name space
 * @param {String} ns name space of starterkit
 */
let getKitName = function(ns) {
    let kit = null;
    if (ns.split('/').length === 3) {
        kit = ns.split('/')[2];
    }
    return kit;
};
exports.getKitName = getKitName;

let getPkgJson = function(localPath) {
    let pkgJsonPath = path.join(localPath, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
        delRequireCache.bind(this)(pkgJsonPath);
        return require(pkgJsonPath);
    }
    else {
        throw new Error('package.json does not exist');
    }
};
exports.getPkgJson = getPkgJson;

/**
 * help
 */
let help = function() {
    this.printUsage(this.description, 'kit');
    this.printOption([
        {
            option: 'list',
            alias: 'l',
            description: 'list all available starter kits'
        },
        {
            option: 'add',
            alias: 'i',
            value:
                '[<git repo>|<git repo> --tag <tag name>|--alias <starterkit name>]',
            description: 'install starter kit'
        },
        {
            option: 'develop',
            alias: 'd',
            description: 'develop starterkit and make it on starterkit list'
        },
        {
            option: 'update',
            alias: 'u',
            value: '[--global]',
            description:
                'update starter kit for project or update global starterkit'
        },
        {
            option: 'remove',
            alias: 'r',
            value: '<starterkit name>',
            description: 'remove starterkit'
        }
    ]);
};
exports.help = help;

let addVersion = function(oldVers, newVer) {
    for (let i = 0, len = oldVers.length; i < len; i++) {
        if (compareVer(newVer, oldVers[i]) > 0) {
            oldVers.unshift(newVer);
            return oldVers;
        }
    }

    oldVers.push(newVer);
    return oldVers;
};
exports.addVersion = addVersion;

let getVersion = function(tag) {
    return tag.replace(/[a-zA-Z]+/gi, '');
};
exports.getVersion = getVersion;

/**
 * check folder empty or not
 * @param {*} folderPath
 */
let checkEmpty = function(folderPath, ignoreFiles = []) {
    // 查看目标目录是否为空
    if (path.resolve(folderPath) === process.cwd()) {
        let folderInfo = fs.readdirSync(folderPath);
        folderInfo = folderInfo.filter(item => {
            return !ignoreFiles.includes(item);
        });
        return !folderInfo.length;
    }
    else {
        return !fs.existsSync(folderPath);
    }
};
exports.checkEmpty = checkEmpty;
