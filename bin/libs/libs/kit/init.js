const Rx = require('rxjs');
const inquirer = require('inquirer');
const path = require('path');
const _ = require('lodash');

const {
    readKitConfig,
    checkEmpty,
    createPluginConfig
} = require('./utils');

/**
 * copy starterkit files to project folder
 */
function copyFiles({
    files,
    kitQuestions,
    folderPath,
    kitPath,
    kit,
    ver,
    isSteamerKit,
    projectName,
    kitConfig
}) {
    // 脚手架相关配置问题
    let prompt = inquirer.createPromptModule();
    prompt(kitQuestions)
        .then(answersParam => {
            let answers = Object.assign({}, answersParam, {
                projectName
            });
            // 复制文件前的自定义行为
            if (
                kitConfig.beforeInstallCopy &&
                _.isFunction(kitConfig.beforeInstallCopy)
            ) {
                kitConfig.beforeInstallCopy.bind(this)(
                    answers,
                    folderPath,
                    files
                );
            }

            let newFiles = files.filter(item => {
                return !this.ignoreFiles.includes(item);
            });

            newFiles.forEach(item => {
                let srcFiles = path.join(kitPath, item);
                let destFile = path.join(folderPath, item);

                if (this.fs.existsSync(srcFiles)) {
                    this.fs.copySync(srcFiles, destFile);
                }
            });

            if (answers.webserver) {
                this.fs.ensureFileSync(
                    path.join(folderPath, 'config/steamer.config.js')
                );
                this.fs.writeFileSync(
                    path.join(folderPath, 'config/steamer.config.js'),
                    'module.exports = ' + JSON.stringify(answers, null, 4)
                );
            }

            // 复制文件后的自定义行为
            if (
                kitConfig.afterInstallCopy &&
                _.isFunction(kitConfig.afterInstallCopy)
            ) {
                kitConfig.afterInstallCopy.bind(this)(answers, folderPath);
            }

            if (isSteamerKit) {
                createPluginConfig.bind(this)(
                    {
                        kit: kit,
                        version: ver
                    },
                    folderPath
                );
            }

            // 替换项目名称
            if (projectName) {
                const oldPkgJson = this.getPkgJson.bind(this)(folderPath);
                let pkgJson = _.merge({}, oldPkgJson, {
                    name: projectName
                });
                this.fs.writeFileSync(
                    path.join(folderPath, 'package.json'),
                    JSON.stringify(pkgJson, null, 4),
                    'utf-8'
                );
            }
            // beforeInstall 自定义行为
            if (
                kitConfig.beforeInstallDep &&
                _.isFunction(kitConfig.beforeInstallDep)
            ) {
                kitConfig.beforeInstallDep.bind(this)(answers, folderPath);
            }

            // 安装项目node_modules包
            this.spawn.sync(this.config.NPM, ['install'], {
                stdio: 'inherit',
                cwd: folderPath
            });

            // afterInstall 自定义行为
            if (
                kitConfig.afterInstallDep &&
                _.isFunction(kitConfig.afterInstallDep)
            ) {
                kitConfig.afterInstallDep.bind(this)(answers, folderPath);
            }

            this.success(`The project is initiated success in ${folderPath}`);
        })
        .catch(e => {
            this.error(e.stack);
        });
}

/**
 * install or update kit to project
 */
exports.installProject = function(options) {
    let { kit, kitOriginalName, ver, folder, projectName } = options;

    let kitPath = path.join(this.kitHomePath, kit);
    let kitConfigPath = path.join(kitPath, `.steamer/${kitOriginalName}.js`);
    let kitConfig = {};
    let isSteamerKit = false;
    let folderPath = path.join(process.cwd(), folder);
    let kitQuestions = [];
    let files = [];

    this.git(kitPath).checkout(ver, () => {
        // 查看是否能获取steamer规范的脚手架配置
        if (this.fs.existsSync(kitConfigPath)) {
            kitConfig = readKitConfig.bind(this)(kitConfigPath);
            files = new Set(kitConfig.installFiles || kitConfig.files);
            files.add('package.json');
            kitQuestions = kitConfig.options || [];
            isSteamerKit = true;
        } else {
            files = new Set(this.fs.readdirSync(kitPath));
        }

        // 做去重
        files = Array.from(files);

        let isEmpty = checkEmpty.bind(this)(folderPath, this.ignoreFiles);
        let overwriteQuestion = [];

        if (!isEmpty) {
            overwriteQuestion.push({
                type: 'text',
                name: 'overwrite',
                message: 'The foler is not empty, do you wanna overwrite?',
                default: 'n'
            });
        }

        let prompt = inquirer.createPromptModule();
        prompt(overwriteQuestion)
            .then(answers => {
                if (
                    !answers.hasOwnProperty('overwrite') ||
                    (answers.overwrite && answers.overwrite === 'y')
                ) {
                    copyFiles.bind(this)({
                        files,
                        kitQuestions,
                        folderPath,
                        kitPath,
                        kit,
                        ver,
                        isSteamerKit,
                        projectName,
                        kitConfig
                    });
                }
            })
            .catch(e => {
                this.error(e.stack);
            });
    });
};

/**
 * init project
 *
 * @export
 */
module.exports = function() {
    let kits = this.kitOptions.list;
    // let questions = [];
    let choices = [];

    Object.keys(kits).forEach(key => {
        choices.push({
            name: `${key} - ${kits[key].description}`,
            value: key
        });
    });

    let answers = {};
    let prompts = new Rx.Subject();
    inquirer.prompt(prompts).ui.process.subscribe(
        obj => {
            switch (obj.name) {
                case 'kit': {
                    prompts.next({
                        type: 'list',
                        name: 'ver',
                        message: 'Which version do you need: ',
                        choices: kits[obj.answer].versions
                    });
                    answers.kit = obj.answer;
                    answers.kitOriginalName =
                        kits[obj.answer].originalName || obj.answer;
                    break;
                }
                case 'ver': {
                    prompts.next({
                        type: 'text',
                        name: 'folder',
                        default: './',
                        message: 'Which folder is your project in: '
                    });
                    answers.ver = obj.answer;
                    break;
                }
                case 'folder': {
                    answers.folder = obj.answer.trim();
                    prompts.next({
                        type: 'text',
                        name: 'projectName',
                        message: 'type your project name:',
                        default: path.basename(answers.folder)
                    });

                    prompts.complete();
                    break;
                }
                case 'projectName':
                    answers.projectName = obj.answer.trim();
                    break;
            }
        },
        () => {},
        () => {
            exports.installProject.bind(this)(answers);
        }
    );

    prompts.next({
        type: 'list',
        name: 'kit',
        message: 'Which starterkit do you wanna install: ',
        choices: choices,
        pageSize: 100
    });
};
