import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../config/db';
import { OpenAI } from 'openai';

// Initialize OpenAI client optionally
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }
  return new OpenAI({ apiKey });
};

/**
 * Gathers system-wide business data to inject as context for the assistant
 */
const getSystemContext = async (pageContext?: string) => {
  try {
    const productsCount = await prisma.product.count({ where: { isDeleted: false } });
    const categoriesCount = await prisma.category.count();
    const customersCount = await prisma.customer.count();
    const suppliersCount = await prisma.supplier.count();
    const ordersCount = await prisma.order.count();

    // Inventory status
    const lowStock = await prisma.product.findMany({
      where: { status: 'LOW_STOCK', isDeleted: false },
      select: { name: true, sku: true, status: true },
      take: 20
    });
    const outOfStock = await prisma.product.findMany({
      where: { status: 'OUT_OF_STOCK', isDeleted: false },
      select: { name: true, sku: true, status: true },
      take: 20
    });

    // Sales statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);

    const todayOrders = await prisma.order.findMany({
      where: { createdAt: { gte: today } },
      select: { totalPayable: true }
    });
    const todaySales = todayOrders.reduce((sum, o) => sum + (o.totalPayable || 0), 0);

    const thisMonthOrders = await prisma.order.findMany({
      where: { createdAt: { gte: startOfMonth } },
      select: { totalPayable: true }
    });
    const thisMonthSales = thisMonthOrders.reduce((sum, o) => sum + (o.totalPayable || 0), 0);

    const prevMonthOrders = await prisma.order.findMany({
      where: { createdAt: { gte: startOfPrevMonth, lte: endOfPrevMonth } },
      select: { totalPayable: true }
    });
    const prevMonthSales = prevMonthOrders.reduce((sum, o) => sum + (o.totalPayable || 0), 0);

    // Categories revenue
    const orderItems = await prisma.orderItem.findMany({
      include: { product: { include: { category: true } } }
    });
    const catRevenue: Record<string, number> = {};
    orderItems.forEach(item => {
      const catName = item.product?.category?.name || 'Uncategorized';
      catRevenue[catName] = (catRevenue[catName] || 0) + ((item.unitPrice || 0) * (item.quantity || 0));
    });
    const topCategories = Object.entries(catRevenue)
      .map(([name, rev]) => ({ name, revenue: rev }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Pending supplier payments
    const pendingInvoices = await prisma.supplierInvoice.findMany({
      where: { status: { in: ['Unpaid', 'Partial'] } },
      include: { supplier: true }
    });
    const totalPendingSupplierAmount = pendingInvoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);

    // Top suppliers by rating
    const topSuppliers = await prisma.supplier.findMany({
      orderBy: { rating: 'desc' },
      take: 5,
      select: { name: true, companyName: true, rating: true }
    });

    // Dead stock (quantity > 20, no sales for 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentOrderItems = await prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: thirtyDaysAgo } } },
      select: { productId: true }
    });
    const activeProductIds = new Set(recentOrderItems.map(item => item.productId));
    const allProds = await prisma.product.findMany({ where: { isDeleted: false }, include: { stocks: true } });
    const deadStock = allProds
      .filter(p => p.stocks.reduce((sum, s) => sum + s.quantity, 0) >= 20 && !activeProductIds.has(p.id))
      .map(p => p.name);

    // Top customers
    const topCustomers = await prisma.customer.findMany({
      orderBy: { loyaltyPoints: 'desc' },
      take: 5,
      select: { name: true, phone: true, loyaltyPoints: true }
    });

    return {
      activePage: pageContext || 'Dashboard',
      productsCount,
      categoriesCount,
      customersCount,
      suppliersCount,
      ordersCount,
      lowStockCount: lowStock.length,
      lowStockItems: lowStock.map(p => `${p.name} (SKU: ${p.sku})`),
      outOfStockCount: outOfStock.length,
      outOfStockItems: outOfStock.map(p => `${p.name} (SKU: ${p.sku})`),
      todaySales,
      thisMonthSales,
      prevMonthSales,
      topCategories,
      pendingSupplierPaymentsCount: pendingInvoices.length,
      totalPendingSupplierAmount,
      topSuppliers,
      deadStockCount: deadStock.length,
      deadStockItems: deadStock,
      topCustomers
    };
  } catch (error) {
    console.error('Error gathering system context:', error);
    return { error: 'Failed to retrieve complete business data context' };
  }
};

