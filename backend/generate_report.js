const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Initialize PDF Document
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  bufferPages: true
});

const reportPath = path.join('C:', 'Users', 'HP', 'OneDrive', 'Desktop', 'POS_Inventory', 'Google_Sheets', 'Harshada Nichit.pdf');
const writeStream = fs.createWriteStream(reportPath);
doc.pipe(writeStream);

// Styles and Palettes
const colors = {
  primary: '#0f172a',    // Dark Slate
  secondary: '#334155',  // Slate
  accent: '#0d9488',     // Teal
  text: '#1e293b',       // Dark Charcoal
  lightText: '#64748b',  // Muted Slate
  line: '#e2e8f0',       // Light Grey
  boxBg: '#f8fafc'       // Light Blue-Grey
};

// Section counter
let sectionCounter = 0;
function getSecNum() {
  sectionCounter++;
  return `${sectionCounter}.0`;
}

// Helper: Title / Cover Page
function renderCoverPage() {
  doc.rect(0, 0, 595, 842).fill('#f8fafc');
  doc.rect(0, 0, 15, 842).fill(colors.accent);
  
  doc.fillColor(colors.primary);
  doc.font('Helvetica-Bold').fontSize(28);
  doc.text('POS & INVENTORY', 50, 180, { lineGap: 10 });
  doc.text('MANAGEMENT SYSTEM', 50, 220);
  
  doc.moveTo(50, 280).lineTo(350, 280).strokeColor(colors.accent).lineWidth(4).stroke();
  
  doc.fillColor(colors.secondary);
  doc.font('Helvetica').fontSize(14);
  doc.text('Enterprise Business Software Product Documentation & Implementation Guide', 50, 310, { width: 450 });
  
  doc.y = 480;
  doc.fontSize(10).fillColor(colors.lightText).text('AUTHOR & PREPARER:');
  doc.fontSize(12).font('Helvetica-Bold').fillColor(colors.primary).text('Harshada Nichit', { paragraphGap: 12 });
  
  doc.fontSize(10).font('Helvetica').fillColor(colors.lightText).text('PROJECT CLASSIFICATION:');
  doc.fontSize(11).font('Helvetica-Bold').fillColor(colors.primary).text('Enterprise Multi-Branch Retail & Restaurant System', { paragraphGap: 12 });
  
  doc.fontSize(10).font('Helvetica').fillColor(colors.lightText).text('DOCUMENT VERSION:');
  doc.fontSize(11).font('Helvetica-Bold').fillColor(colors.primary).text('1.0', { paragraphGap: 12 });
  
  doc.fontSize(10).font('Helvetica').fillColor(colors.lightText).text('DATE OF RELEASE:');
  doc.fontSize(11).font('Helvetica-Bold').fillColor(colors.primary).text('25-Jun-2026', { paragraphGap: 12 });
  
  doc.addPage();
}

// Helper: Add Section Header
function addSectionHeader(title) {
  doc.moveDown(2);
  const num = getSecNum();
  doc.fillColor(colors.primary);
  doc.font('Helvetica-Bold').fontSize(14);
  doc.text(`${num} ${title.toUpperCase()}`, { paragraphGap: 8 });
  doc.moveTo(doc.x, doc.y).lineTo(545, doc.y).strokeColor(colors.line).lineWidth(1).stroke();
  doc.moveDown(0.8);
}

// Helper: Add Sub-section Header
function addSubHeader(title) {
  doc.moveDown(1);
  doc.fillColor(colors.accent);
  doc.font('Helvetica-Bold').fontSize(11);
  doc.text(title, { paragraphGap: 4 });
  doc.font('Helvetica').fontSize(9.5).fillColor(colors.text);
}

// Helper: Add Screenshot Placeholder Box
function addScreenshotBox(pageName) {
  doc.moveDown(0.8);
  const currentY = doc.y;
  
  // Draw placeholder box
  doc.rect(50, currentY, 495, 100).fillAndStroke(colors.boxBg, colors.line);
  doc.fillColor(colors.lightText);
  doc.font('Helvetica-Bold').fontSize(9);
  doc.text('------------------------------------------------------------------------------------------------------------------------', 55, currentY + 25, { align: 'center', width: 485 });
  doc.text(`[ INSERT ACTUAL ${pageName.toUpperCase()} SCREENSHOT HERE ]`, 55, currentY + 45, { align: 'center', width: 485 });
  doc.text('------------------------------------------------------------------------------------------------------------------------', 55, currentY + 65, { align: 'center', width: 485 });
  
  doc.y = currentY + 115;
  doc.font('Helvetica').fontSize(9.5).fillColor(colors.text);
}

