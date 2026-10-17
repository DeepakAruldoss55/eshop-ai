"""
Retriever Module for DeepShop RAG.
Performs semantic retrieval and live hybrid entity lookup for orders, tracking, and catalog items.
"""

import re
from typing import List, Dict, Any, Optional
from src.vectordb.vector_store import vector_store
from src.ingestion.loader import loader
from src.chunking.chunker import chunker

class Retriever:
    def __init__(self, top_k: int = 4):
        self.default_top_k = top_k

    def _get_live_order_and_shipping_chunks(
        self,
        order_number: Optional[str] = None,
        tracking_number: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Builds live, up-to-the-second order and shipping chunks directly from JSON storage."""
        orders = loader.load_orders()
        shipping_records = loader.load_shipping()

        matched_orders = []
        matched_shipping = []

        if order_number:
            ord_upper = order_number.upper()
            matched_orders = [o for o in orders if str(o.get("orderNumber", "")).upper() == ord_upper]
            matched_shipping = [s for s in shipping_records if str(s.get("orderNumber", "")).upper() == ord_upper]
        elif tracking_number:
            trk_upper = tracking_number.upper()
            matched_orders = [o for o in orders if str(o.get("trackingNumber", "")).upper() == trk_upper]
            matched_shipping = [s for s in shipping_records if str(s.get("trackingNumber", "")).upper() == trk_upper]

        live_chunks: List[Dict[str, Any]] = []
        if matched_orders:
            live_chunks.extend(chunker.chunk_orders(matched_orders))
        if matched_shipping:
            live_chunks.extend(chunker.chunk_shipping(matched_shipping))

        return live_chunks

    def _refresh_dynamic_chunks(self, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Replaces any cached order or shipping chunks from ChromaDB with live JSON state."""
        if not chunks:
            return chunks

        has_dynamic = any(c.get("metadata", {}).get("doc_type") in ("order", "shipping") for c in chunks)
        if not has_dynamic:
            return chunks

        orders_by_num = {str(o.get("orderNumber", "")).upper(): o for o in loader.load_orders()}
        ship_by_trk = {str(s.get("trackingNumber", "")).upper(): s for s in loader.load_shipping()}
        ship_by_ord = {str(s.get("orderNumber", "")).upper(): s for s in loader.load_shipping()}

        refreshed: List[Dict[str, Any]] = []
        for c in chunks:
            meta = c.get("metadata", {})
            doc_type = meta.get("doc_type")
            ord_num = str(meta.get("order_number", "")).upper()
            trk_num = str(meta.get("tracking_number", "")).upper()

            if doc_type == "order" and ord_num in orders_by_num:
                fresh = chunker.chunk_orders([orders_by_num[ord_num]])
                if fresh:
                    refreshed.append({**c, "content": fresh[0]["content"], "metadata": fresh[0]["metadata"]})
                    continue
            elif doc_type == "shipping":
                ship_rec = ship_by_trk.get(trk_num) or ship_by_ord.get(ord_num)
                if ship_rec:
                    fresh = chunker.chunk_shipping([ship_rec])
                    if fresh:
                        refreshed.append({**c, "content": fresh[0]["content"], "metadata": fresh[0]["metadata"]})
                        continue

            refreshed.append(c)

        return refreshed

    def retrieve(self, query: str, top_k: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Retrieves relevant grounded chunks.
        Applies live lookup if explicit order or tracking identifiers are detected.
        """
        k = top_k or self.default_top_k
        query_clean = query.strip()
        if not query_clean:
            return []

        # Check for explicit Tracking Number pattern (e.g. TRK-DPS-4589741)
        tracking_match = re.search(r"TRK-[A-Z0-9-]+", query_clean, re.IGNORECASE)
        # Check for explicit Order Number pattern (e.g. ORD-2026-5054)
        order_match = re.search(r"ORD-[0-9]{4}-[0-9]+", query_clean, re.IGNORECASE)

        if tracking_match:
            trk_val = tracking_match.group(0).upper()
            live_trk_results = self._get_live_order_and_shipping_chunks(tracking_number=trk_val)
            if live_trk_results:
                return live_trk_results

        if order_match:
            ord_val = order_match.group(0).upper()
            live_ord_results = self._get_live_order_and_shipping_chunks(order_number=ord_val)
            if live_ord_results:
                return live_ord_results

        # Standard semantic search across all knowledge, with live refresh for dynamic chunks
        raw_results = vector_store.query(query_text=query_clean, top_k=k)
        return self._refresh_dynamic_chunks(raw_results)

retriever = Retriever()

