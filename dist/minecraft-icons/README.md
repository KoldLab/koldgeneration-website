# Minecraft Item Icons

This folder should contain PNG files for each Minecraft item.

## How to get the icons:

### Option 1: Extract from Minecraft JAR (Easiest!)
1. Go to your Minecraft installation directory:
   - Windows: `%APPDATA%\.minecraft\versions`
   - Mac: `~/Library/Application Support/minecraft/versions`
   - Linux: `~/.minecraft/versions`
2. Open the folder for your Minecraft version (e.g., `1.21`)
3. Extract the `.jar` file (it's just a ZIP archive - use 7-Zip, WinRAR, etc.)
4. Navigate to: `assets\minecraft\textures\item`
5. Copy all PNG files to this folder
6. Done! The file names already match what the app expects

### Option 2: Using IconExporter Mod
1. Download **IconExporter** from [CurseForge](https://www.curseforge.com/minecraft/mc-mods/iconexporter) or [Modrinth](https://modrinth.com/mod/icon-exporter)
2. Install it in Minecraft (requires Cyclops Core)
3. Run: `/iconexporter export 32` in-game
4. Copy from `icon-exports-x32` folder to this folder
5. Run the rename script:
   - **Windows PowerShell**: `.\rename-files.ps1`
   - **Node.js**: `node rename-files.js`

The rename scripts will automatically convert `minecraft__item_name__0.png` to `item_name.png`

### File Naming
Icons should be named exactly as they appear in the Minecraft item ID (without the `minecraft:` prefix):
- `chest.png`
- `diamond_sword.png`
- `smooth_stone.png`
- etc.

## Temporary Solution
If you don't have icons yet, the app will display items without icons until you add them.

