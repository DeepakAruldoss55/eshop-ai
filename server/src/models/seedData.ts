import {
  categoryRepo,
  productRepo,
  customerRepo,
  addressRepo,
  orderRepo,
  shippingRepo
} from './JsonRepository.js';
import type {
  Category,
  Product,
  Customer,
  CustomerAddress,
  Order,
  ShippingRecord
} from '../types/index.js';

export const seedCategories: Category[] = [
  {
    id: 'cat_electronics',
    name: 'Smart Electronics',
    slug: 'electronics',
    description: 'Next-generation gadgets, flagship smartphones, and ultra-high-definition displays.',
    image: '/images/categories/electronics.jpg',
    productCount: 4,
  },
  {
    id: 'cat_audio',
    name: 'Premium Audio',
    slug: 'audio',
    description: 'Noise-canceling headphones, studio monitors, and portable wireless speakers.',
    image: '/images/categories/audio.jpg',
    productCount: 4,
  },
  {
    id: 'cat_wearables',
    name: 'Smart Wearables',
    slug: 'wearables',
    description: 'Fitness trackers, luxury smartwatches, and modern biometric health companions.',
    image: '/images/categories/wearables.jpg',
    productCount: 3,
  },
  {
    id: 'cat_computing',
    name: 'Laptops & Workstations',
    slug: 'computing',
    description: 'Powerhouse ultrabooks, mechanical keyboards, and precision ergonomic mice.',
    image: '/images/categories/computing.jpg',
    productCount: 3,
  },
  {
    id: 'cat_photography',
    name: 'Cameras & Drones',
    slug: 'photography',
    description: 'Mirrorless cameras, 4K aerial drones, and professional cinematic lenses.',
    image: '/images/categories/photography.jpg',
    productCount: 2,
  },
  {
    id: 'cat_accessories',
    name: 'Minimal Accessories',
    slug: 'accessories',
    description: 'MagSafe charging docks, premium leather cases, and aluminum desk stands.',
    image: '/images/categories/accessories.jpg',
    productCount: 2,
  },
];

