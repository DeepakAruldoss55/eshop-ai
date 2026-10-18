# DeepShop AI Service — Technical Architecture & Pipeline Execution Flow

**Service Name:** DeepShop AI Service  
**Location:** `/var/www/deepak_a/ai/eshop/ai-service`  
**Core Technologies:** Python 3.10+, FastAPI, Pydantic v2, ChromaDB, Uvicorn, Requests  
**Target Roles:** Developers, Evaluators, and Technical Presenters  
**Focus:** Technical pipeline flows, function call chains, data flow, and file-by-file execution logic.

---

## 1. System Overview & The Two AI Engines

The DeepShop AI Service is a dedicated Python microservice running on `http://localhost:8000`. It powers two distinct AI systems for the application:

1. **Customer Storefront AI Concierge (RAG Assistant)**:
   - Responds to shopping inquiries, brand policies, and product questions.
   - Dynamically injects customer order histories, current cart items, and live shipping status.
   - Embeds interactive UI components (Product Cards, GPS Tracking buttons) directly in chat replies.

2. **Merchant ERP AI Analytics & Business Copilot**:
   - Automatically computes real-time P&L, EBIT, operating margins, and executive KPIs directly from operational JSON ledgers.
   - Flags catalog anomalies (e.g., pricing errors, low stock, dead-stock capital lockup).
   - Offers a multi-turn, state-aware **AI Business Copilot** for store administrators to inspect orders, customers, delivery addresses, and financial targets.

---

## 2. High-Level Architecture & Communication Flow

```text
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │                                   FRONTEND (React / Vite)                              │
  │   • Storefront Chat Widget (ChatWidget.tsx)    • Admin ERP Analytics (AdminAIAnalytics)│
  └───────────────────────────────┬────────────────────────────────────────┬───────────────┘
                                  │ POST /api/chat                         │ GET /api/analytics/overview
                                  │ (Customer RAG)                         │ POST /api/analytics/ask
                                  ▼                                        ▼
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │                               FASTAPI ROUTER (src/api/routes.py)                       │
  │   Validates schemas with Pydantic (ChatRequest, ChatResponse, AnalyticsAskRequest)     │
  └───────────────────────────────┬────────────────────────────────────────┬───────────────┘
                                  │                                        │
           ┌──────────────────────┴──────────────┐                         │
           ▼                                     ▼                         ▼
┌──────────────────────┐              ┌──────────────────────┐  ┌─────────────────────────┐
│ Live Context Builder │              │   Hybrid Retriever   │  │ Merchant Analytics      │
│ (src/ingestion/      │              │ (src/retrieval/      │  │ Engine                  │
│  loader.py)          │              │  retriever.py)       │  │ (src/analytics/         │
│ • Reads orders.json  │              │ • Regex Entity Match │  │  engine.py)             │
│ • Reads shipping.json│              │ • ChromaDB Vector DB │  │ • Computes P&L & KPIs   │
│ • Reads Cart State   │              │ • Live Chunk Refresh │  │ • Flags Pricing Errors  │
└──────────┬───────────┘              └──────────┬───────────┘  │ • Multi-turn Copilot    │
           │                                     │              └────────────┬────────────┘
           └──────────────────┬──────────────────┘                           │
                              ▼                                              │
               ┌───────────────────────────────┐                             │
               │   Prompt Assembly Engine      │                             │
               │ (src/prompts/prompt_templates)│                             │
               │ • Anti-repetition guardrails  │                             │
               │ • Policy & catalog context    │                             │
               └──────────────┬────────────────┘                             │
                              ▼                                              │
               ┌───────────────────────────────┐                             │
               │      Multi-Tier LLM Client    │                             │
               │    (src/llm/llm_client.py)    │◄────────────────────────────┘
               │ Tier 1: Groq API Pool         │
               │ Tier 2: OpenRouter Cloud      │
               │ Tier 3: Deterministic Engine  │
               └──────────────┬────────────────┘
                              ▼
               ┌───────────────────────────────┐
               │  Response Tag Parser & UI Map │
               │     (src/utils/helpers.py)    │
               │ • Extracts [SUGGEST_PRODUCT]  │
               │ • Extracts [ACTION]           │
               └──────────────┬────────────────┘
                              ▼
               ┌───────────────────────────────┐
               │ Return JSON payload to Client │
               └───────────────────────────────┘
```

---

