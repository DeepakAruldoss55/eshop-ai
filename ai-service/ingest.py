"""
Standalone Ingestion Script for DeepShop RAG.
Can be executed to refresh embeddings when products or store policies change.
"""

import os
from dotenv import load_dotenv

ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(ENV_PATH)

from src.ingestion.loader import loader
from src.chunking.chunker import chunker
from src.vectordb.vector_store import vector_store

def run_ingestion():
    print("==================================================")
    print("🚀 DeepShop Knowledge Base Ingestion Pipeline")
    print("==================================================")

    # 1. Load Data
    print("[1/3] Loading raw data files...")
    products = loader.load_products()
    shipping = loader.load_shipping()
    orders = loader.load_orders()
    policies = loader.load_policies()
    print(f"      • Loaded {len(products)} products")
    print(f"      • Loaded {len(shipping)} shipping tracking records")
    print(f"      • Loaded {len(orders)} customer purchase orders")
    print(f"      • Loaded {len(policies)} bytes of store policies")

    # 2. Chunk Data
    print("[2/3] Generating semantic chunks with metadata...")
    prod_chunks = chunker.chunk_products(products)
    ship_chunks = chunker.chunk_shipping(shipping)
    ord_chunks = chunker.chunk_orders(orders)
    pol_chunks = chunker.chunk_policies(policies)
    all_chunks = prod_chunks + ship_chunks + ord_chunks + pol_chunks
    print(f"      • {len(prod_chunks)} product chunks")
    print(f"      • {len(ship_chunks)} shipping chunks")
    print(f"      • {len(ord_chunks)} customer order chunks")
    print(f"      • {len(pol_chunks)} policy chunks")
    print(f"      • Total chunks to index: {len(all_chunks)}")

    # 3. Embed & Upsert
    print("[3/3] Generating neural embeddings & upserting into ChromaDB...")
    indexed_count = vector_store.upsert_chunks(all_chunks)
    print(f"      • Successfully indexed {indexed_count} chunks into ChromaDB!")
    print(f"      • Active collection total count: {vector_store.count()}")
    print("==================================================")
    print("✓ Ingestion complete!")
    print("==================================================")

if __name__ == "__main__":
    run_ingestion()
