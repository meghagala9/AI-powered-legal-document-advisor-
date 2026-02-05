# Legal chatbot app - using Flask and Gemini API
# Started this project to help with legal document analysis

import os
import json
import sys
from flask import Flask, render_template, request, jsonify, session
from flask_session import Session
import google.generativeai as genai
from datetime import datetime
import uuid

# Try to load from config file first, fallback to env vars
try:
    from config import GEMINI_API_KEY as CONFIG_API_KEY, PORT as CONFIG_PORT
    GEMINI_API_KEY = CONFIG_API_KEY
    PORT = CONFIG_PORT
except ImportError:
    # config.py doesn't exist, try env vars instead
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass  # dotenv not installed, that's fine
    
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
    PORT = int(os.environ.get('PORT', 3000))

# Flask setup - basic config
SECRET_KEY = os.environ.get('SECRET_KEY', 'legalease-secret-key-change-in-production')
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'

app = Flask(__name__)
app.config['SECRET_KEY'] = SECRET_KEY
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_FILE_DIR'] = './flask_session'

# Make sure session folder exists
os.makedirs(app.config['SESSION_FILE_DIR'], exist_ok=True)

# Setup sessions
Session(app)

# Check if API key is set up
if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
    print("=" * 60)
    print("WARNING: GEMINI_API_KEY not configured!")
    print("=" * 60)
    print("Please update config.py with your Gemini API key.")
    print("Get your API key from: https://makersuite.google.com/app/apikey")
    print("=" * 60)
    GEMINI_API_KEY = ''

genai.configure(api_key=GEMINI_API_KEY)

# Initialize the model - find what's actually available
model = None
available_model_name = None

# List available models and find one that works
if GEMINI_API_KEY:
    try:
        print("\nChecking available models...")
        available_models = genai.list_models()
        print("Available models with generateContent:")
        for m in available_models:
            if 'generateContent' in m.supported_generation_methods:
                print(f"  - {m.name}")
                # Extract just the model name (remove 'models/' prefix if present)
                model_name = m.name.replace('models/', '')
                # Try to use this model
                if not model:
                    try:
                        model = genai.GenerativeModel(model_name)
                        available_model_name = model_name
                        print(f"\n✓ Successfully initialized: {model_name}\n")
                    except Exception as e:
                        print(f"  ✗ Could not use {model_name}: {str(e)[:80]}")
                        continue
    except Exception as e:
        print(f"Could not list models: {e}")
        print("Trying common model names...")

# If listing didn't work, try common names
if not model:
    model_names_to_try = [
        'gemini-pro',  # Try the older one first
        'gemini-1.5-flash',
        'gemini-1.5-pro',
    ]
    
    for model_name in model_names_to_try:
        try:
            model = genai.GenerativeModel(model_name)
            available_model_name = model_name
            print(f"\n✓ Using model: {model_name}\n")
            break
        except Exception as e:
            print(f"✗ {model_name} failed: {str(e)[:80]}")
            continue

if not model:
    print("\n" + "=" * 60)
    print("ERROR: Could not initialize any Gemini model!")
    print("Please check:")
    print("  1. Your API key is valid")
    print("  2. The Generative Language API is enabled in Google Cloud Console")
    print("  3. Your API key has the correct permissions")
    print("=" * 60 + "\n")
    # Set a default - will fail on first use but at least the app starts
    try:
        model = genai.GenerativeModel('gemini-pro')
    except:
        model = None

# Store conversations in memory (not persistent, but works for now)
conversation_storage = {}

LEGAL_DISCLAIMER = """
IMPORTANT DISCLAIMER

This system (LegalEase) is an AI-powered advisory tool designed to assist with understanding legal documents and compliance requirements.

This system is NOT a substitute for professional legal counsel. The information provided is:

- For educational and informational purposes only
- Not legal advice or opinion
- Not a replacement for consultation with qualified legal professionals
- Provided "as-is" without warranties of any kind

You should always consult with a licensed attorney for:

- Important legal decisions
- Legal document review and drafting
- Compliance matters affecting your business
- Any situation with legal or financial consequences

By using this system, you acknowledge and agree that you will not hold the developers, operators, or any related parties liable for any decisions made based on information provided by this tool.
"""