## 3. Pipeline 1: Customer Storefront RAG Concierge (`POST /api/chat`)

This pipeline runs every time a shopper opens the chat assistant on the storefront and sends a message.

```text
[User clicks 'Send' in ChatWidget.tsx]
       │
       ▼
1. HTTP POST Request:
   • Endpoint: http://localhost:8000/api/chat
   • Headers: { "Content-Type": "application/json" }
   • Payload: {
       "message": "Where is my order ORD-2026-3923?",
       "history": [...past turns...],
       "customerId": "cust_001",
       "customerEmail": "deepak.a@example.com",
       "cartItems": [...]
     }
       │
       ▼
2. Request Validation (src/api/routes.py: chat_endpoint):
   • Pydantic validates input using class ChatRequest.
   • Cleans whitespace and normalizes query text.
       │
       ▼
3. Entity Detection & Account Context Gathering:
   • Function: routes.py checks regex: r"ORD-[0-9]{4}-[0-9]+" and r"TRK-[A-Z0-9-]+"
   • Match Found: 'ORD-2026-3923'
   • Action: Calls loader.get_customer_orders(customer_id="cust_001")
   • Reads from disk: /var/www/deepak_a/ai/eshop/server/data/orders.json
   • Reads from disk: /var/www/deepak_a/ai/eshop/server/data/shipping.json
   • Status Check: Detects current status is "DELIVERED" on 2026-10-17 in Chennai.
   • Creates [LIVE DATABASE UPDATE] context block so the LLM knows the current delivery state.
       │
       ▼
4. Hybrid Knowledge Retrieval (src/retrieval/retriever.py: retrieve):
   • Case A: Explicit Tracking or Order detected -> Bypasses static vectors and pulls
     live order record directly from loader.load_orders().
   • Case B: Product / Policy questions -> Calls vector_store.query(query_text, n_results=4)
     - Triggers embedder.py (_embed_text) to generate a 384-dimensional query vector.
     - ChromaDB performs cosine similarity search on the 'deepshop_knowledge' collection.
   • Cache Refresh: Calls _refresh_dynamic_chunks() to overwrite any outdated ChromaDB
     order chunks with current data from orders.json.
       │
       ▼
5. System Prompt Construction (src/prompts/prompt_templates.py: build_system_prompt):
   • Injects customer identity: "Deepak Aruldoss (cust_001)"
   • Injects customer cart contents: e.g. "1x Apex Prime 65W GaN Charger"
   • Injects live order status override: "Order #ORD-2026-3923 is DELIVERED. Do not say in-transit."
   • Injects retrieved store policies & catalog specifications.
   • Injects Anti-Repetition Rules: Checks conversation history; prevents repeating greetings.
       │
       ▼
6. LLM Generation with Multi-Tier Failover (src/llm/llm_client.py: generate):
   • Tier 1: Groq Cloud API (URL: https://api.groq.com/openai/v1/chat/completions)
     - Primary Model: qwen/qwen3.8-27b
     - Failover Cascade: llama-3.3-70b-versatile -> openai/gpt-oss-120b -> openai/gpt-oss-20b -> groq/compound-mini
   • Tier 2: OpenRouter Cloud API (Fallback if Groq is unavailable)
     - Model: qwen/qwen-2.5-7b-instruct:free
   • Tier 3: Deterministic Fallback Engine (Runs if external internet is down)
     - Synthesizes factual answer using regex directly from the assembled context.
       │
       ▼
7. Response Parsing & UI Tag Extraction (src/utils/helpers.py: parse_llm_response):
   • Scans response string for special UI tags:
     - [SUGGEST_PRODUCT: prod_001] -> Resolves product details from product cache.
     - [ACTION: track_order] -> Injects action button metadata for GPS tracker.
     - [ACTION: view_cart] -> Injects action button to open cart drawer.
   • Strips raw tags from the text so user sees a clean message.
   • Deduplicates citation sources.
       │
       ▼
8. JSON Response Sent to Client:
   • HTTP 200 OK
   • Payload: {
       "reply": "Order #ORD-2026-3923 is DELIVERED. It was completed on 2026-10-17 in Chennai...",
       "suggestedProduct": null,
       "action": { "type": "track_order", "label": "Open Order Tracker" },
       "sources": ["Order: ORD-2026-3923", "Shipment: TRK-DPS-4557260"]
     }
       │
       ▼
9. React Client Rendering (ChatWidget.tsx):
   • Renders assistant chat bubble with markdown formatting.
   • Renders interactive button: "Open Order Tracker" (clicking opens OrderHistoryModal.tsx).
```

