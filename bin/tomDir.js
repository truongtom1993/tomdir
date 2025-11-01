#!/usr/bin/env node
// const { listDirectory } = require('../lib/index');
import { listDirectory } from '../lib/index.js';
import path from 'path';
import fs from 'fs';
// Parse command line arguments
const args = process.argv.slice(2);
let dir = null;
let ignoreGitignore = false;

// Check for -i flag
if (args.includes('-i')) {
	ignoreGitignore = true;
	// Remove -i flag from args
	const flagIndex = args.indexOf('-i');
	args.splice(flagIndex, 1);
}
if (args.includes('-v') || args.includes('--version')) {
	const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));
	console.log(`tomdir v${packageJson.version}`);
	process.exit(0);
}
// Get directory path
if (args.length > 0) {
	dir = args[0];
} else {
	// Default to current directory
	dir = process.cwd();
}

try {
	const normalizedPath = path.normalize(dir);
	const newDir = normalizedPath.replace(/\\/g, '/');
	
	// Only check for path format if user provided a path (not using default)
	if (args.length > 0 && newDir.indexOf('/') === -1) {
		console.error("Kiểm tra lại đường dẫn, nếu trên window, cần phải paste đường dẫn vào giữa 2 dấu nháy như sau: \"<path>\" ");
		process.exit(1);
	}
	
	listDirectory(newDir, ignoreGitignore);
} catch (err) {
	console.error('Lỗi:', err.message);
	process.exit(1);
}