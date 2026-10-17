import { Request, Response } from 'express';
import { categoryRepo, productRepo } from '../models/JsonRepository.js';
import type { Category } from '../types/index.js';
import crypto from 'crypto';

export const getCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await categoryRepo.findAll();
    const products = await productRepo.findAll();

    const categoriesWithCount = categories.map((cat) => ({
      ...cat,
      productCount: products.filter((p) => p.categoryId === cat.id).length
    }));

    res.json(categoriesWithCount);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const category = await categoryRepo.findById(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch category' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { id, name, slug, description, image } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const trimmedName = name.trim();
    const customId = id && typeof id === 'string' && id.trim()
      ? id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
      : `cat_${crypto.randomUUID().slice(0, 8)}`;

    const generatedSlug = (slug && typeof slug === 'string' && slug.trim()
      ? slug.trim()
      : trimmedName
    ).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newCategory: Category = {
      id: customId,
      name: trimmedName,
      slug: generatedSlug,
      description: description?.trim() || '',
      image: image?.trim() || '/images/categories/electronics.jpg',
    };

    const created = await categoryRepo.create(newCategory);
    res.status(201).json(created);
  } catch (error) {
    console.error('Failed to create category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = await categoryRepo.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const updates = { ...req.body };
    if (updates.name) {
      updates.name = updates.name.trim();
      if (!updates.slug) {
        updates.slug = updates.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
    }
    if (updates.slug) {
      updates.slug = updates.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (updates.description !== undefined) {
      updates.description = updates.description.trim();
    }
    if (updates.image !== undefined) {
      updates.image = updates.image.trim();
    }

    const updated = await categoryRepo.update(id, updates);

    // If category name changed, synchronize categoryName in products that use this category
    if (updates.name && updates.name !== existing.name) {
      const products = await productRepo.findAll();
      let productChanged = false;
      const updatedProducts = products.map((p) => {
        if (p.categoryId === id) {
          productChanged = true;
          return { ...p, categoryName: updates.name };
        }
        return p;
      });
      if (productChanged) {
        await productRepo.save(updatedProducts);
      }
    }

    res.json(updated);
  } catch (error) {
    console.error('Failed to update category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const deleted = await categoryRepo.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ success: true, message: 'Category deleted', id });
  } catch (error) {
    console.error('Failed to delete category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};
