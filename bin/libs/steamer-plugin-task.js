/**
 * reference:
 * 1. http://llever.com/2017/06/13/%E4%B8%AD%E9%97%B4%E4%BB%B6js%E5%AE%9E%E7%8E%B0/
 * 2. https://zhuanlan.zhihu.com/p/26063036
 */

const path = require('path'),
    spawn = require('cross-spawn'),
    git = require('simple-git'),
    inquirer = require('inquirer'),
    SteamerPlugin = require('steamer-plugin');

let bindSerialTask = (runner, cmdArr) => (ctx, next) => {
    spawn.sync(runner, cmdArr, { stdio: 'inherit' });
    next && next();
};

class TaskPlugin extends SteamerPlugin {
    constructor(args) {
        super(args);
        this.argv = args;
        this.pluginName = 'steamer-plugin-task';
        this.description = 'run tasks parallelly or serially';
        this.config = this.readSteamerDefaultConfig();
        this.taskPrefix = this.config.TASK_PREFIX || 'steamer-task-';
        this.npm = this.config.NPM;
        this.git = git;
        this.spawn = spawn;
        this.inquirer = inquirer;
        this.middleware = [];
    }

    init(argv) {
        let argvs = argv || this.argv; // command argv
        let isAdd = argvs.add || argvs.a;

        // 如果配置不存在，则创建
        this.checkPluginConfig();
        
        argvs._.shift();
        let tasks = argvs._;

        if (tasks.length && !isAdd) {
            let task = tasks[0],
                config = this.readConfig();

            if (!config.hasOwnProperty(task)) {
                return this.error(`The task '${task}' is not found.`);
            }

            this.processTask(config, task);
        }
        else if (isAdd && isAdd !== true) {
            this.add(isAdd);
        }
    }

    /**
     * add task to config
     * @param {String} task 
     */
    add(task) {
        // console.log(this.taskPrefix);
        this.fs.ensureDir(path.join(process.cwd(), '.steamer'));
        let taskFullName = `${this.taskPrefix}${task}`;
        let taskPath = path.join(this.getGlobalModules(), `${taskFullName}`);
        let taskFilePath = path.join(taskPath, '.steamer');
        
        if (!this.fs.existsSync(taskPath)) {
            this.info(`Installing ${taskFullName}`);
            this.spawn.sync(this.npm, ['install', '--global', taskFullName], { stdio: 'inherit' });
        }
        this.info(`${taskFullName} installed`);

        if (!this.fs.existsSync(taskPath)) {
            return this.error(`${taskFullName} not found.`);
        }
        
        let pkgJsonPath = path.join(taskPath, 'package.json');
        let pkgJson = {};
        
        if (this.fs.existsSync(pkgJsonPath)) {
            pkgJson = require(pkgJsonPath);
        }
        
        let dependencies = pkgJson.dependencies || {};

        if (!this.fs.existsSync(taskFilePath)) {
            return this.error(`Task files not found.`);
        }

        let files = this.fs.readdirSync(taskFilePath);
        files.forEach((item) => {
            this.fs.copySync(path.join(taskFilePath, item), path.join(process.cwd(), '.steamer', item));
        });

        let installDependencies = [];
        Object.keys(dependencies).forEach((key) => {
            installDependencies.push(`${key}@${dependencies[key]}`);
        });

        if (installDependencies.length) {
            this.info(`Installing ${installDependencies.join(' ')}`);
            let action = ['install', '--save-dev'];
            action = action.concat(installDependencies);
            this.spawn.sync(this.npm, action, { stdio: 'inherit' });
        }

        this.success('Task installed success');
    }

    /**
     * get version
     * @param {String} ver 
     */
    // getVersion(ver) {
    //     ver = ver.match(/(\d+).(\d+).(\d+)/ig, '');
    //     if (ver.length) {
    //         return ver[0];
    //     }

    //     return '';
    // }

    /**
     * check whether plugin config file is avaiable or not
     */
    checkPluginConfig() {
        let configPath = path.join(process.cwd(), './.steamer/steamer-plugin-task.js');
        if (!this.fs.existsSync(configPath)) {
            this.createConfig({}, {
                overwrite: true
            });
        }
    }

