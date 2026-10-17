# DeepShop AI Service — Customer RAG Concierge & Merchant Business Copilot

A production-grade **Retrieval-Augmented Generation (RAG)** and **Statistical Business Intelligence** microservice built with **FastAPI**, **ChromaDB**, and a **Multi-Tier Cloud LLM Failover Engine**.

This microservice powers two core AI capabilities across the DeepShop platform:
1. **DeepShop AI Concierge (Customer Storefront Assistant)** — Real-time order & shipment tracking, semantic product search with interactive product cards, shopping cart inspection, and store policy Q&A.
2. **AI Analytics & Business Copilot (Admin ERP Intelligence)** — Real-time P&L & executive KPI synthesis, SKU velocity and price-anomaly detection, dead-stock capital lockup analysis, customer LTV segmentation, and a multi-turn conversational Business Copilot for merchants.

---

## 🚀 Technology Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **API Framework** | **FastAPI** + **Pydantic v2** | High-throughput REST API with strict request/response schema validation |
| **ASGI Server** | **Uvicorn** | Asynchronous HTTP server running on port `8000` |
| **Vector Database** | **ChromaDB** (`PersistentClient`) | Persistent vector storage, metadata filtering, and cosine/L2 similarity search |
| **Embedding Engine** | **`LightweightSemanticEmbeddingFunction`** (`384-dim`) | Custom 384-dimensional L2-normalized hybrid semantic, bigram, character 4-gram, and domain-concept embedder |
| **Merchant BI Engine** | **`MerchantAnalyticsEngine`** (`src/analytics/engine.py`) | Real-time statistical KPI engine, SKU anomaly detector, CRM LTV analyzer, and multi-turn AI Business Copilot |
| **Primary LLM Engine** | **Groq Cloud API** (OpenAI-Compatible) | Ultra-low-latency inference with automatic multi-model failover |
| **Secondary LLM Engine** | **OpenRouter API** | Secondary cloud LLM fallback |
| **Resilience Fallback** | **Deterministic Context Responder** | Instant context-grounded response synthesis if external cloud APIs are unreachable |
| **Configuration** | **Python-dotenv** + **PyYAML** | Environment variable management (`.env`) and declarative pipeline settings (`config.yaml`) |

---

## 🧠 Models & Multi-Tier LLM Architecture

The LLM layer (`src/llm/llm_client.py`) implements an automated **multi-tier, multi-model failover pipeline** using persistent HTTP connection pooling (`requests.Session`) and low-temperature sampling (`temperature: 0.3`) for strict factual grounding:

### Tier 1: Groq Cloud API (Primary Multi-Model Pool)
Automatically cascades through candidate models in order if rate limits or transient errors occur:
1. **`qwen/qwen3.8-27b`** *(Primary)*
2. **`llama-3.3-70b-versatile`** *(Failover 1)*
3. **`openai/gpt-oss-120b`** *(Failover 2)*
4. **`openai/gpt-oss-20b`** *(Failover 3)*
5. **`groq/compound-mini`** *(Failover 4)*

### Tier 2: OpenRouter Cloud API (Secondary Cloud Fallback)
- **`qwen/qwen-2.5-7b-instruct:free`** — Invoked automatically if all Tier 1 endpoints are unreachable.

### Tier 3: Context-Grounded Deterministic Responder
- Extracts live order statuses, shipment checkpoints, shopping cart state, and merchant ERP metrics directly from the assembled context so both customers and store admins receive accurate answers even during complete internet outages.

---

## 📊 Merchant AI Analytics & Business Copilot (`src/analytics/engine.py`)

The `MerchantAnalyticsEngine` directly inspects live operational data (`products.json`, `orders.json`, `shipping.json`, `customers.json`, `expenses.json`, and `categories.json`) to synchronize 100% with the Admin ERP's **P&L Statement & Executive KPI** and **Sales Orders & Invoices** modules.

