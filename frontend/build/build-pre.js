const path = require('path');
const colors = require('colors/safe');
const fs = require('fs');
const appVersion = require('../../package.json').version;
const { exec } = require('child_process');

console.log(colors.cyan('\nRunning pre-build tasks'));

async function getHash() {
    return new Promise((resolve, reject) => {
        exec('git rev-parse HEAD', (error, stdout, stderr) => {
            if (error) {
                reject(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                reject(`stderr: ${stderr}`);
                return;
            }

            resolve(stdout.trim());
        });
    });
}

async function getRemoteUrl() {
    return new Promise((resolve, reject) => {
        exec('git config --get remote.origin.url', (error, stdout, stderr) => {
            if (error) {
                reject(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                reject(`stderr: ${stderr}`);
                return;
            }

            // format is either:
            // git@github.com:https://github.com/UUDigitalHumanitieslab/I-analyzer.git
            // or https://github.com/UUDigitalHumanitieslab/I-analyzer.git
            // or https://USERNAME:SECRET@github.com/UUDigitalHumanitieslab/I-analyzer.git/

            // remove https://
            let sourceUrl = stdout.replace(/^https?:\/\//, '').trim();
            // remove git@ or USERNAME:SECRET@
            sourceUrl = sourceUrl.replace(/^[^@]+@/, '').trim();
            // replace : with /
            sourceUrl = sourceUrl.replace(':', '/');
            // remove .git/
            sourceUrl = sourceUrl.replace(/\.git\/?\n?$/, '');
            resolve('https://' + sourceUrl);
        });
    });
}

Promise.all([getHash(), getRemoteUrl()]).then(([hash, remoteUrl]) => {
    writeVersion(hash, remoteUrl);
}).catch((error) => {
    console.log(`${colors.red('Could not update version: ')} ${error}`);
});

function writeVersion(hash, remoteUrl) {
    const versionFilePath = path.join(__dirname + '/../src/environments/version.ts');
    const src = `export const version = '${appVersion}';
export const buildTime = '${new Date()}';
export const sourceUrl = '${remoteUrl}/tree/${hash}';
`;

    // ensure version module pulls value from package.json
    fs.writeFile(versionFilePath, src, { flat: 'w' }, function (err) {
        if (err) {
            return console.log(colors.red(err));
        }

        console.log(colors.green(`Updating application version ${colors.yellow(appVersion)}`));
        console.log(`${colors.green('Writing version module to ')}${colors.yellow(versionFilePath)}\n`);
        console.log(src);
    });
}
