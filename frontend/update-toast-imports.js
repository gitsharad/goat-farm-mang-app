const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, 'frontend', 'src');

function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file uses react-hot-toast
    if (content.includes("from 'react-hot-toast'")) {
      console.log(`Updating ${filePath}...`);
      
      // Replace the import
      content = content.replace(
        /import (\{?\s*toast\s*\}?\s*,?\s*)from\s*['"]react-hot-toast['"]/g,
        'import { toast } from \'../../utils/toast\''
      );
      
      // Remove any empty import lines that might be left behind
      content = content.replace(/import\s+['"]react-hot-toast['"];?\n?/g, '');
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

function processDirectory(directory) {
  const files = fs.readdirSync(directory, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(directory, file.name);
    
    if (file.isDirectory()) {
      // Skip node_modules and other non-source directories
      if (file.name !== 'node_modules' && !file.name.startsWith('.')) {
        processDirectory(fullPath);
      }
    } else if (file.name.endsWith('.js') || file.name.endsWith('.jsx') || file.name.endsWith('.tsx')) {
      updateFile(fullPath);
    }
  }
}

// Start processing from the frontend source directory
processDirectory(frontendDir);
console.log('Toast imports update completed!');
