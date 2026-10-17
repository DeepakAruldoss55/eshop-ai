# DeepShop AI Concierge RAG Service

FastAPI-powered conversational customer support service using Retrieval-Augmented Generation (RAG), ChromaDB vector database, and multi-model cloud LLM failover (Groq Cloud API → OpenRouter).

---

## 🏗️ Architecture & Project Structure

The project conforms strictly to the modular RAG production standard:

```
ai-service/
├── README.md                     # Documentation & setup guide
├── requirements.txt              # Pinned Python dependencies
├── .env                          # API keys, model provider, DB paths
├── .env.example                  # Template environment variables
├── .gitignore                    # Ignores venv, chroma_db, __pycache__, logs
├── config.yaml                   # Model names, chunk size, top_k, temperature
├── run.sh                        # Auto-setup & venv execution script for npm
├── package.json                  # npm scripts for root concurrently integration
├── ingest.py                     # Standalone knowledge ingestion script
├── main.py                       # FastAPI application entrypoint & lifecycle
├── data/
│   └── store_policies.md         # Store policies, warranties, returns, and FAQs
├── src/
│   ├── ingestion/
│   │   └── loader.py             # Loads products.json, shipping.json, orders.json, store policies
│   ├── chunking/
│   │   └── chunker.py            # Chunks product catalogs, shipping checkpoints, orders, policies
│   ├── embeddings/
│   │   └── embedder.py           # 384-dimensional semantic embedding service
│   ├── vectordb/
│   │   └── vector_store.py       # ChromaDB persistent collection manager
│   ├── retrieval/
│   │   └── retriever.py          # Similarity search with live order/tracking lookup
│   ├── prompts/
│   │   └── prompt_templates.py   # DeepShop Concierge system prompt & instructions
│   ├── llm/
│   │   └── llm_client.py         # Multi-model LLM client with automatic failover
│   ├── api/
│   │   └── routes.py             # FastAPI routes (/api/chat, /api/suggestions, /api/health)
│   └── utils/
│       └── helpers.py            # Response parser, product card extractor, logging
├── tests/
│   └── test_app.py               # Unit & integration tests
└── logs/
    └── app.log                   # Rolling log file
```

---

## ⚡ How It Runs (Single Command)

Simply run in the root repository:

```bash
npm run dev
```

This automatically installs dependencies, builds packages if needed, and concurrently launches:
1. `SERVER`: Express Node.js Backend (`http://localhost:5000`)
2. `CLIENT`: React Vite Frontend (`http://localhost:3000`)
3. `AI`: FastAPI RAG Backend (`http://localhost:8000`)

Requests from the React frontend to `/api/ai/*` are automatically proxied via Vite to `http://localhost:8000/api/*`.

---

## 📡 API Endpoints

- `GET /api/health`: Health status, indexed chunk counts, active model provider.
- `GET /api/suggestions`: Popular starter inquiries for customers.
- `POST /api/chat`: Grounded chat inquiry with auto-attached product cards & action buttons.
- `POST /api/ingest`: Re-indexes the catalog when products or policies change.
