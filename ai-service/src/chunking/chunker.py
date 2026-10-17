"""
Chunking Module for DeepShop RAG.
Transforms products, shipping data, and policies into rich semantic chunks with metadata.
"""

from typing import List, Dict, Any

class DataChunker:
    def chunk_products(self, products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Converts raw product records into descriptive semantic chunks."""
        chunks: List[Dict[str, Any]] = []

        for p in products:
            p_id = str(p.get("id", ""))
            title = p.get("title", "Unknown Product")
            category = p.get("categoryName", "General")
            price = p.get("price", 0.0)
            compare_price = p.get("compareAtPrice")
            rating = p.get("rating", 4.5)
            review_count = p.get("reviewCount", 0)
            stock = p.get("stock", 0)
            description = p.get("description", "")
            tags = ", ".join(p.get("tags", [])) if p.get("tags") else "N/A"
            image = p.get("images", [""])[0] if p.get("images") else ""

            specs_list = []
            specs = p.get("specifications", {})
            if isinstance(specs, dict):
                for k, v in specs.items():
                    specs_list.append(f"{k}: {v}")
            specs_str = "; ".join(specs_list) if specs_list else "Standard factory specifications."

            price_str = f"${float(price):.2f}"
            if compare_price:
                price_str += f" (Reduced from ${float(compare_price):.2f})"

            stock_status = f"In Stock ({stock} units ready to dispatch)" if stock > 0 else "Temporarily Out of Stock"

            content = (
                f"Product: {title}\n"
                f"ID: {p_id}\n"
                f"Category: {category}\n"
                f"Price: {price_str}\n"
                f"Availability: {stock_status}\n"
                f"Community Rating: {rating} / 5.0 ({review_count} verified reviews)\n"
                f"Key Tags: {tags}\n"
                f"Specifications: {specs_str}\n"
                f"Overview & Features: {description}\n"
                f"Store Benefits: Includes 2-Year Manufacturer Warranty, 30-Day Returns, and Free Priority Shipping over $200."
            )

            chunks.append({
                "id": f"chunk_prod_{p_id}",
                "content": content,
                "metadata": {
                    "doc_type": "product",
                    "product_id": p_id,
                    "title": title,
                    "category": category,
                    "price": float(price),
                    "rating": float(rating),
                    "stock": int(stock),
                    "image": image
                }
            })

        return chunks

    def chunk_shipping(self, shipping_records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Converts shipping and order tracking records into searchable checkpoints."""
        chunks: List[Dict[str, Any]] = []

        for s in shipping_records:
            s_id = str(s.get("id", ""))
            order_id = str(s.get("orderId", ""))
            order_number = str(s.get("orderNumber", ""))
            tracking_number = str(s.get("trackingNumber", ""))
            carrier = str(s.get("carrier", "Express Courier"))
            status = str(s.get("status", "in_transit")).upper().replace("_", " ")
            delivery_date = str(s.get("estimatedDeliveryDate", "Pending"))

            updates = s.get("updates", [])
            latest_checkpoint = "Package scanned into shipping network."
            last_up_date = ""
            if updates and isinstance(updates, list):
                last_up = updates[-1]
                last_up_date = str(last_up.get("timestamp", ""))[:10]
                latest_checkpoint = f"{last_up.get('status', '')} at {last_up.get('location', '')} - {last_up.get('message', '')}"

            if status == "DELIVERED":
                delivered_on = last_up_date or delivery_date
                delivery_info_line = f"Delivery Status: DELIVERED (Completed on {delivered_on} — Package has already been delivered to consignee, NOT in transit)"
            else:
                delivery_info_line = f"Estimated Delivery Date: {delivery_date}"

            content = (
                f"Shipment Tracking Record\n"
                f"Order Number: {order_number}\n"
                f"Internal Order ID: {order_id}\n"
                f"Tracking Number: {tracking_number}\n"
                f"Carrier: {carrier}\n"
                f"Current Status: {status}\n"
                f"{delivery_info_line}\n"
                f"Latest Live Transit Checkpoint: {latest_checkpoint}\n"
                f"Customer Guidance: Customers can inspect live interactive GPS tracking in the Track Orders section anytime."
            )

            chunks.append({
                "id": f"chunk_ship_{s_id or tracking_number}",
                "content": content,
                "metadata": {
                    "doc_type": "shipping",
                    "order_number": order_number,
                    "tracking_number": tracking_number,
                    "order_id": order_id,
                    "carrier": carrier,
                    "status": status
                }
            })

        return chunks

    def chunk_policies(self, markdown_text: str) -> List[Dict[str, Any]]:
        """Splits markdown policy document by H2 sections."""
        chunks: List[Dict[str, Any]] = []
        if not markdown_text:
            return chunks

        sections = markdown_text.split("\n## ")
        for idx, sec in enumerate(sections):
            sec_clean = sec.strip()
            if not sec_clean:
                continue

            lines = sec_clean.split("\n")
            title = lines[0].replace("#", "").strip()
            body = "\n".join(lines[1:]).strip()

            content = f"DeepShop Store Policy: {title}\n{body}"

            chunks.append({
                "id": f"chunk_policy_{idx}",
                "content": content,
                "metadata": {
                    "doc_type": "policy",
                    "section": title
                }
            })

        return chunks

    def chunk_orders(self, orders: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Converts order records into detailed searchable chunks linked to customers."""
        chunks: List[Dict[str, Any]] = []

        for o in orders:
            order_num = o.get("orderNumber", "")
            cust_name = o.get("customerName", "Customer")
            cust_email = o.get("customerEmail", "")
            cust_id = o.get("customerId", "")
            status = str(o.get("status", "processing")).upper().replace("_", " ")
            total = float(o.get("totalAmount", 0.0))
            date_str = o.get("createdAt", "")[:10]
            tracking = o.get("trackingNumber", "N/A")
            carrier = o.get("shippingMethod", {}).get("name", "Standard Ground")

            items_list = []
            for itm in o.get("items", []):
                items_list.append(f"{itm.get('quantity', 1)}x {itm.get('title', 'Product')} (${itm.get('price', 0)})")
            items_desc = ", ".join(items_list) if items_list else "No item details."

            status_desc = f"{status} (Completed & Delivered to Customer — NOT in transit)" if status == "DELIVERED" else status

            content = (
                f"Customer Purchase Order\n"
                f"Order Number: {order_num}\n"
                f"Customer: {cust_name} ({cust_email}, ID: {cust_id})\n"
                f"Order Date: {date_str}\n"
                f"Current Order Status: {status_desc}\n"
                f"Total Amount: ${total:.2f}\n"
                f"Items Purchased: {items_desc}\n"
                f"Carrier: {carrier}\n"
                f"Tracking Number: {tracking}\n"
                f"Customer Access: Customer can check order status, delivery, or track shipment."
            )

            chunks.append({
                "id": f"chunk_order_{order_num}",
                "content": content,
                "metadata": {
                    "doc_type": "order",
                    "order_number": order_num,
                    "customer_id": cust_id,
                    "customer_email": cust_email,
                    "customer_name": cust_name,
                    "status": status,
                    "total": total,
                    "tracking_number": tracking
                }
            })

        return chunks

chunker = DataChunker()
