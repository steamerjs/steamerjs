module.exports = {
    "env": {},
    "extends": [
        "eslint-config-alloy"
    ],
    "plugins": [],
    "rules": {
        "one-var": "off",
        "strict": "off",
        complexity: ["error", 20]
    },
    "globals": {
        "describe": true,
        "it": true,
        "before": true,
        "after": true,
        "beforeEach": true,
        "afterEach": true
    }
};