export const seedProducts: Product[] = [
  {
    id: 'prod_001',
    title: 'Aura Pro Studio Wireless Headphones',
    slug: 'aura-pro-studio-wireless-headphones',
    description: 'Active hybrid noise cancellation, 45-hour battery life, titanium 40mm acoustic drivers, and spatial audio with dynamic head tracking.',
    price: 349.99,
    compareAtPrice: 399.99,
    categoryId: 'cat_audio',
    categoryName: 'Premium Audio',
    images: [
      '/images/products/headphones-1.jpg',
      '/images/products/headphones-2.jpg',
    ],
    rating: 4.9,
    reviewCount: 248,
    stock: 35,
    featured: true,
    tags: ['Best Seller', 'ANC', 'Wireless', 'Spatial Audio'],
    specifications: {
      Battery: 'Up to 45 hours',
      Connectivity: 'Bluetooth 5.3 + 3.5mm AUX',
      Weight: '250g',
      Drivers: '40mm Titanium Composite'
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_002',
    title: 'Titan Precision Chrono Smartwatch',
    slug: 'titan-precision-chrono-smartwatch',
    description: 'Aerospace-grade titanium chassis, sapphire crystal display, continuous ECG and SpO2 sensors, with 100m water resistance.',
    price: 499.00,
    compareAtPrice: 549.00,
    categoryId: 'cat_wearables',
    categoryName: 'Smart Wearables',
    images: [
      '/images/products/smartwatch-1.jpg',
      '/images/products/smartwatch-2.jpg'
    ],
    rating: 4.8,
    reviewCount: 185,
    stock: 22,
    featured: true,
    tags: ['Titanium', 'Waterproof', 'ECG', 'OLED'],
    specifications: {
      Case: '46mm Grade 5 Titanium',
      Display: '1.43" AMOLED 1000 nits',
      WaterResistance: '10 ATM (100m)',
      Battery: '14 Days Typical Usage'
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_003',
    title: 'Lumix Infinity 4K Cinema Drone',
    slug: 'lumix-infinity-4k-cinema-drone',
    description: 'Ultralight folding drone equipped with 3-axis mechanical gimbal, 4K/60fps HDR video recording, and 360-degree omnidirectional obstacle sensing.',
    price: 899.00,
    compareAtPrice: 999.00,
    categoryId: 'cat_photography',
    categoryName: 'Cameras & Drones',
    images: [
      '/images/products/drone-1.jpg',
      '/images/products/drone-2.jpg'
    ],
    rating: 4.9,
    reviewCount: 92,
    stock: 14,
    featured: true,
    tags: ['4K 60FPS', 'Gimbal', 'Obstacle Avoidance', 'Pro'],
    specifications: {
      Camera: '1-inch CMOS 20MP',
      FlightTime: '38 minutes per battery',
      Range: '12 km HD Video Transmission',
      Weight: '249 grams'
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_004',
    title: 'NeoBook Pro 16 Carbon Ultrabook',
    slug: 'neobook-pro-16-carbon-ultrabook',
    description: 'Forged carbon fiber unibody with M-series architecture, 3.2K Liquid Retina ProMotion 120Hz display, and 32GB unified high-speed RAM.',
    price: 1899.00,
    compareAtPrice: 2099.00,
    categoryId: 'cat_computing',
    categoryName: 'Laptops & Workstations',
    images: [
      '/images/products/laptop-1.jpg',
      '/images/products/laptop-2.jpg'
    ],
    rating: 5.0,
    reviewCount: 310,
    stock: 18,
    featured: true,
    tags: ['Flagship', '120Hz ProMotion', '32GB RAM', 'Carbon Fiber'],
    specifications: {
      Display: '16.2" Mini-LED 3456x2234 120Hz',
      Memory: '32GB Unified Memory',
      Storage: '1TB NVMe PCIe 4.0 SSD',
      Battery: 'Up to 22 hours video playback'
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_005',
    title: 'ZenPulse ANC Wireless Earbuds',
    slug: 'zenpulse-anc-wireless-earbuds',
    description: 'True wireless earbuds with custom acoustic silicon tips, lossless aptX audio decoding, wireless Qi charging case, and IPX7 sweat resistance.',
    price: 179.99,
    compareAtPrice: 219.99,
    categoryId: 'cat_audio',
    categoryName: 'Premium Audio',
    images: [
      '/images/products/earbuds-1.jpg'
    ],
    rating: 4.7,
    reviewCount: 420,
    stock: 50,
    featured: false,
    tags: ['Earbuds', 'IPX7', 'Lossless Audio', 'Qi Wireless'],
    specifications: {
      Playtime: '8h buds / 32h with charging case',
      Waterproofing: 'IPX7 certified',
      Codecs: 'LDAC, AAC, aptX Adaptive',
      Weight: '4.5g per bud'
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_006',
    title: 'Spectra Mechanical Custom Keyboard',
    slug: 'spectra-mechanical-custom-keyboard',
    description: 'CNC anodized 6063 aluminum case, hot-swappable lubed linear switches, south-facing per-key RGB backlighting, and gasket-mount dampening structure.',
    price: 169.50,
    compareAtPrice: 199.00,
    categoryId: 'cat_computing',
    categoryName: 'Laptops & Workstations',
    images: [
      '/images/products/keyboard-1.jpg'
    ],
    rating: 4.9,
    reviewCount: 164,
    stock: 28,
    featured: false,
    tags: ['Mechanical', 'Gasket Mount', 'Hot-Swap', 'RGB'],
    specifications: {
      Layout: '75% Compact (82 keys)',
      Switches: 'Gateron Oil King Factory Lubed',
      Connectivity: 'Tri-Mode: 2.4G / BT 5.1 / Type-C',
      Weight: '1.45 kg'
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_007',
    title: 'PulseFit Vital Smart Band',
    slug: 'pulsefit-vital-smart-band',
    description: 'Ultra-slim health monitor featuring 24/7 heart rate variability, sleep cycle staging, skin temperature tracking, and seamless auto-workout detection.',
    price: 89.99,
    compareAtPrice: 109.99,
    categoryId: 'cat_wearables',
    categoryName: 'Smart Wearables',
    images: [
      '/images/products/smartband-1.jpg'
    ],
    rating: 4.6,
    reviewCount: 97,
    stock: 45,
    featured: false,
    tags: ['Sleep Tracker', 'HRV', 'Lightweight', '20-Day Battery'],
    specifications: {
      Sensors: 'Optical PPG, Accelerometer, SpO2',
      Display: '1.1" Curved AMOLED',
      BatteryLife: '20 days standby',
      WaterResistance: '5 ATM'
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_008',
    title: 'Apex Prime 65W GaN Fast Charger Trio',
    slug: 'apex-prime-65w-gan-fast-charger',
    description: 'Next-gen Gallium Nitride (GaN) fast charger with 2x USB-C and 1x USB-A ports. Powers laptops, tablets, and phones simultaneously in ultra-compact form factor.',
    price: 49.99,
    compareAtPrice: 59.99,
    categoryId: 'cat_accessories',
    categoryName: 'Minimal Accessories',
    images: [
      '/images/products/charger-1.jpg'
    ],
    rating: 4.8,
    reviewCount: 215,
    stock: 65,
    featured: false,
    tags: ['GaN Technology', '65W Fast Charge', 'Multi-Port', 'Compact'],
    specifications: {
      PowerOutput: '65W Max USB-PD 3.0',
      Ports: '2x Type-C (PD/PPS) + 1x Type-A (QC4+)',
      Size: '53 x 40 x 30 mm',
      Safety: 'Active Temperature Guard 2.0'
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_009',
    title: 'SoundCore Horizon Hi-Res Speaker',
    slug: 'soundcore-horizon-hi-res-speaker',
    description: 'Room-filling 360-degree acoustic dispersion with dual passive radiators, brushed aircraft aluminum housing, and 24-hour party playback.',
    price: 199.99,
    compareAtPrice: 249.99,
    categoryId: 'cat_audio',
    categoryName: 'Premium Audio',
    images: [
      '/images/products/speaker-1.jpg'
    ],
    rating: 4.7,
    reviewCount: 140,
    stock: 30,
    featured: false,
    tags: ['Hi-Res Audio', 'IP67 Waterproof', 'Aluminum', 'Bass Boost'],
    specifications: {
      Output: '60W RMS Dual Drivers',
      FrequencyResponse: '40Hz - 20kHz',
      Bluetooth: '5.3 with Stereo Pairing Mode',
      Battery: '7800mAh (24 hours)'
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_010',
    title: 'Alpha One 8K Mirrorless Body',
    slug: 'alpha-one-8k-mirrorless-body',
    description: 'Full-frame 50.1-megapixel Exmor sensor, 30fps black-out free continuous shooting, 8K 30p and 4K 120p video recording with Real-time Eye AF.',
    price: 3299.00,
    compareAtPrice: 3500.00,
    categoryId: 'cat_photography',
    categoryName: 'Cameras & Drones',
    images: [
      '/images/products/camera-1.jpg'
    ],
    rating: 5.0,
    reviewCount: 68,
    stock: 8,
    featured: true,
    tags: ['8K Video', 'Full-Frame', '50.1MP', 'Cinematic'],
    specifications: {
      Sensor: '35mm Full-Frame 50.1 MP CMOS',
      Autofocus: '759 phase-detection points',
      ISO: '100-32000 (expandable 50-102400)',
      Stabilization: '5.5-step 5-axis in-body IS'
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_011',
    title: 'AeroGlide Ergonomic Wireless Mouse',
    slug: 'aeroglide-ergonomic-wireless-mouse',
    description: 'Precision sculpted mouse engineered for natural wrist alignment, whisper-quiet magnetic scroll wheel, and 8,000 DPI Darkfield glass sensor.',
    price: 99.00,
    compareAtPrice: 119.00,
    categoryId: 'cat_computing',
    categoryName: 'Laptops & Workstations',
    images: [
      '/images/products/mouse-1.jpg'
    ],
    rating: 4.8,
    reviewCount: 388,
    stock: 42,
    featured: false,
    tags: ['Ergonomic', 'Magnetic Scroll', '8K DPI', 'Multi-Device'],
    specifications: {
      Sensor: '8000 DPI Darkfield Glass Tracking',
      Battery: 'Up to 70 days per single charge',
      Buttons: '7 customizable macro buttons',
      Weight: '141g'
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_012',
    title: 'DeepShop Glass Wireless Stand',
    slug: 'deepshop-glass-wireless-stand',
    description: 'Sleek brushed space-gray aluminum and frosted tempered glass 3-in-1 stand for fast wireless charging of your smartphone, watch, and earbuds.',
    price: 79.99,
    compareAtPrice: 99.99,
    categoryId: 'cat_accessories',
    categoryName: 'Minimal Accessories',
    images: [
      '/images/products/magsafe-stand-1.jpg'
    ],
    rating: 4.9,
    reviewCount: 172,
    stock: 38,
    featured: false,
    tags: ['MagSafe 15W', '3-in-1', 'Tempered Glass', 'Minimal'],
    specifications: {
      Input: 'Type-C 30W Power Adapter',
      Output: '15W Phone + 5W Watch + 5W Buds',
      Material: 'CNC Aluminum + Tempered Glass',
      Weight: '320g weighted base'
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_013',
    title: 'Horizon Curved 34-inch OLED Monitor',
    slug: 'horizon-curved-34-inch-oled-monitor',
    description: 'Quantum Dot OLED panel, 175Hz refresh rate with lightning 0.03ms response time, HDR TrueBlack 400, and integrated 90W USB-C hub.',
    price: 999.00,
    compareAtPrice: 1199.00,
    categoryId: 'cat_electronics',
    categoryName: 'Smart Electronics',
    images: [
      '/images/products/curved-monitor-1.jpg'
    ],
    rating: 4.9,
    reviewCount: 114,
    stock: 12,
    featured: true,
    tags: ['QD-OLED', '175Hz', 'Ultrawide 21:9', 'HDR True Black'],
    specifications: {
      Resolution: '3440 x 1440 UWQHD (1800R Curve)',
      Panel: 'Quantum Dot OLED',
      RefreshRate: '175 Hz G-Sync Compatible',
      Ports: '2x DP 1.4, 1x HDMI 2.1, 1x USB-C 90W'
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_014',
    title: 'DeepShop Smart Home Hub Pro',
    slug: 'deepshop-smart-home-hub-pro',
    description: 'Thread, Matter, and Zigbee 3.0 universal smart controller with 8-inch high-resolution touch panel and integrated far-field voice recognition.',
    price: 149.00,
    compareAtPrice: 179.00,
    categoryId: 'cat_electronics',
    categoryName: 'Smart Electronics',
    images: [
      '/images/products/smarthome-hub-1.jpg'
    ],
    rating: 4.7,
    reviewCount: 88,
    stock: 25,
    featured: false,
    tags: ['Matter Standard', 'Thread Border Router', 'Touch Hub'],
    specifications: {
      Connectivity: 'Wi-Fi 6, Thread, Zigbee, Bluetooth 5.2',
      Display: '8.0" IPS Touchscreen',
      Microphones: '4x Far-Field Beamforming',
      Audio: 'Stereo 10W Neodymium Drivers'
    },
    createdAt: new Date().toISOString(),
  }
];

export const seedCustomers: Customer[] = [
  {
    id: 'cust_001',
    firstName: 'Deepak',
    lastName: 'Aruldoss',
    email: 'deepak.a@example.com',
    phone: '+91 98765 43210',
    avatar: '/images/customers/customer-1.jpeg',
    createdAt: '2026-01-15T10:00:00.000Z',
  },
  {
    id: 'cust_002',
    firstName: 'Sara',
    lastName: 'S',
    email: 'sara.s@example.com',
    phone: '+1 (555) 234-5678',
    avatar: '/images/customers/customer-2.jpg',
    createdAt: '2026-02-10T14:30:00.000Z',
  },
  {
    id: 'cust_003',
    firstName: 'Sharvin',
    lastName: 'S',
    email: 'sharvin.s@example.com',
    phone: '+44 7911 123456',
    avatar: '/images/customers/customer-3.jpg',
    createdAt: '2026-03-01T09:15:00.000Z',
  }
];

export const seedAddresses: CustomerAddress[] = [
  {
    id: 'addr_001',
    customerId: 'cust_001',
    type: 'home',
    isDefault: true,
    fullName: 'Deepak Aruldoss',
    phone: '+91 98765 43210',
    addressLine1: '42 Silicon Avenue, Tech Park',
    addressLine2: 'Suite 404, Tower B',
    city: 'Chennai',
    state: 'Tamil Nadu',
    postalCode: '600096',
    country: 'India',
  },
  {
    id: 'addr_002',
    customerId: 'cust_001',
    type: 'work',
    isDefault: false,
    fullName: 'Deepak Aruldoss (Office)',
    phone: '+91 98765 43210',
    addressLine1: 'AI Research Innovation Labs',
    addressLine2: '3rd Floor, Cyber City',
    city: 'Chennai',
    state: 'Tamil Nadu',
    postalCode: '600113',
    country: 'India',
  },
  {
    id: 'addr_003',
    customerId: 'cust_002',
    type: 'home',
    isDefault: true,
    fullName: 'Sara S',
    phone: '+1 (555) 234-5678',
    addressLine1: '742 Evergreen Terrace',
    city: 'San Francisco',
    state: 'California',
    postalCode: '94107',
    country: 'United States',
  },
  {
    id: 'addr_004',
    customerId: 'cust_003',
    type: 'home',
    isDefault: true,
    fullName: 'Sharvin S',
    phone: '+44 7911 123456',
    addressLine1: '10 Downing Crescent',
    city: 'London',
    state: 'Greater London',
    postalCode: 'SW1A 2AA',
    country: 'United Kingdom',
  }
];

export const seedOrders: Order[] = [
  {
    id: 'order_1001',
    orderNumber: 'ORD-2026-8941',
    customerId: 'cust_001',
    customerName: 'Deepak Aruldoss',
    customerEmail: 'deepak.a@example.com',
    customerPhone: '+91 98765 43210',
    items: [
      {
        productId: 'prod_001',
        title: 'Aura Pro Studio Wireless Headphones',
        price: 349.99,
        quantity: 1,
        image: '/images/products/headphones-1.jpg',
      },
      {
        productId: 'prod_008',
        title: 'Apex Prime 65W GaN Fast Charger Trio',
        price: 49.99,
        quantity: 1,
        image: '/images/products/charger-1.jpg',
      }
    ],
    shippingAddress: seedAddresses[0],
    shippingMethod: {
      id: 'ship_express',
      name: 'Express Priority Dispatch',
      description: 'Guaranteed 24-48 hours delivery with GPS tracking',
      cost: 15.00,
      estimatedDeliveryDays: '1-2 Days',
    },
    subtotal: 399.98,
    shippingFee: 15.00,
    tax: 32.00,
    totalAmount: 446.98,
    status: 'shipped',
    paymentMethod: 'upi',
    paymentStatus: 'paid',
    createdAt: '2026-04-10T11:20:00.000Z',
    trackingNumber: 'TRK-DPS-9832410',
  },
  {
    id: 'order_1002',
    orderNumber: 'ORD-2026-7712',
    customerId: 'cust_002',
    customerName: 'Sara S',
    customerEmail: 'sara.s@example.com',
    customerPhone: '+1 (555) 234-5678',
    items: [
      {
        productId: 'prod_002',
        title: 'Titan Precision Chrono Smartwatch',
        price: 499.00,
        quantity: 1,
        image: '/images/products/smartwatch-1.jpg',
      }
    ],
    shippingAddress: seedAddresses[2],
    shippingMethod: {
      id: 'ship_standard',
      name: 'Standard Carbon-Neutral',
      description: 'Eco-friendly ground delivery in 3-5 business days',
      cost: 0.00,
      estimatedDeliveryDays: '3-5 Days',
    },
    subtotal: 499.00,
    shippingFee: 0.00,
    tax: 42.41,
    totalAmount: 541.41,
    status: 'delivered',
    paymentMethod: 'credit_card',
    paymentStatus: 'paid',
    createdAt: '2026-04-05T08:45:00.000Z',
    trackingNumber: 'TRK-DPS-6541298',
  }
];

export const seedShipping: ShippingRecord[] = [
  {
    id: 'ship_rec_001',
    orderId: 'order_1001',
    orderNumber: 'ORD-2026-8941',
    trackingNumber: 'TRK-DPS-9832410',
    carrier: 'BlueDart Express Courier',
    status: 'in_transit',
    estimatedDeliveryDate: '2026-04-14',
    updates: [
      {
        status: 'Order Dispatched',
        location: 'Central Fulfillment Hub, Warehouse 4',
        message: 'Package picked up by courier and scanned into network.',
        timestamp: '2026-04-10T16:00:00.000Z'
      },
      {
        status: 'In Transit',
        location: 'Regional Sorting Facility',
        message: 'Package arrived at regional distribution hub and is scheduled for morning route.',
        timestamp: '2026-04-11T09:30:00.000Z'
      }
    ],
    createdAt: '2026-04-10T11:30:00.000Z'
  },
  {
    id: 'ship_rec_002',
    orderId: 'order_1002',
    orderNumber: 'ORD-2026-7712',
    trackingNumber: 'TRK-DPS-6541298',
    carrier: 'FedEx Priority Global',
    status: 'delivered',
    estimatedDeliveryDate: '2026-04-08',
    updates: [
      {
        status: 'Delivered',
        location: 'San Francisco, CA',
        message: 'Delivered to resident and signed by Sara S.',
        timestamp: '2026-04-08T14:15:00.000Z'
      }
    ],
    createdAt: '2026-04-05T09:00:00.000Z'
  }
];

export async function runSeed() {
  console.log('Seeding JSON database tables with local assets...');
  await categoryRepo.save(seedCategories);
  console.log(`Saved ${seedCategories.length} categories to categories.json`);

  await productRepo.save(seedProducts);
  console.log(`Saved ${seedProducts.length} products to products.json`);

  await customerRepo.save(seedCustomers);
  console.log(`Saved ${seedCustomers.length} customers to customers.json`);

  await addressRepo.save(seedAddresses);
  console.log(`Saved ${seedAddresses.length} customer addresses to customer_addresses.json`);

  await orderRepo.save(seedOrders);
  console.log(`Saved ${seedOrders.length} orders to orders.json`);

  await shippingRepo.save(seedShipping);
  console.log(`Saved ${seedShipping.length} shipping records to shipping.json`);

  console.log('JSON Database Seed completed with 100% local images!');
}

if (process.argv[1]?.endsWith('seedData.ts') || process.argv[1]?.endsWith('seedData.js')) {
  runSeed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}
