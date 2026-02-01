#!/usr/bin/env node

/**
 * Setup helper for Electron desktop app
 * Validates environment and provides guidance
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n🖥️  Quiz Desktop - Electron Setup Verification\n');
console.log('═'.repeat(50));

// Check Node.js version
const nodeVersion = process.versions.node;
const majorVersion = parseInt(nodeVersion.split('.')[0], 10);

console.log(`\n✓ Node.js version: ${nodeVersion}`);
if (majorVersion < 14) {
  console.warn('  ⚠️  Recommend Node.js 14 or higher');
}

// Check key files
const keyFiles = [
  'public/main.js',
  'public/preload.js',
  'package.json',
  'README.md',
  'QUICKSTART.md',
];

console.log('\n✓ Files created:');
keyFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  const status = exists ? '✓' : '✗';
  console.log(`  ${status} ${file}`);
});

// Check if node_modules exists
const nodeModulesExists = fs.existsSync(path.join(__dirname, 'node_modules'));
console.log(`\n${nodeModulesExists ? '✓' : '⚠️ '} node_modules: ${nodeModulesExists ? 'Installed' : 'Not found - run "npm install"'}`);

// Show available scripts
console.log('\n📝 Available npm scripts:');
console.log('  npm run electron:dev       - Start development');
console.log('  npm run electron:build:win - Build Windows installer');
console.log('  npm run electron:build     - Build for current platform');
console.log('  npm run electron:build:all - Build for all platforms');

// Show next steps
console.log('\n🚀 Next steps:');
if (!nodeModulesExists) {
  console.log('  1. npm install');
  console.log('  2. npm run electron:dev');
} else {
  console.log('  1. npm run electron:dev');
}
console.log('  2. Test the application');
console.log('  3. npm run electron:build:win (when ready to build)');

// Check frontend exists
const frontendPath = path.join(__dirname, '../../frontend');
const frontendExists = fs.existsSync(frontendPath);
console.log(`\n${frontendExists ? '✓' : '⚠️ '} Frontend app: ${frontendExists ? 'Found' : 'Not found at apps/frontend'}`);

console.log('\n📚 For more information, see:');
console.log('  - README.md (detailed reference)');
console.log('  - QUICKSTART.md (quick start guide)');

console.log('\n' + '═'.repeat(50) + '\n');
