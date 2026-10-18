# DeepShop AI Service — Comprehensive Technical & System Architecture Documentation

**Project Name:** DeepShop AI Service  
**Repository Path:** `/eshop/ai-service`  
**Frameworks & Core Technologies:** Python 3.10+, FastAPI, Pydantic v2, ChromaDB, Uvicorn, Requests, PyYAML  
**Target Environment:** Microservice backend powering Storefront AI Concierge & Merchant ERP Business Copilot  
**Documentation Version:** 2.0 (Production Release / Capstone Project Demo Edition)

---

## 1. Executive System Overview & Core Philosophy

The **DeepShop AI Service** is a production-grade, dual-engine artificial intelligence microservice designed for contemporary e-commerce and enterprise resource planning (ERP). Rather than functioning as a generic wrapper around third-party language models, this service provides an integrated, context-grounded ecosystem that solves two distinct real-world business challenges:

```
                                  ┌────────────────────────────────────────────────────────┐
                                  │             DEEPSHOP AI SERVICE (FastAPI)              │
                                  └───────────────────────────┬────────────────────────────┘
                                                              │
                              ┌───────────────────────────────┴───────────────────────────────┐
                              ▼                                                               ▼
             ┌─────────────────────────────────┐                             ┌─────────────────────────────────┐
             │   1. CUSTOMER STOREFRONT RAG    │                             │    2. MERCHANT ERP ANALYTICS    │
             │           AI CONCIERGE          │                             │        & BUSINESS COPILOT       │
             ├─────────────────────────────────┤                             ├─────────────────────────────────┤
             │ • Semantic Product Discovery    │                             │ • Real-time Executive P&L / KPI │
             │ • Interactive UI Card Injection │                             │ • Automated Health Score (0-100)│
             │ • Live Order & GPS Tracking     │                             │ • SKU Anomaly & Dead-Stock Scan │
             │ • Store Policy Factual Grounding│                             │ • Customer LTV Segmentation     │
             │ • Anti-Repetition Guardrails    │                             │ • Multi-Turn Business Copilot   │
             └─────────────────────────────────┘                             └─────────────────────────────────┘
```

### Architectural Distinctions
1. **Zero-PyTorch, Ultra-Lightweight Embedding Engine**: Implements a custom 384-dimensional semantic projection algorithm with sub-millisecond execution times, zero CUDA dependencies, and complete portability across low-resource host environments.
2. **Hybrid Live-Ledger Retrieval**: Prevents vector cache staleness by dynamically refreshing ChromaDB chunks with real-time operational JSON storage when order numbers (`ORD-*`) or tracking identifiers (`TRK-*`) are detected.
3. **Three-Tier LLM Resilience Layer**: Guarantees 100% uptime through a cascade of 5 Groq Cloud models, an OpenRouter fallback tier, and an instant deterministic context-grounded response synthesizer.
4. **Bi-Directional ERP Synchronization**: Financial algorithms strictly exclude cancelled orders and pending credit adjustments, ensuring that the AI Business Copilot, the Executive P&L Dashboard, and the Sales Invoices ledger align down to the cent.

---

## 2. System Architecture & High-Level Data Flow

