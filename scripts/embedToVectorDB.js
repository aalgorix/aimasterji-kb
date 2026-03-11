import fs from 'fs';
import { ChromaClient } from 'chromadb';
import OpenAI from 'openai';
import 'dotenv/config';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configuration
const INPUT_FILE = './output/knowledge-base.json';
const COLLECTION_NAME = 'aimasterji_kb';
const EMBEDDING_MODEL = 'text-embedding-3-small'; // Cheaper and good quality
const BATCH_SIZE = 100; // Process in batches to avoid rate limits

async function createEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error creating embedding:', error.message);
    throw error;
  }
}

function prepareTextForEmbedding(item) {
  // Combine relevant fields for semantic search
  const parts = [
    `Grade: ${item.grade}`,
    `Subject: ${item.subject}`,
    `Topic: ${item.topic || ''}`,
    `Title: ${item.title || ''}`,
    `Concept: ${item.concept || ''}`,
    `Explanation: ${item.explanation || ''}`,
    item.examples?.length ? `Examples: ${item.examples.join('; ')}` : '',
    item.keywords?.length ? `Keywords: ${item.keywords.join(', ')}` : ''
  ];
  
  return parts.filter(p => p).join('\n');
}

function prepareMetadata(item) {
  return {
    id: item.id,
    grade: item.grade,
    subject: item.subject,
    content_type: item.content_type || '',
    topic: item.topic || '',
    title: item.title || '',
    difficulty: item.difficulty || '',
    keywords: JSON.stringify(item.keywords || []),
    has_examples: (item.examples?.length || 0) > 0,
    has_questions: (item.practice_questions?.length || 0) > 0
  };
}

async function embedToChromaDB() {
  console.log('🚀 Starting vector database embedding process...\n');
  
  // Read JSON file
  console.log(`📖 Reading ${INPUT_FILE}...`);
  const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  
  // Extract items from merged JSON structure
  let items = [];
  if (data.items && Array.isArray(data.items)) {
    items = data.items;
  } else if (data.content && Array.isArray(data.content)) {
    items = data.content;
  } else {
    console.error('❌ Could not find items array in JSON structure');
    process.exit(1);
  }
  
  console.log(`✅ Found ${items.length} items to embed\n`);
  
  // Initialize ChromaDB client
  console.log('🔌 Connecting to ChromaDB...');
  const client = new ChromaClient();
  
  // Delete existing collection if it exists
  try {
    await client.deleteCollection({ name: COLLECTION_NAME });
    console.log('🗑️  Deleted existing collection');
  } catch (error) {
    // Collection doesn't exist, that's fine
  }
  
  // Create new collection
  const collection = await client.createCollection({
    name: COLLECTION_NAME,
    metadata: { 
      description: 'AI MasterJi Educational Knowledge Base',
      total_items: items.length 
    }
  });
  console.log(`✅ Created collection: ${COLLECTION_NAME}\n`);
  
  // Process items in batches
  const totalBatches = Math.ceil(items.length / BATCH_SIZE);
  let processed = 0;
  
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const start = batchIndex * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, items.length);
    const batch = items.slice(start, end);
    
    console.log(`📦 Processing batch ${batchIndex + 1}/${totalBatches} (items ${start + 1}-${end})...`);
    
    // Prepare batch data
    const texts = batch.map(item => prepareTextForEmbedding(item));
    const ids = batch.map(item => item.id);
    const metadatas = batch.map(item => prepareMetadata(item));
    
    // Create embeddings for batch
    console.log('   🧠 Generating embeddings...');
    const embeddings = await Promise.all(
      texts.map(text => createEmbedding(text))
    );
    
    // Add to ChromaDB
    console.log('   💾 Storing in vector database...');
    await collection.add({
      ids: ids,
      embeddings: embeddings,
      documents: texts,
      metadatas: metadatas
    });
    
    processed += batch.length;
    console.log(`   ✅ Progress: ${processed}/${items.length} (${Math.round(processed/items.length*100)}%)\n`);
    
    // Rate limiting delay
    if (batchIndex < totalBatches - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('🎉 Embedding complete!');
  console.log(`\n📊 Summary:`);
  console.log(`   Total items embedded: ${processed}`);
  console.log(`   Collection name: ${COLLECTION_NAME}`);
  console.log(`   Model used: ${EMBEDDING_MODEL}`);
  
  // Test query
  console.log('\n🔍 Testing search functionality...');
  const results = await collection.query({
    queryTexts: ['how to add numbers'],
    nResults: 3
  });
  
  console.log('\n📝 Sample search results for "how to add numbers":');
  results.ids[0].forEach((id, idx) => {
    console.log(`   ${idx + 1}. ${id} - ${results.metadatas[0][idx].title}`);
  });
}

async function embedToPinecone() {
  // TODO: Implement Pinecone integration
  console.log('Pinecone integration coming soon...');
}

// Main execution
const args = process.argv.slice(2);
const dbType = args[0] || 'chromadb';

if (dbType === 'chromadb') {
  embedToChromaDB().catch(console.error);
} else if (dbType === 'pinecone') {
  embedToPinecone().catch(console.error);
} else {
  console.log('Usage: node embedToVectorDB.js [chromadb|pinecone]');
  console.log('Default: chromadb');
}
