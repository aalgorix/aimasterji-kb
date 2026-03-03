/**
 * Merge All JSON Files
 * =====================
 * Combines all individual JSON files into one master knowledge base
 * 
 * Usage:
 * Run: node scripts/mergeAllJSON.js
 * Output: output/knowledge-base.json
 */

import fs from 'fs';
import path from 'path';

function mergeAllKnowledgeBase() {
  try {
    console.log('🔗 Starting merge process...\n');
    
    const outputDir = './output';
    
    // Check if output directory exists
    if (!fs.existsSync(outputDir)) {
      throw new Error('Output directory not found. Run conversion scripts first.');
    }
    
    // Get all JSON files (except the merged one)
    const files = fs.readdirSync(outputDir)
      .filter(f => f.startsWith('kb-') && f.endsWith('.json') && f !== 'knowledge-base.json');
    
    if (files.length === 0) {
      throw new Error('No JSON files found to merge. Run conversion scripts first.');
    }
    
    console.log(`📁 Found ${files.length} files to merge:`);
    files.forEach(f => console.log(`   - ${f}`));
    console.log('');
    
    const allContent = [];
    const metadata = {
      files: [],
      grades: new Set(),
      subjects: new Set()
    };
    
    // Read and merge all files
    files.forEach(file => {
      const filePath = path.join(outputDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      console.log(`📄 ${file}: ${data.total_items} items`);
      
      // Add content
      allContent.push(...data.content);
      
      // Track metadata
      metadata.files.push({
        filename: file,
        grade: data.grade,
        subject: data.subject,
        items: data.total_items,
        generated_at: data.generated_at
      });
      
      metadata.grades.add(data.grade);
      metadata.subjects.add(data.subject);
    });
    
    // Prepare final merged knowledge base
    const finalKB = {
      version: "1.0",
      last_updated: new Date().toISOString(),
      total_items: allContent.length,
      grades: Array.from(metadata.grades).sort(),
      subjects: Array.from(metadata.subjects).sort(),
      source_files: metadata.files,
      content: allContent
    };
    
    // Save merged file
    const outputPath = path.join(outputDir, 'knowledge-base.json');
    fs.writeFileSync(outputPath, JSON.stringify(finalKB, null, 2), 'utf8');
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Merge Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Total items: ${allContent.length}`);
    console.log(`🎓 Grades: ${finalKB.grades.join(', ')}`);
    console.log(`📚 Subjects: ${finalKB.subjects.join(', ')}`);
    console.log(`💾 Saved to: ${outputPath}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📋 Next steps:');
    console.log('1. Review the merged file: output/knowledge-base.json');
    console.log('2. Copy to your main project: aimasterji-web/src/data/knowledge-base.json');
    console.log('3. Use in your React app! 🚀\n');
    
    return finalKB;
    
  } catch (error) {
    console.error('\n❌ Error during merge:');
    console.error(error.message);
    throw error;
  }
}

// Main execution (only when run directly)
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  mergeAllKnowledgeBase()
    .then(() => {
      console.log('✅ Done!');
    })
    .catch((error) => {
      console.error('❌ Failed:', error.message);
      process.exit(1);
    });
}

export { mergeAllKnowledgeBase };
