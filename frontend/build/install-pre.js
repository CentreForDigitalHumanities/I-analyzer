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