### Key Capabilities
1. **Synchronized Financial & Operational KPIs**:
   - Filters active (non-cancelled) orders and expenses so **Gross Sales Revenue**, **Total Operating Expenses**, **Net Operating Profit / Loss (EBIT)**, **Operating Profit Margin (%)**, and **Average Order Value (AOV)** match the ERP ledger down to the cent.
   - Calculates **AI Store Health Score (`0–100`)**, **30-Day Revenue Forecast**, **Break-Even Order Gap**, and **Inventory Capital Lockup Valuation**.
2. **SKU Velocity, Price-Anomaly & Dead-Stock Detection**:
   - Flags severe pricing anomalies (e.g., high-value flagship items listed far below category median price).
   - Identifies best-selling revenue drivers alongside zero-sale products tying up warehouse capital, with automated discount and bundle recommendations.
3. **Operating Expense & Burn Ratio Breakdown**:
   - Aggregates paid vs. scheduled/pending expense vouchers by category (`Payroll`, `Infrastructure`, `Operations`, `Marketing`, `Software`, `Logistics`) and simulates fixed-overhead reduction scenarios.
4. **Customer Lifetime Value (CRM) Segmentation**:
   - Ranks customers by active spend, revenue share percentage, and order frequency into actionable segments (`VIP Champion`, `Active Repeat Buyer`, `Inactive — Needs Onboarding`).
5. **Multi-Turn Conversational AI Business Copilot (`ask_advisor`)**:
   - Supports stateful follow-up continuation (`lastTopic` and conversation `history`) so short follow-ups like *"give details"*, *"what about shipped?"*, or *"show customer address"* automatically resolve to the active context.
   - Provides full order breakdowns including **Order ID, Date, Status, Tracking Number, Carrier, Latest Checkpoint, Customer Name/Email/Phone, Full Delivery Address, Payment Method, and Itemized Products**.

---

## 🔎 Hybrid Semantic Embedding & Customer RAG Engine

### 1. 384-Dimensional Semantic Embedder (`src/embeddings/embedder.py`)
The `LightweightSemanticEmbeddingFunction` transforms documents and user queries into L2-normalized **384-dimensional vectors** using:
- **Exact Identifier Boosting**: High-salience projection (`weight: 8.0`) for order numbers (`ORD-*`), tracking numbers (`TRK-*`), product IDs (`prod_*`), and category IDs (`cat_*`).
- **Header & Title Salience Weighting**: Prioritizes product titles, policy section headers, categories, and tags (`weight: 5.0`) over body descriptions (`weight: 1.2`) while stripping repetitive footer boilerplate.
- **Lexical Stemming & Word Bigrams**: Captures multi-word phrases (e.g., `"noise cancelling"`, `"curved monitor"`, `"wireless stand"`).
- **Character 4-Grams**: Provides typo tolerance for misspelled user queries (e.g., `"expance"`, `"whan"`, `"sory"`).
- **15 E-Commerce Domain Concept Clusters**: Maps synonymous terms into shared semantic concept dimensions (`__concept_mobile_phone__`, `__concept_audio__`, `__concept_display__`, `__concept_laptop__`, `__concept_wearable__`, `__concept_accessory__`, `__concept_camera__`, `__concept_smarthome__`, `__concept_warranty__`, `__concept_shipping__`, `__concept_returns__`, `__concept_order__`, `__concept_payment_cart__`, `__concept_featured__`, `__concept_support__`).

### 2. Live Entity & Hybrid Retrieval (`src/retrieval/retriever.py`)
When a customer sends a message, the `Retriever` executes a hybrid strategy:
- **Explicit Order / Tracking Detection**: Uses regex pattern matching for `ORD-YYYY-XXXX` and `TRK-DPS-XXXXXXX`. When matched, it bypasses static cache and reads live records directly from `server/data/orders.json` and `server/data/shipping.json`, ensuring instant reflection of status updates made in the Admin ERP dashboard (`PROCESSING` → `SHIPPED` → `ON THE WAY` → `DELIVERED`).
- **Dynamic Chunk Refresh**: When standard vector similarity search returns order or shipping chunks from ChromaDB, `_refresh_dynamic_chunks()` automatically refreshes their contents against live JSON storage so stale statuses are never served.

