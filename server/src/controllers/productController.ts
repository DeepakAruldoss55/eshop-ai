import { Request, Response } from 'express';
import { productRepo, categoryRepo } from '../models/JsonRepository.js';
import type { Product } from '../types/index.js';
import crypto from 'crypto';

export const getProducts = async (req: Request, res: Response) => {
  try {
    let products = await productRepo.findAll();
    const { category, search, tag, featured, sort } = req.query;

    if (category && typeof category === 'string' && category !== 'all') {
      products = products.filter((p) => p.categoryId === category);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      products = products.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (tag && typeof tag === 'string') {
      products = products.filter((p) => p.tags?.includes(tag));
    }

    if (featured === 'true') {
      products = products.filter((p) => p.featured);
    }

    if (sort) {
      if (sort === 'price-low') {
        products.sort((a, b) => a.price - b.price);
      } else if (sort === 'price-high') {
        products.sort((a, b) => b.price - a.price);
      } else if (sort === 'rating') {
        products.sort((a, b) => b.rating - a.rating);
      } else if (sort === 'newest') {
        products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    }

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const product = await productRepo.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      id,
      title,
      description,
      price,
      compareAtPrice,
      categoryId,
      images,
      stock,
      featured,
      tags,
      specifications,
      rating,
      reviewCount
    } = req.body;

    if (!title || price === undefined || price === '' || !categoryId) {
      return res.status(400).json({ error: 'Title, price, and category are required' });
    }

    const category = await categoryRepo.findById(categoryId);
    const categoryName = category ? category.name : 'General';

    // Parse tags if string
    let parsedTags: string[] = ['New Arrival'];
    if (Array.isArray(tags)) {
      parsedTags = tags.filter(Boolean);
    } else if (typeof tags === 'string' && tags.trim()) {
      parsedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
    }

    // Parse images
    let parsedImages: string[] = ['/images/products/headphones-1.jpg'];
    if (Array.isArray(images) && images.length > 0) {
      parsedImages = images.filter(Boolean);
    } else if (typeof images === 'string' && images.trim()) {
      parsedImages = images.split(',').map((img) => img.trim()).filter(Boolean);
    }

    const customId = id && typeof id === 'string' && id.trim()
      ? id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
      : `prod_${crypto.randomUUID().slice(0, 8)}`;

    const reviewCountNum = reviewCount !== undefined && reviewCount !== '' ? Math.max(0, Number(reviewCount)) : 0;
    const ratingNum = reviewCountNum > 0
      ? (rating !== undefined && rating !== '' ? Number(rating) : 5.0)
      : 0;

    const newProduct: Product = {
      id: customId,
      title: title.trim(),
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: description?.trim() || '',
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      categoryId,
      categoryName,
      images: parsedImages,
      rating: ratingNum,
      reviewCount: reviewCountNum,
      stock: stock !== undefined && stock !== '' ? Math.max(0, Number(stock)) : 10,
      featured: Boolean(featured),
      tags: parsedTags,
      specifications: specifications || {},
      createdAt: new Date().toISOString()
    };

    const created = await productRepo.create(newProduct);
    res.status(201).json(created);
  } catch (error) {
    console.error('Failed to create product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = await productRepo.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updates = { ...req.body };

    if (updates.categoryId) {
      const category = await categoryRepo.findById(updates.categoryId);
      if (category) {
        updates.categoryName = category.name;
      }
    }

    if (updates.price !== undefined && updates.price !== '') {
      updates.price = Number(updates.price);
    }

    if (updates.compareAtPrice !== undefined) {
      updates.compareAtPrice = updates.compareAtPrice && updates.compareAtPrice !== ''
        ? Number(updates.compareAtPrice)
        : undefined;
    }

    if (updates.stock !== undefined && updates.stock !== '') {
      updates.stock = Math.max(0, Number(updates.stock));
    }

    if (updates.reviewCount !== undefined && updates.reviewCount !== '') {
      updates.reviewCount = Math.max(0, Number(updates.reviewCount));
      if (updates.reviewCount === 0 && updates.rating === undefined) {
        updates.rating = 0;
      }
    }

    if (updates.rating !== undefined && updates.rating !== '') {
      updates.rating = Number(updates.rating);
    }

    if (updates.featured !== undefined) {
      updates.featured = Boolean(updates.featured);
    }

    if (typeof updates.tags === 'string') {
      updates.tags = updates.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    }

    if (typeof updates.images === 'string') {
      updates.images = updates.images.split(',').map((img: string) => img.trim()).filter(Boolean);
    }

    if (updates.title && !updates.slug) {
      updates.slug = updates.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    const updated = await productRepo.update(id, updates);
    res.json(updated);
  } catch (error) {
    console.error('Failed to update product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const deleted = await productRepo.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted', id });
  } catch (error) {
    console.error('Failed to delete product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};