# Legal document templates - these are just basic ones, could add more later
LEGAL_TEMPLATES = {
    'nda': {
        'name': 'Non-Disclosure Agreement (NDA)',
        'category': 'Contracts',
        'description': 'Template for protecting confidential information',
        'template': """NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into on [DATE] between:
Disclosing Party: [NAME], [ADDRESS]
Receiving Party: [NAME], [ADDRESS]

1. DEFINITION OF CONFIDENTIAL INFORMATION
Confidential Information includes, but is not limited to: [SPECIFY SCOPE]

2. OBLIGATIONS
The Receiving Party agrees to:
- Maintain confidentiality of all Confidential Information
- Use Confidential Information solely for [PURPOSE]
- Not disclose Confidential Information to third parties without prior written consent

3. EXCEPTIONS
Confidential Information does not include information that:
- Is publicly known at the time of disclosure
- Was independently developed without use of Confidential Information
- Is required to be disclosed by law

4. DURATION
This Agreement shall remain in effect for [DURATION] years from the date of execution.

5. REMEDIES
Breach of this Agreement may result in irreparable harm, and the Disclosing Party may seek injunctive relief.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

Disclosing Party: _________________    Receiving Party: _________________
Date: _______________                 Date: _______________"""
    },
    'employment_contract': {
        'name': 'Employment Contract',
        'category': 'Employment',
        'description': 'Standard employment agreement template',
        'template': """EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is made on [DATE] between:
Employer: [COMPANY NAME], [ADDRESS]
Employee: [NAME], [ADDRESS]

1. POSITION AND DUTIES
Employee agrees to serve as [POSITION] and perform duties as assigned by Employer.

2. COMPENSATION
- Base Salary: $[AMOUNT] per [PERIOD]
- Benefits: [SPECIFY BENEFITS]
- Bonus: [IF APPLICABLE]

3. TERM
Employment shall commence on [START DATE] and continue until terminated by either party with [NOTICE PERIOD] notice.

4. CONFIDENTIALITY
Employee agrees to maintain confidentiality of all proprietary information during and after employment.

5. NON-COMPETE
[IF APPLICABLE: Specify geographic and temporal restrictions]

6. TERMINATION
Either party may terminate this Agreement with or without cause, subject to notice requirements.

IN WITNESS WHEREOF, the parties have executed this Agreement.

Employer: _________________           Employee: _________________
Date: _______________                 Date: _______________"""
    },
    'privacy_policy': {
        'name': 'Privacy Policy',
        'category': 'Compliance',
        'description': 'Website privacy policy template',
        'template': """PRIVACY POLICY

Effective Date: [DATE]

[COMPANY NAME] ("we," "our," or "us") respects your privacy. This Privacy Policy explains how we collect, use, and protect your personal information.

1. INFORMATION WE COLLECT
- Personal Information: Name, email, address, phone number
- Technical Information: IP address, browser type, device information
- Usage Data: How you interact with our services

2. HOW WE USE YOUR INFORMATION
We use collected information to:
- Provide and improve our services
- Communicate with you
- Comply with legal obligations
- Protect our rights and prevent fraud

3. INFORMATION SHARING
We do not sell your personal information. We may share information with:
- Service providers who assist in operations
- Legal authorities when required by law
- Business partners with your consent

4. DATA SECURITY
We implement reasonable security measures to protect your information.

5. YOUR RIGHTS
You have the right to:
- Access your personal information
- Request correction or deletion
- Opt-out of certain communications
- File a complaint with relevant authorities

6. COOKIES
We use cookies to enhance user experience. You can control cookies through your browser settings.

7. CHANGES TO THIS POLICY
We may update this Privacy Policy. Continued use constitutes acceptance of changes.

Contact Us: [EMAIL] | [ADDRESS]"""
    },
    'service_agreement': {
        'name': 'Service Agreement',
        'category': 'Contracts',
        'description': 'Template for service provider agreements',
        'template': """SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into on [DATE] between:
Service Provider: [NAME], [ADDRESS]
Client: [NAME], [ADDRESS]

1. SERVICES
Service Provider agrees to provide the following services: [DESCRIBE SERVICES]

2. PAYMENT
- Service Fee: $[AMOUNT]
- Payment Terms: [NET 30/UPFRONT/etc.]
- Late Fees: [IF APPLICABLE]

3. TERM AND TERMINATION
This Agreement shall commence on [START DATE] and continue until [END DATE] or terminated by either party with [NOTICE] days' notice.

4. INTELLECTUAL PROPERTY
All work product shall be owned by [SPECIFY OWNERSHIP].

5. WARRANTIES AND DISCLAIMERS
Service Provider warrants services will be performed in a professional manner. [DISCLAIMERS]

6. LIMITATION OF LIABILITY
Service Provider's liability is limited to the amount paid for services.

7. GOVERNING LAW
This Agreement shall be governed by the laws of [JURISDICTION].

IN WITNESS WHEREOF, the parties have executed this Agreement.

Service Provider: _________________    Client: _________________
Date: _______________                 Date: _______________"""
    }
}

