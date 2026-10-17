import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  RotateCcw,
  Bot,
  Truck,
  Headphones,
  ShieldCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import type { Product, Customer, CartItem } from '../../types';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  suggestedProduct?: Product;
  action?: {
    type: 'track_order' | 'view_product' | 'view_cart';
    label: string;
    payload?: any;
  };
}

interface ChatWidgetProps {
  products?: Product[];
  activeCustomer?: Customer | null;
  cartItems?: CartItem[];
  onQuickViewProduct?: (product: Product) => void;
  onOpenTracking?: () => void;
  onOpenCart?: () => void;
}

const DEFAULT_GREETING: Message[] = [
  {
    id: 'm_welcome_1',
    sender: 'bot',
    text: "👋 Hi there! Welcome to DeepShop. I'm your AI Shopping Assistant.",
    timestamp: 'Just now'
  },
  {
    id: 'm_welcome_2',
    sender: 'bot',
    text: "How can I help you today? I can recommend top gear, help track your package, or explain our shipping & warranty policies.",
    timestamp: 'Just now'
  }
];

const QUICK_PROMPTS = [
  {
    label: 'My Orders',
    icon: Truck,
    query: 'How many orders do I have and what is their status?'
  },
  {
    label: 'Recommend Headphones',
    icon: Headphones,
    query: 'Can you recommend the best noise-cancelling headphones?'
  },
  {
    label: 'Top Trending Gear',
    icon: Sparkles,
    query: 'What are the top trending featured products today?'
  },
  {
    label: 'Shipping & Warranty',
    icon: ShieldCheck,
    query: 'What are your delivery times and warranty coverage?'
  }
];

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  products = [],
  activeCustomer,
  cartItems = [],
  onQuickViewProduct,
  onOpenTracking,
  onOpenCart
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(DEFAULT_GREETING);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [showTeaser, setShowTeaser] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
      setShowTeaser(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isTyping]);

  // Dismiss teaser after 12 seconds if not clicked
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTeaser(false);
    }, 12000);
    return () => clearTimeout(timer);
  }, []);

  const handleReset = () => {
    setMessages(DEFAULT_GREETING);
  };

  const generateBotReply = (userQuery: string): {
    text: string;
    suggestedProduct?: Product;
    action?: Message['action'];
  } => {
    const q = userQuery.toLowerCase();

    // Track order query
    if (q.includes('track') || q.includes('shipment') || q.includes('order status') || q.includes('package')) {
      return {
        text: "You can track your orders in real time! Check live GPS transit checkpoints, courier status, and estimated delivery dates.",
        action: {
          type: 'track_order',
          label: 'Open Order Tracker'
        }
      };
    }

    // Headphones / Audio query
    if (q.includes('headphone') || q.includes('earbud') || q.includes('audio') || q.includes('sound')) {
      const audioProd = products.find(
        (p) => p.categoryId === 'cat_audio' || p.title.toLowerCase().includes('headphone')
      ) || products[0];

      return {
        text: "Our highest-rated acoustic gear is the **Aura Pro Studio Wireless Headphones**. It features 45-hour battery life, active hybrid noise cancellation, and titanium composite 40mm drivers.",
        suggestedProduct: audioProd,
        action: audioProd ? {
          type: 'view_product',
          label: 'View Product Details',
          payload: audioProd
        } : undefined
      };
    }

    // Monitor / Display query
    if (q.includes('monitor') || q.includes('display') || q.includes('screen') || q.includes('oled')) {
      const monitorProd = products.find(
        (p) => p.title.toLowerCase().includes('monitor') || p.title.toLowerCase().includes('curved')
      );

      return {
        text: "For creative workflows and immersive gaming, the **Horizon Curved 34-inch OLED Monitor** is our flagship pick, featuring 240Hz refresh rate and 99.8% DCI-P3 color gamut.",
        suggestedProduct: monitorProd,
        action: monitorProd ? {
          type: 'view_product',
          label: 'View Monitor Specs',
          payload: monitorProd
        } : undefined
      };
    }

    // Shipping & Warranty query
    if (q.includes('shipping') || q.includes('warranty') || q.includes('return') || q.includes('policy')) {
      return {
        text: "All orders over $200 qualify for **Free Carbon-Neutral Priority Delivery** (2-3 business days). Every device includes a comprehensive **2-Year Manufacturer Warranty** and 30-day hassle-free returns."
      };
    }

    // Best seller / Trending query
    if (q.includes('trending') || q.includes('best') || q.includes('popular') || q.includes('recommend')) {
      const featured = products.find((p) => p.featured) || products[0];
      return {
        text: "Here is one of our top-rated bestsellers loved by our community. Hand-tuned for performance and everyday durability:",
        suggestedProduct: featured,
        action: featured ? {
          type: 'view_product',
          label: 'Inspect Item',
          payload: featured
        } : undefined
      };
    }

    // Cart query
    if (q.includes('cart') || q.includes('checkout') || q.includes('buy')) {
      return {
        text: "You can view your shopping bag and proceed to secure encrypted checkout anytime using the button below:",
        action: {
          type: 'view_cart',
          label: 'View Shopping Bag'
        }
      };
    }

    // Default friendly assistant response
    return {
      text: "Thanks for reaching out! DeepShop curates modern studio audio, flagships, and ergonomics. Feel free to explore our catalog, check live tracking, or ask about any product specs."
    };
  };

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputValue;
    if (!query.trim() || isTyping) return;

    const userMessage: Message = {
      id: `m_user_${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Build conversation history (up to last 6 turns)
      const history = messages
        .filter((m) => m.id !== 'm_welcome_1' && m.id !== 'm_welcome_2')
        .slice(-6)
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.text,
          history,
          customerId: activeCustomer?.id,
          customerEmail: activeCustomer?.email,
          customerName: activeCustomer ? `${activeCustomer.firstName} ${activeCustomer.lastName}` : undefined,
          cartItems: cartItems.map((c) => ({
            productId: c.product.id,
            title: c.product.title,
            quantity: c.quantity,
            price: c.product.price
          }))
        })
      });

      if (!res.ok) {
        throw new Error(`AI API returned status ${res.status}`);
      }

      const data = await res.json();
      const botMessage: Message = {
        id: `m_bot_${Date.now()}`,
        sender: 'bot',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedProduct: data.suggestedProduct,
        action: data.action
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.warn('[AI Chatbot] Backend unavailable, using smart client fallback:', err);
      const replyData = generateBotReply(userMessage.text);
      const botMessage: Message = {
        id: `m_bot_${Date.now()}`,
        sender: 'bot',
        text: replyData.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedProduct: replyData.suggestedProduct,
        action: replyData.action
      };
      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleActionClick = (action: Message['action']) => {
    if (!action) return;
    if (action.type === 'track_order' && onOpenTracking) {
      onOpenTracking();
    } else if (action.type === 'view_product' && action.payload && onQuickViewProduct) {
      onQuickViewProduct(action.payload);
    } else if (action.type === 'view_cart' && onOpenCart) {
      onOpenCart();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 select-none">
      {/* Floating Teaser Speech Bubble (before opening) */}
      {!isOpen && showTeaser && (
        <div
          onClick={() => setIsOpen(true)}
          className="absolute bottom-16 right-0 mb-2 w-64 p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xl cursor-pointer transition-all hover:scale-[1.02] group"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[11px] font-extrabold text-blue-600 uppercase tracking-wider">
                DeepShop Concierge
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTeaser(false);
              }}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs text-slate-600 mt-1.5 leading-snug">
            👋 Have questions about products, shipping, or tracking your order? Tap to chat!
          </p>
          <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white border-r border-b border-slate-200 transform rotate-45" />
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative group flex items-center justify-center p-4 rounded-full shadow-xl transition-all duration-300 transform active:scale-95 cursor-pointer ${
          isOpen
            ? 'bg-slate-900 text-white hover:bg-slate-800 rotate-90'
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:shadow-blue-600/30 hover:shadow-2xl hover:scale-105'
        }`}
        aria-label="Toggle Support Chat"
        id="chatbot-trigger-btn"
      >
        {isOpen ? (
          <X className="w-6 h-6 transition-transform" />
        ) : (
          <>
            <MessageSquare className="w-6 h-6 fill-white/15" />
            {hasUnread && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white" />
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-32px)] sm:w-[400px] h-[550px] max-h-[calc(100vh-120px)] bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-50"
          id="chatbot-window"
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-white shadow-inner">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-blue-600" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="text-sm font-extrabold text-white tracking-tight">DeepShop Concierge</h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-white/20 text-white">
                    AI Active
                  </span>
                </div>
                <p className="text-[11px] text-blue-100 flex items-center space-x-1">
                  <span>Always ready to assist</span>
                  <span>•</span>
                  <span className="text-emerald-300 font-semibold">Online</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={handleReset}
                title="Restart conversation"
                className="p-1.5 text-blue-100 hover:text-white hover:bg-white/15 rounded-xl transition-colors cursor-pointer"
                id="chatbot-reset-btn"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 text-blue-100 hover:text-white hover:bg-white/15 rounded-xl transition-colors cursor-pointer"
                id="chatbot-close-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/70">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs ${
                      isUser
                        ? 'bg-blue-600 text-white font-medium rounded-br-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>

                    {/* Interactive Embedded Product Card */}
                    {msg.suggestedProduct && (
                      <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-2.5 overflow-hidden">
                        <img
                          src={msg.suggestedProduct.images?.[0] || (msg.suggestedProduct as any).image || '/images/products/placeholder.jpg'}
                          alt={msg.suggestedProduct.title}
                          className="w-12 h-12 rounded-lg object-cover shrink-0 bg-white border border-slate-200"
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="text-[11px] font-extrabold text-slate-900 truncate">
                            {msg.suggestedProduct.title}
                          </h5>
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <span className="text-xs font-mono font-black text-blue-600">
                              ${Number(msg.suggestedProduct.price).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-amber-500 font-bold">
                              ★ {msg.suggestedProduct.rating || '4.8'}
                            </span>
                          </div>
                        </div>
                        {onQuickViewProduct && (
                          <button
                            onClick={() => onQuickViewProduct(msg.suggestedProduct!)}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
                            title="Quick View"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Interactive Action Button */}
                    {msg.action && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleActionClick(msg.action)}
                          className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          <span>{msg.action.label}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-xs px-3.5 py-2.5 flex items-center space-x-1.5 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips (when only greetings exist) */}
          {messages.length <= 3 && !isTyping && (
            <div className="px-4 py-2.5 border-t border-slate-200 bg-white">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                Popular Inquiries:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((p, i) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSend(p.query)}
                      className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      <Icon className="w-3 h-3 text-blue-600" />
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about products, orders, shipping..."
              className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 transition-all"
              id="chatbot-input-field"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-40 transition-colors shadow-sm cursor-pointer"
              title="Send message"
              id="chatbot-send-btn"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
