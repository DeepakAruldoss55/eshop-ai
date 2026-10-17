"""
Helper utilities for DeepShop RAG.
Provides response tag extraction, product resolution, and structured message formatting.
"""

import os
import re
import logging
from typing import Dict, Any, Optional, List
from src.ingestion.loader import loader

# Setup logging to file and console
LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "logs")
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "app.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("deepshop_ai")

# Cache products for fast lookup by ID
_PRODUCT_CACHE: Dict[str, Dict[str, Any]] = {}

def get_product_by_id(product_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves product record by ID."""
    global _PRODUCT_CACHE
    if not _PRODUCT_CACHE:
        products = loader.load_products()
        for p in products:
            _PRODUCT_CACHE[str(p.get("id"))] = p
    return _PRODUCT_CACHE.get(product_id)

def parse_llm_response(raw_text: str, retrieved_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Parses LLM output, extracts structured action buttons and suggested product cards,
    and returns a clean user-facing reply.
    """
    clean_text = raw_text
    suggested_product: Optional[Dict[str, Any]] = None
    action: Optional[Dict[str, Any]] = None

    # Check for [SUGGEST_PRODUCT: <id>] tag
    prod_match = re.search(r"\[SUGGEST_PRODUCT:\s*([a-zA-Z0-9_-]+)\]", clean_text)
    if prod_match:
        prod_id = prod_match.group(1).strip()
        matched_prod = get_product_by_id(prod_id)
        if matched_prod:
            suggested_product = matched_prod
            action = {
                "type": "view_product",
                "label": f"View {matched_prod.get('title', 'Product Details')}",
                "payload": matched_prod
            }
        clean_text = clean_text.replace(prod_match.group(0), "").strip()

    # Check for [ACTION: <action_type>] tag
    action_match = re.search(r"\[ACTION:\s*([a-zA-Z0-9_-]+)\]", clean_text)
    if action_match:
        act_type = action_match.group(1).strip().lower()
        if act_type == "track_order":
            action = {
                "type": "track_order",
                "label": "Open Order Tracker"
            }
        elif act_type == "view_cart":
            action = {
                "type": "view_cart",
                "label": "View Shopping Bag"
            }
        clean_text = clean_text.replace(action_match.group(0), "").strip()

    # If no product tag was explicitly found by LLM, but a product was the top retrieved chunk
    if not suggested_product and retrieved_chunks:
        top_meta = retrieved_chunks[0].get("metadata", {})
        if top_meta.get("doc_type") == "product" and top_meta.get("product_id"):
            prod_id = top_meta.get("product_id")
            # Only auto-suggest if the query/text explicitly talks about buying or specific specs
            p = get_product_by_id(prod_id)
            if p and p.get("title", "").lower() in clean_text.lower():
                suggested_product = p
                if not action:
                    action = {
                        "type": "view_product",
                        "label": "View Product Details",
                        "payload": p
                    }

    # Extract source titles for transparency
    sources: List[str] = []
    for c in retrieved_chunks:
        meta = c.get("metadata", {})
        doc_type = meta.get("doc_type", "")
        if doc_type == "product":
            sources.append(f"Product: {meta.get('title', 'Catalog')}")
        elif doc_type == "order":
            sources.append(f"Order: {meta.get('order_number', 'Order')}")
        elif doc_type == "shipping":
            sources.append(f"Shipment: {meta.get('tracking_number', 'Tracking')}")
        elif doc_type == "policy":
            sources.append(f"Policy: {meta.get('section', 'Store FAQ')}")

    return {
        "reply": clean_text,
        "suggestedProduct": suggested_product,
        "action": action,
        "sources": list(dict.fromkeys(sources))[:3]  # Deduplicate & cap to 3
    }
