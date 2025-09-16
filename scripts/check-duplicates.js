const fs = require('fs');
const path = require('path');
const { EOL } = require('os');

/**
 * Recursively finds all JSON files in a directory
 */
function findJsonFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      try {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          findJsonFiles(filePath, fileList);
        } else if (file.endsWith('.json')) {
          fileList.push(filePath);
        }
      } catch (error) {
        console.warn(`Warning: Could not process ${file}:`, error.message);
      }
    });
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return fileList;
}

/**
 * Gets the context around a line number in a file
 */
function getContextLines(filePath, lineNumber, context = 2) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(EOL);
  const start = Math.max(0, lineNumber - 1 - context);
  const end = Math.min(lines.length, lineNumber + context);
  
  return {
    line: lines[lineNumber - 1],
    context: lines.slice(start, end).map((l, i) => ({
      lineNumber: start + i + 1,
      content: l,
      isTarget: start + i + 1 === lineNumber
    }))
  };
}

/**
 * Validates a JSON file for duplicate keys
 */
function validateJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(EOL);
    const keyMap = new Map();
    const duplicates = [];
    
    // Track nested objects to provide better context
    const keyPath = [];
    
    lines.forEach((line, index) => {
      // Check for opening/closing braces to track nesting
      const trimmed = line.trim();
      if (trimmed.endsWith('{')) {
        // Try to extract the key for this object
        const keyMatch = line.match(/"([^"]+)"\s*:/);
        if (keyMatch) {
          keyPath.push(keyMatch[1]);
        } else {
          keyPath.push(null);
        }
      } else if (trimmed === '}') {
        keyPath.pop();
      }
      
      // Match key-value pairs
      const keyValueMatch = line.match(/^\s*"([^"]+)"\s*:/);
      if (keyValueMatch) {
        const key = keyValueMatch[1];
        const fullPath = [...keyPath, key].filter(Boolean).join('.');
        
        if (keyMap.has(fullPath)) {
          const { line: prevLine, context: prevContext } = keyMap.get(fullPath);
          const currentContext = getContextLines(filePath, index + 1);
          
          duplicates.push({
            key: fullPath,
            line: index + 1,
            context: currentContext,
            previousLine: prevLine,
            previousContext: prevContext
          });
        } else {
          keyMap.set(fullPath, {
            line: index + 1,
            context: getContextLines(filePath, index + 1)
          });
        }
      }
    });
    
    return duplicates;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return [];
  }
}

// Main function
function main() {
  const localesDir = path.join(__dirname, '..', 'frontend', 'src', 'locales');
  
  if (!fs.existsSync(localesDir)) {
    console.error(`Error: Directory not found: ${localesDir}`);
    process.exit(1);
  }
  
  const jsonFiles = findJsonFiles(localesDir);
  
  if (jsonFiles.length === 0) {
    console.error('No JSON files found in the locales directory');
    process.exit(1);
  }
  
  console.log(`Found ${jsonFiles.length} JSON files to check...\n`);
  
  let totalDuplicates = 0;
  let filesWithIssues = 0;
  
  jsonFiles.forEach(filePath => {
    const relativePath = path.relative(process.cwd(), filePath);
    const duplicates = validateJsonFile(filePath);
    
    if (duplicates.length > 0) {
      filesWithIssues++;
      totalDuplicates += duplicates.length;
      
      console.log(`\n❌ Found ${duplicates.length} duplicate key(s) in ${relativePath}:`);
      
      duplicates.forEach(({ key, line, previousLine, context, previousContext }) => {
        console.log(`\n  Key: "${key}"`);
        console.log(`  - First occurrence: line ${previousLine}`);
        console.log(`  - Duplicate: line ${line}`);
        
        // Show context for the duplicate
        console.log('\n  Context for duplicate:');
        context.context.forEach(ctx => {
          const lineNum = String(ctx.lineNumber).padEnd(4, ' ');
          const marker = ctx.isTarget ? '>>> ' : '    ';
          console.log(`  ${lineNum} ${marker}${ctx.content}`);
        });
        
        console.log(''); // Add spacing between duplicates
      });
    }
  });
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  if (totalDuplicates === 0) {
    console.log('✅ No duplicate keys found in any translation files.');
  } else {
    console.log(`\n⚠️  Found ${totalDuplicates} duplicate keys across ${filesWithIssues} files.`);
    console.log('   Please fix the duplicate keys before continuing.');
    process.exit(1);
  }
}

// Run the check
main();
