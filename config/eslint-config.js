module.exports = {
	"env": {
        "browser": true,
        "node": true,
        "commonjs": true,
        "es6": true
    },
    "extends": "eslint:recommended",
    rules: {
    	"indent": [2, 'tab', {SwitchCase: 1, VariableDeclarator: 1}],
    	"no-console": 0,
    	"one-var-declaration-per-line": [2, "always"],
    	"no-mixed-spaces-and-tabs": 0,
    	"semi": 2,

    }
};