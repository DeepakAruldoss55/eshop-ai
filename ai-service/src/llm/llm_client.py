"""
LLM Client Module for DeepShop RAG.
Implements resilient multi-tier cloud LLM execution with automatic failover:
1. Groq Cloud API (openai_compatible).
2. OpenRouter Cloud API (fallback).
3. Context-grounded deterministic fallback.
"""

import os
import requests
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")
load_dotenv(ENV_PATH)

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai_compatible")

# Groq / Primary OpenAI-compatible settings
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.groq.com/openai/v1")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "qwen/qwen3.8-27b")

# OpenRouter settings
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "qwen/qwen-2.5-7b-instruct:free")

class LLMClient:
    def __init__(self):
        self._session = requests.Session()

    def _call_groq_or_openai(
        self,
        prompt: str,
        system_prompt: str,
        history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """Invokes Groq / OpenAI-compatible endpoint with automatic multi-model failover."""
        if not OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is not configured.")

        url = f"{OPENAI_BASE_URL.rstrip('/')}/chat/completions"
        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }

        messages: List[Dict[str, str]] = [{"role": "system", "content": system_prompt}]
        if history:
            for h in history[-10:]:
                role = "assistant" if h.get("role") in ["assistant", "bot"] else "user"
                content = h.get("content", "").strip()
                if content:
                    messages.append({"role": role, "content": content})

        if not messages or messages[-1].get("content") != prompt:
            messages.append({"role": "user", "content": prompt})

        # List of candidate models for Groq failover
        candidate_models = [OPENAI_MODEL]
        backup_models = [
            "llama-3.3-70b-versatile",
            "openai/gpt-oss-120b",
            "openai/gpt-oss-20b",
            "groq/compound-mini"
        ]
        for m in backup_models:
            if m not in candidate_models:
                candidate_models.append(m)

        last_error = None
        for model_name in candidate_models:
            try:
                payload = {
                    "model": model_name,
                    "messages": messages,
                    "temperature": 0.3,
                    "presence_penalty": 0.2,
                    "frequency_penalty": 0.2,
                    "max_tokens": 450
                }
                res = self._session.post(url, json=payload, headers=headers, timeout=10)
                if res.status_code == 200:
                    data = res.json()
                    choices = data.get("choices", [])
                    if choices and "message" in choices[0]:
                        content = choices[0]["message"].get("content", "").strip()
                        if content:
                            return content
                else:
                    last_error = f"HTTP {res.status_code}: {res.text[:120]}"
                    print(f"[!] Groq ({model_name}) error: {last_error}")
            except Exception as e:
                last_error = str(e)
                print(f"[!] Groq ({model_name}) exception: {e}")

        raise RuntimeError(f"All primary cloud models failed. Last error: {last_error}")

    def _call_openrouter(
        self,
        prompt: str,
        system_prompt: str,
        history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """Invokes OpenRouter API as a secondary cloud fallback."""
        if not OPENROUTER_API_KEY:
            raise ValueError("OPENROUTER_API_KEY not configured.")

        url = f"{OPENROUTER_BASE_URL.rstrip('/')}/chat/completions"
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }

        messages: List[Dict[str, str]] = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]

        payload = {
            "model": OPENROUTER_MODEL,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 400
        }
        res = requests.post(url, json=payload, headers=headers, timeout=12)
        if res.status_code == 200:
            data = res.json()
            choices = data.get("choices", [])
            if choices and "message" in choices[0]:
                return choices[0]["message"].get("content", "").strip()
        raise RuntimeError(f"OpenRouter failed with HTTP {res.status_code}: {res.text[:100]}")

    def _deterministic_fallback(self, prompt: str, system_prompt: str) -> str:
        """
        Instant context-grounded fallback if cloud APIs are unreachable.
        """
        import re
        live_match = re.search(r"\[LIVE DATABASE UPDATE:\s*(.+?)\]", system_prompt)
        if live_match:
            return f"{live_match.group(1)} [ACTION: track_order]"

        q_lower = prompt.lower()
        if any(w in q_lower for w in ["order", "ord-", "trk-", "track", "shipment", "delivery", "status"]):
            orders_lines = [
                line.strip()
                for line in system_prompt.splitlines()
                if line.strip().startswith(("1.", "2.", "3.", "4.", "5.")) and "Order #" in line
            ]
            if orders_lines:
                summary = "\n".join(f"• {l}" for l in orders_lines[:4])
                return f"Here is your live order status from DeepShop:\n{summary}\n[ACTION: track_order]"

        if "cart" in q_lower or "bag" in q_lower:
            cart_match = re.search(r"Current Cart Bag:\s*(.+)", system_prompt)
            if cart_match:
                return f"Your shopping cart status: {cart_match.group(1)}. [ACTION: view_cart]"

        return (
            "I'm ready to help with your DeepShop orders, live shipment tracking, and tech catalog! "
            "You can check your live order status anytime using 'Track Orders' above."
        )

    def generate(
        self,
        prompt: str,
        system_prompt: str,
        history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """
        Executes multi-tier LLM generation with graceful degradation:
        Groq Cloud -> OpenRouter Cloud -> Context-Grounded Deterministic Fallback.
        """
        # Tier 1: Groq Cloud API
        try:
            return self._call_groq_or_openai(prompt, system_prompt, history)
        except Exception as e_groq:
            print(f"[!] Primary Cloud LLM error: {e_groq}")

        # Tier 2: OpenRouter Cloud API
        if OPENROUTER_API_KEY:
            try:
                print("[*] Trying Tier 2 fallback: OpenRouter...")
                return self._call_openrouter(prompt, system_prompt, history)
            except Exception as e_or:
                print(f"[!] OpenRouter error: {e_or}")

        # Tier 3: Context-grounded deterministic fallback
        return self._deterministic_fallback(prompt, system_prompt)

llm_client = LLMClient()