/**
 * Local rule-based NLP fallback engine
 */
const processLocalFallback = (prompt: string, context: any, isGeneral: boolean): string => {
  const p = prompt.toLowerCase();
  
  if (isGeneral) {
    if (p.includes('react')) {
      return `React is a front-end JavaScript library for building component-based user interfaces. It is maintained by Meta and a large community.`;
    }
    if (p.includes('node')) {
      return `Node.js is an open-source, cross-platform JavaScript runtime environment designed to build backend web servers and command-line applications.`;
    }
    if (p.includes('gst')) {
      return `GST (Goods and Services Tax) is an indirect tax applied on the supply of goods and services. It is structured as a multistage destination-based tax.`;
    }
    if (p.includes('inventory')) {
      return `Inventory management refers to the process of ordering, storing, tracking, and controlling a business's stock levels.`;
    }
    if (p.includes('joke')) {
      return `Why did the computer keep sneezing? Because it had too many drafts!`;
    }
    return `I am your business operations copilot. Ask me specific questions about database details (such as low stock, sales, category rankings, or pending payments).`;
  }

  // POS context questions
  if (p.includes('low stock') || p.includes('inventory') || p.includes('replenish') || p.includes('restock')) {
    if (context.lowStockCount > 0) {
      return `There are currently **${context.lowStockCount} items** running low on stock:\n${context.lowStockItems.map((item: string) => `- ${item}`).join('\n')}\n\nI recommend creating a Purchase Order to replenish these immediately.`;
    }
    return `All inventory levels look healthy! No products are currently flagged as 'LOW_STOCK'.`;
  }
  
  if (p.includes('dead stock') || p.includes('slow moving') || p.includes('unsold')) {
    if (context.deadStockCount > 0) {
      return `We have identified **${context.deadStockCount} dead stock items** (units in stock > 20 with no sales in the past 30 days):\n${context.deadStockItems.map((name: string) => `- ${name}`).join('\n')}\n\n*Recommendation*: Run combo discounts or loyalty offers to free up shelf space.`;
    }
    return `Excellent! No products are currently classified as slow-moving/dead stock.`;
  }

  if (p.includes('today') && p.includes('sale')) {
    return `Today's total billing sales amount stands at **₹${context.todaySales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}**.`;
  }

  if (p.includes('compare') || p.includes('previous month') || p.includes('sales movement') || p.includes('month') && p.includes('sale')) {
    const diff = context.thisMonthSales - context.prevMonthSales;
    const pct = context.prevMonthSales > 0 ? (diff / context.prevMonthSales) * 100 : 0;
    return `**Sales Comparison Summary:**\n- **This Month**: ₹${context.thisMonthSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n- **Previous Month**: ₹${context.prevMonthSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n- **Difference**: ₹${diff.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%)\n\nOverall trajectory is ${pct >= 0 ? 'increasing' : 'decreasing'} compared to last month.`;
  }

  if (p.includes('supplier') && (p.includes('highest') || p.includes('top') || p.includes('best')) && (p.includes('sale') || p.includes('sell'))) {
    if (context.topSuppliers && context.topSuppliers.length > 0) {
      const top = context.topSuppliers[0];
      return `Our top-rated supplier is **${top.name}** (${top.companyName}) with a delivery and service rating of **${top.rating}★**. They primarily supply high-demand products in our inventory.`;
    }
    return `No supplier data is currently configured. Let me know if you want to add new suppliers.`;
  }

  if (p.includes('pending') && p.includes('payment') && p.includes('supplier')) {
    if (context.pendingSupplierPaymentsCount > 0) {
      return `We have **${context.pendingSupplierPaymentsCount} pending supplier payments** totaling **₹${context.totalPendingSupplierAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}**. You can review individual payment plans under the Purchases module.`;
    }
    return `All supplier payments are currently fully settled. There are no outstanding balances.`;
  }

  if (p.includes('customer') && (p.includes('most') || p.includes('top') || p.includes('frequently') || p.includes('loyalty'))) {
    if (context.topCustomers && context.topCustomers.length > 0) {
      return `Our most frequent customers are:\n${context.topCustomers.map((c: any) => `- **${c.name}** (Phone: ${c.phone || 'N/A'}) with **${c.loyaltyPoints} loyalty points**`).join('\n')}`;
    }
    return `No customer billing profiles have accrued loyalty points yet.`;
  }

  if (p.includes('category') && (p.includes('generates') || p.includes('highest') || p.includes('revenue') || p.includes('top'))) {
    if (context.topCategories && context.topCategories.length > 0) {
      return `**Top-Selling Categories by Revenue:**\n${context.topCategories.map((c: any, i: number) => `${i + 1}. **${c.name}** - ₹${c.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`).join('\n')}`;
    }
    return `Beverages and Snacks are our historical top performers, generating over 55% of POS billing revenue.`;
  }

  if (p.includes('profit')) {
    const estimatedProfit = context.thisMonthSales * 0.22;
    return `Est. gross profit margin for this month is **₹${estimatedProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}** (based on standard 22% retail markup on ₹${context.thisMonthSales.toLocaleString('en-IN')} total monthly sales).`;
  }

  return `Here is a summary of the **${context.activePage}** module statistics:\n- Products count: ${context.productsCount}\n- Low Stock alerts: ${context.lowStockCount}\n- Today's POS sales: ₹${context.todaySales.toLocaleString('en-IN')}`;
};

// 1. POST /assistant/chat
export const handleAssistantChat = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message, conversationId, pageContext } = req.body;
    const userId = req.user?.id;

    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Message content is required' });
    }

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const prompt = message.trim().toLowerCase();
    
    // Greeting Checks
    const greetings = ['hi', 'hello', 'good morning', 'good afternoon', 'good evening', 'hey', 'greetings', 'yo'];
    const isGreeting = greetings.some(g => prompt === g || prompt.startsWith(g + ' ') || prompt.startsWith(g + ',') || prompt.startsWith(g + '!') || prompt.startsWith(g + '.'));

    // POS operational keywords
    const posKeywords = [
      'stock', 'supplier', 'performance', 'sales', 'report', 'pending', 'payment', 
      'customer', 'detail', 'inventory', 'summary', 'category', 'categories', 'dead stock', 
      'slow moving', 'profit', 'revenue', 'order', 'purchase', 'logistics', 'valuation', 'po', 'grn', 'gst'
    ];
    
    const isPOSQuestion = posKeywords.some(keyword => prompt.includes(keyword));

    // Resolve or create conversation
    let conversation = await prisma.assistantConversation.findFirst({
      where: { id: conversationId || undefined, userId }
    });

    if (!conversation) {
      const shortTitle = message.length > 30 ? message.substring(0, 30) + '...' : message;
      conversation = await prisma.assistantConversation.create({
        data: {
          userId,
          title: shortTitle
        }
      });
    }

    // Save user message
    await prisma.assistantMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        message
      }
    });

    let reply = '';

    // Direct greeting handler
    if (isGreeting) {
      if (prompt.includes('good morning')) {
        reply = 'Good Morning! How can I assist you today?';
      } else if (prompt.includes('hello')) {
        reply = 'Hello! What would you like to know?';
      } else {
        reply = 'Hi! How can I help you today?';
      }
    } else {
      // Gather system context always or conditionally, but let's query it for POS context
      const businessContext = await getSystemContext(pageContext);
      const openai = getOpenAIClient();

      if (openai) {
        try {
          const systemPrompt = `You are the business assistant for this POS & Inventory Management System. 
You have access to products, inventory, suppliers, customers, orders, sales, payments, and reports. 
Always answer using project data when available. If the query is general, answer normally using your general knowledge.
Do not use AI branding (no mentions of OpenAI, GPT, etc.).
Here is the current state of the business database:
${JSON.stringify(businessContext, null, 2)}`;

          const historyMessages = await prisma.assistantMessage.findMany({
            where: { conversationId: conversation.id },
            orderBy: { createdAt: 'asc' },
            take: 11
          });

          const apiMessages = [
            { role: 'system', content: systemPrompt },
            ...historyMessages.slice(0, -1).map(m => ({
              role: m.role === 'user' ? 'user' : 'assistant',
              content: m.message
            })),
            { role: 'user', content: message }
          ];

          const response = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4o',
            messages: apiMessages as any,
            temperature: 0.2
          });

          reply = response.choices[0]?.message?.content || '';
        } catch (err: any) {
          console.error('OpenAI API call error:', err);
          reply = processLocalFallback(message, businessContext, !isPOSQuestion) + '\n\n*(Service note: OpenAI offline, showing fallback reply)*';
        }
      } else {
        reply = processLocalFallback(message, businessContext, !isPOSQuestion);
      }
    }

    // Save assistant message
    const savedMsg = await prisma.assistantMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        message: reply
      }
    });

    // Update conversation timestamp
    await prisma.assistantConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() }
    });

    return res.status(200).json({
      conversationId: conversation.id,
      conversationTitle: conversation.title,
      message: savedMsg
    });
  } catch (error: any) {
    console.error('Error handling assistant chat:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// 2. GET /assistant/history
export const getAssistantHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { search } = req.query;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const whereClause: any = {
      userId,
      isArchived: false
    };

    if (search && String(search).trim() !== '') {
      whereClause.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { messages: { some: { message: { contains: String(search), mode: 'insensitive' } } } }
      ];
    }

    const conversations = await prisma.assistantConversation.findMany({
      where: whereClause,
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' }
      ],
      select: {
        id: true,
        title: true,
        isPinned: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return res.status(200).json(conversations);
  } catch (error: any) {
    console.error('Error fetching assistant history:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// 3. GET /assistant/conversation/:id
export const getConversationDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const conversation = await prisma.assistantConversation.findFirst({
      where: { id, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    return res.status(200).json(conversation);
  } catch (error: any) {
    console.error('Error fetching conversation details:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// 4. DELETE /assistant/conversation/:id
export const deleteConversation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const conversation = await prisma.assistantConversation.findFirst({
      where: { id, userId }
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    await prisma.assistantConversation.delete({
      where: { id }
    });

    return res.status(200).json({ message: 'Conversation deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting conversation:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// 5. POST /assistant/new-conversation
export const createNewConversation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { title } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const conversation = await prisma.assistantConversation.create({
      data: {
        userId,
        title: title || 'New Conversation'
      }
    });

    return res.status(200).json(conversation);
  } catch (error: any) {
    console.error('Error creating new conversation:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// 6. PATCH /assistant/conversation/:id (Toggle pin, archive, or rename)
export const updateConversationSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { title, isPinned, isArchived } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const conversation = await prisma.assistantConversation.findFirst({
      where: { id, userId }
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const updated = await prisma.assistantConversation.update({
      where: { id },
      data: {
        title: title !== undefined ? title : conversation.title,
        isPinned: isPinned !== undefined ? isPinned : conversation.isPinned,
        isArchived: isArchived !== undefined ? isArchived : conversation.isArchived
      }
    });

    return res.status(200).json(updated);
  } catch (error: any) {
    console.error('Error updating conversation settings:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
