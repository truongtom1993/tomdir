import fs from 'fs';
import path from 'path';
import readline from 'readline';
import clipboard from 'clipboardy';
import os from 'os';
import { execSync } from 'child_process';

function parseGitignore(gitignorePath) {
	if (!fs.existsSync(gitignorePath)) {
		return [];
	}
	
	const content = fs.readFileSync(gitignorePath, 'utf-8');
	const patterns = content
		.split('\n')
		.map(line => line.trim())
		.filter(line => line && !line.startsWith('#'))
		.map(pattern => {
			// Remove leading slash for consistency
			if (pattern.startsWith('/')) {
				pattern = pattern.substring(1);
			}
			return pattern;
		});
	
	return patterns;
}

function getGlobalGitignorePath() {
	try {
		// Đọc từ git config
		const configPath = execSync('git config --global core.excludesfile', { 
			encoding: 'utf-8',
			stdio: ['pipe', 'pipe', 'ignore']
		}).trim();
		
		if (configPath) {
			// Xử lý tilde (~) expansion
			const expandedPath = configPath.startsWith('~') 
				? path.join(os.homedir(), configPath.slice(1))
				: configPath;
			return expandedPath;
		}
	} catch (err) {
		// Git không cài đặt hoặc không có config
	}
	
	// Fallback: thử các đường dẫn mặc định phổ biến
	const defaultPaths = [
		path.join(os.homedir(), '.config', 'git', 'ignore'),
		path.join(os.homedir(), '.gitignore_global'),
		path.join(os.homedir(), '.gitignore')
	];
	
	for (const p of defaultPaths) {
		if (fs.existsSync(p)) {
			return p;
		}
	}
	
	return null;
}

function loadGitignorePatterns(targetDir) {
	const patterns = [];
	
	// Load global gitignore
	const globalGitignorePath = getGlobalGitignorePath();
	if (globalGitignorePath && fs.existsSync(globalGitignorePath)) {
		patterns.push(...parseGitignore(globalGitignorePath));
	}
	
	// Load local gitignore from target directory
	const localGitignorePath = path.join(targetDir, '.gitignore');
	if (fs.existsSync(localGitignorePath)) {
		patterns.push(...parseGitignore(localGitignorePath));
	}
	
	return patterns;
}

function compilePatterns(patterns) {
	const compiled = {
		exact: new Set(),
		directories: new Set(),
		wildcards: [],
		subpaths: []
	};
	
	for (const pattern of patterns) {
		// Directory patterns (ending with /)
		if (pattern.endsWith('/')) {
			compiled.directories.add(pattern.slice(0, -1));
			continue;
		}
		
		// Wildcard patterns
		if (pattern.includes('*')) {
			const regexPattern = pattern
				.replace(/\./g, '\\.')
				.replace(/\*\*/g, '___DOUBLESTAR___')
				.replace(/\*/g, '[^/]*')
				.replace(/___DOUBLESTAR___/g, '.*');
			compiled.wildcards.push({
				pattern,
				regex: new RegExp(`(^|/)${regexPattern}(/|$)`)
			});
			continue;
		}
		
		// Check if pattern might match subpaths
		if (!pattern.includes('/')) {
			compiled.exact.add(pattern);
			compiled.subpaths.push(pattern);
		} else {
			compiled.subpaths.push(pattern);
		}
	}
	
	return compiled;
}

function shouldIgnore(entryName, relativePath, compiledPatterns, isDirectory) {
	if (!compiledPatterns) {
		return false;
	}
	
	// Fast path: exact name match
	if (compiledPatterns.exact.has(entryName)) {
		return true;
	}
	
	// Fast path: directory-specific patterns
	if (isDirectory && compiledPatterns.directories.has(entryName)) {
		return true;
	}
	
	// Check wildcard patterns
	const pathToTest = relativePath;
	for (const { regex } of compiledPatterns.wildcards) {
		if (regex.test(pathToTest)) {
			return true;
		}
	}
	
	// Check subpath patterns
	const pathParts = pathToTest.split('/');
	for (const pattern of compiledPatterns.subpaths) {
		// Check if pattern matches any segment
		if (pathParts.some(part => part === pattern)) {
			return true;
		}
		// Check if pattern is in path
		if (pathToTest.includes(pattern)) {
			return true;
		}
	}
	
	// Check for directory patterns in path
	for (const dirPattern of compiledPatterns.directories) {
		if (pathToTest.includes(dirPattern + '/') || pathToTest.startsWith(dirPattern + '/')) {
			return true;
		}
	}
	
	return false;
}

function generateStructure(dir, ignoreGitignore = false) {
	const dirName = path.basename(dir);
	let structure = `|-- ${dirName}/\n`;
	const patterns = ignoreGitignore ? [] : loadGitignorePatterns(dir);
	const compiledPatterns = patterns.length > 0 ? compilePatterns(patterns) : null;
	structure += processDirectory(dir, '\t', dir, compiledPatterns);
	return structure.trimEnd();
}

function processDirectory(currentDir, indent, baseDir, compiledPatterns) {
	let contents = '';
	const entries = fs.readdirSync(currentDir, { withFileTypes: true });
	
	for (const entry of entries) {
		const isDir = entry.isDirectory();
		const fullPath = path.join(currentDir, entry.name);
		const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
		
		// Check if should be ignored
		if (shouldIgnore(entry.name, relativePath, compiledPatterns, isDir)) {
			continue;
		}
		
		const line = `${indent}|-- ${entry.name}${isDir ? '/' : ''}\n`;
		contents += line;
		
		if (isDir) {
			contents += processDirectory(fullPath, indent + '\t', baseDir, compiledPatterns);
		}
	}
	return contents;
}

export function listDirectory(dir, ignoreGitignore = false) {
	const result = generateStructure(dir, ignoreGitignore);
	console.log(result);

	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	rl.question('Sao chép vào clipboard? (y/n): ', answer => {
		if (answer.toLowerCase() === 'y') {
			try {
				clipboard.writeSync(result);
				console.log('Đã sao chép vào clipboard.');
			} catch (err) {
				console.error('Sao chép thất bại: ', err);
			}
		}
		rl.close();
	});
}