```
                                      ┌────────────────────────┐
                                      │   Client Applications  │
                                      │ (Storefront / Web ERP) │
                                      └───────────┬────────────┘
                                                  │ HTTP JSON (Port 8000)
                                                  ▼
                                      ┌────────────────────────┐
                                      │  FastAPI Router Layer  │
                                      │   (src/api/routes.py)  │
                                      └─────┬────────────┬─────┘
                                            │            │
                    ┌───────────────────────┘            └──────────────────────┐
                    │                                                           │
        (Customer Chat Flow)                                        (Merchant Analytics Flow)
                    ▼                                                           ▼
     ┌─────────────────────────────┐                             ┌─────────────────────────────┐
     │  Live Context Injection     │                             │   Merchant Analytics Engine │
     │  (Orders, Cart, History)    │                             │  (src/analytics/engine.py)  │
     └──────────────┬──────────────┘                             └──────────────┬──────────────┘
                    │                                                           │
                    ▼                                                           ├── Load Live JSON Ledgers
     ┌─────────────────────────────┐                                            ├── Compute P&L & Margins
     │      Hybrid Retriever       │                                            ├── Detect SKU Price Anomalies
     │  (src/retrieval/retriever)  │                                            ├── Calculate Store Health (0-100)
     └──────┬───────────────┬──────┘                                            └── Multi-Turn Advisor Intent
            │               │
            ▼               ▼
     ┌─────────────┐ ┌─────────────┐                                            │
     │ Live JSON   │ │  ChromaDB   │                                            │
     │ Dynamic Sync│ │ Vector DB   │                                            │
     └─────────────┘ └─────────────┘                                            │
            │               │                                                   │
            └───────┬───────┘                                                   │
                    ▼                                                           │
     ┌─────────────────────────────┐                                            │
     │   Grounded Prompt Builder   │                                            │
     │  (prompt_templates.py)      │                                            │
     └──────────────┬──────────────┘                                            │
                    │                                                           │
                    ▼                                                           │
     ┌─────────────────────────────┐                                            │
     │   Multi-Tier LLM Client     │                                            │
     │   (src/llm/llm_client.py)   │◄───────────────────────────────────────────┘
     │ • Groq Cascade (5 Models)   │
     │ • OpenRouter Fallback       │
     │ • Deterministic Generator   │
     └──────────────┬──────────────┘
                    │ Raw String
                    ▼
     ┌─────────────────────────────┐
     │  Parser & UI Tag Extractor  │
     │  (src/utils/helpers.py)     │
     │  • [SUGGEST_PRODUCT: <id>]  │
     │  • [ACTION: <type>]         │
     └──────────────┬──────────────┘
                    │
                    ▼ JSON Response
     ┌─────────────────────────────┐
     │  Frontend Interactive View  │
     └─────────────────────────────┘
```

---

## 3. Directory Layout & Module Responsibilities

The codebase follows a strictly modular layout where ingestion, chunking, representation, storage, retrieval, synthesis, and domain logic are decoupled:

```
ai-service/
├── .env                          # Runtime environment variables (Ignored in Git)
├── .env.example                  # Template configuration for deployment
├── .gitignore                    # Git tracking exemptions
├── README.md                     # User-facing summary and quickstart
├── TECHNICAL_DOCUMENTATION.md    # Full technical, mathematical, and coding documentation
├── config.yaml                   # Global declarative pipeline parameters
├── ingest.py                     # Standalone CLI script to trigger vector re-indexing
├── main.py                       # FastAPI application entry point, lifespan, & CORS
├── package.json                  # NPM workspace integration scripts
├── pyproject.toml                # Project metadata & Pyright type-checker configuration
├── pyrightconfig.json            # Static type inspection settings
├── requirements.txt              # Production Python package dependencies
├── run.sh                        # Virtual environment bootstrapper and Uvicorn daemon
├── data/
│   └── store_policies.md         # Source grounding documents (Shipping, Warranty, Returns, Support)
├── logs/
│   └── app.log                   # Rolling execution logs
├── src/
│   ├── analytics/
│   │   ├── __init__.py
│   │   └── engine.py             # Statistical BI, Health Score, SKU Anomaly, & Business Copilot
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py             # REST endpoints (/api/chat, /api/analytics/*, /api/health)
│   ├── chunking/
│   │   ├── __init__.py
│   │   └── chunker.py            # Domain-aware text chunking for catalog, orders, and policies
│   ├── embeddings/
│   │   ├── __init__.py
│   │   └── embedder.py           # 384-dimensional zero-dependency semantic embedder
│   ├── ingestion/
│   │   ├── __init__.py
│   │   └── loader.py             # Thread-safe JSON file loader with path resolution
│   ├── llm/
│   │   ├── __init__.py
│   │   └── llm_client.py         # Multi-tier resilient LLM connection pool
│   ├── prompts/
│   │   ├── __init__.py
│   │   └── prompt_templates.py   # System persona, anti-repetition rules, & context wrappers
│   ├── retrieval/
│   │   ├── __init__.py
│   │   └── retriever.py          # Hybrid regex entity matcher + ChromaDB vector search
│   ├── utils/
│   │   ├── __init__.py
│   │   └── helpers.py            # Response parser for UI tags, product cache, & structured logging
│   └── vectordb/
│       ├── __init__.py
│       └── vector_store.py       # ChromaDB PersistentClient wrapper with atomic upsertion
└── tests/
    ├── __init__.py
    └── test_app.py               # Automated pytest suite for data loaders and retrieval
```

