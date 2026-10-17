# DeepShop AI Concierge — RAG Microservice

A production-grade **Retrieval-Augmented Generation (RAG)** conversational AI microservice built with **FastAPI**, **ChromaDB**, and a **Multi-Tier Cloud LLM Failover Engine**. It powers the interactive **DeepShop Concierge** shopping assistant, providing real-time order tracking, personalized product recommendations with interactive UI cards, cart inspection, and store policy support.

---

## 🚀 Technology Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **API Framework** | **FastAPI** + **Pydantic v2** | High-throughput REST API with strict request/response schema validation |
| **ASGI Server** | **Uvicorn** | Asynchronous HTTP server running on port `8000` |
| **Vector Database** | **ChromaDB** (`PersistentClient`) | Persistent vector storage, metadata filtering, and cosine/L2 similarity search |
| **Embedding Engine** | **`LightweightSemanticEmbeddingFunction`** (`384-dim`) | Custom 384-dimensional L2-normalized hybrid semantic, bigram, character 4-gram, and domain-concept embedder |
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
- Extracts live order statuses, shipment checkpoints, and shopping cart state directly from the assembled prompt context so customers always receive accurate answers even during complete internet outages.

---

## 🔎 Hybrid Semantic Embedding & Retrieval Engine

### 1. 384-Dimensional Semantic Embedder (`src/embeddings/embedder.py`)
The `LightweightSemanticEmbeddingFunction` transforms documents and user queries into L2-normalized **384-dimensional vectors** using:
- **Exact Identifier Boosting**: High-salience projection (`weight: 8.0`) for order numbers (`ORD-*`), tracking numbers (`TRK-*`), product IDs (`prod_*`), and category IDs (`cat_*`).
- **Header & Title Salience Weighting**: Prioritizes product titles, policy section headers, categories, and tags (`weight: 5.0`) over body descriptions (`weight: 1.2`) while stripping repetitive footer boilerplate.
- **Lexical Stemming & Word Bigrams**: Captures multi-word phrases (e.g., `"noise cancelling"`, `"curved monitor"`, `"wireless stand"`).
- **Character 4-Grams**: Provides typo tolerance for misspelled user queries (e.g., `"expance"`, `"whan"`, `"sory"`).
- **15 E-Commerce Domain Concept Clusters**: Maps synonymous terms into shared semantic concept dimensions (`__concept_mobile_phone__`, `__concept_audio__`, `__concept_display__`, `__concept_laptop__`, `__concept_wearable__`, `__concept_accessory__`, `__concept_camera__`, `__concept_smarthome__`, `__concept_warranty__`, `__concept_shipping__`, `__concept_returns__`, `__concept_order__`, `__concept_payment_cart__`, `__concept_featured__`, `__concept_support__`).

### 2. Live Entity & Hybrid Retrieval (`src/retrieval/retriever.py`)
When a customer sends a message, the `Retriever` executes a hybrid strategy:
- **Explicit Order / Tracking Detection**: Uses regex pattern matching for `ORD-YYYY-XXXX` and `TRK-DPS-XXXXXXX`. When matched, it bypasses static cache and reads live records directly from `data/orders.json` and `data/shipping.json`, ensuring instant reflection of status updates made in the Admin ERP dashboard (such as `SHIPPED` → `ON THE WAY` → `DELIVERED`).
- **Dynamic Chunk Refresh**: When standard vector similarity search returns order or shipping chunks from ChromaDB, `_refresh_dynamic_chunks()` automatically refreshes their contents against live JSON storage so stale statuses are never served.

---

## 🔄 End-to-End RAG Pipeline Flow

```text
User Message + Conversation History + Active Customer Profile + Cart Items
                                   │
                                   ▼
        ┌──────────────────────────────────────────────────────┐
        │ 1. Live Customer & Order Context Injection           │
        │    • Loads customer orders (sorted newest-first)     │
        │    • Joins live shipping checkpoints & delivery date │
        │    • Injects [LIVE DATABASE UPDATE] status override  │
        │    • Formats current shopping cart items             │
        └──────────────────────────────────────────────────────┘
                                   │
                                   ▼
        ┌──────────────────────────────────────────────────────┐
        │ 2. Hybrid Knowledge Retrieval (Retriever + ChromaDB) │
        │    • Direct live lookup for ORD-* / TRK-* queries    │
        │    • Top-K (k=4) vector similarity search in Chroma  │
        │    • Live refresh of dynamic order/shipping chunks   │
        └──────────────────────────────────────────────────────┘
                                   │
                                   ▼
        ┌──────────────────────────────────────────────────────┐
        │ 3. Grounded System Prompt Construction               │
        │    • Combines persona, anti-repetition rules,        │
        │      live order priority rules, store policies,      │
        │      and retrieved knowledge chunks                  │
        └──────────────────────────────────────────────────────┘
                                   │
                                   ▼
        ┌──────────────────────────────────────────────────────┐
        │ 4. Multi-Tier LLM Inference                          │
        │    • Tier 1: Groq Cloud API (5-model cascade)        │
        │    • Tier 2: OpenRouter API                          │
        │    • Tier 3: Deterministic Context Fallback          │
        └──────────────────────────────────────────────────────┘
                                   │
                                   ▼
        ┌──────────────────────────────────────────────────────┐
        │ 5. Response Parsing & Interactive UI Attachment      │
        │    • Extracts [SUGGEST_PRODUCT: <id>] -> ProductCard │
        │    • Extracts [ACTION: track_order | view_cart]      │
        │    • Attaches deduplicated source citations          │
        └──────────────────────────────────────────────────────┘
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
│   │   └── routes.py             # FastAPI router (/api/chat, /api/suggestions, /api/health, /api/ingest)
│   └── utils/
│       └── helpers.py            # Tag parser ([SUGGEST_PRODUCT], [ACTION]), product cache & logger
└── tests/
    └── test_app.py               # Unit tests for data loading, chunking, and live order status
```

---

## 📡 REST API Endpoints

### 1. `POST /api/chat`
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

### 2. `GET /api/suggestions`
Returns starter prompt suggestions displayed in the chat widget.

### 3. `GET /api/health`
Returns service health, active LLM provider/model, and total chunks indexed in ChromaDB:
```json
{
  "status": "healthy",
  "service": "DeepShop AI Concierge RAG API",
  "chunks_indexed": 34,
  "provider": "openai_compatible",
  "model": "qwen/qwen3.8-27b"
}
```

### 4. `POST /api/ingest`
Triggers a full re-index of all products (`data/products.json`), shipping records (`data/shipping.json`), customer orders (`data/orders.json`), and store policies (`ai-service/data/store_policies.md`) into ChromaDB.

---

## ⚙️ Running & Testing

### Start Full Stack (Recommended)
From the repository root:
```bash
npm run dev
```
This automatically creates `ai-service/venv` if missing, installs `requirements.txt`, synchronizes the ChromaDB vector store on startup, and serves the FastAPI RAG API at `http://localhost:8000` (proxied via Vite at `http://localhost:3000/api/ai/*`).

### Run Standalone Ingestion
```bash
npm --prefix ai-service run ingest
```

### Run Unit Tests
```bash
npm --prefix ai-service run test
```
