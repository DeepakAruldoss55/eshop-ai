"""
Embeddings Module for DeepShop RAG.
Provides 384-dimensional semantic, n-gram, and domain-concept embeddings for ChromaDB.
"""

import re
import math
import hashlib
from typing import List, Dict, Any, cast
from chromadb.api.types import EmbeddingFunction, Documents, Embeddings

EMBEDDING_DIM = 384

STOP_WORDS = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "in", "on", "at", "to", "for", "with", "about", "by", "from", "of",
    "and", "or", "but", "so", "if", "then", "that", "this", "these", "those",
    "it", "its", "you", "your", "yours", "me", "my", "we", "our", "i", "have",
    "has", "had", "do", "does", "did", "can", "could", "will", "would", "should",
    "what", "which", "who", "whom", "there", "any", "some", "please", "tell",
    "available", "shop", "store", "deepshop", "recommend", "need", "want", "looking"
}

DOMAIN_CONCEPTS = [
    ({"mobile", "smartphone", "iphone", "apple", "cellular", "handset", "ios", "a19"}, "__concept_mobile_phone__"),
    ({"headphone", "headphones", "earbud", "earbuds", "earphone", "audio", "sound", "anc", "noise", "cancelling", "acoustic", "speaker", "music"}, "__concept_audio__"),
    ({"monitor", "monitors", "display", "screen", "oled", "curved", "ultrawide", "240hz"}, "__concept_display__"),
    ({"laptop", "notebook", "ultrabook", "neobook", "workstation", "computer", "pc"}, "__concept_laptop__"),
    ({"watch", "smartwatch", "wearable", "band", "smartband", "fitness", "health", "ecg", "chrono", "titan", "pulsefit"}, "__concept_wearable__"),
    ({"keyboard", "mechanical", "mouse", "ergonomic", "stand", "charger", "gan", "magsafe", "accessory", "accessories"}, "__concept_accessory__"),
    ({"camera", "mirrorless", "drone", "gimbal", "video", "8k", "photography", "alpha", "aero"}, "__concept_camera__"),
    ({"hub", "home", "iot", "matter", "zigbee", "automation"}, "__concept_smarthome__"),
    ({"warranty", "guarantee", "repair", "coverage", "defect", "protection", "replacement"}, "__concept_warranty__"),
    ({"shipping", "ship", "shipped", "delivery", "deliver", "delivered", "dispatch", "transit", "courier", "carrier", "track", "tracking", "package", "shipment", "expected", "arrive"}, "__concept_shipping__"),
    ({"return", "returns", "refund", "refunds", "exchange", "money", "back", "cancel", "cancelled", "policy", "policies"}, "__concept_returns__"),
    ({"order", "orders", "purchase", "bought", "invoice", "history", "status"}, "__concept_order__"),
    ({"payment", "card", "credit", "checkout", "upi", "security", "cart", "bag", "buy"}, "__concept_payment_cart__"),
    ({"trending", "best", "bestseller", "popular", "featured", "top", "flagship"}, "__concept_featured__"),
    ({"support", "human", "agent", "contact", "help", "hours", "email"}, "__concept_support__"),
]


def _stem(word: str) -> str:
    if len(word) > 5 and word.endswith("ing"):
        return word[:-3]
    if len(word) > 4 and word.endswith("es"):
        return word[:-2]
    if len(word) > 3 and word.endswith("s") and not word.endswith("ss"):
        return word[:-1]
    return word


def _hash_feature(feature: str, weight: float, vec: List[float]) -> None:
    digest = hashlib.blake2b(feature.encode("utf-8"), digest_size=16).digest()
    # Project each feature into 2 indices with signed weights to minimize collisions
    idx1 = int.from_bytes(digest[0:4], "little") % EMBEDDING_DIM
    sign1 = 1.0 if (digest[4] & 1) == 0 else -1.0
    idx2 = int.from_bytes(digest[8:12], "little") % EMBEDDING_DIM
    sign2 = 1.0 if (digest[12] & 1) == 0 else -1.0
    vec[idx1] += sign1 * weight
    vec[idx2] += sign2 * (weight * 0.7)