# Legal terms dictionary - common terms users might not know
LEGAL_GLOSSARY = {
    'nda': {
        'term': 'Non-Disclosure Agreement (NDA)',
        'definition': 'A legal contract that creates a confidential relationship between parties to protect sensitive information from being disclosed to third parties.',
        'example': 'An NDA is commonly used when companies discuss potential business partnerships.'
    },
    'consideration': {
        'term': 'Consideration',
        'definition': 'Something of value given in exchange for a promise, necessary for a contract to be legally binding.',
        'example': 'In a sale contract, money is the consideration given in exchange for goods.'
    },
    'liability': {
        'term': 'Liability',
        'definition': 'Legal responsibility or obligation. A person or entity can be held liable for damages, debts, or legal obligations.',
        'example': 'If a company breaches a contract, it may face liability for resulting damages.'
    },
    'jurisdiction': {
        'term': 'Jurisdiction',
        'definition': 'The authority of a court to hear and decide a case, or the geographic area over which a court has authority.',
        'example': 'A contract may specify that disputes will be resolved in California courts.'
    },
    'indemnification': {
        'term': 'Indemnification',
        'definition': 'A contractual obligation where one party agrees to compensate another for losses or damages arising from specific circumstances.',
        'example': 'A service agreement may include indemnification clauses protecting one party from third-party claims.'
    },
    'force_majeure': {
        'term': 'Force Majeure',
        'definition': 'A clause that excuses a party from performing contractual obligations due to extraordinary circumstances beyond their control (e.g., natural disasters, war).',
        'example': 'A force majeure clause may excuse performance during a pandemic or natural disaster.'
    },
    'arbitration': {
        'term': 'Arbitration',
        'definition': 'A method of dispute resolution where parties submit their case to a neutral third party (arbitrator) instead of going to court.',
        'example': 'Many contracts include arbitration clauses requiring disputes to be resolved through arbitration rather than litigation.'
    },
    'intellectual_property': {
        'term': 'Intellectual Property (IP)',
        'definition': 'Legal rights protecting creations of the mind, including patents, trademarks, copyrights, and trade secrets.',
        'example': 'A software company may protect its code through copyright and trade secret laws.'
    },
    'statute_of_limitations': {
        'term': 'Statute of Limitations',
        'definition': 'A law that sets the maximum time period after an event within which legal proceedings may be initiated.',
        'example': 'Many states have a 3-year statute of limitations for breach of contract claims.'
    },
    'due_diligence': {
        'term': 'Due Diligence',
        'definition': 'The investigation or audit of a business or person before signing a contract or agreement.',
        'example': 'Before acquiring a company, the buyer conducts due diligence to review financial records and legal matters.'
    }
}

# Categories for organizing legal stuff
LEGAL_CATEGORIES = {
    'contract': {'name': 'Contract Law', 'color': '#2563eb', 'icon': ''},
    'employment': {'name': 'Employment Law', 'color': '#10b981', 'icon': ''},
    'intellectual_property': {'name': 'Intellectual Property', 'color': '#8b5cf6', 'icon': ''},
    'compliance': {'name': 'Compliance', 'color': '#f59e0b', 'icon': ''},
    'litigation': {'name': 'Litigation', 'color': '#ef4444', 'icon': ''},
    'corporate': {'name': 'Corporate Law', 'color': '#6366f1', 'icon': ''},
    'privacy': {'name': 'Privacy & Data', 'color': '#06b6d4', 'icon': ''},
    'real_estate': {'name': 'Real Estate', 'color': '#ec4899', 'icon': ''}
}

