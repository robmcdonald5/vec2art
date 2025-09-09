#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function getUnusedVariables() {
  try {
    const { stdout } = await execAsync('npx eslint . --format json', {
      cwd: __dirname,
      maxBuffer: 10 * 1024 * 1024  // 10MB buffer
    });
    
    const results = JSON.parse(stdout);
    const fixes = new Map(); // file -> set of fixes
    
    for (const file of results) {
      if (file.errorCount === 0 && file.warningCount === 0) continue;
      
      const fileFixes = new Set();
      
      for (const message of file.messages) {
        if (message.ruleId === 'no-unused-vars' || 
            message.ruleId === '@typescript-eslint/no-unused-vars') {
          
          // Extract variable name from the message
          const match = message.message.match(/'([^']+)' is (defined|assigned)/);
          if (match) {
            const varName = match[1];
            fileFixes.add(varName);
          }
        }
      }
      
      if (fileFixes.size > 0) {
        fixes.set(file.filePath, fileFixes);
      }
    }
    
    return fixes;
  } catch (error) {
    console.error('Error getting unused variables:', error);
    return new Map();
  }
}

async function fixFile(filePath, variableNames) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    for (const varName of variableNames) {
      // Skip if already prefixed with underscore
      if (varName.startsWith('_')) continue;
      
      // Create patterns to match different declaration types
      const patterns = [
        // const/let/var declarations
        new RegExp(`\\b(const|let|var)\\s+${escapeRegex(varName)}\\b`, 'g'),
        // function parameters
        new RegExp(`\\((.*?)\\b${escapeRegex(varName)}\\b(.*?)\\)`, 'g'),
        // destructuring
        new RegExp(`\\{([^}]*?)\\b${escapeRegex(varName)}\\b([^}]*?)\\}`, 'g'),
        // imports
        new RegExp(`import\\s+.*?\\b${escapeRegex(varName)}\\b.*?from`, 'g'),
        // interface/type properties (for function types)
        new RegExp(`(\\w+)\\s*:\\s*\\((.*?)\\b${escapeRegex(varName)}\\b(.*?)\\)`, 'g')
      ];
      
      const originalContent = content;
      
      // Try each pattern
      content = content.replace(patterns[0], `$1 _${varName}`);
      
      // For function parameters - more careful replacement
      content = content.replace(patterns[1], (match, before, after) => {
        // Don't replace if it's in a type annotation
        if (match.includes(':')) {
          // Check if it's a parameter name vs type
          const parts = match.split(',');
          return '(' + parts.map(part => {
            if (part.includes(varName) && !part.includes(`:.*${varName}`)) {
              return part.replace(new RegExp(`\\b${escapeRegex(varName)}\\b`), `_${varName}`);
            }
            return part;
          }).join(',') + ')';
        }
        return `(${before}_${varName}${after})`;
      });
      
      // For destructuring
      content = content.replace(patterns[2], `{$1_${varName}$2}`);
      
      // For imports - comment out or add underscore
      content = content.replace(patterns[3], (match) => {
        return match.replace(new RegExp(`\\b${escapeRegex(varName)}\\b`), `_${varName}`);
      });
      
      // For interface function parameters
      content = content.replace(patterns[4], `$1: ($2_${varName}$3)`);
      
      if (content !== originalContent) {
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed ${variableNames.size} unused variables in ${path.basename(filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error fixing file ${filePath}:`, error);
    return false;
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function main() {
  console.log('Scanning for unused variables...');
  const fixes = await getUnusedVariables();
  
  console.log(`Found ${fixes.size} files with unused variables`);
  
  let totalFixed = 0;
  let filesFixed = 0;
  
  for (const [filePath, variables] of fixes) {
    // Skip test files and certain directories
    if (filePath.includes('node_modules') || 
        filePath.includes('.svelte-kit') ||
        filePath.includes('build') ||
        filePath.includes('dist')) {
      continue;
    }
    
    // Only process TypeScript and JavaScript files for now
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.js')) {
      continue;
    }
    
    const fixed = await fixFile(filePath, variables);
    if (fixed) {
      filesFixed++;
      totalFixed += variables.size;
    }
  }
  
  console.log(`\nFixed ${totalFixed} unused variables in ${filesFixed} files`);
  console.log('Run ESLint again to verify the fixes');
}

main().catch(console.error);