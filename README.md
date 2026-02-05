# LegalEase - Legal Document & Compliance Advisor

A web-based conversational AI system powered by Google Gemini API that helps users understand legal documents and compliance requirements in simple, layman-friendly language.

---

## Complete Setup and Testing Guide

### Step 1: Install Dependencies

Open terminal in the project folder and run:

```bash
pip install -r requirements.txt
```

This installs:
- Flask (web framework)
- flask-session (session management)
- google-generativeai (Gemini API)
- python-dotenv (optional, for .env files)

**Verify installation:**
```bash
python3 -c "import flask, google.generativeai; print('All dependencies installed')"
```

---

### Step 2: Configure API Key

**Edit `config.py` file:**

1. Open `config.py` in any text editor
2. Find this line:
   ```python
   GEMINI_API_KEY = "your_gemini_api_key_here"
   ```
3. Replace `"your_gemini_api_key_here"` with your actual Gemini API key
4. Get your API key from: https://makersuite.google.com/app/apikey

**Example:**
```python
GEMINI_API_KEY = "AIzaSyA_your_actual_api_key_here"
```

**Port Configuration (already set to 3000):**
```python
PORT = 3000  # Server will run on this port
```

---

### Step 3: Start the Server

**Run this command:**

```bash
python app.py
```

**You should see:**
```
LegalEase - Legal Document & Compliance Advisor
============================================================
Server starting on: http://localhost:3000
Also accessible at: http://127.0.0.1:3000
API Key configured: Yes (or No if not set)
============================================================

Open your browser and navigate to:
   http://localhost:3000
   http://127.0.0.1:3000

   Press Ctrl+C to stop the server
```

**Keep this terminal window open** - the server must be running!

---

### Step 4: View the UI in Browser

1. **Open any web browser** (Chrome, Firefox, Safari, Edge)
2. **Type in address bar:** `http://localhost:3000`
3. **Press Enter**

**You should see:**
- Header with "LegalEase" title
- Welcome message with feature descriptions
- Two tabs: "Text Input" and "Document Upload"
- Text input area
- "Send" button
- "Clear Conversation" button
- "Disclaimer" button in header

---

### Step 5: Test the Application

#### Test 1: UI Loads Successfully
- [x] Browser shows the LegalEase interface
- [x] All buttons and tabs are visible
- [x] No errors in browser console (F12)

#### Test 2: Text Input Mode