// RENDER SECTIONS
renderCoverPage();

// SECTION 1: PROJECT OVERVIEW
addSectionHeader('Project Overview & Architecture');
addSubHeader('1.1 Introduction');
doc.text('The POS & Inventory Management System is a unified commerce software platform tailored for high-volume retail checkouts and full-service restaurant dining operations. The system coordinates transaction registers, table layouts, live kitchen display screens (KDS), and supplier ledgers into a single secure business management tool.', { align: 'justify', paragraphGap: 10 });

addSubHeader('1.2 Technical Architecture');
doc.text('The platform uses a decoupled, three-tier architecture:\n' +
         '• Frontend: React and TypeScript Single Page Application built for high responsiveness.\n' +
         '• Backend: Node.js and Express REST API Server conducting strict business schema routing.\n' +
         '• Database Layer: PostgreSQL Database mapped through Prisma Client ORM for atomic transactions.\n' +
         '• Sync Node: WebSockets and Server-Sent Events (SSE) for dynamic updates on KDS monitors.', { align: 'justify', paragraphGap: 10 });

// SECTION 2: MODULE RELATIONSHIPS
addSectionHeader('Module Relationships');
doc.text('The subsystems map directly into each other to prevent administrative silos and inventory discrepancies:', { align: 'justify', paragraphGap: 10 });
const relations = [
  ['Inventory <-> Supplier', 'Tracks low stock products and maps them directly to registered suppliers to suggest restocks.'],
  ['Supplier <-> Purchase Orders', 'Requires mapped supplier IDs to populate contact details, tax numbers, and pricing logs.'],
  ['Purchase Orders <-> Inventory', 'Receiving stock updates inventory registers automatically via Goods Received Notes (GRN).'],
  ['Inventory <-> POS Billing', 'Cashier checkouts query real-time quantities and block processing if items are out of stock.'],
  ['POS Billing <-> Invoice', 'Saves invoice records instantly upon transaction clearance, locking customer loyalty updates.'],
  ['Kitchen <-> Inventory', 'KDS ticket clearances automatically decrease raw ingredients according to recipe maps.'],
  ['Kitchen <-> Supplier', 'Kitchen stock requests connect directly to admin approval dashboards, compiling into POs.'],
  ['Restaurant Orders <-> Kitchen Display', 'Waitstaff order selections route immediately to kitchen monitors in real time.']
];
relations.forEach(([title, desc]) => {
  doc.font('Helvetica-Bold').fillColor(colors.accent).text(`• ${title}: `, { continued: true });
  doc.font('Helvetica').fillColor(colors.text).text(desc, { paragraphGap: 6 });
});

// SECTION 3: DATA FLOW DIAGRAMS (DFD)
addSectionHeader('Data Flow Diagrams (DFD)');
doc.text('This section describes the data pathways across entities, processes, and databases.', { paragraphGap: 10 });

addSubHeader('3.1 Level 0 DFD (System Context Diagram)');
doc.text('[Customer/Waiter/Supplier] ===(Inputs/Commands)===> [POS System] ===(Receipts/POS/Orders)===> [Entities]', { align: 'center', paragraphGap: 10 });

addSubHeader('3.2 Level 1 DFD (Functional Process Map)');
doc.text('Entity --> Process 1.0 (POS / KOT Order) --> DB [orders / order_items]\n' +
         'Process 1.0 --> Process 2.0 (Stock Handler) --> DB [products / inventory_movements]\n' +
         'Process 2.0 --> Process 3.0 (Procurement Tracker) --> DB [purchase_orders / suppliers]', { align: 'center', paragraphGap: 10 });

addSubHeader('3.3 Retail Sales DFD');
doc.text('Barcode Scan --> Match SKU --> Cart Cache --> Payment Settle --> DB [invoices / payments] & Stock Decrement', { align: 'center', paragraphGap: 10 });

addSubHeader('3.4 Restaurant Order DFD');
doc.text('Table QR/Waiter --> DB [orders] --> KDS Grid --> Prepare Food --> Recipe Decelerator --> Serve Notification', { align: 'center', paragraphGap: 10 });

addSubHeader('3.5 Inventory Management DFD');
doc.text('Stock Audits --> Adjustments Log --> DB [inventory_movements] & Expiry Auditor --> Admin Dashboard Alert', { align: 'center', paragraphGap: 10 });

