"""
Data Loader Module for DeepShop RAG.
Loads raw JSON datasets (products, shipping, categories, orders, customers) and markdown policies.
"""

import os
import json
from typing import List, Dict, Any, Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ROOT_DIR = os.path.dirname(BASE_DIR)
DATA_DIR = os.path.join(ROOT_DIR, "data")
LOCAL_DATA_DIR = os.path.join(BASE_DIR, "data")

class DataLoader:
    def __init__(self, data_dir: str = DATA_DIR):
        self.data_dir = data_dir

    def load_products(self) -> List[Dict[str, Any]]:
        """Loads all products from data/products.json."""
        filepath = os.path.join(self.data_dir, "products.json")
        if not os.path.exists(filepath):
            print(f"[!] Warning: products file not found at {filepath}")
            return []
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)

    def load_shipping(self) -> List[Dict[str, Any]]:
        """Loads all shipping tracking entries from data/shipping.json."""
        filepath = os.path.join(self.data_dir, "shipping.json")
        if not os.path.exists(filepath):
            print(f"[!] Warning: shipping file not found at {filepath}")
            return []
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)

    def load_orders(self) -> List[Dict[str, Any]]:
        """Loads all orders from data/orders.json."""
        filepath = os.path.join(self.data_dir, "orders.json")
        if not os.path.exists(filepath):
            print(f"[!] Warning: orders file not found at {filepath}")
            return []
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)

    def load_customers(self) -> List[Dict[str, Any]]:
        """Loads all customers from data/customers.json."""
        filepath = os.path.join(self.data_dir, "customers.json")
        if not os.path.exists(filepath):
            print(f"[!] Warning: customers file not found at {filepath}")
            return []
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)

    def load_categories(self) -> List[Dict[str, Any]]:
        """Loads product categories from data/categories.json."""
        filepath = os.path.join(self.data_dir, "categories.json")
        if not os.path.exists(filepath):
            return []
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)

    def load_expenses(self) -> List[Dict[str, Any]]:
        """Loads operating expenses from data/expenses.json."""
        filepath = os.path.join(self.data_dir, "expenses.json")
        if not os.path.exists(filepath):
            return []
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)

    def load_policies(self) -> str:
        """Loads store policies and knowledge from store_policies.md."""
        filepath = os.path.join(LOCAL_DATA_DIR, "store_policies.md")
        if not os.path.exists(filepath):
            return ""
        with open(filepath, "r", encoding="utf-8") as f:
            return f.read()

    def get_customer_orders(self, customer_id: Optional[str] = None, customer_email: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetches all orders associated with a customer, with linked shipment status."""
        all_orders = self.load_orders()
        all_shipping = {s.get("orderNumber"): s for s in self.load_shipping()}

        matched_orders: List[Dict[str, Any]] = []
        c_id = (customer_id or "").strip().lower()
        c_email = (customer_email or "").strip().lower()

        # If neither provided, default to primary user Deepak Aruldoss cust_001
        if not c_id and not c_email:
            c_id = "cust_001"
            c_email = "deepak.a@example.com"

        for o in all_orders:
            order_cust_id = str(o.get("customerId", "")).strip().lower()
            order_cust_email = str(o.get("customerEmail", "")).strip().lower()

            if (c_id and order_cust_id == c_id) or (c_email and order_cust_email == c_email):
                ord_copy = dict(o)
                # Link shipping updates if available
                ord_num = o.get("orderNumber")
                if ord_num in all_shipping:
                    ord_copy["shippingDetails"] = all_shipping[ord_num]
                matched_orders.append(ord_copy)

        matched_orders.sort(key=lambda x: str(x.get("createdAt", "")), reverse=True)
        return matched_orders

loader = DataLoader()