---

## 4. Pipeline 2: Merchant ERP AI Analytics Overview (`GET /api/analytics/overview`)

This pipeline executes when an administrator opens the **AI Analytics & Statistics** view in the Admin ERP dashboard.

```text
[Admin clicks 'AI Analytics & Statistics' in ERP Navbar]
       │
       ▼
1. HTTP GET Request:
   • Endpoint: http://localhost:8000/api/analytics/overview
       │
       ▼
2. Endpoint Handler (src/api/routes.py: get_merchant_analytics_overview):
   • Dispatches request to analytics_engine.compute_overview()
       │
       ▼
3. Data Aggregation (src/analytics/engine.py -> src/ingestion/loader.py):
   • Concurrently loads 6 live JSON databases:
     - loader.load_orders() -> server/data/orders.json
     - loader.load_products() -> server/data/products.json
     - loader.load_categories() -> server/data/categories.json
     - loader.load_customers() -> server/data/customers.json
     - loader.load_expenses() -> server/data/expenses.json
     - loader.load_shipping() -> server/data/shipping.json
       │
       ▼
4. Financial & P&L Calculation:
   • Excludes Cancelled Orders:
     - Filters valid_orders = [o for o in orders if o.status != 'cancelled']
     - Gross Invoiced Sales: Sums totalAmount across active orders ($16,401.42).
     - Average Order Value (AOV): Gross Revenue / Active Orders ($2,343.06).
   • Operating Expenses Ledger:
     - Sums paid vouchers ($16,524.50) + scheduled vouchers ($850.00) = $17,374.50 total.
   • Net Operating Profit / EBIT:
     - Invoiced Sales ($16,401.42) - Total Expenses ($17,374.50) = -$973.08.
     - Operating Profit Margin: -5.9%.
   • Break-Even Diagnostic:
     - Revenue Gap: $973.08.
     - Orders Needed for Break-Even: ceil(Gap / AOV) = 1 order.
       │
       ▼
5. Catalog Velocity & Anomaly Detection:
   • Detects Pricing Errors:
     - Flagship item 'Apple iPhone 17 Pro Max' has price $20.00 (Median should be $999+).
     - Generates "URGENT FIX: Fix Incorrect Price on Apple iPhone 17 Pro Max" (99% Confidence).
   • Identifies Dead-Stock Capital Lockup:
     - Finds products with 0 units sold (NeoBook Pro 16, Alpha One 8K Camera, etc.).
     - Calculates locked inventory value: $68,957.00.
     - Generates action plan: "Launch 15% discount promo or bundle with best-selling monitors".
   • Stock Warnings:
     - Scans for products where stock <= 15 units (e.g. Lumix Infinity Drone: 13 left).
       │
       ▼
6. CRM & Customer Lifetime Value (LTV) Segmentation:
   • Maps each customer's order history:
     - Deepak Aruldoss: 7 orders, $16,076.00 spent -> Tagged "VIP BUYER" (Low Churn Risk).
     - Sara S: 1 order, $541.41 spent -> Tagged "ONE-TIME BUYER" (Medium Churn Risk).
     - Sharvin S: 0 orders, $0.00 spent -> Tagged "INACTIVE ACCOUNT" (High Churn Risk).
       │
       ▼
7. Composite AI Store Health Score Generation (0 - 100):
   • Sums 5 operational factors:
     - Revenue Performance: 25 / 25
     - Profit Resilience: 12 / 22 (Reflects negative EBIT gap)
     - Catalog Active Ratio: 13 / 20
     - Dispatch Rate: 15 / 15 (100% of non-cancelled orders dispatched or delivered)
     - Customer Conversion: 12 / 15
   • Final Health Score = 77 / 100 ("GOOD PERFORMANCE").
       │
       ▼
8. JSON Delivery to Client:
   • Returns complete payload: healthScore, kpis, skuIntelligence, customerInsights, aiActionPlan.
       │
       ▼
9. React Client Rendering (AdminAIAnalytics.tsx):
   • Renders Executive Banner with Health Score dial (77/100).
   • Renders 4 KPI cards matching P&L Statement down to the cent.
   • Renders prioritized Action Plan cards with "Ask AI Copilot for Details" shortcuts.
```