addSubHeader('3.6 Supplier Procurement DFD');
doc.text('Low Stock alert --> Draft PO --> Admin Approve --> Email Vendor PDF --> Goods Check (GRN) --> Stock Add', { align: 'center', paragraphGap: 10 });

addSubHeader('3.7 POS Billing DFD');
doc.text('Barcode Scan --> Catalog Match --> Tax/Discount Math --> Settle Trigger --> Invoice Store --> Print Tally', { align: 'center', paragraphGap: 10 });

addSubHeader('3.8 Invoice Flow DFD');
doc.text('DB [invoices] --> PDF Invoice Compiler --> API Relay Server --> WhatsApp Notification / Email Dispatch', { align: 'center', paragraphGap: 10 });

// SECTION 4: SETTINGS MODULE
addSectionHeader('Settings Module & Customizations');
doc.text('The settings module customizes system behavior to suit business requirements:', { paragraphGap: 10 });
const settingsItems = [
  ['Business Settings', 'Configures GST/VAT schedules, currency symbols, and multi-branch details.'],
  ['Restaurant Settings', 'Standardizes kitchen preparation timers, seating counts, and floor plans.'],
  ['Retail Settings', 'Controls barcode print standards, scanner templates, and stock margins.'],
  ['Logo Management', 'Manages company logo uploads for digital invoices and QR menu headers.'],
  ['Digital Signature', 'Verifies compliance for invoice signatures and tax reporting.'],
  ['Official Stamp', 'Embeds official seals on PDF Purchase Orders generated for suppliers.'],
  ['Email Configuration', 'Sets up SMTP servers, ports, usernames, and passwords for emails.'],
  ['WhatsApp Configuration', 'Links API keys and templates (e.g. Interakt) for automated invoice notifications.'],
  ['Tax Settings', 'Defines tax brackets linked with inventory items for checkout tax calculation.'],
  ['Invoice Settings', 'Configures template prefixes (e.g. INV-YYYY-), terms, and footer messages.'],
  ['User Settings', 'Manages worker profiles, roles, and branch designations.'],
  ['Role Permissions', 'Maintains permissions for cashier, waiter, chef, and admin roles.'],
  ['System Preferences', 'Controls screen themes, drawer links, and print preview flags.']
];
settingsItems.forEach(([name, desc]) => {
  doc.font('Helvetica-Bold').fillColor(colors.accent).text(`• ${name}: `, { continued: true });
  doc.font('Helvetica').fillColor(colors.text).text(desc, { paragraphGap: 6 });
});

// SECTION 5: ADDITIONAL BUSINESS WORKFLOWS
addSectionHeader('Core Business Workflows');

addSubHeader('5.1 Barcode Management Workflow');
doc.text('1. Product Created: Product is logged in database with SKU details.\n' +
         '2. Barcode Assigned: Barcode code is registered and printable tags generated.\n' +
         '3. Barcode Scanned: Checkout scanner reads barcode, identifying product.\n' +
         '4. Product Added to Cart: Cart increments quantities and totals.\n' +
         '5. Invoice Generated: Checkout concludes, stock levels decrement.', { paragraphGap: 10 });

addSubHeader('5.2 Payment Management Workflow');
doc.text('1. Billing Trigger: Order is calculated for checkout.\n' +
         '2. Payment Selection: Cashier selects payment modes (Cash, UPI, Card, Splits).\n' +
         '3. Payment Success: Records are committed to DB payments.\n' +
         '4. Invoice Generation: System writes receipt and fires messaging APIs.\n' +
         '5. Inventory Update: Linked stock counts decrement.', { paragraphGap: 10 });

addSubHeader('5.3 Retail Supplier Management Workflow');
doc.text('Low Stock Alert --> Admin drafts PO --> Supplier processes PO --> Stock checked at GRN --> Inventory incremented', { paragraphGap: 10 });

addSubHeader('5.4 Restaurant Supplier Management Workflow');
doc.text('Kitchen requests items --> Admin approves requests --> PO generated --> Vendor delivers items --> Kitchen stock incremented', { paragraphGap: 10 });

doc.addPage();

// SECTION 6: PROJECT PAGE INVENTORY (All 46 pages)
addSectionHeader('Project Page Inventory');
doc.text('This section lists all pages in the POS & Inventory Management System, detailing purpose, target users, parameters, and database impacts.', { paragraphGap: 12 });

