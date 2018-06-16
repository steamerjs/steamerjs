const fs = require('fs-extra');
const path = require('path');
const request = require('request');
const mapLimit = require('async/mapLimit');

let files = [
    {
        src: 'steamerjs/steamer-plugin-kit/master/index.js',
        dest: './bin/libs/steamer-plugin-kit.js'
    },
    {
        src: 'steamerjs/steamer-plugin-kit/master/libs/kit/develop.js',
        dest: './bin/libs/libs/kit/develop.js'
    },
    {
        src: 'steamerjs/steamer-plugin-kit/master/libs/kit/init.js',
        dest: './bin/libs/libs/kit/init.js'
    },
    {
        src: 'steamerjs/steamer-plugin-kit/master/libs/kit/install.js',
        dest: './bin/libs/libs/kit/install.js'
    },
    {
        src: 'steamerjs/steamer-plugin-kit/master/libs/kit/list.js',
        dest: './bin/libs/libs/kit/list.js'
    },
    {
        src: 'steamerjs/steamer-plugin-kit/master/libs/kit/template.js',
        dest: './bin/libs/libs/kit/template.js'
    },
    {
        src: 'steamerjs/steamer-plugin-kit/master/libs/kit/uninstall.js',
        dest: './bin/libs/libs/kit/uninstall.js'
    },
    {
        src: 'steamerjs/steamer-plugin-kit/master/libs/kit/update.js',
        dest: './bin/libs/libs/kit/update.js'
    },
    {
        src: 'steamerjs/steamer-plugin-kit/master/libs/kit/utils.js',
        dest: './bin/libs/libs/kit/utils.js'
    }
];

function getFiles() {
    mapLimit(
        files,
        9,
        (file, cb) => {
            let url = ['https://raw.githubusercontent.com', file.src].join('/');
            console.log(url);
            request(url, (err, response, body) => {
                if (err) {
                    console.log(err);
                    return cb(err);
                }

                let filePath = path.resolve(file.dest);
                fs.ensureFileSync(filePath);
                fs.writeFileSync(filePath, body, 'utf-8');
            });
        }
    );
}

getFiles();