---

## 4. Deep-Dive: Embeddings & Vector Representation

### Mathematical Foundations of the Custom Embedder (`src/embeddings/embedder.py`)
Traditional embedding libraries (e.g., `sentence-transformers`, `torch`) add over 1.5 GB of binary overhead and induce high cold-start latencies. To achieve instantaneous startup and minimal memory footprint, the service employs a **384-Dimensional Multi-Scale Semantic Projector** (`LightweightSemanticEmbeddingFunction`).

#### Feature Extraction Stages
1. **Exact Identifier Projection ($W_{id} = 8.0$)**:
   Identifiers matching pattern `(ord-|trk-|prod_|cat_)` receive the highest salience weight. This ensures near-orthogonal separation between different entities.
2. **Header and Title Salience ($W_{header} = 5.0$)**:
   Tokens extracted from the document header (`Product:`, `Category:`, `Key Tags:`, `Policy:`) are indexed with five times the weight of body text, preventing descriptive fluff from diluting search matches.
3. **Word Bigrams ($W_{bigram} = 3.5$)**:
   Adjacent token sequences $(t_i, t_{i+1})$ in titles (e.g., `noise_cancelling`, `curved_monitor`, `fast_charger`) are hashed to preserve semantic context.
4. **Sub-word Character 4-Grams ($W_{c4} = 0.6$)**:
   For tokens $\ge 4$ characters, overlapping 4-character windows are projected to provide inherent **typo tolerance** against queries such as `"hedphones"` or `"moniter"`.
5. **Domain Concept Expansion ($W_{concept} = 6.0 \text{ to } 9.0$)**:
   Documents and queries are evaluated against 15 e-commerce semantic concept clusters:
   - `__concept_mobile_phone__` $\rightarrow$ `{smartphone, iphone, apple, cellular, ios, a19}`
   - `__concept_audio__` $\rightarrow$ `{headphone, earbud, anc, acoustic, speaker}`
   - `__concept_display__` $\rightarrow$ `{monitor, oled, curved, ultrawide, screen}`
   - `__concept_shipping__` $\rightarrow$ `{dispatch, transit, courier, tracking, package}`
   - `__concept_returns__` $\rightarrow$ `{refund, exchange, cancellation, warranty}`

#### Dual-Hash Feature Projection Algorithm
To map arbitrary string tokens into a fixed $D = 384$ vector space with minimal hash collisions, the embedder uses the cryptographic `BLAKE2b` hash:

$$\text{digest} = \text{BLAKE2b}(s, \text{digest\_size}=16)$$

$$\text{index}_1 = \text{uint32}(\text{digest}[0:4]) \pmod D, \quad \text{sign}_1 = (-1)^{\text{digest}[4] \pmod 2}$$

$$\text{index}_2 = \text{uint32}(\text{digest}[8:12]) \pmod D, \quad \text{sign}_2 = (-1)^{\text{digest}[12] \pmod 2}$$

$$V[\text{index}_1] \mathrel{+}= \text{sign}_1 \cdot W, \quad V[\text{index}_2] \mathrel{+}= \text{sign}_2 \cdot (0.7 \cdot W)$$

#### L2 Vector Normalization
The resulting sparse-dense vector $V$ is projected onto the unit hypersphere:

$$\|V\|_2 = \sqrt{\sum_{i=0}^{D-1} V_i^2}$$

$$\hat{V} = \begin{cases} \frac{V}{\|V\|_2} & \text{if } \|V\|_2 > 10^{-9} \\ [1.0, 0, \dots, 0] & \text{otherwise} \end{cases}$$

