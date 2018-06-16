/**
 * startkit list
 */

module.exports = function() {
    this.log('You can use following starterkits: ');
    let kits = this.kitOptions.list;
    Object.keys(kits).forEach(key => {
        let kit = kits[key];
        this.success(this.chalk.bold(`* ${key}`));
        this.log(`    - ver: ${kit.currentVersion}`);
        this.log(`    - des: ${kit.description}`);
        this.log(`    - url: ${kit.url}`);
    });
};
