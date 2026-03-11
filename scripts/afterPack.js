const { execSync } = require("child_process");
const path = require("path");

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== "win32") return;

  const exePath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.exe`);
  const icoPath = path.join(__dirname, "..", "build", "icon.ico");
  const rcedit = path.join(__dirname, "..", "node_modules", "electron-winstaller", "vendor", "rcedit.exe");

  console.log("  • stamping icon on executable");
  execSync(`"${rcedit}" "${exePath}" --set-icon "${icoPath}"`);
};
