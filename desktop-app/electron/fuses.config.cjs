// Electron Fuses — compiled into every built binary by electron-builder via the
// `afterPack` hook. Fuses harden the binary against common tamper vectors:
//
//   runAsNode=false              — disables ELECTRON_RUN_AS_NODE escape.
//   enableCookieEncryption=true  — encrypts Chromium cookie store.
//   asarIntegrity=true           — refuses to launch if the asar is modified.
//   loadFromAsar=true            — refuses to load unpacked JS when packed.
//   enableNodeCliInspect=false   — disables --inspect / --inspect-brk.
//
// Docs: https://www.electronjs.org/docs/latest/tutorial/fuses

const { flipFuses, FuseVersion, FuseV1Options } = require('@electron/fuses')
const path = require('path')

exports.default = async function applyFuses(context) {
  const electronBinary =
    context.electronPlatformName === 'darwin'
      ? path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`, 'Contents', 'MacOS', context.packager.appInfo.productFilename)
      : path.join(context.appOutDir, `${context.packager.appInfo.productFilename}${context.electronPlatformName === 'win32' ? '.exe' : ''}`)

  await flipFuses(electronBinary, {
    version: FuseVersion.V1,
    [FuseV1Options.RunAsNode]: false,
    [FuseV1Options.EnableCookieEncryption]: true,
    [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
    [FuseV1Options.EnableNodeCliInspectArguments]: false,
    [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
    [FuseV1Options.OnlyLoadAppFromAsar]: true,
    [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot]: false,
    [FuseV1Options.GrantFileProtocolExtraPrivileges]: true,
  })
}
