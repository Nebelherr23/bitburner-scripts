import {context} from 'esbuild';
import {BitburnerPlugin} from 'esbuild-bitburner-plugin';
import chokidar from 'chokidar';
import fs from 'fs/promises';

/** @type import('esbuild-bitburner-plugin').PluginExtension*/
const DataExtension = {
    setup() {
    }, //Run once on plugin startup

    beforeConnect() {
    }, //Run once before the game connects
    afterConnect(remoteAPI) {
        let watcher = chokidar.watch(['./data', './config']);
        watcher.on('add', path => pushFile(remoteAPI, path));
        watcher.on('change', path => pushFile(remoteAPI, path)); //Run every time after the game (re)connects
    },
    beforeBuild() {
    }, //Run before every build process
    afterBuild(remoteAPI) {
    }, //Run after build, before results are uploaded into the game
};

async function pushFile(remoteAPI, path) {
    await fs.stat(path, (err, stat) => {
        if (err) {
            console.log(err);
            return;
        }
    });
    console.log(`Pushing file ${path}`);

    let content = await fs.readFile(path, 'utf8', (err, data) => {
            if (err) {
                console.log(err);
                return;
            }
            console.log(data);
        }
    );
    console.log(content);
    console.log(path)
    return remoteAPI.pushFile({server: 'home', filename: path, content: content}).catch(err => {
        console.log(err);
        console.log(`${path} - ${content}`);
    });
}

/**
 * @type {import('esbuild').Plugin}
 */
const CSSSpoofPlugin = {
    name: 'CSSSpoofPlugin',
    setup(pluginBuild) {
        pluginBuild.onLoad({filter: /.*?\.css$/}, async opts => {
            const file = await fs.readFile(opts.path, {encoding: 'utf8'});
            return {
                loader: 'jsx',
                contents: `\
        import React from 'react';

        export default function () {
          return <style>{\`${file}\`}</style>;
        }\
        `
            };
        });
    }
};

const createContext = async () => await context({
    entryPoints: [
        'servers/**/*.js',
        'servers/**/*.jsx',
        'servers/**/*.ts',
        'servers/**/*.tsx',
    ],
    outbase: "./src",
    outdir: "./build",
    plugins: [
        CSSSpoofPlugin,
        BitburnerPlugin({
            port: 12525,
            types: 'NetscriptDefinitions.d.ts',
            mirror: {},
            distribute: {}
        })
    ],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    logLevel: 'debug'
});

const ctx = await createContext();
ctx.watch();
