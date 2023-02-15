const { resolve } = require('path');

module.exports = {
    core: { builder: 'webpack5' },
    stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
    addons: ['@storybook/addon-essentials'],
    webpackFinal: async (config, { configType }) => {
        // apply any global webpack configs that might have been specified in .storybook/main.js

        // add your own webpack tweaks if needed
        config.module.rules.push({
            test: /\.(glsl|vs|fs|vert|frag)$/,
            exclude: /node_modules/,
            use: ['raw-loader', 'glslify-loader'],
            include: resolve(__dirname, '../'),
        });

        return config;
    },
    staticDirs: ['./public'],
};
