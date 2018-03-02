let teamConfig = {
    config: {
        NPM: 'npm',
        TEAM: 'alloyteam'
    },
    kits: [
        {
            'name': 'steamer-react',
            'git': 'https://github.com/steamerjs/steamer-react.git'
        },
        {
            'name': 'steamer-vue',
            'git': 'https://github.com/steamerjs/steamer-vue.git'
        },
        {
            'name': 'steamer-simple',
            'git': 'https://github.com/steamerjs/steamer-simple.git'
        },
        {
            'name': 'steamer-react-component',
            'git': 'https://github.com/steamerjs/steamer-react-component.git'
        },
        {
            'name': 'steamer-vue-component',
            'git': 'https://github.com/steamerjs/steamer-vue-component.git'
        },
        {
            'name': 'steamer-simple-component',
            'git': 'https://github.com/steamerjs/steamer-simple-component.git'
        },
        {
            'name': 'steamer-logic-component',
            'git': 'https://github.com/steamerjs/steamer-logic-component.git'
        }
    ],
    plugins: [
        'steamer-plugin-mock'
    ],
    beforeInstall: function() {

    },
    afterInstall: function() {
        
    }
};

module.exports = teamConfig;