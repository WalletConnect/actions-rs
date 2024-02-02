const os = require('os');

import * as toolCache from '@actions/tool-cache';
import * as core from '@actions/core';
import * as io from '@actions/io';
import * as rustCore from '@actions-rs/core';

import getActionInputs from './args';
import resolveConfig from './config';

async function run() {
    /* Make sure cargo is available before we do anything */
    const cargo = await rustCore.Cargo.get();

    core.debug(`[udeps] getting inputs`)
    const inputs = getActionInputs();
    core.debug(`[udeps] resolving config`)
    const config = await resolveConfig(inputs);

    const outputDir = `${os.tmpdir()}/udeps`;
    core.debug(`[udeps] creating output directory ${outputDir}`);
    await io.mkdirP(outputDir);

    core.info(`[udeps] downloading cargo-udeps from ${config.downloadUrl}`);
    const udepsTarballPath = await toolCache.downloadTool(config.downloadUrl);
    const udepsBinPath = await toolCache.extractTar(udepsTarballPath, undefined, ["xz", "--strip-components=2"]);

    core.addPath(udepsBinPath);

    let args = ["udeps"];
    const additionalArgs = config.additionalOptions;

    args = args.concat(additionalArgs);

    core.info(`[udeps] detecting unused dependencies`);
    await cargo.call(args);
}

async function main() {
    try {
        await run();
    } catch (error) {
        core.setFailed(error.message);
    }
}

main();
