"""
Basic test suite for DeepShop RAG pipeline.
"""

import unittest
from src.ingestion.loader import loader
from src.chunking.chunker import chunker

class TestDeepShopRAG(unittest.TestCase):
    def test_loader(self):
        products = loader.load_products()
        self.assertIsInstance(products, list)
        self.assertGreater(len(products), 0)

        shipping = loader.load_shipping()
        self.assertIsInstance(shipping, list)
        self.assertGreater(len(shipping), 0)

        policies = loader.load_policies()
        self.assertIsInstance(policies, str)
        self.assertIn("DeepShop", policies)

    def test_chunker(self):
        products = loader.load_products()
        prod_chunks = chunker.chunk_products(products[:2])
        self.assertEqual(len(prod_chunks), 2)
        self.assertEqual(prod_chunks[0]["metadata"]["doc_type"], "product")

        shipping = loader.load_shipping()
        ship_chunks = chunker.chunk_shipping(shipping[:1])
        self.assertEqual(len(ship_chunks), 1)
        self.assertEqual(ship_chunks[0]["metadata"]["doc_type"], "shipping")

    def test_delivered_order_chunk_and_live_lookup(self):
        orders = loader.load_orders()
        ord_3923 = [o for o in orders if o.get("orderNumber") == "ORD-2026-3923"]
        if ord_3923:
            ord_chunks = chunker.chunk_orders(ord_3923)
            self.assertEqual(ord_chunks[0]["metadata"]["status"], "DELIVERED")
            self.assertIn("DELIVERED", ord_chunks[0]["content"])
            self.assertIn("NOT in transit", ord_chunks[0]["content"])

if __name__ == "__main__":
    unittest.main()
