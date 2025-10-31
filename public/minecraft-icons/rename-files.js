const fs = require('fs');
const path = require('path');

// Get the directory where this script is located
const dir = __dirname;

console.log('Renaming Minecraft item icons...\n');

// Read all files in the directory
const files = fs.readdirSync(dir);

let renamedCount = 0;
let skippedCount = 0;

files.forEach((file) => {
  // Skip non-PNG files and this script itself
  if (!file.endsWith('.png') || file === path.basename(__filename)) {
    return;
  }

  const oldPath = path.join(dir, file);
  let newName = file;

  // Pattern 1: minecraft__item_name__0.png -> item_name.png
  if (file.startsWith('minecraft__')) {
    newName = file
      .replace(/^minecraft__/, '') // Remove minecraft__
      .replace(/__\d+\.png$/, '.png'); // Remove __0 or __number before .png

    const newPath = path.join(dir, newName);

    // Check if target file already exists
    if (fs.existsSync(newPath)) {
      console.log(`⚠️  Skipping ${file} (${newName} already exists)`);
      skippedCount++;
      return;
    }

    fs.renameSync(oldPath, newPath);
    console.log(`✅ Renamed: ${file} -> ${newName}`);
    renamedCount++;
  } else {
    // File already has correct format
    console.log(`✓  Already correct: ${file}`);
  }
});

console.log(
  `\n✨ Done! Renamed ${renamedCount} files, skipped ${skippedCount} files.`
);