---

## 🔄 End-to-End Architecture Flow

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                        DEEPSHOP AI MICROSERVICE (FastAPI)                    │
├──────────────────────────────────────┬───────────────────────────────────────┤
│   1. CUSTOMER STOREFRONT CONCIERGE   │     2. MERCHANT AI ANALYTICS & BI     │
│            (POST /api/chat)          │  (/api/analytics/overview & /ask)     │
└──────────────────┬───────────────────┴───────────────────┬───────────────────┘
                   │                                       │
                   ▼                                       ▼
┌──────────────────────────────────────┐ ┌─────────────────────────────────────┐
│ • Live Customer & Cart Injection     │ │ • Live JSON Ledger Aggregation      │
│ • Hybrid ChromaDB Vector Search      │ │   (Orders, Expenses, SKUs, CRM)     │
│ • Dynamic Order/Shipment Refresh     │ │ • Active Non-Cancelled Filtering    │
│ • Grounded System Prompt Assembly    │ │ • Price Anomaly & Dead-Stock Scan   │
│ • Multi-Tier LLM Generation          │ │ • Multi-Turn Intent & Continuation  │
│ • UI Card & Action Tag Extraction    │ │ • Executive Action Plan Synthesis   │
└──────────────────────────────────────┘ └─────────────────────────────────────┘
```

---

## 📂 Directory Structure

```text
ai-service/
├── README.md                     # Comprehensive AI service documentation
├── requirements.txt              # Python package dependencies
├── .env                          # Environment configuration & API credentials
├── .env.example                  # Template environment configuration
├── .gitignore                    # Git ignore rules for virtual environment & runtime files
├── config.yaml                   # Declarative RAG, chunking, and LLM parameters
├── pyproject.toml                # Python project and type-checking configuration
├── pyrightconfig.json            # Pyright static type analysis settings
├── package.json                  # NPM scripts for root workspace integration
├── run.sh                        # Automated venv setup & FastAPI launch script
├── ingest.py                     # Standalone CLI script to rebuild ChromaDB index
├── main.py                       # FastAPI application entrypoint & lifespan indexer
├── data/
│   └── store_policies.md         # Grounded store policies (Shipping, Warranty, Returns, Support)
├── src/
│   ├── analytics/
│   │   ├── __init__.py
│   │   └── engine.py             # MerchantAnalyticsEngine (KPIs, SKU BI, CRM LTV & Business Copilot)
│   ├── ingestion/
│   │   └── loader.py             # DataLoader for products, orders, shipping, customers, policies
│   ├── chunking/
│   │   └── chunker.py            # DataChunker for products, shipping, orders, and markdown sections
│   ├── embeddings/
│   │   └── embedder.py           # 384-dim LightweightSemanticEmbeddingFunction for ChromaDB
│   ├── vectordb/
│   │   └── vector_store.py       # VectorStore wrapper around ChromaDB PersistentClient
│   ├── retrieval/
│   │   └── retriever.py          # Hybrid semantic & live order/tracking Retriever
│   ├── prompts/
│   │   └── prompt_templates.py   # System prompt persona, grounding & anti-repetition rules
│   ├── llm/
│   │   └── llm_client.py         # Multi-tier LLMClient with automatic model failover
│   ├── api/
│   │   └── routes.py             # FastAPI router (/api/chat, /api/analytics/*, /api/health, /api/ingest)
│   └── utils/
│       └── helpers.py            # Tag parser ([SUGGEST_PRODUCT], [ACTION]), product cache & logger
└── tests/
    └── test_app.py               # Unit tests for data loading, chunking, and live order status