---

## 5. Pipeline 3: Merchant AI Business Copilot (`POST /api/analytics/ask`)

This pipeline runs when a store administrator asks a question in the **AI Business Copilot** drawer or clicks an action pill.

```text
[Admin types: "Show full details of pending orders" OR clicks 'Pending Orders' chip]
       │
       ▼
1. HTTP POST Request:
   • Endpoint: http://localhost:8000/api/analytics/ask
   • Payload: {
       "question": "Show full details of pending orders",
       "focusArea": "pending_orders",
       "history": [...past turns...],
       "lastTopic": null
     }
       │
       ▼
2. Endpoint Handler (src/api/routes.py: ask_merchant_ai_advisor):
   • Validates input with Pydantic model AnalyticsAskRequest.
   • Dispatches to analytics_engine.ask_advisor(question, focus_area, history, last_topic).
       │
       ▼
3. Intent Resolution & Topic Continuation (src/analytics/engine.py: ask_advisor):
   • Step 3A: Topic Normalization
     - Checks user question and focusArea for keywords: "pending", "transit", "delivered",
       "financial", "inventory", "crm", "growth_plan".
     - Detects intent: "pending_orders".
   • Step 3B: Follow-up Continuation
     - If user simply asks "give more details" or "show address", engine inspects
       lastTopic parameter to continue the exact same subject without losing context.
       │
       ▼
4. Live Data Extraction:
   • Filters all_orders from loader.load_orders() for status == "processing" or "pending".
   • Matched Order: #ORD-2026-1043 (Total: $1,721.90).
   • Calls self._format_order_detail(order, index):
     - Extracts customer details: "Deepak Aruldoss | deepak.a@example.com | +91 98765 43210"
     - Extracts line items: 1x Titan Watch ($499), 1x Lumix Drone ($899), 1x Keyboard ($169.50)
     - Extracts payment info: "PAID via CREDIT_CARD"
     - Extracts full shipping address: "AI Research Innovation Labs, 3rd Floor, Cyber City, Chennai, Tamil Nadu, 600113, India"
     - Extracts carrier & tracking: "Overnight Air Courier (TRK-DPS-5091559)"
       │
       ▼
5. Dynamic Follow-Up Suggestion Generation:
   • Inspects other live order counts in system:
     - In-Transit Orders count = 2
     - Delivered Orders count = 4
   • Emits dynamic suggestion chips:
     - [In-Transit Orders (2)] -> Topic: "transit_orders"
     - [Delivered Orders (4)] -> Topic: "delivered_orders"
     - [Profit Plan] -> Topic: "financial"
       │
       ▼
6. JSON Response Delivery:
   • Payload: {
       "question": "Show full details of pending orders",
       "topic": "pending_orders",
       "focusArea": "pending_orders",
       "answer": "You have 1 Pending / Processing Order (Total Value: $1,721.90):\n\n1. Order #ORD-2026-1043...",
       "followUpSuggestions": [
         { "label": "In-Transit Orders (2)", "topic": "transit_orders", "prompt": "..." },
         { "label": "Delivered Orders (4)", "topic": "delivered_orders", "prompt": "..." }
       ]
     }
       │
       ▼
7. React Client Rendering (AdminAIAnalytics.tsx):
   • Appends structured order card to the Copilot message stream.
   • Renders clickable follow-up chips at the bottom of the answer.
```

---

## 6. Pipeline 4: Service Startup & Vector Store Ingestion

This pipeline runs automatically when the service starts up via `run.sh` or when manually triggered via `python ingest.py` or `POST /api/ingest`.

