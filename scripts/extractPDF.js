/**
 * Extract PDF to Text
 * ====================
 * Converts PDF files to plain text files for processing
 * 
 * Usage:
 * 1. Place PDF in pdfs/ folder
 * 2. Run: node scripts/extractPDF.js pdfs/your-file.pdf
 * 3. Text file will be created in temp/ folder
 */

import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

async function extractPDFText(pdfPath) {
  try {
    console.log('📚 Starting PDF extraction...');
    console.log(`📄 File: ${pdfPath}`);
    
    // Check if file exists
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`File not found: ${pdfPath}`);
    }
    
    // Read PDF file
    const dataBuffer = fs.readFileSync(pdfPath);
    console.log('✅ PDF file loaded');
    
    // Extract text
    console.log('🔍 Extracting text...');
    const data = await pdf(dataBuffer);
    const text = data.text;
    
    // Create temp folder if it doesn't exist
    if (!fs.existsSync('./temp')) {
      fs.mkdirSync('./temp');
    }
    
    // Generate output filename
    const filename = path.basename(pdfPath, '.pdf');
    const outputPath = `./temp/${filename}.txt`;
    
    // Save to text file
    fs.writeFileSync(outputPath, text, 'utf8');
    
    // Print statistics
    console.log('\n✅ Extraction Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📄 Total pages: ${data.numpages}`);
    console.log(`📝 Total characters: ${text.length.toLocaleString()}`);
    console.log(`💾 Saved to: ${outputPath}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return { outputPath, text, pages: data.numpages };
    
  } catch (error) {
    console.error('\n❌ Error extracting PDF:');
    console.error(error.message);
    throw error;
  }
}

// Main execution (only when run directly)
import { fileURLToPath } from 'url';

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const pdfPath = process.argv[2];

  if (!pdfPath) {
    console.log('Usage: node scripts/extractPDF.js <pdf-file-path>');
    console.log('Example: node scripts/extractPDF.js pdfs/class1-math.pdf');
    process.exit(1);
  }

  extractPDFText(pdfPath)
    .then(() => {
      console.log('✅ Done!');
    })
    .catch((error) => {
      console.error('❌ Failed:', error.message);
      process.exit(1);
    });
}

export { extractPDFText };