def create_legal_analysis_prompt(user_input, conversation_history=None):
    # Builds the prompt we send to Gemini
    # Tried a few different formats, this one seems to work best
    base_prompt = """You are LegalEase, an expert legal document analysis and compliance advisory AI assistant. Your role is to help users understand legal documents and compliance requirements in clear, layman-friendly language.

LEGAL EXPERTISE AREAS:
- Contract Law (NDAs, service agreements, employment contracts)
- Employment Law (hiring, termination, workplace policies)
- Intellectual Property (patents, trademarks, copyrights, trade secrets)
- Corporate Law (business formation, governance, mergers)
- Privacy & Data Protection (GDPR, CCPA, privacy policies)
- Compliance (regulatory requirements, industry standards)
- Real Estate Law (leases, property transactions)
- Litigation (disputes, settlements, court procedures)

Your responses should be structured and include the following sections when analyzing legal content:

1. **CATEGORY TAG**: Identify the primary legal category (Contract Law, Employment, IP, Compliance, etc.)

2. **SIMPLE EXPLANATION**: Provide a clear, jargon-free explanation of the legal content or question (2-3 paragraphs).

3. **KEY POINTS**:
   - **Obligations**: What the user must do or comply with
   - **Rights**: What rights or protections the user has
   - **Deadlines**: Any time-sensitive requirements or dates mentioned
   - **Risks**: Potential issues or concerns to be aware of

4. **RISK ASSESSMENT**: Provide a risk score (Low / Medium / High) with a brief justification.

5. **LEGAL TERMINOLOGY**: If complex legal terms are used, provide brief definitions in plain language.

6. **CITATION FORMAT**: If referencing specific laws, statutes, or regulations, format citations appropriately (e.g., "Title 15 U.S.C. § 45" or "Cal. Civ. Code § 1542").

7. **RECOMMENDED NEXT STEPS**: Actionable advice on what the user should consider doing next (2-3 specific recommendations).

8. **RELATED RESOURCES**: Suggest relevant legal resources, templates, or further reading when applicable.

IMPORTANT GUIDELINES:
- Use simple, accessible language. Avoid legal jargon when possible, or explain it clearly when necessary.
- Be accurate but conversational. Help users feel informed, not intimidated.
- Focus on practical implications and actionable insights.
- If the input is a question rather than document analysis, adapt the format accordingly.
- Always maintain professional tone while being approachable.
- Do NOT provide definitive legal advice - frame suggestions as "you may want to consider" or "it would be wise to consult about"
- When appropriate, reference applicable statutes, regulations, or case law (with proper citations)
- Identify potential compliance issues and regulatory considerations

Now, analyze the following legal content or question:"""

    # Add conversation history if we have it (last 6 messages for context)
    if conversation_history:
        history_context = "\n\nPrevious conversation context:\n"
        for msg in conversation_history[-6:]:
            role = "User" if msg.get('role') == 'user' else "Assistant"
            history_context += f"{role}: {msg.get('content', '')}\n"
        base_prompt += history_context
    
    base_prompt += f"\n\nUser Input:\n{user_input}\n\nPlease provide your analysis in the structured format above."
    
    return base_prompt

@app.route('/')
def index():
    # Main page - just render the template
    if 'session_id' not in session:
        session['session_id'] = str(uuid.uuid4())
        conversation_storage[session['session_id']] = []
    return render_template('index.html', disclaimer=LEGAL_DISCLAIMER)

@app.route('/api/chat', methods=['POST'])
def chat():
    # Handle incoming chat messages
    if not model:
        return jsonify({
            'error': 'Gemini API not configured. Please set GEMINI_API_KEY environment variable.'
        }), 500

    data = request.json
    user_message = data.get('message', '').strip()
    is_document = data.get('is_document', False)
    
    if not user_message:
        return jsonify({'error': 'Message cannot be empty'}), 400

    # Create session if it doesn't exist
    if 'session_id' not in session:
        session['session_id'] = str(uuid.uuid4())
        conversation_storage[session['session_id']] = []

    session_id = session['session_id']
    
    # Get the conversation history
    conversation_history = conversation_storage.get(session_id, [])
    
    # Save user's message
    conversation_history.append({
        'role': 'user',
        'content': user_message,
        'timestamp': datetime.now().isoformat(),
        'is_document': is_document
    })
    
    try:
        # Build the prompt with conversation history
        prompt = create_legal_analysis_prompt(user_message, conversation_history[:-1])
        
        # Call Gemini
        response = model.generate_content(prompt)
        assistant_message = response.text
        
        # Save the response too
        conversation_history.append({
            'role': 'assistant',
            'content': assistant_message,
            'timestamp': datetime.now().isoformat()
        })
        
        # Update the storage
        conversation_storage[session_id] = conversation_history
        
        return jsonify({
            'message': assistant_message,
            'session_id': session_id
        })
        
    except Exception as e:
        error_msg = f"Error processing request: {str(e)}"
        print(error_msg)  # TODO: maybe use proper logging later
        return jsonify({'error': error_msg}), 500

@app.route('/api/clear', methods=['POST'])
def clear_session():
    # Clear the conversation - user clicked clear button
    if 'session_id' in session:
        session_id = session['session_id']
        if session_id in conversation_storage:
            del conversation_storage[session_id]
    session.clear()
    return jsonify({'status': 'session cleared'})