    /**
     * check whether task path is available or not
     * @param {String} taskPath 
     */
    checkTaskFile(taskPath) {
        if (!this.fs.existsSync(taskPath)) {
            throw new Error(`${taskPath} is not found.`);
        }
    }

    /**
     * 
     * @param {Object} config 
     * @param {Array} task 
     */
    processTask(config, task) {
        let taskFolderPath = path.join(process.cwd(), './.steamer/task/');
        
        if (this._.isArray(config[task])) {
            this.runSerialTask(config[task], taskFolderPath);
        }
        // Serially
        else if (this._.isObject(config[task])) {
            this.runParallelTask(config[task], taskFolderPath);
        }
    }

    /**
     * get serial tasks
     * @param {String} cmd command
     * @param {String} taskFolderPath task files folder
     */
    getSerialTask(cmd, taskFolderPath) {
        if (!cmd.includes(' ')) {
            let taskPath = path.join(taskFolderPath, `${cmd}`);
            this.checkTaskFile(taskPath);
            cmd = require(taskPath);
        }
        else {
            let cmdArr = cmd.split(' '),
                runner = cmdArr.splice(0, 1);
            cmd = bindSerialTask(runner[0], cmdArr);
        }

        return cmd;
    }

    // 用作头个任务的next占位
    beforeSerialTask(ctx) {}

    use(task, taskName) {
        this.middleware.push({
            task,
            taskName
        });
    }

    /**
     * run tasks
     * @param {Object} ctx context
     */
    run(ctx) {
        this.middleware.reverse().reduce((next, item) => {
            return () => {
                this.info(`start running task: ${item.taskName}`);
                item.task(ctx, () => {
                    next && next();
                });
            };
        }, this.beforeSerialTask(ctx))();
    }

    // []
    /**
     * run serial tasks
     * @param {Array} tasks tasks array
     * @param {String} taskFolderPath task files folder
     */
    runSerialTask(tasks, taskFolderPath) {

        tasks.forEach((task, key) => {
            let cmd = task.trim();
            cmd = this.getSerialTask(cmd, taskFolderPath);
            this.use(cmd, task.trim());
        });

        this.run(this);
    }

    // {}
    /**
     * run parallel task
     * @param {Array} tasks tasks array
     * @param {String} taskFolderPath task files folder
     */
    runParallelTask(tasks, taskFolderPath) {
        Object.keys(tasks).forEach((key) => {
            let cmd = tasks[key].trim();

            if (!cmd.includes(' ')) {
                let taskPath = path.join(taskFolderPath, `${tasks[key]}`);
                this.checkTaskFile(taskPath);
                cmd = require(taskPath);
            }

            if (this._.isFunction(cmd)) {
                this.info(`start running task: ${tasks[key].trim()}`);
                cmd(this);
                this.info(`finishing task: ${tasks[key].trim()}`);
            }
            else if (this._.isString(cmd)) {
                let cmdArr = cmd.split(' '),
                runner = cmdArr.splice(0, 1);

                new Promise((resolve, reject) => {
                    this.info(`start running task: ${tasks[key].trim()}`);
                    let child = this.spawn(runner[0], cmdArr, { stdio: 'inherit' });
                    
                    child.on('exit', (code, signal) => {
                        if (!code) {
                            this.info(`finishing task: ${tasks[key].trim()}`);
                            resolve(code);
                        }
                        else {
                            reject(code);
                        }
                    });

                    child.on('error', (err) => {
                        if (err) {
                            this.error(`task error: ${err}`);
                            reject(err);
                        }
                    });
                }).catch((e) => {
                    this.error(e);
                });  
            }          
        });
    }

    /**
     * help
     */
    help() {
        this.printUsage(this.description, 'task');
        this.printOption([
            {
                option: 'add',
                alias: 'a',
                description: 'install task packages'
            }
        ]);
    }
}

module.exports = TaskPlugin;