def _embed_text(text: str) -> List[float]:
    vec = [0.0] * EMBEDDING_DIM
    if not text:
        vec[0] = 1.0
        return vec

    # Strip boilerplate footer lines that appear on every chunk to prevent cross-topic dilution
    lines = [
        ln for ln in text.splitlines()
        if not ln.startswith(("Store Benefits:", "Customer Guidance:", "Customer Access:", "Availability:", "Community Rating:"))
    ]
    cleaned_doc = "\n".join(lines) if lines else text

    # Identify high-salience lines (Title, Policy Title, Category, Key Tags)
    header_parts: List[str] = []
    for ln in lines[:7]:
        if ln.startswith(("Product:", "DeepShop Store Policy:", "Category:", "Key Tags:", "Order Number:", "Tracking Number:")):
            header_parts.append(ln.split(":", 1)[-1])
    header_text = " ".join(header_parts).lower() if header_parts else cleaned_doc.lower()

    clean = cleaned_doc.lower()
    raw_tokens = re.findall(r"[a-z0-9_-]{2,}", clean)
    tokens = [t for t in raw_tokens if t not in STOP_WORDS]
    stemmed = [_stem(t) for t in tokens]

    header_raw = re.findall(r"[a-z0-9_-]{2,}", header_text)
    header_tokens = [t for t in header_raw if t not in STOP_WORDS]
    header_stemmed = [_stem(t) for t in header_tokens]

    token_set = set(tokens) | set(stemmed)
    header_set = set(header_tokens) | set(header_stemmed)

    # 1. Exact ID / Order / Tracking tokens (highest weight)
    for t in set(raw_tokens):
        if t.startswith(("ord-", "trk-", "prod_", "cat_")):
            _hash_feature(f"id:{t}", 8.0, vec)

    # 2. High-salience header / title / tag tokens (strong weight, deduplicated per chunk)
    for t in set(header_tokens):
        st = _stem(t)
        _hash_feature(f"w:{t}", 5.0, vec)
        _hash_feature(f"st:{st}", 5.0, vec)
        if len(t) >= 4:
            for i in range(len(t) - 3):
                _hash_feature(f"c4:{t[i:i+4]}", 0.6, vec)

    # 3. Body unigrams & stemmed unigrams (sublinear TF so long descriptions don't drown titles)
    for t in set(tokens):
        st = _stem(t)
        _hash_feature(f"w:{t}", 1.2, vec)
        _hash_feature(f"st:{st}", 1.2, vec)

    # 4. Header bigrams
    for i in range(len(header_stemmed) - 1):
        _hash_feature(f"bi:{header_stemmed[i]}_{header_stemmed[i+1]}", 3.5, vec)

    # 5. Domain semantic concept expansion (use header_set for multi-line documents so body mentions don't pollute)
    active_set = header_set if len(lines) > 2 else token_set
    for keywords, concept_tag in DOMAIN_CONCEPTS:
        overlap = active_set & keywords
        if overlap:
            boost = 6.0 + min(3.0, 0.8 * len(overlap))
            _hash_feature(concept_tag, boost, vec)

    # L2 Normalize
    norm = math.sqrt(sum(v * v for v in vec))
    if norm > 1e-9:
        vec = [v / norm for v in vec]
    else:
        vec[0] = 1.0

    return vec


class LightweightSemanticEmbeddingFunction(EmbeddingFunction[Documents]):
    """Zero-PyTorch, offline 384-dim semantic embedding function for ChromaDB."""

    def __init__(self, model_name: str = "deepshop-lightweight-384") -> None:
        self.model_name = model_name

    def __call__(self, input: Documents) -> Embeddings:
        return cast(Embeddings, [_embed_text(doc) for doc in input])

    @staticmethod
    def name() -> str:
        return "deepshop_lightweight_embedder"

    @staticmethod
    def build_from_config(config: Dict[str, Any]) -> "EmbeddingFunction[Documents]":
        return LightweightSemanticEmbeddingFunction(model_name=config.get("model_name", "deepshop-lightweight-384"))

    def get_config(self) -> Dict[str, Any]:
        return {"model_name": self.model_name}


class EmbeddingService:
    def __init__(self):
        self._embedding_fn = LightweightSemanticEmbeddingFunction()

    @property
    def embedding_function(self) -> Any:
        return self._embedding_fn

    def get_embedding_function(self) -> Any:
        return self._embedding_fn


embedder = EmbeddingService()