@app.route('/api/disclaimer', methods=['GET'])
def get_disclaimer():
    # Return the disclaimer text
    return jsonify({'disclaimer': LEGAL_DISCLAIMER})

@app.route('/api/templates', methods=['GET'])
def get_templates():
    # Get list of all templates (just metadata)
    templates_list = {key: {
        'name': val['name'],
        'category': val['category'],
        'description': val['description']
    } for key, val in LEGAL_TEMPLATES.items()}
    return jsonify({'templates': templates_list})

@app.route('/api/templates/<template_id>', methods=['GET'])
def get_template(template_id):
    # Get a specific template by ID
    if template_id in LEGAL_TEMPLATES:
        return jsonify({
            'id': template_id,
            'template': LEGAL_TEMPLATES[template_id]
        })
    return jsonify({'error': 'Template not found'}), 404

@app.route('/api/glossary', methods=['GET'])
def get_glossary():
    # Return all glossary terms
    return jsonify({'glossary': LEGAL_GLOSSARY})

@app.route('/api/glossary/<term_id>', methods=['GET'])
def get_term(term_id):
    # Get a specific term definition
    if term_id in LEGAL_GLOSSARY:
        return jsonify({
            'id': term_id,
            'term_data': LEGAL_GLOSSARY[term_id]
        })
    return jsonify({'error': 'Term not found'}), 404

@app.route('/api/categories', methods=['GET'])
def get_categories():
    # Return the categories we have
    return jsonify({'categories': LEGAL_CATEGORIES})

@app.route('/api/cite', methods=['POST'])
def format_citation():
    # Format legal citations using Gemini
    data = request.json
    citation_text = data.get('citation', '').strip()
    
    if not citation_text:
        return jsonify({'error': 'Citation text required'}), 400
    
    try:
        # Ask Gemini to format it properly
        citation_prompt = f"""Format the following legal citation in proper Bluebook or standard legal citation format:

"{citation_text}"

Provide:
1. Formatted citation in proper legal style
2. Citation type (Case, Statute, Regulation, etc.)
3. Jurisdiction (if applicable)
4. Brief explanation of the source

Format your response as JSON with keys: formatted_citation, citation_type, jurisdiction, explanation"""
        
        response = model.generate_content(citation_prompt)
        
        return jsonify({
            'original': citation_text,
            'formatted': response.text
        })
    except Exception as e:
        return jsonify({'error': f'Error formatting citation: {str(e)}'}), 500

@app.route('/api/analyze-category', methods=['POST'])
def analyze_category():
    # Figure out what category of law this is
    data = request.json
    text = data.get('text', '').strip()
    
    if not text:
        return jsonify({'error': 'Text required'}), 400
    
    try:
        category_prompt = f"""Analyze the following legal text/question and identify the primary legal category:

"{text}"

Categories: Contract Law, Employment Law, Intellectual Property, Compliance, Corporate Law, Privacy & Data, Real Estate, Litigation, or Other.

Respond with only the category name and a brief 1-sentence explanation."""
        
        response = model.generate_content(category_prompt)
        
        return jsonify({
            'text': text[:100] + '...' if len(text) > 100 else text,
            'category_analysis': response.text
        })
    except Exception as e:
        return jsonify({'error': f'Error analyzing category: {str(e)}'}), 500

if __name__ == '__main__':
    # Startup message
    print("\n" + "=" * 60)
    print("LegalEase - Legal Document & Compliance Advisor")
    print("=" * 60)
    print(f"Server starting on: http://localhost:{PORT}")
    print(f"Also accessible at: http://127.0.0.1:{PORT}")
    print(f"API Key configured: {'Yes' if GEMINI_API_KEY and GEMINI_API_KEY != 'your_gemini_api_key_here' else 'No - Please update config.py'}")
    print("=" * 60)
    print(f"\nOpen your browser and navigate to:")
    print(f"   http://localhost:{PORT}")
    print(f"   http://127.0.0.1:{PORT}")
    print(f"\n   Press Ctrl+C to stop the server\n")
    print("=" * 60 + "\n")
    
    try:
        app.run(host='0.0.0.0', port=PORT, debug=DEBUG, use_reloader=False)
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"\nERROR: Port {PORT} is already in use!")
            print(f"   Please either:")
            print(f"   1. Stop the process using port {PORT}")
            print(f"   2. Change PORT in config.py to a different number")
            print(f"\n   To find what's using port {PORT}:")
            print(f"   lsof -i :{PORT}")
        else:
            print(f"\nERROR starting server: {e}")
        sys.exit(1)
