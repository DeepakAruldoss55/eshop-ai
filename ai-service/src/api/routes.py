"""
API Routes Module for DeepShop RAG Chatbot.
FastAPI endpoints for customer chat, prompt suggestions, health checks, and catalog re-indexing.
Includes full access to customer accounts, order history, and active shipments.
"""

import re
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.retrieval.retriever import retriever
from src.prompts.prompt_templates import build_system_prompt
from src.llm.llm_client import llm_client
from src.vectordb.vector_store import vector_store
from src.utils.helpers import parse_llm_response, logger
from src.ingestion.loader import loader
from src.chunking.chunker import chunker
from src.analytics.engine import analytics_engine

router = APIRouter(prefix="/api", tags=["Chatbot & Merchant AI Analytics API"])

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str = Field(..., description="Customer message or inquiry")
    history: Optional[List[ChatMessage]] = Field(default=[], description="Recent conversation turns")
    customerId: Optional[str] = Field(default=None, description="Active logged-in customer ID")
    customerEmail: Optional[str] = Field(default=None, description="Active logged-in customer email")
    customerName: Optional[str] = Field(default=None, description="Active logged-in customer name")
    cartItems: Optional[List[Dict[str, Any]]] = Field(default=None, description="Items currently in cart")

class ChatResponse(BaseModel):
    reply: str
    suggestedProduct: Optional[Dict[str, Any]] = None
    action: Optional[Dict[str, Any]] = None
    sources: List[str] = []

class HealthResponse(BaseModel):
    status: str
    service: str
    chunks_indexed: int

@router.get("/health", response_model=HealthResponse)
def health_check():
    """Returns AI service health and vector store stats."""
    count = vector_store.count()
    return HealthResponse(
        status="healthy",
        service="DeepShop AI Service",
        chunks_indexed=count
    )

@router.get("/suggestions")
def get_chat_suggestions():
    """Returns popular starter prompts for customers."""
    return {
        "suggestions": [
            "How many orders do I have?",
            "Can you recommend the best noise-cancelling headphones?",
            "Where is my active package shipment?",
            "What are your delivery times and warranty coverage?"
        ]
    }