```text
[FastAPI Lifespan Startup (main.py) OR CLI Ingest (ingest.py)]
       │
       ▼
1. Startup Event Triggered:
   • main.py executes @asynccontextmanager lifespan(app: FastAPI)
       │
       ▼
2. Load Raw Operational Records (src/ingestion/loader.py):
   • loader.load_products() -> 15 Products from data/products.json
   • loader.load_shipping() -> 8 Carrier records from data/shipping.json
   • loader.load_orders() -> 8 Customer orders from data/orders.json
   • loader.load_policies() -> 4 Policy sections from ai-service/data/store_policies.md
       │
       ▼
3. Domain-Specific Chunking (src/chunking/chunker.py):
   • chunker.chunk_products() -> Formats title, price, specs, stock status, ratings, and tags.
   • chunker.chunk_shipping() -> Formats tracking ID, carrier, checkpoints, and arrival dates.
   • chunker.chunk_orders() -> Formats order ID, items list, customer ID, and live status.
   • chunker.chunk_policies() -> Extracts Shipping, Warranty, Returns, and Support policies.
   • Total Generated Chunks = ~38 Chunks.
       │
       ▼
4. Vector Embedding Generation (src/embeddings/embedder.py):
   • For each text chunk, LightweightSemanticEmbeddingFunction converts text into a 384-dim vector:
     - Extracts exact IDs (ord-, trk-, prod-, cat-) with high salience weight (8.0).
     - Extracts header & title tokens with weight (5.0).
     - Extracts word bigrams (e.g., "noise cancelling", "curved monitor") with weight (3.5).
     - Extracts character 4-grams for typo-tolerance (weight 0.6).
     - Boosts domain concepts (Audio, Display, Shipping, Returns) with weight (6.0 - 9.0).
     - Normalizes vector to unit length.
       │
       ▼
5. Persistent Vector Storage (src/vectordb/vector_store.py):
   • VectorStore connects to ChromaDB PersistentClient at directory: ./chroma_db
   • Collection Name: deepshop_knowledge
   • Calls collection.upsert(ids=chunk_ids, documents=texts, metadatas=metadatas, embeddings=vectors)
       │
       ▼
6. Ready Status:
   • Logger emits: "✓ Vector store synchronized and ready with 38 Chunks."
   • FastAPI begins listening on http://0.0.0.0:8000.
```

---

## 7. Codebase Directory & File Responsibility Reference

| File Path | Primary Class / Functions | Inputs | Outputs | Key Role in System |
| :--- | :--- | :--- | :--- | :--- |
| `main.py` | `app`, `lifespan()`, `root()` | OS environment, port | Running FastAPI application | Boots service, initializes vector DB sync, configures CORS. |
| `src/api/routes.py` | `chat_endpoint()`, `get_merchant_analytics_overview()`, `ask_merchant_ai_advisor()`, `health_check()` | HTTP requests (`ChatRequest`, `AnalyticsAskRequest`) | JSON responses (`ChatResponse`, analytics dictionaries) | Defines all external REST API endpoints and input validation. |
| `src/analytics/engine.py` | `AnalyticsEngine`, `compute_overview()`, `ask_advisor()`, `_format_order_detail()` | Operational JSON datasets, user question, topic history | Complete P&L breakdown, AI Health Score, Action Plan, Copilot answers | Core business intelligence engine powering Admin ERP AI features. |
| `src/ingestion/loader.py` | `DataLoader`, `load_products()`, `load_orders()`, `load_shipping()`, `load_expenses()`, `get_customer_orders()` | Disk paths to JSON / MD files | Structured Python lists/dicts | Safe, cached loading of backend data stores. |
| `src/chunking/chunker.py` | `DataChunker`, `chunk_products()`, `chunk_shipping()`, `chunk_orders()`, `chunk_policies()` | Raw dictionaries from `DataLoader` | List of structured text chunks with metadata dicts | Prepares clean, domain-specific text representations for ChromaDB. |
| `src/embeddings/embedder.py` | `LightweightSemanticEmbeddingFunction`, `_embed_text()` | Text document string | 384-dimensional float vector list | Zero-dependency semantic embedder with typo tolerance & concept clusters. |
| `src/vectordb/vector_store.py`| `VectorStore`, `upsert_chunks()`, `query()`, `count()` | Text chunks, query string, top-k | Retrieved matching chunks with metadata | Persistent vector interface wrapping ChromaDB `PersistentClient`. |
| `src/retrieval/retriever.py` | `Retriever`, `retrieve()`, `_refresh_dynamic_chunks()`, `_get_live_order_and_shipping_chunks()` | User query string, optional top-k | List of fresh grounded context chunks | Hybrid retrieval coordinating regex entity lookup, ChromaDB, and live JSON. |
| `src/prompts/prompt_templates.py`| `build_system_prompt()`, `SYSTEM_PROMPT` | Grounded context string, customer profile | Complete LLM system prompt string | Enforces bot persona, anti-repetition rules, and grounded facts. |
| `src/llm/llm_client.py` | `LLMClient`, `generate()`, `_call_groq_or_openai()`, `_call_openrouter()`, `_deterministic_fallback()` | Prompt, system prompt, conversation history | Clean string reply from LLM | Resilient connection pool cascading across Groq, OpenRouter, and offline engine. |
| `src/utils/helpers.py` | `parse_llm_response()`, `get_product_by_id()`, `logger` | Raw LLM output string, retrieved chunks | Clean user reply, suggestedProduct, action payload | Parses meta-tags (`[SUGGEST_PRODUCT]`, `[ACTION]`) into rich UI objects. |

