/**
 * Bulk Process All PDFs
 * ======================
 * Automatically processes all PDFs in the pdfs/ folder
 * Extracts text and converts to JSON in one go
 * 
 * Usage:
 * 1. Place all PDFs in pdfs/ folder with proper naming (e.g., class1-math.pdf)
 * 2. Run: node scripts/bulkProcess.js
 * 3. All JSON files will be created in output/ folder
 */

import fs from 'fs';
import path from 'path';
import { extractPDFText } from './extractPDF.js';
import { convertTextToJSON } from './convertToJSON.js';
import { mergeAllKnowledgeBase } from './mergeAllJSON.js';
import dotenv from 'dotenv';

dotenv.config();

// Parse filename to extract grade and subject
function parseFilename(filename) {
  const name = filename.replace('.pdf', '');
  
  // Try to match pattern: class1-math, nursery-rhymes, etc.
  const patterns = [
    /^class(\d+)-(.+)$/, // class1-math
    /^(pre_nursery|nursery)-(.+)$/, // nursery-rhymes
    /^(\w+)-collection$/ // stories-collection
  ];
  
  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match) {
      let grade = match[1];
      let subject = match[2];
      
      // Normalize grade
      if (!isNaN(grade)) {
        grade = `class_${grade}`;
      }
      
      // Normalize subject (replace hyphens with underscores)
      subject = subject.replace(/-/g, '_');
      
      return { grade, subject };
    }
  }
  
  // If no pattern matches, ask user
  return null;
}

async function bulkProcessPDFs() {
  try {
    console.log('🚀 Starting bulk PDF processing...\n');
    
    // Check API key
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
      throw new Error('Please set OPENAI_API_KEY in .env file');
    }
    
    const pdfsDir = './pdfs';
    
    // Get all PDF files
    const pdfFiles = fs.readdirSync(pdfsDir)
      .filter(f => f.endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
      throw new Error('No PDF files found in pdfs/ folder');
    }
    
    console.log(`📚 Found ${pdfFiles.length} PDF file(s):\n`);
    
    const processList = [];
    
    // Parse all filenames first
    for (const pdfFile of pdfFiles) {
      const parsed = parseFilename(pdfFile);
      
      if (parsed) {
        console.log(`✅ ${pdfFile} → Grade: ${parsed.grade}, Subject: ${parsed.subject}`);
        processList.push({
          filename: pdfFile,
          path: path.join(pdfsDir, pdfFile),
          grade: parsed.grade,
          subject: parsed.subject
        });
      } else {
        console.log(`⚠️  ${pdfFile} → Could not parse filename. Skipping.`);
        console.log('   Use format: class1-math.pdf or nursery-rhymes.pdf');
      }
    }
    
    if (processList.length === 0) {
      throw new Error('No valid PDFs to process. Check your filenames.');
    }
    
    console.log(`\n📋 Will process ${processList.length} file(s)\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Process each PDF
    for (let i = 0; i < processList.length; i++) {
      const item = processList[i];
      
      console.log(`\n[${i + 1}/${processList.length}] Processing: ${item.filename}`);
      console.log('═══════════════════════════════════════\n');
      
      try {
        // Step 1: Extract PDF to text
        console.log('Step 1/2: Extracting text from PDF...');
        const { outputPath } = await extractPDFText(item.path);
        
        // Step 2: Convert text to JSON
        console.log('\nStep 2/2: Converting to JSON with AI...');
        await convertTextToJSON(outputPath, item.grade, item.subject);
        
        console.log('✅ Successfully processed!\n');
        
      } catch (error) {
        console.error(`❌ Failed to process ${item.filename}:`, error.message);
        console.log('⏩ Continuing with next file...\n');
      }
      
      // Small delay between files
      if (i < processList.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Bulk processing complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Step 3: Merge all JSON files
    console.log('Step 3/3: Merging all JSON files...\n');
    await mergeAllKnowledgeBase();
    
    console.log('\n🎊 All done! Your knowledge base is ready.');
    console.log('📁 Check output/knowledge-base.json\n');
    
  } catch (error) {
    console.error('\n❌ Bulk processing failed:');
    console.error(error.message);
    throw error;
  }
}

// Main execution
bulkProcessPDFs()
  .then(() => {
    console.log('✅ All operations completed successfully!');
  })
  .catch((error) => {
    console.error('❌ Process failed:', error.message);
    process.exit(1);
  });