This guarantees that cosine similarity during ChromaDB query execution equals the standard dot product $\hat{V}_q \cdot \hat{V}_d$.

---

## 5. Ingestion, Chunking & Hybrid Retrieval Engine

### Data Ingestion Strategy (`src/ingestion/loader.py`)
The `DataLoader` reads structured JSON models from `/var/www/deepak_a/ai/eshop/server/data` and Markdown policies from `data/store_policies.md`. It provides real-time resolution:
- `load_products()`: Ingests 15 electronic SKUs with prices, stock levels, specifications, ratings, and tags.
- `load_orders()`: Reads placed purchase orders with line items, fulfillment stages, customer references, and transaction timestamps.
- `load_shipping()`: Reads carrier tracking histories, checkpoint timestamps, dispatch facilities, and estimated arrivals.
- `load_expenses()`: Reads operating expense ledger vouchers (rent, salaries, AWS hosting, inventory restocking).
- `get_customer_orders(customer_id, customer_email)`: Returns an account's chronological purchase order history sorted newest-first.

### Context-Aware Semantic Chunking (`src/chunking/chunker.py`)
Documents are not split arbitrarily by raw token counts. Instead, the `DataChunker` generates structured markdown documents preserving critical business context:

```python
# Conceptual layout of a Product Knowledge Chunk
Product: Aura Pro Studio Wireless Headphones
Product ID: prod_001
Category: Premium Audio (cat_audio)
Price: $349.99 (Save 13% vs MSRP $399.99)
Stock Status: In Stock (35 units available)
Customer Rating: 4.9 / 5.0 (248 verified reviews)
Key Tags: Best Seller, ANC, Wireless, Studio Acoustics
Key Specifications:
- Drivers: 45mm custom dynamic drivers
- Battery Life: 45 hours playback with ANC enabled
- Charging: Quick-charge (10 mins = 5 hours playback)
Overview: Studio-grade closed-back wireless headphones engineered for creators...
```

### Hybrid Retrieval & Dynamic Cache Refresh (`src/retrieval/retriever.py`)
Static vector databases suffer from stale information when applied to fast-moving e-commerce records (e.g., an order changing from `ON THE WAY` to `DELIVERED`). The `Retriever` overcomes this using a two-stage hybrid protocol:

```
                          Incoming Query from User
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
       Regex Entity Scanner              ChromaDB Vector Retrieval
  (Matches ORD-* or TRK-*)                  (Top-K = 4 Semantic Chunks)
                    │                               │
                    ▼                               ▼
       Direct JSON Store Read            Dynamic Chunk Refresh
     (Bypasses Vector Storage)         (Cross-checks Chroma chunks
                    │                   against live orders.json)
                    │                               │
                    └───────────────┬───────────────┘
                                    ▼
                      Merged, Guaranteed-Fresh
                          Knowledge Chunks
```

---

## 6. Multi-Tier LLM Client & Failover Logic

The LLM abstraction layer (`src/llm/llm_client.py`) provides uninterrupted service availability through persistent HTTP connection pooling (`requests.Session`) and tiered fallback:

```
                    System Prompt + Grounded Context + User Query
                                          │
                                          ▼
                         ┌─────────────────────────────────┐
                         │   Tier 1: Groq Cloud API Pool   │
                         │      (Low Latency Inference)    │
                         └────────────────┬────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
             [Status 200]                                    [Error / 429]
                  ▼                                               ▼
          Return Response                          Cascade Candidate Models:
                                                   1. qwen/qwen3.8-27b
                                                   2. llama-3.3-70b-versatile
                                                   3. openai/gpt-oss-120b
                                                   4. openai/gpt-oss-20b
                                                   5. groq/compound-mini
                                                                  │
                                                        [All Tier 1 Failed]
                                                                  ▼
                                                   ┌───────────────────────────────┐
                                                   │ Tier 2: OpenRouter Cloud API  │
                                                   │ (qwen-2.5-7b-instruct:free)   │
                                                   └──────────────┬────────────────┘
                                                                  │
                                                        [All Cloud APIs Failed]
                                                                  ▼
                                                   ┌───────────────────────────────┐
                                                   │ Tier 3: Deterministic Context │
                                                   │           Responder           │
                                                   │ (100% Offline Rule Synthesis) │
                                                   └───────────────────────────────┘
```

