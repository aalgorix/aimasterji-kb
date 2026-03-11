import { ChromaClient } from 'chromadb';
import OpenAI from 'openai';
import 'dotenv/config';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const COLLECTION_NAME = 'aimasterji_kb';
const EMBEDDING_MODEL = 'text-embedding-3-small';

async function createEmbedding(text) {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return response.data[0].embedding;
}

async function search(query, options = {}) {
  const {
    nResults = 5,
    grade = null,
    subject = null,
    difficulty = null
  } = options;
  
  console.log(`🔍 Searching for: "${query}"\n`);
  
  // Connect to ChromaDB
  const client = new ChromaClient();
  const collection = await client.getCollection({ name: COLLECTION_NAME });
  
  // Build where filter
  const whereFilter = {};
  if (grade) whereFilter.grade = grade;
  if (subject) whereFilter.subject = subject;
  if (difficulty) whereFilter.difficulty = difficulty;
  
  // Query
  const results = await collection.query({
    queryTexts: [query],
    nResults: nResults,
    where: Object.keys(whereFilter).length > 0 ? whereFilter : undefined
  });
  
  // Display results
  console.log(`📊 Found ${results.ids[0].length} results:\n`);
  
  results.ids[0].forEach((id, idx) => {
    const metadata = results.metadatas[0][idx];
    const distance = results.distances[0][idx];
    const document = results.documents[0][idx];
    
    console.log(`${idx + 1}. ${metadata.title || 'Untitled'}`);
    console.log(`   ID: ${id}`);
    console.log(`   Grade: ${metadata.grade} | Subject: ${metadata.subject}`);
    console.log(`   Topic: ${metadata.topic || 'N/A'}`);
    console.log(`   Difficulty: ${metadata.difficulty}`);
    console.log(`   Similarity: ${(1 - distance).toFixed(3)}`);
    console.log(`   Preview: ${document.substring(0, 150)}...`);
    console.log('');
  });
  
  return results;
}

// CLI usage
const args = process.argv.slice(2);
const query = args.join(' ');

if (!query) {
  console.log('Usage: node queryVectorDB.js <your search query>');
  console.log('\nExamples:');
  console.log('  node queryVectorDB.js how to add two numbers');
  console.log('  node queryVectorDB.js body parts for kids');
  console.log('  node queryVectorDB.js hindi vowels');
  process.exit(1);
}

search(query).catch(console.error);
