"""
Vector Database Store Module using ChromaDB.
Handles persistent vector storage, indexing, and similarity querying.
"""

import os
from typing import List, Dict, Any, Optional, cast
import chromadb
from src.embeddings.embedder import embedder

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CHROMA_DIR = os.getenv("CHROMA_PERSIST_DIR", os.path.join(BASE_DIR, "chroma_db"))
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "deepshop_knowledge")

class VectorStore:
    def __init__(self, persist_dir: str = CHROMA_DIR, collection_name: str = COLLECTION_NAME):
        self.persist_dir = os.path.abspath(persist_dir)
        self.collection_name = collection_name
        os.makedirs(self.persist_dir, exist_ok=True)
        self.client = chromadb.PersistentClient(path=self.persist_dir)
        self._collection = None

    def get_collection(self):
        """Returns or initializes the active ChromaDB collection."""
        if self._collection is None:
            fn = embedder.get_embedding_function()
            try:
                self._collection = self.client.get_or_create_collection(
                    name=self.collection_name,
                    embedding_function=fn
                )
            except Exception:
                # Recreate collection if previous embedding function config differs
                try:
                    self.client.delete_collection(name=self.collection_name)
                except Exception:
                    pass
                self._collection = self.client.get_or_create_collection(
                    name=self.collection_name,
                    embedding_function=fn
                )
        return self._collection

    def upsert_chunks(self, chunks: List[Dict[str, Any]]) -> int:
        """Upserts a list of document chunks into the collection."""
        if not chunks:
            return 0

        coll = self.get_collection()
        ids = [c["id"] for c in chunks]
        documents = [c["content"] for c in chunks]
        metadatas = [c.get("metadata", {}) for c in chunks]

        # ChromaDB accepts metadata with primitive types (str, int, float, bool)
        clean_metadatas = []
        for m in metadatas:
            clean_m = {}
            for k, v in m.items():
                if isinstance(v, (str, int, float, bool)):
                    clean_m[k] = v
                elif v is None:
                    clean_m[k] = ""
                else:
                    clean_m[k] = str(v)
            clean_metadatas.append(clean_m)

        coll.upsert(
            ids=ids,
            documents=documents,
            metadatas=cast(Any, clean_metadatas)
        )
        return len(ids)

    def query(self, query_text: str, top_k: int = 4, where: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Queries the vector database for nearest semantic matches."""
        coll = self.get_collection()
        query_params: Dict[str, Any] = {
            "query_texts": [query_text],
            "n_results": top_k,
            "include": ["documents", "metadatas", "distances"]
        }
        if where:
            query_params["where"] = where

        try:
            results = coll.query(**query_params)
        except Exception as e:
            print(f"[!] ChromaDB query error: {e}")
            return []

        matched: List[Dict[str, Any]] = []
        docs_list = results.get("documents", [])
        metas_list = results.get("metadatas", [])
        dists_list = results.get("distances", [])

        if docs_list and len(docs_list) > 0:
            docs = docs_list[0]
            metas = metas_list[0] if metas_list and len(metas_list) > 0 else [{}] * len(docs)
            dists = dists_list[0] if dists_list and len(dists_list) > 0 else [0.0] * len(docs)

            for doc, meta, dist in zip(docs, metas, dists):
                matched.append({
                    "content": doc,
                    "metadata": meta,
                    "distance": dist
                })

        return matched

    def count(self) -> int:
        """Returns total documents indexed in the collection."""
        try:
            return self.get_collection().count()
        except Exception:
            return 0

vector_store = VectorStore()
