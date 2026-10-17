import { Request, Response } from 'express';
import { expenseRepo } from '../models/JsonRepository.js';
import type { Expense, ExpenseStats } from '../types/index.js';
import crypto from 'crypto';

export const getExpenses = async (req: Request, res: Response) => {
  try {
    let expenses = await expenseRepo.findAll();
    const { category, status, search, sort, page, limit } = req.query;

    // Filter by Category
    if (category && typeof category === 'string' && category !== 'all') {
      expenses = expenses.filter((e) => e.category.toLowerCase() === category.toLowerCase());
    }

    // Filter by Status
    if (status && typeof status === 'string' && status !== 'all') {
      expenses = expenses.filter((e) => e.status.toLowerCase() === status.toLowerCase());
    }

    // Filter by Search
    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      expenses = expenses.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          (e.receiptRef && e.receiptRef.toLowerCase().includes(q)) ||
          (e.notes && e.notes.toLowerCase().includes(q)) ||
          (e.paymentMethod && e.paymentMethod.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sort === 'amount-asc') {
      expenses.sort((a, b) => a.amount - b.amount);
    } else if (sort === 'amount-desc') {
      expenses.sort((a, b) => b.amount - a.amount);
    } else if (sort === 'date-asc') {
      expenses.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (sort === 'title') {
      expenses.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // Default: newest date first
      expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    // Pagination
    if (page || limit) {
      const pageNum = Math.max(1, parseInt((page as string) || '1', 10));
      const limitNum = Math.max(1, parseInt((limit as string) || '10', 10));
      const total = expenses.length;
      const totalPages = Math.ceil(total / limitNum);
      const startIndex = (pageNum - 1) * limitNum;
      const paginatedData = expenses.slice(startIndex, startIndex + limitNum);

      return res.json({
        data: paginatedData,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages
        }
      });
    }

    // Default: return full array
    return res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return res.status(500).json({ error: 'Failed to fetch expenses' });
  }
};

export const getExpenseStats = async (_req: Request, res: Response) => {
  try {
    const expenses = await expenseRepo.findAll();
    
    let totalExpenseAmount = 0;
    const byCategory: Record<string, { count: number; total: number }> = {};
    const byStatus: Record<string, { count: number; total: number }> = {};

    for (const exp of expenses) {
      const amt = Number(exp.amount) || 0;
      totalExpenseAmount += amt;

      // Category aggregation
      if (!byCategory[exp.category]) {
        byCategory[exp.category] = { count: 0, total: 0 };
      }
      byCategory[exp.category].count += 1;
      byCategory[exp.category].total = Math.round((byCategory[exp.category].total + amt) * 100) / 100;

      // Status aggregation
      if (!byStatus[exp.status]) {
        byStatus[exp.status] = { count: 0, total: 0 };
      }
      byStatus[exp.status].count += 1;
      byStatus[exp.status].total = Math.round((byStatus[exp.status].total + amt) * 100) / 100;
    }

    const stats: ExpenseStats = {
      totalExpenseAmount: Math.round(totalExpenseAmount * 100) / 100,
      totalExpenseCount: expenses.length,
      byCategory,
      byStatus
    };

    return res.json(stats);
  } catch (error) {
    console.error('Error calculating expense stats:', error);
    return res.status(500).json({ error: 'Failed to calculate expense statistics' });
  }
};

export const getExpenseById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const expense = await expenseRepo.findById(id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense record not found' });
    }
    return res.json(expense);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch expense' });
  }
};

export const createExpense = async (req: Request, res: Response) => {
  try {
    const {
      title,
      category,
      amount,
      date,
      recurring,
      paymentMethod,
      status,
      receiptRef,
      notes
    } = req.body;

    if (!title || !category || amount === undefined || amount === null) {
      return res.status(400).json({ error: 'Title, category and amount are required' });
    }

    const newExpense: Expense = {
      id: `exp_${crypto.randomBytes(4).toString('hex')}`,
      title: title.trim(),
      category: category.trim(),
      amount: parseFloat(amount),
      date: date || new Date().toISOString().split('T')[0],
      recurring: recurring || 'Monthly',
      paymentMethod: paymentMethod || 'Corporate Card',
      status: status || 'Paid',
      receiptRef: receiptRef ? receiptRef.trim() : undefined,
      notes: notes ? notes.trim() : undefined,
      createdAt: new Date().toISOString()
    };

    const saved = await expenseRepo.create(newExpense);
    return res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating expense:', error);
    return res.status(500).json({ error: 'Failed to create expense' });
  }
};

export const updateExpense = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const updates = req.body;

    if (updates.amount !== undefined) {
      updates.amount = parseFloat(updates.amount);
    }

    const updated = await expenseRepo.update(id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Expense record not found' });
    }
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update expense' });
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const success = await expenseRepo.delete(id);
    if (!success) {
      return res.status(404).json({ error: 'Expense record not found' });
    }
    return res.json({ message: 'Expense deleted successfully', id });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete expense' });
  }
};