const pages = [
  {
    name: "Dashboard",
    module: "Common Module",
    purpose: "Operational dashboard showing sales figures, active checkouts, stock levels, and expiring batches.",
    users: "Super Admin, Admin, Manager",
    features: "Dynamic KPI metrics cards, interactive sales charts, and low stock warnings.",
    inputs: "Date range selector, branch location filter.",
    outputs: "Total sales values, profit margins, pending stock requests, and upcoming expiry lists.",
    db: "orders, products, ProductBranchStock, ExpiryManagement, KitchenStockRequest",
  },
  {
    name: "Inventory",
    module: "Inventory Module",
    purpose: "Primary workspace for managing stock counts, low stock warnings, out of stock logs, and expiries.",
    users: "Admin, Manager, Inventory Staff",
    features: "Product list tables, sorting by date, quick stock corrections, and filter options.",
    inputs: "Search queries, category filters, stock level toggles.",
    outputs: "Categorized stock listings, inventory totals, and restock suggestion lists.",
    db: "products, ProductBranchStock, categories, suppliers",
  },
  {
    name: "Add Product Popup",
    module: "Inventory Module",
    purpose: "Quick registration form for adding new products directly into the database.",
    users: "Admin, Manager",
    features: "Input fields validation, automated SKU generation, and supplier mapping fields.",
    inputs: "Product name, SKU, price, category, supplier, low stock alert value.",
    outputs: "New product record created in the database.",
    db: "products, Category, Supplier",
  },
  {
    name: "Product Catalog",
    module: "Retail Module",
    purpose: "Displays all retail products organized by categories for cashiers.",
    users: "Cashier, Store Staff",
    features: "Category tab navigation, product search bar, and grid display with stock indicators.",
    inputs: "Category tabs selection, search query.",
    outputs: "Visual list of items with real-time stock levels.",
    db: "products, Category, ProductBranchStock",
  },
  {
    name: "Low Stock Section",
    module: "Inventory Module",
    purpose: "Dedicated pane listing all products that have fallen below their configured low stock limit.",
    users: "Admin, Manager, Inventory Staff",
    features: "Reorder suggestion links, supplier details display, and quick reorder checkouts.",
    inputs: "Branch filters, sort by date.",
    outputs: "List of products needing restock, ranked by priority.",
    db: "products, ProductBranchStock, Supplier",
  },
  {
    name: "Out Of Stock Section",
    module: "Inventory Module",
    purpose: "Highlights products with zero stock, helping managers avoid missed sales.",
    users: "Admin, Manager, Inventory Staff",
    features: "Zero-stock alerts, fast PO generation wizard, and lost sales estimates.",
    inputs: "Sort parameters.",
    outputs: "Out-of-stock product list with restock buttons.",
    db: "products, ProductBranchStock, Supplier",
  },
  {
    name: "Expiry Tracker",
    module: "Inventory Module",
    purpose: "Tracks expiration dates for fresh foods, beverages, and other perishable items.",
    users: "Admin, Manager, Inventory Staff",
    features: "Color-coded expiration dates (green, orange, red), bulk discount markdown buttons, and write-off logs.",
    inputs: "Days-to-expiry range filters.",
    outputs: "Expiring items list with marked-down prices.",
    db: "products, ExpiryManagement",
  },
  {
    name: "Inventory Activity",
    module: "Inventory Module",
    purpose: "Audit log showing all stock adjustments, manual overrides, and transfers.",
    users: "Admin, Manager, Inventory Staff",
    features: "Log table with timestamps, staff names, action types, and comments.",
    inputs: "Date range, action type filter, product search.",
    outputs: "Audit log of stock movements.",
    db: "inventory_movements, User, products",
  },
  {
    name: "Supplier List",
    module: "Supplier Module",
    purpose: "Directory containing contact details, tax numbers, and ratings for all approved suppliers.",
    users: "Admin, Manager",
    features: "Add/edit supplier wizards, performance ratings, and supplier contact shortcuts.",
    inputs: "Search queries, rating filters.",
    outputs: "Active suppliers list with performance scorecards.",
    db: "suppliers, SupplierPerformance",
  },
  {
    name: "Add Supplier Popup",
    module: "Supplier Module",
    purpose: "Registration form for onboarding new vendors.",
    users: "Admin, Manager",
    features: "GSTIN tax verification inputs, contact forms, and address fields.",
    inputs: "Company name, contact name, phone, email, address, GSTIN.",
    outputs: "New supplier record created.",
    db: "suppliers",
  },
  {
    name: "Purchase Order Page",
    module: "Supplier Module",
    purpose: "Creates and manages Purchase Orders (PO) sent to suppliers.",
    users: "Admin, Manager",
    features: "Dynamic line items grid, tax and shipping calculators, and PDF order previews.",
    inputs: "Supplier selection, products list, quantity, price overrides.",
    outputs: "PO records with printable PDFs.",
    db: "purchase_orders, PurchaseOrderItem, suppliers",
  },
  {
    name: "Supplier Order Details",
    module: "Supplier Module",
    purpose: "Shows tracking details, delivery statuses, and invoices for individual supplier orders.",
    users: "Admin, Manager, Inventory Staff",
    features: "Delivery status progress bars (Draft, Sent, Delivered, Void), Goods Received Notes (GRN) matching, and payment logs.",
    inputs: "Status updates, delivery date logging.",
    outputs: "Updated PO status and stock increments upon delivery.",
    db: "purchase_orders, GoodsReceivedNotes, ProductBranchStock",
  },
  {
    name: "Kitchen Dashboard",
    module: "Restaurant Module",
    purpose: "Displays current operational metrics for kitchen preparation teams.",
    users: "Kitchen Manager, Chef",
    features: "Active order counters, ticket preparation times, and ingredient status highlights.",
    inputs: "Shift selection, branch filter.",
    outputs: "Average preparation times, ingredient usage, and active cooking tickets summary.",
    db: "orders, OrderItem, products, RecipeManagement",
  },
  {
    name: "Kitchen Display Screen",
    module: "Restaurant Module",
    purpose: "Replaces paper tickets in the kitchen with a digital queue of active cooking tickets.",
    users: "Kitchen Staff, Cooks",
    features: "Dynamic ticket cards, order timers, and ticket state updates (cooking, ready, served).",
    inputs: "Button clicks to update ticket statuses.",
    outputs: "Real-time ticket updates shown on waiter and checkout dashboards.",
    db: "orders, OrderItem",
  },
  {
    name: "Kitchen Purchase Request",
    module: "Restaurant Module",
    purpose: "Allows kitchen staff to request fresh ingredients when stock runs low.",
    users: "Kitchen Staff, Chef",
    features: "Ingredient list, quantity selector, and urgent restock toggles.",
    inputs: "Ingredient selection, quantity needed, priority level.",
    outputs: "Stock request forwarded to the admin approval queue.",
    db: "KitchenStockRequest, products",
  },
  {
    name: "POS Billing",
    module: "Common Module",
    purpose: "Fast checkout screen for cashiers to process customer transactions.",
    users: "Cashier, Admin",
    features: "Barcode scanner listener, discount engine, loyalty points lookup, and split payment modes.",
    inputs: "Scan items, manual search, customer selection, payment modes.",
    outputs: "Completed orders, printed invoices, and stock decrements.",
    db: "orders, OrderItem, Customer, Product, Payment, SplitPayment, Invoice",
  },
  {
    name: "Barcode Scanner",
    module: "Retail Module",
    purpose: "Configuration page and backend listener for barcode scanner hardware integrations.",
    users: "Cashier, Admin",
    features: "Scanner speed adjustments, input parser settings, and test scan verification inputs.",
    inputs: "Simulated or hardware scanner inputs.",
    outputs: "Parsed SKU or UPC matched directly to product database records.",
    db: "products",
  },
  {
    name: "Invoice Page",
    module: "Common Module",
    purpose: "Displays detailed tax invoices and receipt formats.",
    users: "Cashier, Admin, Customer (via QR menu)",
    features: "Tax breakdowns, logo display, terms of service, and PDF download buttons.",
    inputs: "Invoice ID query.",
    outputs: "Formatted invoices suitable for print or email.",
    db: "Invoice, Order, Customer, ShopSettings",
  },
  {
    name: "Customer Management",
    module: "Common Module",
    purpose: "Directory of retail and restaurant customers.",
    users: "Admin, Manager, Cashier",
    features: "Add/edit customer profiles, loyalty points tracker, and purchase history views.",
    inputs: "Customer name, phone, email, notes, loyalty points updates.",
    outputs: "Customer profiles with search capabilities.",
    db: "Customer, CustomerTransaction, LoyaltyTransaction",
  },
  {
    name: "Reports",
    module: "Common Module",
    purpose: "Consolidated business report page.",
    users: "Super Admin, Admin, Manager",
    features: "Sales summaries, tax reports, profit margin analytics, and export formats.",
    inputs: "Date ranges, branch filters, export formats (CSV, PDF).",
    outputs: "Sales charts, tax tallies, and downloadable reports.",
    db: "orders, OrderItem, products, Payment",
  },
  {
    name: "Settings",
    module: "Settings Module",
    purpose: "Access panel for editing shop rules, tax rates, logos, and communication APIs.",
    users: "Super Admin, Admin",
    features: "Shop profiles editing, SMTP setups, and API key configurations.",
    inputs: "Shop name, address, tax rate, SMTP details, WhatsApp API credentials.",
    outputs: "Updated configurations saved globally in the database.",
    db: "ShopSettings",
  },
  {
    name: "BusinessPageLayout",
    module: "Admin Module",
    purpose: "Defines page structures and navigation tabs for administrators.",
    users: "Admin, Super Admin",
    features: "Dashboard layout toggles, navigation menu builders, and profile headers.",
    inputs: "Layout styles, toggle status settings.",
    outputs: "Updated admin layouts across modules.",
    db: "ShopSettings, User",
  },
  {
    name: "Categories",
    module: "Inventory Module",
    purpose: "Organizes products into nested category maps.",
    users: "Admin, Manager",
    features: "Category listings, category hierarchy editor, and status toggles.",
    inputs: "Category name, parent category links, status.",
    outputs: "Category tree structure.",
    db: "Category",
  },
  {
    name: "CustomerDetails",
    module: "Common Module",
    purpose: "Deep-dive view showing individual customer statistics.",
    users: "Admin, Manager",
    features: "Purchase timelines, notes log, and transaction history tables.",
    inputs: "Customer ID selection, notes input.",
    outputs: "Customer histories and timelines.",
    db: "Customer, CustomerNote, CustomerTimeline, Order",
  },
  {
    name: "DigitalMenuBuilder",
    module: "Restaurant Module",
    purpose: "Allows restaurant managers to design digital menus.",
    users: "Admin, Manager",
    features: "Category tabs, image upload links, pricing forms, and active status toggles.",
    inputs: "Dish name, description, price, image link, status.",
    outputs: "Updated public QR menus.",
    db: "products, Category",
  },
  {
    name: "ForgotPassword",
    module: "Authentication Module",
    purpose: "Allows users to request reset links if they forget their password.",
    users: "All Users",
    features: "Email validation and secure token links generator.",
    inputs: "User email address.",
    outputs: "Password reset links sent to user emails.",
    db: "User, PasswordResetToken",
  },
  {
    name: "OnlineOrders",
    module: "Restaurant Module",
    purpose: "Tracks online orders placed via QR codes.",
    users: "Cashier, Waiter, Kitchen Staff",
    features: "Real-time order cards, payment confirmation status indicators, and KDS routing links.",
    inputs: "Order status updates.",
    outputs: "Orders routed to KDS or POS checkout panels.",
    db: "orders, OrderItem, Payment",
  },
  {
    name: "OrdersPage",
    module: "Common Module",
    purpose: "Central page showing complete order histories.",
    users: "Admin, Manager, Cashier",
    features: "Search filters, status selectors, and invoice refund links.",
    inputs: "Date filters, status filters, invoice search queries.",
    outputs: "History of completed, held, and refunded orders.",
    db: "orders, OrderItem, Customer",
  },
  {
    name: "PaymentsPage",
    module: "Common Module",
    purpose: "Tracks payment transactions, payment methods, and gateways.",
    users: "Admin, Manager",
    features: "Transaction lists, payment method filters, and refund initiators.",
    inputs: "Transaction ID search, date ranges.",
    outputs: "Financial audit logs for cashier counters.",
    db: "Payment, SplitPayment, Order",
  },
  {
    name: "ProductExchange",
    module: "Retail Module",
    purpose: "Processes returns and item exchanges for retail customers.",
    users: "Cashier, Manager",
    features: "Original items scanner, replacement matches search, and balance adjustment math.",
    inputs: "Invoice ID, returned item, replacement item.",
    outputs: "Stock counts updated and credit notes generated.",
    db: "products, Order, OrderItem, ProductExchange, ExchangeItem",
  },
  {
    name: "ProductSalesHistory",
    module: "Reports Module",
    purpose: "Shows sales figures for individual products.",
    users: "Admin, Manager",
    features: "Sales graphs, customer demographics summary, and seasonal demand metrics.",
    inputs: "Product ID, date range.",
    outputs: "Product sales charts.",
    db: "OrderItem, Order, products",
  },
  {
    name: "PublicInvoiceView",
    module: "Common Module",
    purpose: "Customer-facing portal for viewing digital receipts via QR codes.",
    users: "Customers, Public",
    features: "VAT/GST invoice displays, business contact cards, and PDF receipts downloads.",
    inputs: "QR security tokens.",
    outputs: "Digital receipts shown on customer smartphones.",
    db: "Invoice, Order, ShopSettings",
  },
  {
    name: "PublicQRMenu",
    module: "Restaurant Module",
    purpose: "Guest-facing menu accessed via table QR codes.",
    users: "Customers, Public Guests",
    features: "Category filters, interactive carts, and split payment checkouts.",
    inputs: "Item selections, quantities, customer details.",
    outputs: "Orders sent to the kitchen and checkout queues.",
    db: "products, Category, orders, OrderItem",
  },
  {
    name: "RecipeManagement",
    module: "Restaurant Module",
    purpose: "Defines recipe ingredient maps for menu items.",
    users: "Kitchen Manager, Chef",
    features: "Raw ingredient selectors, unit mapping fields, and production cost updates.",
    inputs: "Dish selection, raw ingredients list, quantity needed per dish.",
    outputs: "Recipe maps that trigger automatic stock decrements.",
    db: "products, Category",
  },
  {
    name: "Reservations",
    module: "Restaurant Module",
    purpose: "Manages guest table reservations.",
    users: "Waiter, Manager, Host",
    features: "Interactive table calendars, guest directories, and seating alerts.",
    inputs: "Guest details, table selection, date, time, party size.",
    outputs: "Updated reservation calendar schedules.",
    db: "Customer, TableManagement",
  },
  {
    name: "RestaurantDashboard",
    module: "Restaurant Module",
    purpose: "Displays metrics for restaurant operations.",
    users: "Manager, Admin",
    features: "Table turnovers rates, average ticket values, and busy hours charts.",
    inputs: "Branch filters, date ranges.",
    outputs: "Operational graphs for table management.",
    db: "orders, OrderItem, TableManagement",
  },
  {
    name: "RestaurantInventory",
    module: "Restaurant Module",
    purpose: "Manages fresh ingredients and kitchen inventory.",
    users: "Kitchen Manager, Chef",
    features: "Ingredient level indicators, wastage trackers, and restock order forms.",
    inputs: "Wastage logs, ingredient edits.",
    outputs: "Ingredient lists with restock status notifications.",
    db: "products, ProductBranchStock, inventory_movements",
  },
  {
    name: "RestaurantReports",
    module: "Restaurant Module",
    purpose: "Financial reports tailored for restaurant managers.",
    users: "Admin, Manager",
    features: "Food versus beverage charts, waiter performance leaderboards, and wastage summaries.",
    inputs: "Date ranges, shift filters.",
    outputs: "Restaurant performance reports.",
    db: "orders, OrderItem, User, inventory_movements",
  },
  {
    name: "ReturnsRefunds",
    module: "Retail Module",
    purpose: "Processes returns and refunds for retail customers.",
    users: "Cashier, Manager",
    features: "Original invoice lookups, restocking options, and payment return updates.",
    inputs: "Invoice ID, returned items, reason, payment methods.",
    outputs: "Updated invoice records and cash drawer adjustments.",
    db: "Refund, Order, OrderItem, ProductBranchStock",
  },
  {
    name: "SalesHistory",
    module: "Common Module",
    purpose: "Lists all completed transactions in chronological order.",
    users: "Admin, Manager, Cashier",
    features: "Search filters, invoice reprint links, and transaction export shortcuts.",
    inputs: "Date filters, cashier filters.",
    outputs: "List of completed transactions.",
    db: "orders, User, Customer",
  },
  {
    name: "SignUp",
    module: "Authentication Module",
    purpose: "Allows new administrators or employees to register profiles.",
    users: "New Employees (requires Admin invite)",
    features: "Password validation fields, mobile forms, and branch links.",
    inputs: "Name, email, mobile, password, invite code.",
    outputs: "New employee profile created in DB.",
    db: "User, Branch",
  },
  {
    name: "TableManagement",
    module: "Restaurant Module",
    purpose: "Interactive table layout editor.",
    users: "Waiter, Manager",
    features: "Table placement editor, real-time table status updates (cooking, ready, served), and guest numbers trackers.",
    inputs: "Table layouts, table status changes.",
    outputs: "Dynamic seating maps sync'd across waitstaff dashboards.",
    db: "orders",
  },
  {
    name: "TakeOrder",
    module: "Restaurant Module",
    purpose: "Table-side ordering interface used by waitstaff.",
    users: "Waiter, Host",
    features: "Table selection cards, order grids, and custom prep note inputs.",
    inputs: "Table selection, item selections, prep notes.",
    outputs: "Orders routed directly to KDS screens.",
    db: "orders, OrderItem",
  },
  {
    name: "WaiterDashboard",
    module: "Restaurant Module",
    purpose: "Operational screen for waiters to track active tables.",
    users: "Waiter",
    features: "My Tables display panels, ticket preparation alerts, and bill generation shortcuts.",
    inputs: "Waiter ID, order updates.",
    outputs: "Table billing requests sent to checkout desks.",
    db: "orders, TableManagement",
  },
  {
    name: "WaiterManagement",
    module: "Restaurant Module",
    purpose: "Manages waitstaff rosters and performance tracking.",
    users: "Admin, Manager",
    features: "Waiter directory, active shift trackers, and average table turn times dashboards.",
    inputs: "Waiter credentials, shifts.",
    outputs: "Shift schedules and waiter performance lists.",
    db: "User",
  },
  {
    name: "Login",
    module: "Authentication Module",
    purpose: "Access portal for authenticated users.",
    users: "All Staff",
    features: "Secure input fields, error loaders, and MFA validation codes.",
    inputs: "Email, password, MFA token.",
    outputs: "HttpOnly session token written and user directed to Dashboard.",
    db: "User, LoginSession"
  }
];