1. Click **"Text Input"** tab
2. Type a test question: `"What is a non-disclosure agreement?"`
3. Click **"Send"** button or press **Enter**
4. Wait for response (you'll see a loading indicator)

**Expected Result:**
- If API key is configured: You'll get an AI-generated legal explanation
- If API key is NOT configured: You'll see an error message (but UI is working)

#### Test 3: Document Upload Mode

1. Click **"Document Upload"** tab
2. **Option A - Paste text:**
   - Paste any legal document text in the text area
   - Click **"Analyze Document"**
   
3. **Option B - Upload file:**
   - Click the upload area or drag & drop a text file
   - Click **"Analyze Document"**

**Expected Result:**
- Document is analyzed and broken down into:
  - Simple Explanation
  - Key Points (Obligations, Rights, Deadlines, Risks)
  - Risk Assessment (Low/Medium/High)
  - Recommended Next Steps

#### Test 4: Multi-turn Conversation

1. After getting a response, ask a follow-up question
2. Example: "Can you explain more about the obligations?"
3. The system should remember previous context

**Expected Result:**
- Follow-up responses reference previous conversation
- Context is maintained throughout the session

#### Test 5: Clear Conversation

1. Click **"Clear Conversation"** button
2. Confirm the action
3. Chat history should be cleared

**Expected Result:**
- All messages disappear
- Welcome message reappears
- New session starts

#### Test 6: Disclaimer

1. Click **"Disclaimer"** button in header
2. Modal should open with legal disclaimer
3. Click **"I Understand"** or close (X) to dismiss

**Expected Result:**
- Disclaimer modal displays correctly
- Can be closed properly

---

## Verification Checklist

Run through this checklist to ensure everything works:

- [ ] **Dependencies installed:** `pip install -r requirements.txt` completed without errors
- [ ] **Config file exists:** `config.py` file is present
- [ ] **API key configured:** `GEMINI_API_KEY` is set in `config.py` (or you see warning if not)
- [ ] **Server starts:** `python app.py` runs without errors
- [ ] **Server shows port 3000:** Terminal displays "Server starting on: http://localhost:3000"
- [ ] **UI loads in browser:** `http://localhost:3000` shows the LegalEase interface
- [ ] **Text input works:** Can type and send messages
- [ ] **Document upload works:** Can paste/upload documents
- [ ] **AI responses:** If API key is set, responses are generated
- [ ] **Error handling:** If API key is not set, clear error message appears
- [ ] **Conversation context:** Follow-up questions work with context
- [ ] **Clear conversation:** Button clears chat history
- [ ] **Disclaimer:** Modal opens and closes correctly

---

## Troubleshooting

### Server Won't Start

**Error: "Port 3000 already in use"**
```bash
# Check what's using the port
lsof -i :3000

# Kill the process (replace PID with actual number)
kill -9 PID

# OR change port in config.py to 3001 or another number
```

**Error: "Module not found"**
```bash
pip install -r requirements.txt
```

**Error: "Cannot import config"**
- Make sure `config.py` exists in the project root
- Check that `config.py` has valid Python syntax

### Can't See UI in Browser

**Browser shows "Can't connect" or "Connection refused"**
- Make sure server is running (check terminal)
- Use correct URL: `http://localhost:3000` (not just `localhost:3000`)
- Try: `http://127.0.0.1:3000`
- Check if firewall is blocking the connection
- Make sure you typed `http://` not `https://`

**Browser shows blank page**
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Check browser console (F12) for errors
- Make sure `templates/` and `static/` folders exist with files

**CSS/JavaScript not loading**
- Check browser console (F12) for 404 errors
- Verify files exist: `static/css/style.css` and `static/js/app.js`
- Hard refresh the page

### Chat Not Working

**Error: "Gemini API not configured"**
- Edit `config.py`
- Set `GEMINI_API_KEY = "your_actual_key_here"`
- Restart the server (Ctrl+C, then `python app.py`)

**Error: "API key invalid"**
- Verify your API key is correct at: https://makersuite.google.com/app/apikey
- Make sure API key has quotes: `GEMINI_API_KEY = "your_key"`
- Check for extra spaces or characters

**No response from AI**
- Check terminal for error messages
- Verify API key is valid and has quota/credits
- Check internet connection
- Wait a few seconds - responses may take time

### Other Issues

**Session errors**
- Delete `flask_session/` folder and restart server
- Check folder permissions

**Import errors**
```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

**Python version issues**
- Requires Python 3.8 or higher
- Check version: `python3 --version`
- Update Python if needed

---

## Project Structure

```
legal chatbot/
├── app.py                 # Main Flask application
├── config.py             # API key and configuration (EDIT THIS)
├── requirements.txt      # Python dependencies
├── README.md            # This file (complete guide)
├── .gitignore          # Git ignore rules
├── templates/
│   └── index.html      # Main HTML interface
└── static/
    ├── css/
    │   └── style.css   # Application styles
    └── js/
        └── app.js      # Frontend JavaScript
```

---

## Quick Start Summary

**3 Steps to Get Running:**

1. **Install:** `pip install -r requirements.txt`
2. **Configure:** Edit `config.py` and add your Gemini API key
3. **Run:** `python app.py` → Open `http://localhost:3000` in browser

**To Test:**

1. Type a legal question → Click "Send" → Verify AI response
2. Upload a document → Click "Analyze" → Verify structured analysis
3. Ask follow-up question → Verify context is maintained

---

## Important Notes

- **API Key Required:** Chat functionality won't work without a valid Gemini API key
- **Port 3000:** Server runs on port 3000 by default (change in `config.py` if needed)
- **Keep Server Running:** Don't close the terminal where server is running
- **Browser Only:** This is a local web app - only accessible on your computer
- **Legal Disclaimer:** This is advisory only, not a substitute for professional legal counsel

---

## Features

- **Document Analysis:** Upload or paste legal documents
- **Text Questions:** Ask legal questions in plain language
- **Multi-turn Conversations:** Context-aware follow-up questions
- **Structured Output:** Clear explanations with key points, risks, and recommendations
- **Risk Assessment:** Automatic risk scoring (Low/Medium/High)
- **No Database:** Session-based storage, no database needed
- **Responsive Design:** Works on desktop, tablet, and mobile

---

**Need Help?** Check the troubleshooting section above or review the error messages in your terminal and browser console.

**Ready to test?** Follow Step 1-5 above!


 pip install --upgrade google-generativeai
 