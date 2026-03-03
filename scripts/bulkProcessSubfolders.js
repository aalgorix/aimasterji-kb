/**
 * Bulk Process PDFs from Subfolders
 * ===================================
 * Processes all PDFs including those in subfolders
 * Automatically handles chapter-wise PDFs
 * 
 * Usage:
 * 1. Organize PDFs in subfolders like: pdfs/class1-english-mridang/aemr101.pdf
 * 2. Run: npm run bulk-all
 * 3. All chapters will be combined per subject
 */

import fs from 'fs';
import path from 'path';
import { extractPDFText } from './extractPDF.js';
import { convertTextToJSON } from './convertToJSON.js';
import { mergeAllKnowledgeBase } from './mergeAllJSON.js';
import dotenv from 'dotenv';

dotenv.config();

// Parse folder name to extract grade and subject
function parseFolderName(folderName) {
  // Pattern: class1-english-mridang => grade: class_1, subject: english
  const patterns = [
    /^class(\d+)-([^-]+)/, // class1-english-something
    /^(pre_nursery|nursery)-(.+)$/, // nursery-rhymes-something
  ];
  
  for (const pattern of patterns) {
    const match = folderName.match(pattern);
    if (match) {
      let grade = match[1];
      let subject = match[2];
      
      // Normalize grade
      if (!isNaN(grade)) {
        grade = `class_${grade}`;
      }
      
      return { grade, subject };
    }
  }
  
  return null;
}

// Find all PDFs including in subfolders
function findAllPDFs(baseDir) {
  const pdfList = [];
  
  const items = fs.readdirSync(baseDir);
  
  for (const item of items) {
    const fullPath = path.join(baseDir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // It's a subfolder - check for PDFs inside
      const subItems = fs.readdirSync(fullPath);
      const pdfFiles = subItems.filter(f => f.endsWith('.pdf'));
      
      if (pdfFiles.length > 0) {
        const folderInfo = parseFolderName(item);
        
        if (folderInfo) {
          pdfList.push({
            type: 'folder',
            folderName: item,
            grade: folderInfo.grade,
            subject: folderInfo.subject,
            pdfs: pdfFiles.map(f => path.join(fullPath, f)),
            count: pdfFiles.length
          });
        } else {
          console.log(`⚠️  Skipping folder: ${item} (couldn't parse name)`);
        }
      }
    } else if (item.endsWith('.pdf')) {
      // It's a PDF file directly in pdfs/ folder
      const name = item.replace('.pdf', '');
      const match = name.match(/^class(\d+)-(.+)$/);
      
      if (match) {
        const grade = `class_${match[1]}`;
        const subject = match[2].replace(/-/g, '_');
        
        pdfList.push({
          type: 'file',
          fileName: item,
          grade: grade,
          subject: subject,
          pdfs: [fullPath],
          count: 1
        });
      }
    }
  }
  
  return pdfList;
}

// Merge text files from multiple chapters
function mergeTextFiles(textFiles) {
  let combinedText = '';
  
  textFiles.forEach((file, index) => {
    const text = fs.readFileSync(file, 'utf8');
    combinedText += `\n\n=== CHAPTER ${index + 1} ===\n\n`;
    combinedText += text;
  });
  
  return combinedText;
}

async function bulkProcessSubfolders() {
  try {
    console.log('🚀 Starting bulk PDF processing (including subfolders)...\n');
    
    // Check API key
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
      throw new Error('Please set OPENAI_API_KEY in .env file');
    }
    
    const pdfsDir = './pdfs';
    
    // Find all PDFs
    const pdfGroups = findAllPDFs(pdfsDir);
    
    if (pdfGroups.length === 0) {
      throw new Error('No PDF files or folders found in pdfs/ directory');
    }
    
    console.log(`📚 Found ${pdfGroups.length} item(s) to process:\n`);
    
    pdfGroups.forEach(group => {
      if (group.type === 'folder') {
        console.log(`📁 ${group.folderName}`);
        console.log(`   Grade: ${group.grade}, Subject: ${group.subject}`);
        console.log(`   Contains: ${group.count} PDF chapter(s)`);
      } else {
        console.log(`📄 ${group.fileName}`);
        console.log(`   Grade: ${group.grade}, Subject: ${group.subject}`);
      }
    });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Process each group
    for (let i = 0; i < pdfGroups.length; i++) {
      const group = pdfGroups[i];
      
      console.log(`\n[${i + 1}/${pdfGroups.length}] Processing: ${group.type === 'folder' ? group.folderName : group.fileName}`);
      console.log('═══════════════════════════════════════\n');
      
      try {
        const extractedTextFiles = [];
        
        // Step 1: Extract all PDFs in this group
        console.log(`Step 1: Extracting ${group.count} PDF(s)...`);
        
        for (let j = 0; j < group.pdfs.length; j++) {
          const pdfPath = group.pdfs[j];
          const pdfName = path.basename(pdfPath);
          
          console.log(`  [${j + 1}/${group.count}] Extracting ${pdfName}...`);
          
          const { outputPath } = await extractPDFText(pdfPath);
          extractedTextFiles.push(outputPath);
          
          // Small delay
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log(`✅ Extracted ${extractedTextFiles.length} file(s)\n`);
        
        // Step 2: Merge texts if multiple chapters
        let finalTextFile;
        
        if (extractedTextFiles.length > 1) {
          console.log('Step 2: Merging chapters...');
          const combinedText = mergeTextFiles(extractedTextFiles);
          
          // Save merged text
          const mergedFileName = `${group.grade}-${group.subject}-merged.txt`;
          finalTextFile = `./temp/${mergedFileName}`;
          fs.writeFileSync(finalTextFile, combinedText, 'utf8');
          
          console.log(`✅ Merged ${extractedTextFiles.length} chapters into ${mergedFileName}\n`);
        } else {
          finalTextFile = extractedTextFiles[0];
          console.log('Step 2: Single file, no merge needed\n');
        }
        
        // Step 3: Convert to JSON
        console.log('Step 3: Converting to JSON with AI...');
        await convertTextToJSON(finalTextFile, group.grade, group.subject);
        
        console.log('✅ Successfully processed!\n');
        
      } catch (error) {
        console.error(`❌ Failed to process:`, error.message);
        console.log('⏩ Continuing with next item...\n');
      }
      
      // Delay between groups
      if (i < pdfGroups.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Bulk processing complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Step 4: Merge all JSON files
    console.log('Step 4: Merging all JSON files into knowledge base...\n');
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
bulkProcessSubfolders()
  .then(() => {
    console.log('✅ All operations completed successfully!');
  })
  .catch((error) => {
    console.error('❌ Process failed:', error.message);
    process.exit(1);
  });