// Append every page
pages.forEach(page => {
  doc.addPage();
  addSectionHeader(`${page.name} Page`);
  
  doc.font('Helvetica-Bold').fillColor(colors.accent).text('Module: ', { continued: true });
  doc.font('Helvetica').fillColor(colors.text).text(page.module, { paragraphGap: 8 });
  
  doc.font('Helvetica-Bold').fillColor(colors.accent).text('Purpose: ', { continued: true });
  doc.font('Helvetica').fillColor(colors.text).text(page.purpose, { paragraphGap: 8 });
  
  doc.font('Helvetica-Bold').fillColor(colors.accent).text('Business Importance: ', { continued: true });
  doc.font('Helvetica').fillColor(colors.text).text(`Essential viewport for ${page.users} roles. Protects transactional flows, eliminates entry errors, and preserves historical data records.`, { paragraphGap: 8 });
  
  doc.font('Helvetica-Bold').fillColor(colors.accent).text('Features: ', { continued: true });
  doc.font('Helvetica').fillColor(colors.text).text(page.features, { paragraphGap: 8 });
  
  doc.font('Helvetica-Bold').fillColor(colors.accent).text('Workflow: ', { continued: true });
  doc.font('Helvetica').fillColor(colors.text).text(`1. Navigate to page.\n2. Supply parameters: [${page.inputs}].\n3. Execute actions.\n4. Output rendered: [${page.outputs}].`, { paragraphGap: 8 });
  
  doc.font('Helvetica-Bold').fillColor(colors.accent).text('Database Impact: ', { continued: true });
  doc.font('Helvetica').fillColor(colors.text).text(`Reads/Writes: [${page.db}].`, { paragraphGap: 12 });
  
  addScreenshotBox(page.name);
});

