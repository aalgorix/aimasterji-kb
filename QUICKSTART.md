# ⚡ Quick Start Guide

Get your knowledge base up and running in 5 minutes!

## Step 1: Install (1 minute)

```bash
npm install
```

## Step 2: Get OpenAI API Key (2 minutes)

1. Go to https://platform.openai.com
2. Sign up or login
3. Go to API Keys section
4. Create new key
5. Copy the key

## Step 3: Configure (30 seconds)

```bash
# Windows
copy .env.example .env

# Then edit .env and paste your API key
```

## Step 4: Download PDFs (Optional - start with 1)

Download from: https://ncert.nic.in/textbook.php

Example: Download Class 1 Math textbook
Save as: `pdfs/class1-math.pdf`

## Step 5: Process (1 minute)

```bash
npm run bulk
```

## Step 6: Use the Output

Copy `output/knowledge-base.json` to your main project!

---

## 🎯 First Test (Without PDFs)

Want to test without downloading PDFs? Create a test file:

Create `pdfs/test-rhymes.pdf` with some rhymes, then:

```bash
npm run bulk
```

---

## 💡 Example Commands

### Process Single PDF
```bash
# Extract
node scripts/extractPDF.js pdfs/class1-math.pdf

# Convert
node scripts/convertToJSON.js temp/class1-math.txt class_1 math

# Merge
node scripts/mergeAllJSON.js
```

### Process Multiple PDFs
```bash
# Just use bulk!
npm run bulk
```

---

## 📊 What You Get

After processing, you'll have:

- `output/kb-class1-math.json` - Individual subject files
- `output/knowledge-base.json` - **Main file (use this!)**

---

## ✅ Next Steps

1. Copy `output/knowledge-base.json` to your React project
2. Create a service to use the knowledge base
3. Integrate with OpenAI for smart responses
4. Build your AI tutor! 🚀

---

**Need help?** Check [README.md](README.md) for detailed documentation.