### Deterministic Offline Fallback Algorithm
If network connections fail completely, `_deterministic_fallback()` parses the assembled prompt context using regular expressions:
- Extracts active order numbers and delivery checkpoints.
- Formats customer cart items and quantities.
- Matches keywords against store policies (warranty, returns, standard shipping rates).
- Emits structured reply tokens (`[ACTION: track_order]`, `[SUGGEST_PRODUCT: <id>]`).
This architecture prevents 500 internal server errors even during complete upstream API outages.

---

## 7. Prompt Engineering & Response Parsing

### System Persona Grounding (`src/prompts/prompt_templates.py`)
The system prompt establishes the persona of **DeepShop Concierge**:
- **Concise Politeness**: Limits answers to 2–3 sentences unless a detailed breakdown is requested.
- **Anti-Repetition Protocol**: Inspects conversation history. If earlier turns already greeted the customer (e.g., *"Hello Deepak! How can I assist you..."*), the assistant replies with a brief, natural variation (under 15 words) rather than repeating boilerplate greetings.
- **Strict Grounding Boundaries**: Refuses to hallucinate tracking events or catalog specifications not present in the injected context block.

### Interactive UI Tag Extraction (`src/utils/helpers.py`)
Rather than outputting raw text links, the LLM emits structured meta-tags that are parsed and converted into rich JSON payloads for the frontend:

| Tag Syntax | Extracted Object | Frontend Visual Component |
| :--- | :--- | :--- |
| `[SUGGEST_PRODUCT: prod_001]` | `suggestedProduct: {...}` | Rich interactive Product Card with image, price, rating, and Add-to-Cart |
| `[ACTION: track_order]` | `action: { type: "track_order" }` | Button triggering the live GPS order tracking modal |
| `[ACTION: view_cart]` | `action: { type: "view_cart" }` | Button opening the slide-over shopping cart drawer |

---

## 8. Merchant AI Analytics & Business Copilot (`src/analytics/engine.py`)

The `MerchantAnalyticsEngine` processes live operational data to generate business intelligence, risk alerts, and multi-turn conversational advisory.

### Key Financial & Operational Metric Formulas

#### 1. Invoiced Gross Revenue ($R_{gross}$)
Calculated strictly across non-cancelled orders:

$$R_{gross} = \sum_{o \in O_{valid}} \text{totalAmount}(o)$$

#### 2. Net Operating Profit / EBIT ($\Pi_{EBIT}$)
Measures store profitability by subtracting operating expenses ($E_{total} = E_{paid} + E_{pending}$) from gross sales:

$$\Pi_{EBIT} = R_{gross} - E_{total}$$

$$\text{Margin}_{\%} = \left( \frac{\Pi_{EBIT}}{R_{gross}} \right) \times 100$$

#### 3. Break-Even Order Requirement ($N_{breakeven}$)
Determines how many average-sized orders are required to cover negative operating cash flow:

$$\text{Gap} = \max(0, E_{total} - R_{gross})$$

$$N_{breakeven} = \left\lceil \frac{\text{Gap}}{\text{AOV}} \right\rceil, \quad \text{where } \text{AOV} = \frac{R_{gross}}{|O_{valid}|}$$

#### 4. Composite AI Store Health Score ($S_{health} \in [0, 100]$)
A multi-factor diagnostic algorithm evaluating store performance across 5 operational dimensions:

$$S_{health} = \text{clamp}(10, 100, S_{rev} + S_{profit} + S_{catalog} + S_{fulfillment} + S_{crm})$$

- **Revenue Momentum ($S_{rev} \le 25$)**: $\min(25, \text{round}(\frac{R_{gross}}{15000} \times 25))$
- **Profitability Resilience ($S_{profit} \le 22$)**:
  - $22$ points if $\Pi_{EBIT} > 0$ and expense-to-revenue ratio $< 70\%$
  - $12$ points if $\Pi_{EBIT} > -10,000$
  - $6$ points otherwise
