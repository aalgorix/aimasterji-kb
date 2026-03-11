# Vector Database Setup Guide

## Overview
Convert your 50,000-line JSON knowledge base to a vector database for semantic search with LLM/RAG applications.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

This installs:
- `chromadb` - Local vector database (free, no signup needed)
- `openai` - For generating embeddings

### 2. Setup ChromaDB (Local)

**Install ChromaDB server:**
```bash
pip install chromadb
```

**Start ChromaDB server:**
```bash
chroma run --path ./chroma_data
```

Keep this terminal open. ChromaDB runs on `http://localhost:8000`

### 3. Embed Your Knowledge Base
```bash
npm run embed
```

This will:
- Read `output/knowledge-base.json` (1,996 items)
- Generate embeddings using OpenAI's `text-embedding-3-small` model
- Store vectors in ChromaDB
- Takes ~5-10 minutes depending on API rate limits

**Cost estimate:** ~2,000 items × $0.00002/item = **$0.04** (4 cents)

### 4. Test Search
```bash
npm run query "how to add two numbers"
npm run query "body parts for kids"
npm run query "hindi alphabet"
```

---

## Advanced Usage

### Filtering by Metadata
Edit `scripts/queryVectorDB.js` and modify the search options:

```javascript
search('multiplication', {
  nResults: 10,
  grade: 'class_3',
  subject: 'maths',
  difficulty: 'medium'
});
```

### Backend Integration

**Option 1: Direct ChromaDB Query**
```javascript
import { ChromaClient } from 'chromadb';

const client = new ChromaClient();
const collection = await client.getCollection({ name: 'aimasterji_kb' });

const results = await collection.query({
  queryTexts: [userQuestion],
  nResults: 5
});

// Pass results.documents to your LLM as context
```

**Option 2: RAG Pipeline**
```javascript
// 1. Get relevant context from vector DB
const context = await searchVectorDB(userQuestion);

// 2. Build prompt with context
const prompt = `Context: ${context}\\n\\nQuestion: ${userQuestion}`;

// 3. Send to LLM
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: prompt }]
});
```

---

## Alternative Vector Databases

### Option 1: ChromaDB (Current) ✅
- **Pros:** Free, local, no signup, great for development
- **Cons:** Not production-ready for high traffic
- **Best for:** Development, testing, low-traffic apps

### Option 2: Pinecone (Cloud)
```bash
npm install @pinecone-database/pinecone
```

Update `.env`:
```
PINECONE_API_KEY=your_key
PINECONE_ENVIRONMENT=us-east-1-aws
```

**Cost:** Free tier: 100K vectors, paid: $70/month for 5M vectors

### Option 3: Weaviate (Cloud/Self-hosted)
```bash
npm install weaviate-ts-client
```

**Cost:** Free tier available, scales well

### Option 4: Qdrant (Cloud/Self-hosted)
```bash
npm install @qdrant/js-client-rest
```

**Cost:** Free for 1GB, very fast

---

## Production Deployment

### Local Development → Production Checklist

1. **Choose Vector DB:**
   - Small/Medium traffic: ChromaDB on VPS
   - High traffic: Pinecone, Weaviate, or Qdrant

2. **Backend API:**
   ```javascript
   app.post('/api/search', async (req, res) => {
     const { question } = req.body;
     const results = await searchVectorDB(question);
     res.json({ results });
   });
   ```

3. **Optimize:**
   - Cache frequent queries
   - Use smaller embedding models for speed
   - Implement rate limiting

4. **Monitor:**
   - Track query latency
   - Monitor embedding API costs
   - Set up alerts for failures

---

## File Structure

```
scripts/
  ├── embedToVectorDB.js     # Convert JSON → Vector DB
  ├── queryVectorDB.js        # Test searches
  └── [existing scripts]

output/
  └── knowledge-base.json     # Source data (1,996 items)

chroma_data/                  # ChromaDB storage (auto-created)
```

---

## Troubleshooting

### "Connection refused" error
- Make sure ChromaDB server is running: `chroma run`

### "Rate limit exceeded"
- Add delays in `embedToVectorDB.js` (already included)
- Use batch processing (already implemented)

### "Out of memory"
- Reduce `BATCH_SIZE` in `embedToVectorDB.js`

### Embeddings are slow
- Switch to `text-embedding-3-small` (default, fastest)
- Or use `text-embedding-ada-002` (older, cheaper)

---

## Cost Breakdown (for 50,000 lines ≈ 2K items)

| Component | Usage | Cost |
|-----------|-------|------|
| ChromaDB | Local | Free |
| OpenAI Embeddings | 2K items × 150 tokens avg | ~$0.04 |
| **Total** | | **$0.04** |

**Regenerating embeddings:** Only needed if you change models or content. Otherwise, one-time cost.

---

## Next Steps

1. ✅ JSON created (done)
2. ✅ Vector DB scripts created (done)
3. ⏳ Run `npm run embed` to create vectors
4. ⏳ Test with `npm run query`
5. ⏳ Integrate into your backend API
6. ⏳ Build RAG pipeline with your LLM

Need help with any step? Let me know!
