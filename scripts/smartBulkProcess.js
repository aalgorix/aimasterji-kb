/**
 * Smart Bulk Process - Skip Already Processed
 * ============================================
 * Only processes new PDFs, skips already converted ones
 * 
 * Usage:
 * Run: npm run bulk-smart
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
  const patterns = [
    /^class(\d+)-([^-]+)/, // class1-english-something
    /^(pre_nursery|nursery)-(.+)$/, // nursery-rhymes-something
  ];
  
  for (const pattern of patterns) {
    const match = folderName.match(pattern);
    if (match) {
      let grade = match[1];
      let subject = match[2];
      
      if (!isNaN(grade)) {
        grade = `class_${grade}`;
      }
      
      return { grade, subject };
    }
  }
  
  return null;
}

// Check if this folder has already been processed
function isAlreadyProcessed(grade, subject) {
  const outputFile = `./output/kb-${grade}-${subject}.json`;
  return fs.existsSync(outputFile);
}

// Find all PDFs including in subfolders
function findAllPDFs(baseDir) {
  const pdfList = [];
  
  const items = fs.readdirSync(baseDir);
  
  for (const item of items) {
    const fullPath = path.join(baseDir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      const subItems = fs.readdirSync(fullPath);
      const pdfFiles = subItems.filter(f => f.endsWith('.pdf'));
      
      if (pdfFiles.length > 0) {
        const folderInfo = parseFolderName(item);
        
        if (folderInfo) {
          // Check if already processed
          const alreadyProcessed = isAlreadyProcessed(folderInfo.grade, folderInfo.subject);
          
          pdfList.push({
            type: 'folder',
            folderName: item,
            grade: folderInfo.grade,
            subject: folderInfo.subject,
            pdfs: pdfFiles.map(f => path.join(fullPath, f)),
            count: pdfFiles.length,
            alreadyProcessed: alreadyProcessed
          });
        } else {
          console.log(`⚠️  Skipping folder: ${item} (couldn't parse name)`);
        }
      }
    } else if (item.endsWith('.pdf')) {
      const name = item.replace('.pdf', '');
      const match = name.match(/^class(\d+)-(.+)$/);
      
      if (match) {
        const grade = `class_${match[1]}`;
        const subject = match[2].replace(/-/g, '_');
        const alreadyProcessed = isAlreadyProcessed(grade, subject);
        
        pdfList.push({
          type: 'file',
          fileName: item,
          grade: grade,
          subject: subject,
          pdfs: [fullPath],
          count: 1,
          alreadyProcessed: alreadyProcessed
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

async function smartBulkProcess() {
  try {
    console.log('🚀 Starting SMART bulk processing (skips already done)...\n');
    
    // Check API key
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
      throw new Error('Please set OPENAI_API_KEY in .env file');
    }
    
    const pdfsDir = './pdfs';
    
    // Find all PDFs
    const allGroups = findAllPDFs(pdfsDir);
    
    if (allGroups.length === 0) {
      throw new Error('No PDF files or folders found in pdfs/ directory');
    }
    
    // Separate into processed and new
    const alreadyDone = allGroups.filter(g => g.alreadyProcessed);
    const needsProcessing = allGroups.filter(g => !g.alreadyProcessed);
    
    console.log('📊 Summary:\n');
    console.log(`✅ Already processed: ${alreadyDone.length}`);
    console.log(`🆕 Need processing: ${needsProcessing.length}`);
    console.log(`📚 Total found: ${allGroups.length}\n`);
    
    if (alreadyDone.length > 0) {
      console.log('✅ Already Processed (will skip):\n');
      alreadyDone.forEach(group => {
        const name = group.type === 'folder' ? group.folderName : group.fileName;
        console.log(`   ⏭️  ${name} (${group.grade} - ${group.subject})`);
      });
      console.log('');
    }
    
    if (needsProcessing.length === 0) {
      console.log('🎉 Everything is already processed!');
      console.log('💡 To reprocess, delete files from output/ folder\n');
      
      // Still merge in case user wants updated master file
      console.log('🔗 Updating master knowledge base...\n');
      await mergeAllKnowledgeBase();
      return;
    }
    
    console.log('🆕 Will Process:\n');
    needsProcessing.forEach(group => {
      const name = group.type === 'folder' ? group.folderName : group.fileName;
      console.log(`   📁 ${name}`);
      console.log(`      Grade: ${group.grade}, Subject: ${group.subject}`);
      console.log(`      PDFs: ${group.count} file(s)\n`);
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Process only new ones
    for (let i = 0; i < needsProcessing.length; i++) {
      const group = needsProcessing[i];
      const name = group.type === 'folder' ? group.folderName : group.fileName;
      
      console.log(`\n[${i + 1}/${needsProcessing.length}] Processing: ${name}`);
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
          
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log(`✅ Extracted ${extractedTextFiles.length} file(s)\n`);
        
        // Step 2: Merge texts if multiple chapters
        let finalTextFile;
        
        if (extractedTextFiles.length > 1) {
          console.log('Step 2: Merging chapters...');
          const combinedText = mergeTextFiles(extractedTextFiles);
          
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
      
      if (i < needsProcessing.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Processing complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Step 4: Merge all JSON files
    console.log('Step 4: Merging all JSON files (including old ones)...\n');
    await mergeAllKnowledgeBase();
    
    console.log('\n🎊 All done! Your knowledge base is updated.');
    console.log('📁 Check output/knowledge-base.json\n');
    
  } catch (error) {
    console.error('\n❌ Processing failed:');
    console.error(error.message);
    throw error;
  }
}

// Main execution
smartBulkProcess()
  .then(() => {
    console.log('✅ All operations completed successfully!');
  })
  .catch((error) => {
    console.error('❌ Process failed:', error.message);
    process.exit(1);
  });
