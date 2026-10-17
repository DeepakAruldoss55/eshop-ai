import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HeroBanner } from './components/home/HeroBanner';
import { CategoryList } from './components/categories/CategoryList';
import { ProductCard } from './components/products/ProductCard';
import { ProductModal } from './components/products/ProductModal';
import { CartDrawer } from './components/cart/CartDrawer';
import { CheckoutModal } from './components/checkout/CheckoutModal';
import { OrderHistoryModal } from './components/checkout/OrderHistoryModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ChatWidget } from './components/chat/ChatWidget';
import type { Category, Product, Customer, CartItem, Order, ShippingRecord } from './types';
import { api } from './services/api';
import { SlidersHorizontal, Filter, CheckCircle2, AlertCircle } from 'lucide-react';

export function App() {
  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSort, setSelectedSort] = useState<string>('featured');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Cart state persisted in localStorage
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('deepshop_cart');
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  // Modals state
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState<boolean>(false);

  // Notification Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Client Routing State
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const productSectionRef = useRef<HTMLDivElement>(null);

  // Save cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem('deepshop_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cartItems]);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Initial Data Fetch
  const loadInitialData = async () => {
    try {
      const [loadedCategories, loadedProducts, loadedCustomers] = await Promise.all([
        api.getCategories(),
        api.getProducts(),
        api.getCustomers(),
      ]);

      setCategories(loadedCategories);
      setProducts(loadedProducts);
      setCustomers(loadedCustomers);
      if (loadedCustomers.length > 0 && !activeCustomer) {
        setActiveCustomer(loadedCustomers[0]);
      }
    } catch (error) {
      console.error('Failed to load store data:', error);
      showToast('Welcome to DeepShop!', 'info');
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Filter & Sort Products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter((p: Product) => p.categoryId === selectedCategory);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p: Product) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t: string) => t.toLowerCase().includes(q)) ||
          p.categoryName.toLowerCase().includes(q)
      );
    }

    // Tag filter
    if (selectedTag) {
      result = result.filter((p: Product) => p.tags.includes(selectedTag));
    }

    // Sorting
    if (selectedSort === 'price-low') {
      result.sort((a: Product, b: Product) => a.price - b.price);
    } else if (selectedSort === 'price-high') {
      result.sort((a: Product, b: Product) => b.price - a.price);
    } else if (selectedSort === 'rating') {
      result.sort((a: Product, b: Product) => b.rating - a.rating);
    } else if (selectedSort === 'newest') {
      result.sort((a: Product, b: Product) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [products, selectedCategory, searchQuery, selectedTag, selectedSort]);

  // All unique tags across catalog
  const allTags = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p: Product) => p.tags?.forEach((t: string) => set.add(t)));
    return Array.from(set);
  }, [products]);

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCartItems((prev: CartItem[]) => {
      const existing = prev.find((item: CartItem) => item.product.id === product.id);
      if (existing) {
        return prev.map((item: CartItem) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(product.stock, item.quantity + quantity) }
            : item
        );
      }
      return [...prev, { product, quantity: Math.min(product.stock, quantity) }];
    });
    showToast(`Added ${quantity} × ${product.title} to cart`);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCartItems((prev: CartItem[]) =>
      prev.map((item: CartItem) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev: CartItem[]) => prev.filter((item: CartItem) => item.product.id !== productId));
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleOrderSuccess = (order: Order, _shipping: ShippingRecord) => {
    setCartItems([]);
    showToast(`Thank you! Order ${order.orderNumber} placed successfully.`);
    loadInitialData();
  };

  const cartTotal = cartItems.reduce(
    (acc: number, item: CartItem) => acc + item.product.price * item.quantity,
    0
  );
  const cartCount = cartItems.reduce((acc: number, item: CartItem) => acc + item.quantity, 0);

  const scrollToProducts = () => {
    productSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // If user navigated to /admin or opened http://localhost:3000/admin directly
  if (currentPath === '/admin' || currentPath.startsWith('/admin')) {
    return (
      <AdminDashboard
        onNavigateHome={() => navigate('/')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* Toast popup */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-3 rounded-2xl bg-slate-900 border border-emerald-500/40 text-emerald-400 shadow-2xl shadow-emerald-500/10 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenOrderHistory={() => setIsOrderHistoryOpen(true)}
        onNavigateAdmin={() => navigate('/admin')}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        customers={customers}
        activeCustomer={activeCustomer}
        setActiveCustomer={setActiveCustomer}
      />

      <main className="flex-1">
        {/* Hero Banner */}
        <HeroBanner
          onExploreClick={scrollToProducts}
          productsCount={products.length}
          categoriesCount={categories.length}
        />

        {/* Categories Section */}
        <CategoryList
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(catId: string) => {
            setSelectedCategory(catId);
            scrollToProducts();
          }}
        />

        {/* Products Catalog Section */}
        <section ref={productSectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Section Heading & Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-black text-white">Product Catalog</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Authentic gear backed by official manufacturer warranty and fast dispatch
              </p>
            </div>

            {/* Filter and Sorting Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Category selector dropdown */}
              <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-900">All Categories</option>
                  {categories.map((c: Category) => (
                    <option key={c.id} value={c.id} className="bg-slate-900">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sorting dropdown */}
              <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="featured" className="bg-slate-900">Featured First</option>
                  <option value="price-low" className="bg-slate-900">Price: Low to High</option>
                  <option value="price-high" className="bg-slate-900">Price: High to Low</option>
                  <option value="rating" className="bg-slate-900">Highest Rated</option>
                  <option value="newest" className="bg-slate-900">Newest Arrivals</option>
                </select>
              </div>

              {/* Clear filters if active */}
              {(selectedCategory !== 'all' || selectedTag || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedTag(null);
                    setSearchQuery('');
                  }}
                  className="text-xs font-semibold text-rose-400 hover:text-rose-300 underline py-2"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Quick Tag Pills */}
          {allTags.length > 0 && (
            <div className="flex items-center space-x-2 py-4 overflow-x-auto scrollbar-none text-xs">
              <span className="text-slate-500 font-semibold whitespace-nowrap">Filter Tags:</span>
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition-colors ${
                  selectedTag === null
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                All
              </button>
              {allTags.map((tag: string) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition-colors ${
                    selectedTag === tag
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-4">
                <AlertCircle className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-white">No products found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                No items match your current filter criteria. Try adjusting the category or search keyword.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedTag(null);
                  setSearchQuery('');
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold transition-colors"
              >
                Reset Catalog Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
              {filteredProducts.map((product: Product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onQuickView={(p: Product) => setQuickViewProduct(p)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <Footer onNavigateAdmin={() => navigate('/admin')} />

      {/* Modals and Drawers */}
      <ProductModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={handleProceedToCheckout}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        activeCustomer={activeCustomer}
        onOrderSuccess={handleOrderSuccess}
      />

      <OrderHistoryModal
        isOpen={isOrderHistoryOpen}
        onClose={() => setIsOrderHistoryOpen(false)}
        customerId={activeCustomer?.id}
      />

      {/* Floating Bottom-Right Chatbot Widget */}
      <ChatWidget
        products={products}
        activeCustomer={activeCustomer}
        cartItems={cartItems}
        onQuickViewProduct={(p: Product) => setQuickViewProduct(p)}
        onOpenTracking={() => setIsOrderHistoryOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
      />
    </div>
  );
}

export default App;
