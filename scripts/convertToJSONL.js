import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const inputFile = path.join(__dirname, '../output/knowledge-base.json');
const outputFile = path.join(__dirname, '../output/knowledge-base.jsonl');

console.log('Converting knowledge-base.json to JSONL format...');

try {
  // Read the JSON file
  const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  
  // Check if content array exists
  if (!data.content || !Array.isArray(data.content)) {
    throw new Error('No content array found in the JSON file');
  }
  
  console.log(`Found ${data.content.length} items to convert`);
  
  // Convert to JSONL - each object on a separate line
  const jsonlLines = data.content.map(item => JSON.stringify(item));
  const jsonlContent = jsonlLines.join('\n');
  
  // Write to output file
  fs.writeFileSync(outputFile, jsonlContent, 'utf8');
  
  console.log(`✅ Successfully converted to JSONL format`);
  console.log(`Output file: ${outputFile}`);
  console.log(`Total lines: ${jsonlLines.length}`);
  
} catch (error) {
  console.error('❌ Error during conversion:', error.message);
  process.exit(1);
}
