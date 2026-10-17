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

  // Dismiss teaser after 10 seconds if not clicked
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
      // Graceful fallback to client-side heuristics if AI service is temporarily connecting
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
          className="absolute bottom-16 right-0 mb-2 w-64 p-3 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md cursor-pointer transition-all hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-2 group"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                DeepShop Assistant
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTeaser(false);
              }}
              className="text-slate-400 hover:text-white p-0.5 rounded"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs text-slate-200 mt-1.5 leading-snug">
            👋 Have questions about products, shipping, or tracking your order? Tap to chat!
          </p>
          <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-slate-900 border-r border-b border-slate-700 transform rotate-45" />
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative group flex items-center justify-center p-3.5 rounded-full shadow-2xl transition-all duration-300 transform active:scale-95 ${
          isOpen
            ? 'bg-slate-800 text-white border border-slate-600 hover:bg-slate-700 rotate-90'
            : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-bold hover:shadow-cyan-500/25 hover:shadow-xl hover:scale-105'
        }`}
        aria-label="Toggle Support Chat"
        id="chatbot-trigger-btn"
      >
        {isOpen ? (
          <X className="w-6 h-6 transition-transform" />
        ) : (
          <>
            <MessageSquare className="w-6 h-6 fill-slate-950/20" />
            {hasUnread && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-400 border-2 border-slate-950" />
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-32px)] sm:w-[400px] h-[550px] max-h-[calc(100vh-120px)] bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/10 animate-in fade-in slide-in-from-bottom-5 duration-200 z-50"
          id="chatbot-window"
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-cyan-500/30 to-blue-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="text-sm font-bold text-white tracking-tight">DeepShop Concierge</h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    AI Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                  <span>Always ready to assist</span>
                  <span>•</span>
                  <span className="text-emerald-400">Online</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={handleReset}
                title="Restart conversation"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
                id="chatbot-reset-btn"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                id="chatbot-close-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-semibold rounded-br-xs'
                        : 'bg-slate-800/90 border border-slate-700/70 text-slate-200 rounded-bl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>

                    {/* Interactive Embedded Product Card */}
                    {msg.suggestedProduct && (
                      <div className="mt-2.5 p-2 bg-slate-950/70 border border-slate-700/80 rounded-xl flex items-center space-x-2.5 overflow-hidden">
                        <img
                          src={msg.suggestedProduct.images?.[0] || (msg.suggestedProduct as any).image || '/images/products/placeholder.jpg'}
                          alt={msg.suggestedProduct.title}
                          className="w-12 h-12 rounded-lg object-cover shrink-0 bg-slate-900 border border-slate-800"
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="text-[11px] font-bold text-white truncate">
                            {msg.suggestedProduct.title}
                          </h5>
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <span className="text-xs font-mono font-bold text-emerald-400">
                              ${Number(msg.suggestedProduct.price).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ★ {msg.suggestedProduct.rating || '4.8'}
                            </span>
                          </div>
                        </div>
                        {onQuickViewProduct && (
                          <button
                            onClick={() => onQuickViewProduct(msg.suggestedProduct!)}
                            className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold shrink-0 transition-colors"
                            title="Quick View"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Interactive Action Button */}
                    {msg.action && (
                      <div className="mt-2.5 pt-2 border-t border-slate-700/50">
                        <button
                          onClick={() => handleActionClick(msg.action)}
                          className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold transition-colors"
                        >
                          <span>{msg.action.label}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-500 mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-slate-800 border border-slate-700/70 rounded-2xl rounded-bl-xs px-3.5 py-2.5 flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips (when only greetings exist) */}
          {messages.length <= 3 && !isTyping && (
            <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/40">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Popular Inquiries:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((p, i) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSend(p.query)}
                      className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700/70 text-slate-300 hover:text-white text-[11px] transition-colors"
                    >
                      <Icon className="w-3 h-3 text-cyan-400" />
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
            className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about products, orders, shipping..."
              className="flex-1 px-3.5 py-2 text-xs bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              id="chatbot-input-field"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold hover:opacity-90 disabled:opacity-40 transition-opacity shadow-md"
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
