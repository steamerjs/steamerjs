/**
 * template operator
 */

const path = require('path');
const inquirer = require('inquirer');
const { createPluginConfig, walkAndReplace } = require('./utils');

/**
 * Install template dependency
 * @param {*} templateFolder
 * @param {*} templateName
 * @param {*} npmCmd
 */
function installDependency(templateFolder, templateName, npmCmd = 'npm') {
    let dependencyJson = path.join(templateFolder, 'dependency.js');

    if (!this.fs.existsSync(dependencyJson)) {
        return;
    }

    let dependencies = require(dependencyJson) || {};
    dependencies = dependencies[templateName] || {};

    let cmd = '';

    Object.keys(dependencies).forEach(item => {
        cmd += item + '@' + dependencies[item] + ' ';
    });

    if (cmd) {
        this.spawn.sync(npmCmd, ['install', '--save', cmd], {
            stdio: 'inherit',
            shell: true
        });
    }
}

/**
 * list all templates
 * @param {*} localConfig
 */
function listTemplate(localConfig) {
    let templateFolder = path.resolve(localConfig.template.src);
    let templateInfo = this.fs.readdirSync(templateFolder);

    templateInfo = templateInfo.filter(item => {
        return this.fs.statSync(path.join(templateFolder, item)).isDirectory();
    });

    inquirer
        .prompt([
            {
                type: 'list',
                name: 'template',
                message: 'which template do you like: ',
                choices: templateInfo
            },
            {
                type: 'input',
                name: 'path',
                message: 'type in your page name: '
            }
        ])
        .then(answers => {
            if (!answers.path) {
                return this.error('Please type in your page name.');
            }

            let targetFolder = path.resolve(
                localConfig.template.dist,
                answers.path
            );
            let srcFolder = path.resolve(
                localConfig.template.src,
                answers.template
            );

            if (this.fs.existsSync(targetFolder)) {
                return this.error(
                    'Target folder already exist. Please change another page name.'
                );
            }

            this.fs.copySync(srcFolder, targetFolder);

            walkAndReplace.bind(this)(
                targetFolder,
                ['.js', '.jsx', '.ts', '.tsx', '.html'],
                {
                    Title: answers.path.replace(/^[a-z]/, l => l.toUpperCase()),
                    title: answers.path.replace(/^[A-Z]/, L => L.toLowerCase())
                }
            );

            installDependency.bind(this)(
                path.resolve(localConfig.template.src),
                answers.template,
                localConfig.template.npm
            );
        })
        .catch(e => {
            this.error(e.statck);
        });
}


/**
 * Create page from template
 */
module.exports = function() {
    let localConfig = this.readConfig();
    // let kit = localConfig.kit || null;
    // let folder = path.resolve();

    // this.checkConfigExist(localConfig);

    let pkgJsonPath = path.join(process.cwd(), 'package.json');

    // 如果 localConfig 为空，则创建，兼容直接 git clone 脚手架的情况
    if (this.fs.existsSync(pkgJsonPath) && !Object.keys(localConfig).length) {
        this.pkgJson = require(path.join(process.cwd(), 'package.json')) || {};

        localConfig.kit = this.pkgJson.name;
        localConfig.version = this.pkgJson.version;

        createPluginConfig.bind(this)(localConfig, process.cwd());
    }

    if (
        !localConfig.template ||
        !localConfig.template.src ||
        !localConfig.template.dist
    ) {
        inquirer
            .prompt([
                {
                    type: 'text',
                    name: 'src',
                    message: 'type the template source folder:',
                    default: './tools/template'
                },
                {
                    type: 'input',
                    name: 'dist',
                    message: 'type your template destination folder: ',
                    default: './src/page'
                },
                {
                    type: 'input',
                    name: 'npm',
                    message: 'type your npm command(npm|tnpm|cnpm etc): ',
                    default: 'npm'
                }
            ])
            .then(answers => {
                localConfig.template = {};
                localConfig.template.src = answers.src;
                localConfig.template.dist = answers.dist;
                localConfig.template.npm = answers.npm;

                createPluginConfig.bind(this)(localConfig, path.resolve());

                listTemplate.bind(this)(localConfig);
            })
            .catch(e => {
                this.error(e.statck);
            });
    } else {
        listTemplate.bind(this)(localConfig);
    }
};

