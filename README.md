<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/0949919c-29b9-40b7-8638-86817c72ac23

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


You are an expert full-stack developer and solution architect.
with deep expertise in:
• Generative AI systems
• Legacy system modernization
• Static code analysis
• LLM + RAG architecture
• Python + FastAPI backend development
• Streamlit / React frontend systems
Build a complete, working, production-ready solution for the following
problem statement. choose One-shot Prompting or multi-shot prompting as per the suitable in this problem statement
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROBLEM STATEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Problem Statement:
Consumer packaged goods companies often struggle with maintaining optimal inventory levels across multiple distribution centers, leading to stockouts or overstock situations that impact sales and increase costs. Manual inventory management is time-consuming and error-prone.
Steps:
Develop an AI agent that ingests inventory data and sales trends.
Use Langchain or Llamaindex to build a task-oriented agent that can analyze inventory status and recommend reorder quantities.
Enable the agent to answer queries about stock levels, forecast demand, and suggest restocking schedules.
Integrate the agent with sample inventory and sales data for demonstration.
Data Requirements:
Historical sales data, current inventory levels, product catalog details. Sample data can be simulated or sourced from open datasets related to retail sales.
Expected Output:
Interactive agent responses providing reorder recommendations, inventory status summaries, and demand forecasts in text format.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INFRASTRUCTURE & API CONFIGURATION (FIXED — DO NOT CHANGE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LLM Gateway: GenAILab (internal)
Base URL: URL
API Key: key
SSL: verify=False (self-signed certificate — always disable SSL verification)
LLM Client pattern (use this EXACTLY):
from openai import AsyncOpenAI
import httpx
transport = httpx.AsyncHTTPTransport(verify=False)
client = AsyncOpenAI(
baseurl="URL/v1",
apikey="key",
httpclient=httpx.AsyncClient(transport=transport, verify=False),
)
Available models — choose the RIGHT model for each task:
azure/genailab-maas-gpt-4o → Complex reasoning, analysis,
vision, primary agent tasks
azure/genailab-maas-gpt-4o-mini → Fast tasks, formatting,
classification, fallback
azure/genailab-maas-gpt-35-turbo → Simple tasks, last resort fallback
azureai/genailab-maas-DeepSeek-R1 → Chain-of-thought reasoning,
math, logic, step-by-step analysis
azureai/genailab-maas-DeepSeek-V3-0324 → General purpose, creative tasks,
summarization
azureai/genailab-maas-Llama-3.3-70B-Instruct → Open-ended generation,
alternative reasoning
azureai/genailab-maas-Phi-4-reasoning → Lightweight fast reasoning
azure/genailab-maas-text-embedding-3-large → Embeddings, semantic search,
similarity matching
azure/genailab-maas-whisper → Audio transcription
Embedding Model:
• azure/genailab-maas-text-embedding-3-large
Model routing: The prefix "azure/" or "azureai/" tells the gateway
which backend to use. Same client, same API key for ALL models.
CONTENT FILTER WARNING: The Azure gateway blocks certain keywords in
prompts even in legitimate contexts. Avoid these words in LLM prompts:
"injection" → use "query manipulation" or "unsafe input handling"
"exploit" → use "weakness" or "vulnerability pattern"
"malicious" → use "harmful" or "unsafe"
"shell" → use "OS command" or "system command"
Medical terms used in non-medical context may also be blocked
If a prompt gets a 403 error, rephrase it to avoid trigger words.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK (USE EXACTLY THESE — TESTED & WORKING)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Backend:
Language: Python 3.12
Framework: FastAPI + uvicorn
Key packages (Python 3.12 compatible versions):
fastapi==0.115.0
uvicorn[standard]==0.30.0
pydantic==2.8.2
openai>=1.40.0
httpx==0.27.2
PyJWT==2.8.0
python-dotenv==1.0.1
websockets==12.0
python-multipart==0.0.9
Frontend:
Framework: Next.js 14.2.29 (NOT v15 — Turbopack breaks on Windows)
Language: TypeScript
Styling: Tailwind CSS
Key packages:
next@14.2.29
react@ ^18.3.1 (NOT React 19 — peer dep issues)
react-dom@ ^18.3.1
lucide-react@ ^0.468.0
axios@ ^1.7.2
zustand@ ^4.5.2
react-hot-toast@ ^2.4.1
clsx@ ^2.1.1
Vector Database:
• ChromaDB
Steps:
Split code into logical chunks (function/class aware)
Generate embeddings
Store in vector DB
Retrieve relevant chunks
Pass to LLM for structured analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ARCHITECTURE REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Backend folder structure (mandatory):
backend/
├── main.py # FastAPI app entry point
├── .env # Pre-configured with API key
├── requirements.txt
├── agents/ # LLM agent logic
├── api/ # Route handlers (auth, core features)
├── models/ # Pydantic schemas
├── services/ # LLM client, WebSocket manager, other services
└── utils/ # Helper functions
Frontend folder structure (mandatory):
frontend/src/
├── app/
│ ├── page.tsx # Login or landing page
│ ├── layout.tsx
│ └── [feature]/
│ └── page.tsx # Main feature page
├── components/ # Reusable UI components
└── lib/
├── api.ts # Axios client (baseURL: http://localhost:8000
)
└── authStore.ts # Zustand store with SSR-safe hydrate pattern
MANDATORY PATTERNS — always implement these:
LLM CLIENT: Single shared AsyncOpenAI via lrucache, SSL verify=False
MULTI-AGENT: If problem needs multiple analysis types, run agents in
parallel via asyncio.gather with primary + fallback model per agent
STREAMING: Use WebSocket for real-time progress updates
Flow: Client opens WS first → then POSTs REST request →
backend streams progress events via WS → REST returns final result
AUTH: JWT-based, no database required
Demo credentials stored in-memory dict
Accept both email and username formats
8 hour token expiry
NO DATABASE: Use in-memory Python dicts for session state
(as per hackathon constraints)
CORS: Allow localhost:3000, 3001, 3002 and 127.0.0.1 variants
allow_credentials=True
ERROR HANDLING: Every LLM call wrapped in try/except with fallback model
Log all errors with traceback for debugging
REACT HOOKS RULE: ALL hooks (useState, useEffect, useCallback, useRef)
MUST be declared before ANY early return statement
SSR HYDRATION: Never read localStorage in initial Zustand state
Always use hydrate() pattern:
hydrate: () => set({
token: localStorage.getItem("token"),
hydrated: true
})
Call hydrate() in useEffect, show loading until hydrated=true
PACKAGE.JSON dev script: "next dev -p 3000"
(no --no-turbopack flag — invalid in Next.js 14)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UI/UX REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Theme: Give a toggle for light and dark theme,use enterprise professional theme
Always include:
Login page with demo credentials shown
Navbar with username display and logout button
Loading states for all async operations
Toast notifications for success/error (react-hot-toast)
Empty states and error states for all data views
Responsive layout (desktop primary)
Real-time streaming display (findings/results appear progressively)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SOLUTION DESIGN INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Read the problem statement carefully, then design and build a complete enterprise-grade AI-powered Performance Log Analysis & Anomaly Explanation Assistant.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IDENTIFY THE CORE AI TASKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The solution should support:
Log parsing
Anomaly detection
Context understanding
Root cause inference
Explanation generation
Recommendation/remediation generation
Conversational troubleshooting
Semantic retrieval over logs
Pattern correlation across log events
Determine where:
RAG is required
Multi-agent orchestration is beneficial
Streaming responses improve UX
Synthetic data generation is necessary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELECT THE APPROPRIATE MODELS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use the best model for each task:
Complex anomaly reasoning & explanation → GPT-4o
Fast classification/filtering tasks → GPT-4o-mini
Step-by-step root cause analysis → DeepSeek-R1
General summarization & insight generation → DeepSeek-V3
Semantic similarity & log retrieval → text-embedding-3-large
Audio support (if voice logs/alerts exist) → Whisper
Screenshot/dashboard analysis → GPT-4o vision
Always configure:
primary model
fallback model
retry/error handling
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN THE MULTI-AGENT ARCHITECTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Break the system into specialized agents.
Recommended agents:
A. Log Parsing Agent
Responsibilities:
Parse raw logs
Normalize timestamps
Extract severity levels
Extract services/modules
Detect structured patterns
Remove noisy log entries
B. Anomaly Detection Agent
Responsibilities:
Detect unusual patterns
Identify spikes/errors/timeouts
Correlate failures
Detect performance bottlenecks
C. Root Cause Analysis Agent
Responsibilities:
Infer likely causes
Correlate anomalies with system behavior
Analyze cascading failures
Perform step-by-step reasoning
D. Explanation Generation Agent
Responsibilities:
Convert technical anomalies into human-readable explanations
Summarize issues clearly
Explain severity and impact
E. Remediation Recommendation Agent
Responsibilities:
Suggest troubleshooting steps
Recommend configuration changes
Recommend infrastructure scaling or fixes
F. Conversational Q&A Agent
Responsibilities:
Answer questions only based on uploaded logs/context
Support follow-up troubleshooting conversations
Reject unrelated/out-of-scope questions
Each agent must include:
system prompt
primary model
fallback model
structured output schema
Run independent agents in parallel wherever possible using asyncio.gather().
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN THE DATA FLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User Upload/Paste Logs
→ Sanitization & Guardrails
→ Log Parsing
→ Noise Filtering
→ Context Extraction
→ Embedding Generation
→ Vector Retrieval
→ Multi-Agent Analysis Pipeline
→ Aggregation & Validation
→ Explanation Generation
→ Streaming Results
→ User Feedback Loop
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPLEMENT LOG PREPROCESSING PIPELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Build preprocessing utilities for:
Timestamp normalization
Severity extraction
Session correlation
Duplicate log filtering
Noise reduction
Sensitive data masking
Structured parsing
JSON/text log handling
Support:
JSON logs
Plain text logs
Multi-line logs
ELK-style logs
Stack traces
Use modular utility files such as:
parser.py
normalizer.py
noise_filter.py
sanitizer.py
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPLEMENT INPUT SANITIZATION & SAFETY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Create a dedicated sanitizer.py module.
Responsibilities:
Detect blocked/unsafe content
Mask sensitive values
Replace restricted patterns
Normalize malformed inputs
Prevent unsafe prompt manipulation
Remove secrets/tokens/IPs if necessary
Sanitization must occur before:
embeddings
retrieval
LLM prompting
logging/storage
Log sanitization events safely without storing raw sensitive content.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPLEMENT RAG PIPELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Build a Retrieval-Augmented Generation workflow:
Split logs into semantic chunks
Generate embeddings
Store embeddings in vector database
Retrieve relevant log segments
Pass retrieved context to reasoning agents
Suggested vector DB:
ChromaDB
Embedding model:
text-embedding-3-large
Store:
anomaly summaries
correlated events
historical explanations
remediation patterns
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GENERATE SYNTHETIC TEST DATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Create a dedicated data.py module.
Requirements:
Generate at least 500 synthetic log entries
Include multiple anomaly categories:
CPU spikes
memory leaks
disk bottlenecks
network latency
API failures
DB connection exhaustion
timeout chains
thread deadlocks
container crashes
autoscaling failures
Generate:
normal logs
warning logs
error logs
correlated failure sequences
Include:
timestamps
services
trace IDs
severity levels
expert annotations
expected explanations
Add:
randomized synthetic generation functions
API endpoint for demo data generation
UI button to auto-populate sample logs
Never use real sensitive production logs.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BUILD THE ENTERPRISE UI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Create a professional enterprise dashboard.
Include:
A. Log Input Area
file upload
drag-and-drop
text paste
sample log generation button
B. Streaming Analysis Panel
live processing updates
WebSocket streaming
pipeline stage indicators
C. Results Dashboard
anomaly cards
severity indicators
root cause summaries
remediation suggestions
confidence scores
D. Visualizations
anomaly timelines
severity charts
service health indicators
frequency graphs
correlation graphs
E. Conversational Troubleshooting Chat
ask follow-up questions
refine analysis
contextual Q&A
F. Export Features
PDF report
JSON export
CSV summaries
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPLEMENT FEEDBACK LOOP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Add:
thumbs up/down feedback
remediation usefulness feedback
explanation quality rating
Store:
feedback history
previous analyses
session interactions
Use feedback to improve future responses where applicable.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPLEMENT ENTERPRISE ARCHITECTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use:
modular folder structure
reusable services/components
RBAC support
environment-based configuration
WebSocket streaming
proper logging
centralized error handling
scalable architecture patterns
Suggested backend modules:
agents/
services/
api/
models/
utils/
storage/
Suggested frontend modules:
dashboard/
components/
charts/
chat/
upload/
logs/
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUCCESS METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Target:
≥80% explanation accuracy
explanation generation within 1 minute
support diverse anomaly categories
improve troubleshooting efficiency
provide understandable explanations for non-experts
The final solution should demonstrate:
anomaly understanding
cause inference
enterprise observability workflows
natural language explanation generation
actionable remediation guidance
scalable AI-assisted troubleshooting
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DELIVERABLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Provide:
Complete working code for ALL files (no placeholders, no TODOs)
Pre-configured .env with the API key
requirements.txt with exact versions listed above
package.json with Next.js 14.2.29 and React 18
Downloadable zip file with complete project
Run steps (Windows PowerShell):
Backend:
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
Frontend:
cd frontend
npm install
npm run dev
Open: http://localhost:3000
Login: dev@example.ai / developer123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUALITY CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Before delivering, verify:
[ ] All hooks declared before early returns (Rules of Hooks)
[ ] No localStorage in initial Zustand state (SSR hydration)
[ ] SSL verify=False on ALL httpx clients
[ ] Content filter words removed from ALL LLM prompts
[ ] Fallback model for every LLM call
[ ] WebSocket opens before REST POST is made
[ ] CORS allows localhost:3000 with credentials
[ ] No --no-turbopack in package.json scripts
[ ] React 18 not 19, Next.js 14 not 15
[ ] No hardcoded API keys in frontend code
[ ] All agents run in parallel via asyncio.gather
[ ] In-memory storage only (no database imports)
[ ] Every LLM call has try/except with fallback
[ ] Chat endpoint sends full conversation history
[ ] Apply-fix returns full patched file content