- **Active SKU Ratio ($S_{catalog} \le 20$)**: $\min(20, \text{round}(\frac{N_{selling}}{N_{total}} \times 20) + 6)$
- **Order Dispatch Rate ($S_{fulfillment} \le 15$)**: $\min(15, \text{round}(\frac{N_{dispatched}}{|O_{valid}|} \times 15))$
- **Customer Conversion Rate ($S_{crm} \le 15$)**: $\min(15, \text{round}(\text{Conversion}_{\%} \times 0.15))$

### Automated SKU Anomaly & Inventory Risk Detection
The engine scans the catalog for operational anomalies:
- **Pricing Anomaly Detection**:
  Flags flagship SKUs priced drastically below category medians:
  $$\text{If } \text{price} < \$50 \text{ and } \text{title contains } ("\text{iPhone}", "\text{MacBook}", "\text{Camera}") \rightarrow \text{URGENT\_FIX (99\% Confidence)}$$
  *(Example: Catches Apple iPhone 17 Pro Max listed at \$20.00).*
- **Dead-Stock Capital Lockup**:
  Identifies SKUs with zero units sold and computes locked warehouse capital ($V_{locked} = \text{stock} \times \text{price}$). Recommends automated 15% discount bundles for high-ticket unsold items.
- **Restock Warning**:
  Triggers when available warehouse inventory falls below 15 units.

### Customer Lifetime Value (CRM) Segmentation
Customers are categorized based on purchase frequency and monetary contribution:
- **VIP Buyer**: Total spend $\ge \$1,000$ or orders $\ge 3$. (Churn Risk: LOW. Action: Loyalty rewards & early access).
- **One-Time Buyer**: Exactly 1 purchase. (Churn Risk: MEDIUM. Action: 10% second-order coupon).
- **Inactive Account**: Registered but zero purchases. (Churn Risk: HIGH. Action: Onboarding discount code).

### Multi-Turn Conversational Business Copilot (`ask_advisor`)
The copilot supports stateful topic continuation:
- **Context Continuation**: If a merchant asks *"give details"* or *"show pending orders"*, the engine checks `lastTopic` and past turns to maintain context.
- **Itemized Drilldowns**: Returns structured order cards containing line items, payment status (e.g., `PAID via UPI`), customer contact information, carrier tracking numbers, and delivery addresses.
- **Dynamic Follow-Up Chips**: Emits context-aware suggestion pills (e.g., `In-Transit Orders (2)`, `Delivered Orders (4)`, `Profit Plan`, `Unsold Stock`).

---

## 9. Comprehensive REST API Reference

The service runs on port `8000` (proxied by the frontend development server via `/api/ai/*`).

### 1. `POST /api/chat`
Handles customer storefront conversational turns with RAG retrieval and UI card attachment.

**Request Schema:**
```json
{
  "message": "Can you recommend noise-cancelling headphones and check my order ORD-2026-3923?",
  "history": [
    { "role": "user", "content": "Hi there" },
    { "role": "assistant", "content": "Hey Deepak! What can I help you find today?" }
  ],
  "customerId": "cust_001",
  "customerEmail": "deepak.a@example.com",
  "customerName": "Deepak Aruldoss",
  "cartItems": [
    {
      "productId": "prod_008",
      "title": "Apex Prime 65W GaN Fast Charger",
      "quantity": 1,
      "price": 49.99
    }
  ]
}
```

**Response Schema:**
```json
{
  "reply": "I highly recommend the **Aura Pro Studio Wireless Headphones** ($349.99), featuring 45mm studio drivers, active noise cancellation, and 45-hour battery life. Regarding your order **#ORD-2026-3923**, it was successfully **DELIVERED** on 2026-10-17 at Chennai Delivery Station via Standard Ground Express.",
  "suggestedProduct": {
    "id": "prod_001",
    "title": "Aura Pro Studio Wireless Headphones",
    "price": 349.99,
    "rating": 4.9,
    "reviewCount": 248,
    "image": "/images/products/headphones.png"
  },
  "action": {
    "type": "track_order",
    "label": "Open Order Tracker"
  },
  "sources": [
    "Product: Aura Pro Studio Wireless Headphones",
    "Order: ORD-2026-3923",
    "Shipment: TRK-DPS-4557260"
  ]
}
```

