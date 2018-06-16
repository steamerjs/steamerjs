/**
 * uninstaller
 */

/**
 * remove starterkit
 * @param {String} kit
 */
module.exports = function(kit) {
    let kits = this.kitOptions.list;

    if (!kits.hasOwnProperty(kit)) {
        return this.error(`The starterkit ${kit} does not exist.`);
    }

    this.fs.removeSync(this.kitOptions.list[kit].path);
    delete this.kitOptions.list[kit];
    this.writeKitOptions(this.kitOptions);
    this.success(`The kit ${kit} is removed.`);
};