// SECTION 7: SYSTEM IMPLEMENTATION CONCLUSION
doc.addPage();
addSectionHeader('System Implementation Conclusion');
doc.text('The POS & Inventory Management System represents a production-grade software package designed for modern multi-branch retail and hospitality setups. By integrating inventory controls, recipe decrement triggers, supplier procurement logs, email notifications, and WhatsApp communication tools into a unified relational database, the system ensures data accuracy, eliminates manual bottlenecks, and protects business profits. It offers a scalable, secure implementation model ready for deployment.', { align: 'justify', paragraphGap: 12 });

// RENDER FOOTERS & PAGE NUMBERS (Double-pass layout calculation)
const range = doc.bufferedPageRange();
for (let i = 0; i < range.count; i++) {
  doc.switchToPage(i);
  
  if (i > 0) {
    // Header
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor(colors.lightText);
    doc.text('POS & INVENTORY MANAGEMENT SYSTEM  |  PROJECT DOCUMENTATION', 50, 25);
    doc.moveTo(50, 35).lineTo(545, 35).strokeColor(colors.line).lineWidth(0.5).stroke();
    
    // Footer
    doc.moveTo(50, 807).lineTo(545, 807).strokeColor(colors.line).lineWidth(0.5).stroke();
    doc.fontSize(7.5).font('Helvetica').fillColor(colors.lightText);
    doc.text('Author: Harshada Nichit', 50, 815);
    doc.text(`Page ${i + 1} of ${range.count}`, 500, 815);
  }
}

// Finalize PDF
doc.end();
console.log('Successfully generated Project Report PDF at: ' + reportPath);