---

## 8. Step-by-Step Project Demo Walkthrough

Use this guide when explaining the system during live project demos and technical presentations:

### Demo Scenario 1: Customer Asks for Product Advice
1. **User Action:** Shopper opens the chat widget and types: *"Can you recommend noise-cancelling headphones?"*
2. **Technical Pipeline Executed:**
   - `POST /api/chat` receives the message.
   - `retriever.py` passes the query to `embedder.py` $\rightarrow$ queries ChromaDB.
   - Top chunk returned: `prod_001` (Aura Pro Studio Wireless Headphones).
   - `prompt_templates.py` injects headphones specs and store warranty policies into prompt.
   - `llm_client.py` calls Groq API (`qwen/qwen3.8-27b`).
   - LLM generates reply and appends `[SUGGEST_PRODUCT: prod_001]`.
   - `helpers.py` parses the tag and attaches product image, price, and specs.
3. **UI Result:** Chat assistant displays the response and renders an interactive **Aura Pro Studio Wireless Headphones** card with an "Add to Cart" button.

---

### Demo Scenario 2: Real-Time Order & Shipment Tracking
1. **User Action:** Shopper types: *"Where is my order ORD-2026-3923?"*
2. **Technical Pipeline Executed:**
   - `routes.py` runs regex match and detects `ORD-2026-3923`.
   - `loader.py` pulls the live record from `orders.json` and `shipping.json`.
   - Status is detected as **DELIVERED** in Chennai on 2026-10-17.
   - A `[LIVE DATABASE UPDATE]` override is injected into the context, instructing the LLM that the package is already delivered and no longer in transit.
   - LLM generates message and appends `[ACTION: track_order]`.
3. **UI Result:** Chat displays delivery date, carrier, and renders an **"Open Order Tracker"** action button that launches the interactive GPS timeline modal.

---

### Demo Scenario 3: Merchant Inspects ERP AI Analytics & Pricing Anomalies
1. **User Action:** Administrator navigates to **AI Analytics & Statistics** in the Admin ERP.
2. **Technical Pipeline Executed:**
   - React invokes `GET /api/analytics/overview`.
   - `engine.py:compute_overview()` reads all 6 JSON operational databases.
   - Filters out cancelled orders, calculates Gross Revenue ($16,401.42), Expenses ($17,374.50), and Net EBIT (-$973.08).
   - Detects pricing anomaly: Flagship `Apple iPhone 17 Pro Max` is listed for \$20.00.
   - Computes composite Store Health Score: **77/100**.
3. **UI Result:** ERP displays the Health Score dial, 4 synchronized KPI cards, and highlights an **"URGENT FIX: Product Pricing Error on iPhone 17 Pro Max"** action card.

---

### Demo Scenario 4: Multi-Turn AI Business Copilot Inquiry
1. **User Action:** Administrator clicks the quick chip **"Pending Orders & Addresses"** in the Copilot window.
2. **Technical Pipeline Executed:**
   - React sends `POST /api/analytics/ask` with `focusArea: "pending_orders"`.
   - `engine.py:ask_advisor()` matches the pending orders intent.
   - Extracts active order `ORD-2026-1043` ($1,721.90), pulls line items, customer phone/email, payment method (`PAID via CREDIT_CARD`), carrier tracking, and full shipping address in Chennai.
   - Generates contextual follow-up suggestion chips: `In-Transit Orders (2)`, `Delivered Orders (4)`, `Profit Plan`.
3. **User Follow-Up:** Administrator clicks `In-Transit Orders (2)`.
   - `ask_advisor()` uses `lastTopic` to maintain state and immediately outputs full details for the 2 in-transit shipments without re-asking what the user meant.
4. **UI Result:** Administrator receives instant, itemized dispatch details with delivery addresses and live follow-up chips.

---
*End of Technical Architecture & Pipeline Documentation.*
