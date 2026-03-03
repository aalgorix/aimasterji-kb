/**
 * Convert Text to JSON using AI
 * ==============================
 * Converts extracted text files to structured JSON knowledge base
 * Uses OpenAI GPT-4 to intelligently parse and structure content
 * 
 * Usage:
 * 1. Set OPENAI_API_KEY in .env file
 * 2. Run: node scripts/convertToJSON.js temp/class1-math.txt class_1 math
 * 3. JSON file will be created in output/ folder
 */

import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const TEMPERATURE = parseFloat(process.env.OPENAI_TEMPERATURE || '0.3');

async function convertTextToJSON(textFile, grade, subject) {
  try {
    console.log('🤖 Starting AI conversion...');
    console.log(`📄 File: ${textFile}`);
    console.log(`🎓 Grade: ${grade}`);
    console.log(`📚 Subject: ${subject}`);
    console.log(`🧠 Model: ${MODEL}\n`);
    
    // Check API key
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
      throw new Error('Please set OPENAI_API_KEY in .env file');
    }
    
    // Read the extracted text
    if (!fs.existsSync(textFile)) {
      throw new Error(`File not found: ${textFile}`);
    }
    
    const text = fs.readFileSync(textFile, 'utf8');
    console.log(`📝 Loaded ${text.length.toLocaleString()} characters`);
    
    // Split into chunks (GPT-4 has token limits)
    const chunkSize = 4000; // Conservative limit to avoid token issues
    const chunks = [];
    
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.substring(i, i + chunkSize));
    }
    
    console.log(`📦 Split into ${chunks.length} chunks for processing\n`);
    
    const allContent = [];
    let itemCounter = 1;
    
    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      console.log(`⏳ Processing chunk ${i + 1}/${chunks.length}...`);
      
      const prompt = `You are an expert educational content converter. Convert this ${grade} ${subject} content into structured JSON.

Extract all educational content including:
- Lessons and concepts
- Questions and answers
- Examples
- Rhymes or poems (if present)
- Stories (if present)
- Exercises

Text to convert:
${chunks[i]}

Return ONLY a valid JSON array (no markdown, no explanation) in this exact format:
[
  {
    "id": "kb_${grade}_${subject}_${String(itemCounter).padStart(3, '0')}",
    "grade": "${grade}",
    "subject": "${subject}",
    "content_type": "lesson",
    "topic": "Main topic name",
    "title": "Specific lesson title",
    "concept": "Core concept in one line",
    "explanation": "Child-friendly explanation with examples",
    "examples": ["example 1", "example 2"],
    "practice_questions": [
      {"q": "Question text?", "a": "Answer text"}
    ],
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "difficulty": "easy"
  }
]

IMPORTANT RULES:
1. Extract EVERY distinct concept as a separate item
2. If it's a rhyme/poem, use "content_type": "rhyme" or "poem" and include full text
3. If it's a story, use "content_type": "story" and include the narrative
4. Make explanations age-appropriate and engaging
5. Include emojis to make it fun for children
6. For math, include visual examples (use emojis like 🍎 for counting)
7. Return ONLY the JSON array, nothing else`;

      try {
        const response = await openai.chat.completions.create({
          model: MODEL,
          messages: [
            { 
              role: "system", 
              content: "You are an expert at converting educational content to structured JSON. Always return valid JSON only." 
            },
            { role: "user", content: prompt }
          ],
          temperature: TEMPERATURE,
          max_tokens: 3000
        });
        
        const content = response.choices[0].message.content;
        
        // Extract JSON (remove markdown formatting if present)
        let jsonContent = content.trim();
        if (jsonContent.includes('```json')) {
          jsonContent = jsonContent.split('```json')[1].split('```')[0];
        } else if (jsonContent.includes('```')) {
          jsonContent = jsonContent.split('```')[1].split('```')[0];
        }
        
        // Parse and validate
        const parsed = JSON.parse(jsonContent.trim());
        
        if (Array.isArray(parsed) && parsed.length > 0) {
          allContent.push(...parsed);
          itemCounter += parsed.length;
          console.log(`✅ Extracted ${parsed.length} items from this chunk`);
        } else {
          console.log(`⚠️  No items extracted from chunk ${i + 1}`);
        }
        
      } catch (parseError) {
        console.error(`❌ Error processing chunk ${i + 1}:`, parseError.message);
        console.log('⏩ Continuing with next chunk...');
      }
      
      // Wait 1 second between requests to avoid rate limits
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Conversion Complete!`);
    console.log(`📊 Total items extracted: ${allContent.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Create output folder if it doesn't exist
    if (!fs.existsSync('./output')) {
      fs.mkdirSync('./output');
    }
    
    // Prepare final output
    const output = {
      version: "1.0",
      source: path.basename(textFile),
      grade: grade,
      subject: subject,
      generated_at: new Date().toISOString(),
      total_items: allContent.length,
      content: allContent
    };
    
    // Save to file
    const outputPath = `./output/kb-${grade}-${subject}.json`;
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
    
    console.log(`💾 Saved to: ${outputPath}\n`);
    
    return output;
    
  } catch (error) {
    console.error('\n❌ Error during conversion:');
    console.error(error.message);
    throw error;
  }
}

// Main execution (only when run directly)
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const textFile = process.argv[2];
  const grade = process.argv[3];
  const subject = process.argv[4];

  if (!textFile || !grade || !subject) {
    console.log('Usage: node scripts/convertToJSON.js <text-file> <grade> <subject>');
    console.log('Example: node scripts/convertToJSON.js temp/class1-math.txt class_1 math');
    console.log('\nGrades: pre_nursery, nursery, class_1, class_2, class_3, class_4, class_5');
    console.log('Subjects: math, english, science, evs, hindi, social_studies, rhymes, stories, etc.');
    process.exit(1);
  }

  convertTextToJSON(textFile, grade, subject)
    .then(() => {
      console.log('✅ Done!');
    })
    .catch((error) => {
      console.error('❌ Failed:', error.message);
      process.exit(1);
    });
}

export { convertTextToJSON };
