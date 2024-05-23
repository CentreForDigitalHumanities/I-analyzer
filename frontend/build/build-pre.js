const path = require('path');
const colors = require('colors/safe');
const fs = require('fs');


console.log(colors.cyan("\nRunning pre-build tasks"));

var appVersion;

try {
    appVersion = require("../../package.json").version;
} catch {
    console.warn("Could not import package.json.");
    appVersion = undefined;
}

const versionFilePath = path.join(
    __dirname + "/../src/environments/version.ts"
);
const src = `export const version = '${appVersion}';
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

const { execSync } = require("child_process");
const path = require("path");

// build and install local ngx-scroll-position-restoration
const sprDir = path.join(__dirname + "/../scroll-position-restoration-local/");

const installCmd = `yarn --cwd ${sprDir} install`;
const buildCmd = `yarn --cwd ${sprDir} build`;

console.log("\nInstalling ngx-scroll-position-restoration dependencies");
execSync(installCmd, { stdio: "inherit" });
console.log("\nBuilding ngx-scroll-position-restoration");
execSync(buildCmd, { stdio: "inherit" });
