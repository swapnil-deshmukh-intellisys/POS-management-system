import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const getCategories = async (req: AuthenticatedRequest, res: Response) => {
  const { search, status, parentCategoryId } = req.query;

  try {
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    if (status) {
      whereClause.status = String(status);
    }

    if (parentCategoryId === 'null') {
      whereClause.parentCategoryId = null;
    } else if (parentCategoryId) {
      whereClause.parentCategoryId = String(parentCategoryId);
    }

    const categories = await prisma.category.findMany({
      where: whereClause,
      include: {
        parentCategory: true,
        subCategories: true,
        products: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map to include product counts like in the screenshots
    const formattedCategories = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      status: cat.status,
      sortOrder: cat.sortOrder,
      parentCategory: cat.parentCategory ? { id: cat.parentCategory.id, name: cat.parentCategory.name } : null,
      subCategoriesCount: cat.subCategories.length,
      productsCount: cat.products.length,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));

    return res.status(200).json(formattedCategories);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const createCategory = async (req: AuthenticatedRequest, res: Response) => {
  const { name, description, status, sortOrder, parentCategoryId } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const existing = await prisma.category.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        status: status || 'Active',
        sortOrder: sortOrder ? parseInt(String(sortOrder)) : 1,
        parentCategoryId: parentCategoryId || null,
      },
    });

    // Log Activity
    if (req.user) {
      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'Category Added',
          details: `Created new category: ${name}`,
        },
      });
    }

    return res.status(201).json(category);
  } catch (error: any) {
    console.error('Error creating category:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const updateCategory = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, status, sortOrder, parentCategoryId } = req.body;

  try {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check name collision
    if (name && name !== existing.name) {
      const nameCollision = await prisma.category.findUnique({ where: { name } });
      if (nameCollision) {
        return res.status(400).json({ message: 'Category with this name already exists' });
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name,
        description,
        status,
        sortOrder: sortOrder !== undefined ? parseInt(String(sortOrder)) : undefined,
        parentCategoryId: parentCategoryId === '' ? null : parentCategoryId,
      },
    });

    // Log Activity
    if (req.user) {
      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'Category Updated',
          details: `Updated category: ${updated.name}`,
        },
      });
    }

    return res.status(200).json(updated);
  } catch (error: any) {
    console.error('Error updating category:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const deleteCategory = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await prisma.category.delete({ where: { id } });

    // Log Activity
    if (req.user) {
      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'Category Deleted',
          details: `Deleted category: ${category.name}`,
        },
      });
    }

    return res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
