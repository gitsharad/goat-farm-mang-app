const fs = require('fs');
const path = require('path');

/**
 * Gets all keys from an object recursively and checks for duplicates
 * @param {Object} obj - The object to get keys from
 * @param {string} [prefix=''] - The current key path (for recursion)
 * @param {Set} [keySet=new Set()] - Set to track duplicate keys
 * @param {Array} [duplicates=[]] - Array to collect duplicate keys
 * @returns {{keys: string[], duplicates: string[]}} Object containing all keys and duplicates
 */
function getAllKeys(obj, prefix = '', keySet = new Set(), duplicates = []) {
  const keys = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const currentKey = prefix ? `${prefix}.${key}` : key;
    
    // Check for duplicates
    if (keySet.has(currentKey)) {
      duplicates.push(currentKey);
    } else {
      keySet.add(currentKey);
    }
    
    keys.push(currentKey);
    
    // Recursively process nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = getAllKeys(value, currentKey, keySet, duplicates);
      keys.push(...nested.keys);
      duplicates.push(...nested.duplicates);
    }
  }
  
  return { keys, duplicates };
}

// Read translation files
const localesPath = path.join(__dirname, '..', 'frontend', 'src', 'locales');
const enPath = path.join(localesPath, 'en', 'common.json');
const mrPath = path.join(localesPath, 'mr', 'common.json');

// Function to read and parse a JSON file
function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    process.exit(1);
  }
}

// Function to validate a translation file
function validateTranslationFile(filePath, language) {
  console.log(`\nValidating ${language} translations...`);
  const content = readJsonFile(filePath);
  const { keys, duplicates } = getAllKeys(content);
  
  console.log(`Total keys: ${keys.length}`);
  
  if (duplicates.length > 0) {
    console.error(`❌ Found ${duplicates.length} duplicate keys in ${language}:`);
    duplicates.forEach(dup => console.error(`  - ${dup}`));
    return false;
  }
  
  console.log('✅ No duplicate keys found');
  return true;
}

// Function to compare translation structures
function compareStructures(enObj, otherObj, path = '') {
  const enKeys = Object.keys(enObj);
  const otherKeys = Object.keys(otherObj);
  const missingKeys = [];
  const extraKeys = [];

  // Check for keys in English but missing in the other language
  enKeys.forEach(key => {
    const fullPath = path ? `${path}.${key}` : key;
    if (!otherObj.hasOwnProperty(key)) {
      missingKeys.push(fullPath);
    } else if (typeof enObj[key] === 'object' && enObj[key] !== null) {
      // Recursively check nested objects
      const nestedMissing = compareStructures(enObj[key], otherObj[key], fullPath);
      missingKeys.push(...nestedMissing);
    }
  });

  // Check for extra keys in the other language
  otherKeys.forEach(key => {
    if (!enObj.hasOwnProperty(key)) {
      extraKeys.push(path ? `${path}.${key}` : key);
    }
  });

  return { missingKeys, extraKeys };
}

// Main validation function
async function main() {
  try {
    // Read translation files
    const enContent = readJsonFile(enPath);
    const mrContent = readJsonFile(mrPath);
    
    // Validate each file for duplicates
    const enValid = validateTranslationFile(enPath, 'English');
    const mrValid = validateTranslationFile(mrPath, 'Marathi');
    
    if (!enValid || !mrValid) {
      console.error('\n❌ Validation failed: Duplicate keys found');
      process.exit(1);
    }
    
    // Compare structures between English and Marathi
    console.log('\nComparing translation structures...');
    const { missingKeys, extraKeys } = compareStructures(enContent, mrContent);
    
    if (missingKeys.length > 0) {
      console.warn(`\n⚠️  Found ${missingKeys.length} keys in English missing from Marathi:`);
      missingKeys.forEach(key => console.warn(`  - ${key}`));
    }
    
    if (extraKeys.length > 0) {
      console.warn(`\n⚠️  Found ${extraKeys.length} extra keys in Marathi not present in English:`);
      extraKeys.forEach(key => console.warn(`  - ${key}`));
    }
    
    if (missingKeys.length === 0 && extraKeys.length === 0) {
      console.log('✅ Translation structures match perfectly!');
    }
    
    // Create a clean Marathi translation with the same structure as English
    console.log('\nUpdating Marathi translation file...');
    const newMrContent = createLocalizedObject(enContent, mrContent);
    
    // Write the updated file
    fs.writeFileSync(
      mrPath,
      JSON.stringify(newMrContent, null, 2) + '\n',
      'utf8'
    );
    
    console.log('✅ Marathi translation file has been updated with a clean structure.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Function to create a localized object with the same structure as English
function createLocalizedObject(enObj, mrObj = {}) {
  const result = {};
  const usedKeys = new Set();
  
  for (const [key, value] of Object.entries(enObj)) {
    if (usedKeys.has(key)) {
      console.warn(`⚠️  Duplicate key in English: ${key}`);
      continue;
    }
    usedKeys.add(key);
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = createLocalizedObject(value, mrObj[key] || {});
    } else {
      // Preserve existing translation or use empty string
      result[key] = mrObj.hasOwnProperty(key) ? mrObj[key] : '';
    }
  }
  
  return result;
}

// Run the validation
main();
