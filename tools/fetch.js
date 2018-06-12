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
        src: 'steamerjs/steamer-plugin-kit/master/utils/kit/index.js',
        dest: './bin/libs/utils/kit/index.js'
    }
];

function getFiles() {
    mapLimit(
        files,
        4,
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