@router.post("/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest):
    """
    Core RAG Chat Endpoint:
    1. Retrieves relevant grounded knowledge chunks.
    2. Injects full customer order history & account context.
    3. Builds grounded system prompt with store policies, orders & catalog.
    4. Calls resilient multi-tier LLM.
    5. Formats clean response with embedded interactive product cards or action buttons.
    """
    user_query = req.message.strip()
    if not user_query:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        q_lower = user_query.lower()
        explicit_ord_match = re.search(r"ORD-[0-9]{4}-[0-9]+", user_query, re.IGNORECASE)
        explicit_trk_match = re.search(r"TRK-[A-Z0-9-]+", user_query, re.IGNORECASE)

        is_order_or_account_query = bool(explicit_ord_match or explicit_trk_match) or any(k in q_lower for k in [
            "order", "ord-", "trk-", "bought", "buy", "purchase", "package", "track", "shipment",
            "history", "deliver", "expected", "status", "account", "profile", "my"
        ])

        customer_context_parts: List[str] = []
        target_live_order_note: str = ""

        # If user is asking about orders/account or provided customer identity
        if is_order_or_account_query or req.customerId or req.customerEmail:
            # Default to primary active user Deepak Aruldoss if not specified
            c_id = req.customerId or "cust_001"
            c_email = req.customerEmail or "deepak.a@example.com"
            c_name = req.customerName or "Deepak Aruldoss"

            customer_orders = loader.get_customer_orders(customer_id=c_id, customer_email=c_email)

            # Also check if user asked about a specific order/tracking number that might belong to any account
            if explicit_ord_match or explicit_trk_match:
                all_orders = loader.load_orders()
                all_shipping = {s.get("orderNumber"): s for s in loader.load_shipping()}
                target_ord_num = explicit_ord_match.group(0).upper() if explicit_ord_match else None
                target_trk_num = explicit_trk_match.group(0).upper() if explicit_trk_match else None

                for o in all_orders:
                    o_num = str(o.get("orderNumber", "")).upper()
                    o_trk = str(o.get("trackingNumber", "")).upper()
                    if (target_ord_num and o_num == target_ord_num) or (target_trk_num and o_trk == target_trk_num):
                        o_status = str(o.get("status", "processing")).upper().replace("_", " ")
                        sd = all_shipping.get(o.get("orderNumber")) or {}
                        carrier = sd.get("carrier") or o.get("shippingMethod", {}).get("name", "Standard Ground Express")
                        updates = sd.get("updates", [])
                        last_up = updates[-1] if updates else {}
                        last_loc = last_up.get("location", "Delivery Hub")
                        last_msg = last_up.get("message", "")
                        last_date = str(last_up.get("timestamp", ""))[:10] or str(o.get("createdAt", ""))[:10]

                        if o_status == "DELIVERED" or str(sd.get("status", "")).lower() == "delivered":
                            target_live_order_note = (
                                f"[LIVE DATABASE UPDATE: Order #{o_num} (Tracking: {o_trk}) is currently **DELIVERED**. "
                                f"It was successfully delivered on {last_date} at {last_loc} ({last_msg}) via {carrier}. "
                                f"It is NO LONGER in transit or shipped. Ignore any earlier messages in chat history that said it was shipped or in transit.]"
                            )
                        else:
                            est_date = sd.get("estimatedDeliveryDate", "Pending")
                            target_live_order_note = (
                                f"[LIVE DATABASE UPDATE: Order #{o_num} (Tracking: {o_trk}) has current live status **{o_status}** "
                                f"via {carrier}. Latest checkpoint: {last_loc} ({last_msg}). Estimated delivery: {est_date}. "
                                f"Always report this exact current status even if earlier chat history had a different status.]"
                            )
                        break

            customer_context_parts.append(
                f"=== CURRENT LOGGED-IN CUSTOMER PROFILE & LIVE ORDER HISTORY ===\n"
                f"Customer Name: {c_name}\n"
                f"Customer ID: {c_id}\n"
                f"Customer Email: {c_email}\n"
                f"Total Orders Placed: {len(customer_orders)}"
            )

            if target_live_order_note:
                customer_context_parts.append(target_live_order_note)

            if customer_orders:
                customer_context_parts.append("Orders Breakdown (LIVE REAL-TIME STATUS):")
                for idx, o in enumerate(customer_orders, 1):
                    o_num = o.get("orderNumber", "")
                    o_date = o.get("createdAt", "")[:10]
                    o_status = str(o.get("status", "processing")).upper().replace("_", " ")
                    o_total = float(o.get("totalAmount", 0.0))
                    o_tracking = o.get("trackingNumber", "N/A")
                    items_desc = ", ".join([
                        f"{it.get('quantity', 1)}x {it.get('title', 'Product')} (${it.get('price', 0)})"
                        for it in o.get("items", [])
                    ])

                    ship_info = ""
                    if "shippingDetails" in o and o["shippingDetails"]:
                        sd = o["shippingDetails"]
                        carrier = sd.get("carrier", "Carrier")
                        est_date = sd.get("estimatedDeliveryDate", "Pending")
                        updates = sd.get("updates", [])
                        last_up = updates[-1] if updates else {}
                        last_loc = last_up.get("location", "")
                        last_msg = last_up.get("message", "")
                        last_date = str(last_up.get("timestamp", ""))[:10] or o_date

                        if o_status == "DELIVERED" or str(sd.get("status", "")).lower() == "delivered":
                            o_status = "DELIVERED"
                            ship_info = (
                                f" | Carrier: {carrier} | Delivery Status: DELIVERED on {last_date} "
                                f"at {last_loc} ({last_msg}) [Completed - Not In Transit]"
                            )
                        else:
                            checkpoint_str = f" | Latest Checkpoint: {last_loc} ({last_msg})" if last_loc else ""
                            ship_info = f" | Carrier: {carrier} | Est. Delivery: {est_date}{checkpoint_str}"

                    latest_tag = " [LATEST / MOST RECENT ORDER]" if idx == 1 else ""
                    customer_context_parts.append(
                        f"  {idx}.{latest_tag} Order #{o_num} (Order Date: {o_date}) - Total: ${o_total:.2f} | Current Status: {o_status} | "
                        f"Items: [{items_desc}] | Tracking: {o_tracking}{ship_info}"
                    )
            else:
                customer_context_parts.append("No previous orders found for this account.")

        if req.cartItems:
            cart_desc = ", ".join([
                f"{it.get('quantity', 1)}x {it.get('title', 'Product')} (${it.get('price', 0)})"
                for it in req.cartItems
            ])
            customer_context_parts.append(f"Current Cart Bag: [{cart_desc}] ({len(req.cartItems)} item(s) in cart)")
        else:
            customer_context_parts.append("Current Cart Bag: Empty (0 items currently in shopping cart)")

        is_simple_greeting = q_lower.strip("!.,? ") in [
            "hi", "hai", "hello", "hey", "hola", "yo", "morning", "good morning", "good evening", "howdy"
        ]

        if is_simple_greeting and req.history:
            customer_context_parts.append(
                "NOTE TO ASSISTANT: The user sent a casual greeting ('Hai'/'Hello'). "
                "You have ALREADY greeted them earlier. DO NOT REPEAT 'Hello Deepak! How can I assist you...'. "
                "Reply casually, warmly, and briefly (under 12 words) asking what they'd like to check today."
            )

        # 1. Semantic Retrieval from Knowledge Store (Skip for pure short greetings)
        if is_simple_greeting:
            retrieved_chunks = []
            knowledge_text = ""
        else:
            retrieved_chunks = retriever.retrieve(query=user_query, top_k=4)
            knowledge_text = "\n\n---\n\n".join([c["content"] for c in retrieved_chunks])

        # Combine customer profile context with knowledge chunks
        all_context_blocks = []
        if customer_context_parts:
            all_context_blocks.append("\n".join(customer_context_parts))
        if knowledge_text:
            all_context_blocks.append(knowledge_text)

        full_context = "\n\n========================================\n\n".join(all_context_blocks)

        # 2. Prompt Engineering
        system_prompt = build_system_prompt(context=full_context)

        # 3. Multi-tier LLM generation
        history_dicts = [{"role": m.role, "content": m.content} for m in req.history] if req.history else []
        llm_prompt = f"{user_query}\n\n{target_live_order_note}" if target_live_order_note else user_query

        raw_reply = llm_client.generate(
            prompt=llm_prompt,
            system_prompt=system_prompt,
            history=history_dicts
        )

        # 4. Parse response & attach structured UI cards
        parsed = parse_llm_response(raw_reply, retrieved_chunks)

        # If user asked about orders or tracking, ensure order tracking action button is available
        if is_order_or_account_query and not parsed.get("action"):
            parsed["action"] = {
                "type": "track_order",
                "label": "Open Order Tracker"
            }

        logger.info(f"Query: '{user_query}' -> Sources: {parsed['sources']}")

        return ChatResponse(
            reply=parsed["reply"],
            suggestedProduct=parsed["suggestedProduct"],
            action=parsed["action"],
            sources=parsed["sources"]
        )
    except Exception as e:
        logger.error(f"Error processing chat: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate answer: {str(e)}")

@router.post("/ingest")
def trigger_ingestion():
    """Re-indexes all products, shipping, orders, and policies into ChromaDB."""
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
        indexed_count = vector_store.upsert_chunks(all_chunks)

        return {
            "status": "success",
            "indexed_count": indexed_count,
            "products_indexed": len(prod_chunks),
            "shipping_indexed": len(ship_chunks),
            "orders_indexed": len(ord_chunks),
            "policies_indexed": len(pol_chunks)
        }
    except Exception as e:
        logger.error(f"Ingestion failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


class AnalyticsAskRequest(BaseModel):
    question: str = Field(..., description="Merchant strategic business question")
    focusArea: Optional[str] = Field(default="general", description="Focus area: general, financial, inventory, crm, orders")
    history: Optional[List[ChatMessage]] = Field(default=[], description="Previous conversation turns for continuation")
    lastTopic: Optional[str] = Field(default=None, description="Last active topic for follow-up continuation")


@router.get("/analytics/overview")
def get_merchant_analytics_overview():
    """
    Computes real-time merchant statistical analytics, SKU intelligence,
    expense burn ratios, CRM LTV rankings, and AI recommendations.
    """
    try:
        data = analytics_engine.compute_overview()
        return data
    except Exception as e:
        logger.error(f"Analytics overview computation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analytics computation failed: {str(e)}")


@router.post("/analytics/ask")
def ask_merchant_ai_advisor(req: AnalyticsAskRequest):
    """
    Interactive AI Business Advisor for merchants with multi-turn continuation.
    """
    q = req.question.strip()
    if not q:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    try:
        history_dicts = [{"role": m.role, "content": m.content} for m in req.history] if req.history else []
        result = analytics_engine.ask_advisor(
            question=q,
            focus_area=req.focusArea or "general",
            history=history_dicts,
            last_topic=req.lastTopic
        )
        logger.info(f"Merchant AI Analytics Query: '{q}' -> Topic: {result.get('focusArea')}")
        return result
    except Exception as e:
        logger.error(f"Merchant AI Advisor error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate advisor analysis: {str(e)}")