---

### 2. `GET /api/analytics/overview`
Returns complete merchant executive metrics, SKU velocity matrices, expense allocations, and prioritized action recommendations.

**Response Schema (Truncated):**
```json
{
  "healthScore": 77,
  "healthStatus": "GOOD PERFORMANCE",
  "kpis": {
    "grossRevenue": 16401.42,
    "totalExpenses": 17374.50,
    "netOperatingProfit": -973.08,
    "operatingMarginPct": -5.9,
    "avgOrderValue": 2343.06,
    "validOrders": 7,
    "cancelledOrders": 1,
    "ordersNeededForBreakeven": 1,
    "forecast30dRevenue": 23782.06,
    "lockedCapitalValuation": 68957.00
  },
  "aiActionPlan": [
    {
      "id": "action_profit_breakeven",
      "priority": "HIGH PRIORITY",
      "category": "Profitability & Expenses",
      "confidence": 98,
      "title": "Close the $973.08 Gap Between Sales and Expenses",
      "issue": "Total expenses ($17,374.50) currently exceed gross invoiced sales ($16,401.42).",
      "solution": "Promote high-margin flagship bundles to generate 1 more average order.",
      "expectedImpact": "+$973 to reach profitability"
    },
    {
      "id": "action_price_anomaly_iphone",
      "priority": "URGENT FIX",
      "category": "Product Pricing Error",
      "confidence": 99,
      "title": "Fix Incorrect Price on 'Apple iPhone 17 Pro Max' (Listed at $20)",
      "issue": "AI detected flagship SKU is priced at only $20.00 with 25 units in stock.",
      "solution": "Update unit price to correct market value ($999 - $1,199).",
      "expectedImpact": "Prevents catastrophic pricing margin loss"
    }
  ]
}
```

---

### 3. `POST /api/analytics/ask`
Interactive conversational copilot endpoint for business intelligence queries.

**Request Schema:**
```json
{
  "question": "Show full details of pending orders awaiting dispatch",
  "focusArea": "pending_orders",
  "history": [],
  "lastTopic": null
}
```

**Response Schema:**
```json
{
  "question": "Show full details of pending orders awaiting dispatch",
  "topic": "pending_orders",
  "focusArea": "pending_orders",
  "answer": "You have 1 Pending / Processing Order (Total Value: $1,721.90):\n\n1. Order #ORD-2026-1043 (Date: 2026-10-17) — Status: PROCESSING\n• Product(s): 1x Titan Precision Chrono Smartwatch ($499.00), 1x Lumix Infinity 4K Cinema Drone ($899.00), 1x Spectra Mechanical Custom Keyboard ($169.50)\n• Total Amount: $1,721.90 (PAID via CREDIT_CARD)\n• Customer: Deepak Aruldoss | Email: deepak.a@example.com | Phone: +91 98765 43210\n• Delivery Address: AI Research Innovation Labs, 3rd Floor, Cyber City, Chennai, Tamil Nadu, 600113, India\n• Shipping & Tracking: Overnight Air Courier (Tracking: TRK-DPS-5091559)\n\nNext Step:\nOrder is paid and ready at Fulfillment Center Hub 1 for dispatch.",
  "followUpSuggestions": [
    {
      "label": "In-Transit Orders (2)",
      "prompt": "Show full details of all 2 shipped and on-the-way orders",
      "topic": "transit_orders"
    },
    {
      "label": "Delivered Orders (4)",
      "prompt": "Show full details of all 4 delivered orders",
      "topic": "delivered_orders"
    }
  ],
  "generatedAt": "2026-10-18T03:45:00Z"
}
```

---

### 4. `GET /api/suggestions`
Returns starter prompt suggestions for customer chat widgets.

### 5. `GET /api/health`
Returns service health, indexed vector count, and active LLM provider.

