"""
Main Application Entry Point for DeepShop RAG Chatbot Service.
FastAPI application with automated vector indexing and CORS configuration.
"""

import os
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(ENV_PATH)

from src.api.routes import router as api_router
from src.vectordb.vector_store import vector_store
from src.ingestion.loader import loader
from src.chunking.chunker import chunker
from src.utils.helpers import logger

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup & Shutdown Lifecycle.
    Ensures vector store is populated on first launch without requiring manual steps.
    """
    logger.info("⚡ Starting DeepShop AI Concierge RAG service...")
    try:
        products = loader.load_products()
        shipping = loader.load_shipping()
        orders = loader.load_orders()
        policies = loader.load_policies()

        prod_chunks = chunker.chunk_products(products)
        ship_chunks = chunker.chunk_shipping(shipping)
        ord_chunks = chunker.chunk_orders(orders)
        pol_chunks = chunker.chunk_policies(policies)

        all_chunks = prod_chunks + ship_chunks + ord_chunks + pol_chunks
        total = vector_store.upsert_chunks(all_chunks)
        logger.info(f"✓ Vector store synchronized and ready with {total} indexed chunks.")
    except Exception as e:
        logger.error(f"[!] Warning during vector startup indexing: {e}", exc_info=True)

    yield
    logger.info("🛑 DeepShop AI Concierge service shutting down.")

app = FastAPI(
    title="DeepShop AI Concierge RAG API",
    description="RAG-powered conversational customer service assistant for DeepShop E-Commerce",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend (localhost:3000, 127.0.0.1, LAN IPs)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes
app.include_router(api_router)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "DeepShop AI Concierge & Merchant Analytics API",
        "endpoints": {
            "chat": "POST /api/chat",
            "suggestions": "GET /api/suggestions",
            "analytics_overview": "GET /api/analytics/overview",
            "analytics_ask": "POST /api/analytics/ask",
            "health": "GET /api/health",
            "ingest": "POST /api/ingest"
        }
    }

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host=host, port=port, reload=True)

