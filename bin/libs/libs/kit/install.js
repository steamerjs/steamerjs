/**
 * kit installer
 */

const path = require('path');
const {
    getNameSpace,
    getKitName,
    getPkgJson,
    addVersion,
    getVersion,
    help,
    spinSuccess,
    spinFail,
} = require('./utils');

/**
 * start cloning starterkit
 * @param {String} repo repo url
 * @param {String} tag tag name
 * @param {String} alias alias name
 */
exports.clone = function(repo, tag = null, alias) {
    let nameSpace = getNameSpace.bind(this)(repo);
    let kitName = alias || getKitName.bind(this)(nameSpace);
    let localPath = path.join(this.kitHomePath, kitName);

    let opt = {
        repo,
        kitName,
        localPath,
        tag
    };

    // starterkit exist and not add another version
    if (this.kitOptions.list.hasOwnProperty(kitName) && !tag) {
        this.error(`${kitName} exists. Please change the name useing --alias.`);
        return Promise.resolve();
    } else {
        if (!this.kitOptions.list.hasOwnProperty(kitName)) {
            // if the repo is not in config, but repo localPath exist, delete it and reinstall
            if (this.fs.existsSync(localPath)) {
                this.fs.removeSync(localPath);
            }

            // init starterkit config
            this.kitOptions.list[kitName] = {
                url: repo,
                path: localPath,
                versions: []
            };
        }
        if (opt.tag) {
            return this.cloneTag(opt);
        } else {
            return this.cloneLatest(opt);
        }
    }
};

/**
 * clone latest starterkit
 * @param {Object``} options
 */
exports.cloneLatest = function(options) {
    let { repo, kitName, localPath } = options;
    return new Promise((resolve, reject) => {
        this.git()
            .silent(true)
            .exec(() => {
                this.spinner.start();
                this.spinner.color = 'cyan';
                this.spinner.text = `installing ${kitName}`;
            })
            .clone(repo, localPath, '--depth=1', err => {
                spinFail.bind(this)(kitName, err, reject);
            })
            .exec(() => {
                let pkgJson = {};
                try {
                    pkgJson = getPkgJson.bind(this)(localPath);
                    this.kitOptions.list[kitName] = this._.merge(
                        {},
                        this.kitOptions.list[kitName],
                        {
                            description: pkgJson.description,
                            currentVersion: pkgJson.version,
                            latestVersion: pkgJson.version,
                            versions: [pkgJson.version]
                        }
                    );
                } catch (e) {
                    reject(e);
                }
                exports.checkoutLatest.bind(this)({
                    localPath,
                    pkgJson,
                    kitName,
                    resolve,
                    reject
                });
            });
    });
};

/**
 * checkout latest branch after clone the latest from repo
 * @param {Object} options
 */
exports.checkoutLatest = function({ localPath, pkgJson, kitName, resolve, reject }) {
    this.git(localPath)
        .silent(true)
        .branch([pkgJson.version], err => {
            spinFail.bind(this)(kitName, err, reject);
        })
        .checkout(pkgJson.version, err => {
            err
                ? spinFail.bind(this)(kitName, err, reject)
                : spinSuccess.bind(this)(`${kitName}@${pkgJson.version} installed`);
        })
        .branch(['-D', 'master'], err => {
            err ? reject(err) : resolve();
        });
};

// fetch specific tag https://stackoverflow.com/questions/45338495/fetch-a-single-tag-from-remote-repository
// git branch new_branch tag_name
exports.cloneTag = function({ repo, kitName, localPath, tag }) {
    this.fs.ensureDirSync(localPath);

    return new Promise((resolve, reject) => {
        this.git(localPath)
            .silent(true)
            .exec(() => {
                this.spinner.start();
                this.spinner.color = 'cyan';
                this.spinner.text = `installing ${kitName}`;
            })
            .exec(() => {
                let isGitFolderExists = this.fs.existsSync(
                    path.join(localPath, '.git')
                );

                if (!isGitFolderExists) {
                    this.spawn.sync('git', ['init'], { cwd: localPath });
                    this.spawn.sync('git', ['remote', 'add', 'origin', repo], {
                        cwd: localPath
                    });
                }
            })
            .fetch(
                ['origin', `refs/tags/${tag}:refs/tags/${tag}`, '--depth=1'],
                err => {
                    if (err) {
                        spinFail.bind(this)(kitName, err, reject);
                        return;
                    }
                    exports.checkoutTag.bind(this)({
                        tag,
                        localPath,
                        kitName,
                        resolve,
                        reject
                    });
                }
            );
    });
};

/**
 * checkout tag branch after fetch that tag repo
 * @param {Object} options
 */
exports.checkoutTag = function({ tag, localPath, kitName, resolve, reject }) {
    let version = getVersion.bind(this)(tag);
    this.git(localPath)
        .silent(true)
        .branch([`${version}`, `${tag}`], err => {
            spinFail.bind(this)(kitName, err, reject);
        })
        .checkout(`${version}`, () => {
            spinSuccess.bind(this)(`${kitName}@${version} installed`);
            let pkgJson = getPkgJson.bind(this)(localPath);
            let versions = addVersion.bind(this)(
                this.kitOptions.list[kitName].versions,
                pkgJson.version
            );

            this.kitOptions.list[kitName] = this._.merge(
                {},
                this.kitOptions.list[kitName],
                {
                    description: pkgJson.description,
                    currentVersion: pkgJson.version,
                    latestVersion: versions[0],
                    versions: versions
                }
            );
            resolve();
        });
};

/**
 * add starterkit to $Home/.steamer/starterkits
 * @param {String} repo repo url
 * @param {String} tag tag name
 * @param {String} alias alias name
 */
exports.installKit = function(repo, tag, alias) {
    if (repo === true) {
        return help.bind(this)();
    }
    this.clone(repo, tag, alias)
        .then(() => {
            this.writeKitOptions(this.kitOptions);
        })
        .catch(e => {
            this.error(e.stack);
        });
};