### 6. `POST /api/ingest`
Triggers full vector database re-indexing across products, shipping records, orders, and store policies.

---

## 10. Verification, Testing & Quality Assurance

The service contains unit tests (`tests/test_app.py`) verifying chunking integrity, order status tracking, and API endpoints.

```bash
# Activate virtual environment
cd /var/www/deepak_a/ai/eshop/ai-service
source venv/bin/activate

# 1. Run automated test suite
python -m pytest tests/ -v

# 2. Verify static typing with pyright
pyright src/

# 3. Test standalone vector ingestion
python ingest.py

# 4. Verify clean syntax compilation
python -m py_compile main.py src/analytics/engine.py src/embeddings/embedder.py
```

---

## 11. Project Demo Guide & Walkthrough Script

Use this step-by-step walkthrough to present the project during evaluations or live demonstrations:

### Act 1: The Customer Storefront & AI Concierge (RAG in Action)
1. **Navigate to the Storefront (`http://localhost:3000`)**:
   - Highlight the modern UI, Department filters, real-time stock badges, and customer identity switcher (`Deepak Aruldoss`).
2. **Open the AI Concierge (Bottom-Right Widget)**:
   - Notice the greeting and prompt chips (`My Orders`, `Recommend Headphones`, `Shipping & Warranty`).
3. **Ask a Product Query**:
   - Type: *"Recommend the best wireless headphones for studio work."*
   - **What to show**: The AI returns concise grounded specs and dynamically renders the **Aura Pro Studio Wireless Headphones** interactive card with direct Add-to-Cart functionality.
4. **Demonstrate Real-Time Order Tracking**:
   - Type: *"Track my order ORD-2026-3923"* or click `My Orders`.
   - **What to show**: The AI detects the order number, inspects live shipping checkpoints, states that the package is **DELIVERED in Chennai**, and attaches the `[ACTION: track_order]` button to trigger the GPS tracker.

### Act 2: The Admin ERP & Real-Time AI Business Intelligence
1. **Switch to Admin ERP (`Click 'Admin ERP' in Navbar`)**:
   - Navigate to **AI Analytics & Statistics**.
2. **Explain the Executive AI Banner**:
   - Show the **AI Store Health Score (77/100)**.
   - Point out the **Finance AI** alert ($-\$973.08$ gap to breakeven, requiring $+1$ average order).
   - Point out the **Inventory AI** alert (Top seller vs. \$68,957 locked in zero-sale inventory).
3. **Demonstrate Automated Anomaly Detection**:
   - Point out Insight #2 in the AI Action Plan: **"Fix Incorrect Price on 'Apple iPhone 17 Pro Max' (Listed at \$20)"**. Explain how the rule engine flagged this critical catalog error automatically.
4. **Interact with the AI Business Copilot**:
   - Click the chip: `Pending Orders & Addresses` or type *"Show full details of pending orders"*.
   - **What to show**: The Copilot itemizes the pending order with customer contact info, payment method (`PAID via CREDIT_CARD`), carrier tracking, and full shipping address in Chennai.
   - Click a follow-up chip: `In-Transit Orders (2)`.
   - **What to show**: The Copilot seamlessly maintains conversation continuation without losing context.

### Act 3: System Architecture & Technical Defense
1. **Show Zero-Dependency Embeddings**:
   - Open [`src/embeddings/embedder.py`](file:///var/www/deepak_a/ai/eshop/ai-service/src/embeddings/embedder.py) and explain the 384-dimensional dual-hash projection and domain concept boosting.
2. **Show Multi-Tier Resilience**:
   - Open [`src/llm/llm_client.py`](file:///var/www/deepak_a/ai/eshop/ai-service/src/llm/llm_client.py) and explain the 5-model Groq cascade, OpenRouter fallback, and deterministic offline synthesizer.
3. **Show Code Quality**:
   - Point out strict type annotations, clean Pydantic v2 schemas, zero compiler warnings, and modular directory separation.

---
*DeepShop AI Service — Built with passion for high-performance, resilient, and grounded Artificial Intelligence.*