```

---

## 📡 REST API Endpoints

### Customer RAG Concierge Endpoints

#### 1. `POST /api/chat`
Processes a customer message with full RAG retrieval, live order history injection, and structured UI card extraction.

**Request Body:**
```json
{
  "message": "ORD-2026-3923",
  "history": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi Deepak! How can I help you today?" }
  ],
  "customerId": "cust_001",
  "customerEmail": "deepak.a@example.com",
  "customerName": "Deepak Aruldoss",
  "cartItems": [
    { "productId": "prod_001", "title": "Aura Pro Studio Wireless Headphones", "quantity": 1, "price": 349.99 }
  ]
}
```

**Response Body:**
```json
{
  "reply": "Order #ORD-2026-3923 is **DELIVERED**. It was completed on 2026-10-17 at Chennai, Delivery Station via Standard Ground Express (Tracking: TRK-DPS-4557260).",
  "suggestedProduct": null,
  "action": {
    "type": "track_order",
    "label": "Open Order Tracker"
  },
  "sources": [
    "Order: ORD-2026-3923",
    "Shipment: TRK-DPS-4557260"
  ]
}
```

#### 2. `GET /api/suggestions`
Returns starter prompt suggestions displayed in the storefront chat widget.

#### 3. `POST /api/ingest`
Triggers a full re-index of all products (`server/data/products.json`), shipping records (`server/data/shipping.json`), customer orders (`server/data/orders.json`), and store policies (`ai-service/data/store_policies.md`) into ChromaDB.

---

### Merchant AI Analytics & Business Copilot Endpoints

#### 4. `GET /api/analytics/overview`
Computes real-time merchant statistical analytics, executive KPIs, category revenue share, SKU velocity & price-anomaly alerts, operating expense burn ratios, customer LTV rankings, and prioritized AI growth recommendations.

**Response Highlights:**
```json
{
  "healthScore": 68,
  "healthLabel": "Moderate Growth — Needs Profit Optimization",
  "kpis": {
    "grossRevenue": 16401.42,
    "totalExpenses": 17374.5,
    "netOperatingProfit": -973.08,
    "operatingMarginPct": -5.9,
    "avgOrderValue": 2343.06,
    "validOrders": 7,
    "cancelledOrders": 1,
    "ordersNeededForBreakeven": 1
  }
}
```

#### 5. `POST /api/analytics/ask`
Interactive multi-turn AI Business Copilot for store administrators. Supports topic continuation (`pending_orders`, `transit_orders`, `delivered_orders`, `orders`, `financial`, `inventory`, `crm`, `growth_plan`) and detailed order/product/customer inspection.

**Request Body:**
```json
{
  "question": "Show my pending orders awaiting dispatch",
  "focusArea": "pending_orders",
  "history": [],
  "lastTopic": null
}
```

**Response Body:**
```json
{
  "question": "Show my pending orders awaiting dispatch",
  "topic": "pending_orders",
  "focusArea": "pending_orders",
  "answer": "You have 1 Pending / Processing Order (Total Value: $1,721.90):\n\n1. Order #ORD-2026-3844 — Status: PROCESSING...",
  "followUpSuggestions": [
    { "label": "In-Transit Orders (2)", "prompt": "Show full details of all 2 shipped and on-the-way orders", "topic": "transit_orders" },
    { "label": "Delivered Orders (4)", "prompt": "Show full details of all 4 delivered orders", "topic": "delivered_orders" }
  ]
}
```

---

### System Health Endpoint

#### 6. `GET /api/health`
Returns service health and total chunks indexed in ChromaDB:
```json
{
  "status": "healthy",
  "service": "DeepShop AI Service",
  "chunks_indexed": 38
}
```

---

## ⚙️ Running & Testing

### Start Full Stack (Recommended)
From the repository root:
```bash
npm run dev
```
This automatically creates `ai-service/venv` if missing, installs `requirements.txt`, synchronizes the ChromaDB vector store on startup, and serves the FastAPI microservice at `http://localhost:8000` (proxied via Vite at `http://localhost:3000/api/ai/*`).

### Run Standalone Ingestion
```bash
npm --prefix ai-service run ingest
```

### Run Unit Tests
```bash
npm --prefix ai-service run test
```
