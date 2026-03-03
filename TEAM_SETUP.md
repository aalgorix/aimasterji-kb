# Team Setup Guide

Welcome to the AI MasterJi Knowledge Base Generator team!

## 🚀 Quick Setup (5 minutes)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/aimasterji-kb.git
cd aimasterji-kb
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Your API Key

```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

Then edit `.env` and add your OpenAI API key:

```
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini
```

**Get API Key:** https://platform.openai.com/api-keys

### 4. Download PDFs

Download NCERT textbooks from: https://ncert.nic.in/textbook.php

**Organize them like this:**
```
pdfs/
  class1-english-mridang/
    aemr101.pdf
    aemr102.pdf
    ...
  class1-math/
    math-ch1.pdf
    math-ch2.pdf
    ...
```

**Naming Convention:**
- Folder: `class1-math`, `nursery-rhymes`, etc.
- PDFs: Any name inside the folder

### 5. Process PDFs

```bash
# Process only new PDFs (skips already done)
npm run bulk-smart

# Or process everything
npm run bulk-all
```

### 6. Check Output

Your knowledge base will be in:
```
output/knowledge-base.json
```

---

## 📁 Project Structure

```
aimasterji-kb/
├── scripts/           # Conversion scripts
├── pdfs/             # Add your PDFs here (NOT in git)
├── temp/             # Temporary files (auto-generated)
├── output/           # Final JSON output
├── package.json      # Dependencies
├── .env             # Your API key (NOT in git)
└── README.md        # Full documentation
```

---

## 💡 Important Notes

### ⚠️ NEVER Commit These Files:
- `.env` (contains API key!)
- PDF files (copyrighted, too large)
- `temp/` folder
- `node_modules/`

The `.gitignore` file handles this automatically.

### 💰 OpenAI Costs:

| Model | Cost per textbook (~100 pages) |
|-------|-------------------------------|
| gpt-4o-mini | ~$0.10 (recommended) |
| gpt-3.5-turbo | ~$0.30 |
| gpt-4 | ~$15 (overkill) |

**Use `gpt-4o-mini` for best balance!**

---

## 🔄 Workflow for Team

### If You're Adding New Content:

1. Add new PDFs to `pdfs/` folder
2. Run: `npm run bulk-smart` (only processes new ones)
3. Share the updated `output/knowledge-base.json` with team

### To Share Generated Knowledge Base:

**Option 1:** Commit output files to git
```bash
git add output/
git commit -m "Update: Added Class 2 Math content"
git push
```

**Option 2:** Use cloud storage (Google Drive, Dropbox)
- Share the `output/` folder separately

**Option 3:** Use Git LFS for large files
```bash
git lfs track "output/*.json"
```

---

## 🐛 Troubleshooting

### "Error: OPENAI_API_KEY is not set"
**Solution:** Create `.env` file with your API key

### "Error: Model not found"
**Solution:** Your API key might not have access to that model. Try:
```
OPENAI_MODEL=gpt-4o-mini
```

### "No PDFs found"
**Solution:** Add PDFs to `pdfs/` folder with correct naming

---

## 📞 Team Communication

**Before Processing Large Batches:**
- Check with team to avoid duplicate work
- Update team on what you're processing

**After Processing:**
- Share the output JSON file
- Update the main `aimasterji-web` project

---

## 🎯 Commands Reference

| Command | Description |
|---------|-------------|
| `npm run bulk-smart` | Process only new PDFs (recommended) |
| `npm run bulk-all` | Process all PDFs (re-process everything) |
| `npm run merge` | Just merge existing JSON files |
| `npm run extract` | Extract single PDF (manual) |
| `npm run convert` | Convert single text file (manual) |

---

## 🔐 Security Best Practices

1. **Never share your `.env` file**
2. **Each team member uses their own API key**
3. **Don't commit PDF files** (copyright issues)
4. **Keep API keys secure** (don't paste in chat/email)

---

## 📚 Resources

- **OpenAI API Docs:** https://platform.openai.com/docs
- **NCERT Textbooks:** https://ncert.nic.in/textbook.php
- **Project README:** See [README.md](README.md) for full details

---

## ✅ Checklist

Before you start:
- [ ] Cloned repository
- [ ] Ran `npm install`
- [ ] Created `.env` with API key
- [ ] Downloaded PDFs
- [ ] Organized PDFs in proper folders
- [ ] Tested with one textbook first

---

**Questions?** Check the main README.md or ask the team!
