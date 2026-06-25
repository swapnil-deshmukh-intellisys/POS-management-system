const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Initialize PDF Document
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 40, bottom: 40, left: 40, right: 40 },
  bufferPages: true
});

const reportPath = path.join('C:', 'Users', 'HP', 'OneDrive', 'Desktop', 'POS_Inventory', 'Google_Sheets', 'Harshada Nichit Roadmap.pdf');
const writeStream = fs.createWriteStream(reportPath);
doc.pipe(writeStream);

// Professional color palette
const colors = {
  primary: '#0f172a',    // Dark Slate
  secondary: '#334155',  // Slate Gray
  accent: '#0d9488',     // Teal
  lightText: '#64748b',  // Muted Slate
  line: '#cbd5e1',       // Border Slate
  bgLight: '#f8fafc',    // Background Accent
  boxBg: '#ffffff',      // Pure White
  success: '#10b981'     // Green
};

// Helper: Title / Cover Page
function renderCoverPage() {
  doc.rect(0, 0, 595, 842).fill(colors.bgLight);
  doc.rect(0, 0, 15, 842).fill(colors.accent);
  
  doc.fillColor(colors.primary);
  doc.font('Helvetica-Bold').fontSize(26);
  doc.text('VISUAL PROJECT ROADMAP', 50, 220);
  doc.fontSize(22).fillColor(colors.secondary).text('POS & INVENTORY SYSTEM', 50, 260);
  
  doc.moveTo(50, 310).lineTo(400, 310).strokeColor(colors.accent).lineWidth(4).stroke();
  
  doc.fillColor(colors.secondary);
  doc.font('Helvetica').fontSize(13);
  doc.text('Interactive Visual Workflows, Module Dependencies, and System Pipelines', 50, 335, { width: 450 });
  
  doc.y = 520;
  doc.fontSize(10).fillColor(colors.lightText).text('AUTHOR & OWNER:');
  doc.fontSize(12).font('Helvetica-Bold').fillColor(colors.primary).text('Harshada Nichit', { paragraphGap: 15 });
  
  doc.fontSize(10).font('Helvetica').fillColor(colors.lightText).text('DOCUMENT CATEGORY:');
  doc.fontSize(11).font('Helvetica-Bold').fillColor(colors.primary).text('Technical Business Architecture Roadmap', { paragraphGap: 15 });
  
  doc.fontSize(10).font('Helvetica').fillColor(colors.lightText).text('DATE:');
  doc.fontSize(11).font('Helvetica-Bold').fillColor(colors.primary).text('25-Jun-2026', { paragraphGap: 15 });
  
  doc.addPage();
}

// Helper: Header bar
function renderHeader(title) {
  doc.fillColor(colors.primary);
  doc.font('Helvetica-Bold').fontSize(14);
  doc.text(title.toUpperCase(), 40, 45);
  doc.moveTo(40, 60).lineTo(555, 60).strokeColor(colors.accent).lineWidth(2).stroke();
  doc.y = 75;
}

// Draw Arrow Helper
function drawArrow(x1, y1, x2, y2) {
  doc.moveTo(x1, y1).lineTo(x2, y2).strokeColor(colors.accent).lineWidth(1.5).stroke();
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLength = 5;
  const arrowX1 = x2 - headLength * Math.cos(angle - Math.PI / 6);
  const arrowY1 = y2 - headLength * Math.sin(angle - Math.PI / 6);
  const arrowX2 = x2 - headLength * Math.cos(angle + Math.PI / 6);
  const arrowY2 = y2 - headLength * Math.sin(angle + Math.PI / 6);
  doc.moveTo(x2, y2).lineTo(arrowX1, arrowY1).lineTo(arrowX2, arrowY2).closePath().fill(colors.accent);
}

// Helper: Node Box
function drawNode(text, x, y, w, h, isAccent = false) {
  doc.rect(x, y, w, h).fillAndStroke(isAccent ? colors.accent : colors.bgLight, colors.line);
  doc.fillColor(isAccent ? '#ffffff' : colors.primary);
  doc.font('Helvetica-Bold').fontSize(8.5);
  doc.text(text, x + 5, y + (h / 2) - 4, { align: 'center', width: w - 10 });
}

// RENDER DOC
renderCoverPage();

// 1. PROJECT OVERVIEW ROADMAP
renderHeader('1.0 Project Overview Roadmap');
doc.fontSize(9.5).font('Helvetica').fillColor(colors.secondary)
   .text('A structural tree representation of the POS & Inventory Management System core functional endpoints.', 40, 80);

// Visual Tree Coordinates
const startX = 297;
const startY = 130;
drawNode('POS & INVENTORY SYSTEM', startX - 75, startY, 150, 25, true);

// Connections from Center to Left & Right Branches
const modules = [
  { name: 'Authentication', x: 70, y: 190 },
  { name: 'Dashboard', x: 70, y: 240 },
  { name: 'Retail Management', x: 70, y: 290 },
  { name: 'Restaurant Mgmt', x: 70, y: 340 },
  { name: 'Inventory Mgmt', x: 70, y: 390 },
  { name: 'Supplier Mgmt', x: 400, y: 190 },
  { name: 'Billing & Invoice', x: 400, y: 240 },
  { name: 'Reports & Analytics', x: 400, y: 290 },
  { name: 'Settings Module', x: 400, y: 340 },
  { name: 'Integrations Node', x: 400, y: 390 }
];

modules.forEach(m => {
  drawNode(m.name, m.x, m.y, 120, 20);
  if (m.x < startX) {
    // Left Branch Lines
    doc.moveTo(startX, startY + 25).quadraticCurveTo(startX, m.y + 10, m.x + 120, m.y + 10).strokeColor(colors.line).lineWidth(1).stroke();
  } else {
    // Right Branch Lines
    doc.moveTo(startX, startY + 25).quadraticCurveTo(startX, m.y + 10, m.x, m.y + 10).strokeColor(colors.line).lineWidth(1).stroke();
  }
});
doc.addPage();

// 2. COMPLETE SIDEBAR ROADMAP
renderHeader('2.0 Sidebar Navigation Map');
doc.fontSize(9.5).font('Helvetica').fillColor(colors.secondary)
   .text('Tree diagram mapping elements structured inside the administration dashboard side menu.', 40, 80);

// Draw Sidebar Tree
drawNode('Sidebar Console', 240, 110, 110, 22, true);

const submenus = [
  { title: 'Authentication', items: ['User Login', 'Role Verification', 'Permissions', 'Redirect'], x: 50, y: 160 },
  { title: 'Dashboard Metrics', items: ['KPI Cards', 'Notifications', 'Quick Actions', 'Analytics Feed'], x: 320, y: 160 }
];

submenus.forEach(menu => {
  drawNode(menu.title, menu.x, menu.y, 220, 20, false);
  doc.moveTo(295, 132).lineTo(menu.x + 110, menu.y).strokeColor(colors.line).stroke();
  
  menu.items.forEach((item, idx) => {
    const itemY = menu.y + 35 + (idx * 28);
    drawNode(item, menu.x + 30, itemY, 170, 18);
    // Draw branch line
    doc.moveTo(menu.x + 15, menu.y + 20).lineTo(menu.x + 15, itemY + 9).lineTo(menu.x + 30, itemY + 9).strokeColor(colors.line).stroke();
  });
});
doc.addPage();

// 3. RETAIL MODULE ROADMAP
renderHeader('3.0 Retail Module Roadmap');
doc.fontSize(9.5).font('Helvetica').fillColor(colors.secondary)
   .text('Hierarchical branch map for POS Retail operations.', 40, 80);

drawNode('Retail Management', 230, 110, 130, 22, true);

const retailBranches = [
  { title: 'Product Setup', items: ['Catalog Grid', 'Add Product', 'Categories', 'Barcode Map'], x: 50, y: 160 },
  { title: 'Inventory Control', items: ['Stock Tracks', 'Low Stock Warns', 'Out of Stock', 'Expiry Checker'], x: 320, y: 160 }
];

retailBranches.forEach(branch => {
  drawNode(branch.title, branch.x, branch.y, 220, 20);
  doc.moveTo(295, 132).lineTo(branch.x + 110, branch.y).strokeColor(colors.line).stroke();
  
  branch.items.forEach((item, idx) => {
    const itemY = branch.y + 35 + (idx * 28);
    drawNode(item, branch.x + 30, itemY, 170, 18);
    doc.moveTo(branch.x + 15, branch.y + 20).lineTo(branch.x + 15, itemY + 9).lineTo(branch.x + 30, itemY + 9).strokeColor(colors.line).stroke();
  });
});
doc.addPage();

// 4. RESTAURANT MODULE ROADMAP
renderHeader('4.0 Restaurant Module Roadmap');
doc.fontSize(9.5).font('Helvetica').fillColor(colors.secondary)
   .text('Hierarchical branch map for restaurant KOT operations and service pipelines.', 40, 80);

drawNode('Restaurant Management', 220, 110, 150, 22, true);

const restBranches = [
  { title: 'Dining Service', items: ['Menu Builder', 'Table Layouts', 'QR Orders', 'Reservations Map'], x: 50, y: 160 },
  { title: 'Kitchen & Backhouse', items: ['KDS Queue', 'Recipe Setup', 'Stock Requests', 'Analytics'], x: 320, y: 160 }
];

restBranches.forEach(branch => {
  drawNode(branch.title, branch.x, branch.y, 220, 20);
  doc.moveTo(295, 132).lineTo(branch.x + 110, branch.y).strokeColor(colors.line).stroke();
  
  branch.items.forEach((item, idx) => {
    const itemY = branch.y + 35 + (idx * 28);
    drawNode(item, branch.x + 30, itemY, 170, 18);
    doc.moveTo(branch.x + 15, branch.y + 20).lineTo(branch.x + 15, itemY + 9).lineTo(branch.x + 30, itemY + 9).strokeColor(colors.line).stroke();
  });
});
doc.addPage();

// 5. PROCUREMENT & SALES FLOWCHARTS
renderHeader('5.0 System Core Workflows');

doc.fontSize(10).font('Helvetica-Bold').fillColor(colors.primary).text('5.1 Inventory Procurement Workflow', 40, 80);
const flow1 = ['Kitchen Staff', 'Create Request', 'Admin Alerts', 'PO Creation', 'Supplier Dispatch', 'Stock GRN Check', 'Stock Added'];
let itemY = 110;
flow1.forEach((step, idx) => {
  drawNode(step, 60, itemY, 120, 20);
  if (idx < flow1.length - 1) {
    drawArrow(120, itemY + 20, 120, itemY + 30);
  }
  itemY += 30;
});

doc.fontSize(10).font('Helvetica-Bold').fillColor(colors.primary).text('5.2 Retail Sales Workflow', 220, 80);
const flow2 = ['Customer Basket', 'Barcode Scan', 'Settle Screen', 'Split Payments', 'Commit Order', 'Stock Tally Update', 'Invoice Receipt'];
itemY = 110;
flow2.forEach((step, idx) => {
  drawNode(step, 230, itemY, 120, 20);
  if (idx < flow2.length - 1) {
    drawArrow(290, itemY + 20, 290, itemY + 30);
  }
  itemY += 30;
});

doc.fontSize(10).font('Helvetica-Bold').fillColor(colors.primary).text('5.3 Restaurant Order Workflow', 390, 80);
const flow3 = ['Menu QR Scan', 'Place Order', 'KDS Ticketing', 'Chef Prep Status', 'Ready Alert', 'Waiter Serves', 'Invoice Checkout'];
itemY = 110;
flow3.forEach((step, idx) => {
  drawNode(step, 400, itemY, 120, 20);
  if (idx < flow3.length - 1) {
    drawArrow(460, itemY + 20, 460, itemY + 30);
  }
  itemY += 30;
});
doc.addPage();

// 6. MODULE DEPENDENCY MAP
renderHeader('6.0 Module Dependency Map');
doc.fontSize(9.5).font('Helvetica').fillColor(colors.secondary)
   .text('Details how various modules link data structures together.', 40, 80);

const nodes = [
  { name: 'Settings Node', x: 235, y: 120, w: 120, h: 22, color: true },
  { name: 'POS Billing', x: 70, y: 190, w: 100, h: 20 },
  { name: 'Invoices DB', x: 70, y: 260, w: 100, h: 20 },
  { name: 'Inventory Ledger', x: 245, y: 190, w: 100, h: 20 },
  { name: 'Purchase Orders', x: 245, y: 260, w: 100, h: 20 },
  { name: 'KDS Kitchen', x: 420, y: 190, w: 100, h: 20 },
  { name: 'Supplier Core', x: 420, y: 260, w: 100, h: 20 }
];

nodes.forEach(n => {
  drawNode(n.name, n.x, n.y, n.w, n.h, n.color);
});

// Drawing connectors between dependencies
drawArrow(120, 190, 120, 142); // Settings -> POS
drawArrow(295, 190, 295, 142); // Settings -> Inventory
drawArrow(470, 190, 470, 142); // Settings -> Kitchen

drawArrow(120, 210, 120, 260); // POS <-> Invoice
drawArrow(170, 200, 245, 200); // POS <-> Inventory
drawArrow(295, 210, 295, 260); // Inventory <-> PO
drawArrow(345, 200, 420, 200); // Inventory <-> Kitchen
drawArrow(470, 210, 470, 260); // Kitchen <-> Supplier
drawArrow(345, 270, 420, 270); // PO <-> Supplier
doc.addPage();

// 7. SETTINGS MODULE ROADMAP
renderHeader('7.0 Settings Module Roadmap');
doc.fontSize(9.5).font('Helvetica').fillColor(colors.secondary)
   .text('Tree map representing configuration parameters inside the global Settings controller.', 40, 80);

drawNode('Settings Hub', 240, 110, 110, 22, true);

const settingsColumns = [
  { title: 'Business Profiles', items: ['Business Info', 'Tax Schemas', 'Logo Manager', 'Invoice Rules'], x: 50, y: 160 },
  { title: 'Gateways & System', items: ['WhatsApp APIs', 'SMTP Email Info', 'Roles & RBAC', 'Preferences'], x: 320, y: 160 }
];

settingsColumns.forEach(col => {
  drawNode(col.title, col.x, col.y, 220, 20);
  doc.moveTo(295, 132).lineTo(col.x + 110, col.y).strokeColor(colors.line).stroke();
  
  col.items.forEach((item, idx) => {
    const itemY = col.y + 35 + (idx * 28);
    drawNode(item, col.x + 30, itemY, 170, 18);
    doc.moveTo(col.x + 15, col.y + 20).lineTo(col.x + 15, itemY + 9).lineTo(col.x + 30, itemY + 9).strokeColor(colors.line).stroke();
  });
});
doc.addPage();

// 8. IMPLEMENTATION ROADMAP
renderHeader('8.0 Implementation Roadmap');
doc.fontSize(9.5).font('Helvetica').fillColor(colors.secondary)
   .text('Development phases and milestone distributions.', 40, 80);

const phases = [
  { title: 'Phase 1: Core Framework', desc: 'Authentication Setup, Admin Dashboard, and User Role Rules Configurations.', date: 'Week 1-2' },
  { title: 'Phase 2: Retail Module', desc: 'Product Catalogs, Categories, Barcode Management, and Customer Registers.', date: 'Week 3-4' },
  { title: 'Phase 3: Restaurant Service', desc: 'Table Management Map, Kitchen Displays, KOT Ticketing, and QR Ordering.', date: 'Week 5-6' },
  { title: 'Phase 4: Supplier Channels', desc: 'Supplier Registers, Purchase Orders (PO), GRN Inflows, and Supplier Ledgers.', date: 'Week 7-8' },
  { title: 'Phase 5: Invoice & Reports', desc: 'GST Invoice PDF Compiler, SMTP, WhatsApp Integrations, and Analytics charts.', date: 'Week 9-10' }
];

phases.forEach((p, idx) => {
  const boxY = 110 + (idx * 68);
  // Timeline dot and line
  doc.circle(55, boxY + 25, 6).fill(colors.accent);
  if (idx < phases.length - 1) {
    doc.moveTo(55, boxY + 31).lineTo(55, boxY + 93).strokeColor(colors.line).lineWidth(2).stroke();
  }
  
  // Phase details
  doc.rect(80, boxY, 460, 55).fillAndStroke(colors.bgLight, colors.line);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(colors.primary).text(p.title, 95, boxY + 10);
  doc.fontSize(8.5).font('Helvetica').fillColor(colors.secondary).text(p.desc, 95, boxY + 24, { width: 340 });
  doc.fontSize(9).font('Helvetica-Bold').fillColor(colors.accent).text(p.date, 450, boxY + 10);
});
doc.addPage();

// 9. PROJECT COMPLETION TRACKER
renderHeader('9.0 Project Completion Tracker');

doc.fontSize(11).font('Helvetica-Bold').fillColor(colors.primary).text('9.1 Completed Features', 40, 80);

const progressBars = [
  { name: 'Authentication Module', pct: 100 },
  { name: 'Dashboard Analytics Feed', pct: 100 },
  { name: 'Inventory & Stock Alerts', pct: 95 },
  { name: 'Supplier Procurement Lifecycle', pct: 85 },
  { name: 'Kitchen KOT displays & Requests', pct: 90 },
  { name: 'Invoice PDF compiler & Registers', pct: 95 },
  { name: 'Analytical charts & Sales reports', pct: 80 }
];

progressBars.forEach((p, idx) => {
  const barY = 105 + (idx * 38);
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor(colors.secondary).text(p.name, 40, barY);
  
  // Outer progress bar
  doc.rect(40, barY + 12, 400, 10).fillAndStroke('#e2e8f0', colors.line);
  // Inner progress bar
  const progressWidth = 400 * (p.pct / 100);
  doc.rect(40, barY + 12, progressWidth, 10).fill(colors.success);
  
  doc.fontSize(9).font('Helvetica-Bold').fillColor(colors.primary).text(`${p.pct}%`, 450, barY + 12);
});

// Pending items
doc.fontSize(11).font('Helvetica-Bold').fillColor(colors.primary).text('9.2 Pending Features / Roadmap Items', 40, 395);
const pendings = [
  ['Real-time WhatsApp Delivery Gateway', 'Direct receipt text links dispatch to client numbers.'],
  ['Supplier Email Order Logs Audit', 'Logs and tracks PO delivery status to supplier mailboxes.'],
  ['Multi-Branch Cloud Data Synchronization', 'Bridges branch stocks and ledgers to a central DB.'],
  ['AI Demand Forecasting', 'Uses sales history trends to predict raw stock restocking dates.'],
  ['Mobile Waiter & POS application', 'Native app wrappers for service staff handheld tablets.']
];

pendings.forEach((p, idx) => {
  const boxY = 415 + (idx * 38);
  doc.rect(40, boxY, 500, 30).fillAndStroke(colors.bgLight, colors.line);
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor(colors.primary).text(`• ${p[0]}`, 50, boxY + 6, { continued: true });
  doc.font('Helvetica').fontSize(8.5).fillColor(colors.secondary).text(` - ${p[1]}`);
});
doc.addPage();

// 10. FINAL MASTER ARCHITECTURE ROADMAP
renderHeader('10.0 Master Architecture Flow');
doc.fontSize(9.5).font('Helvetica').fillColor(colors.secondary)
   .text('Complete end-to-end user lifecycle pipeline of the POS & Inventory Management System.', 40, 80);

const steps = [
  'Login Page & Identity',
  'Admin Dashboard Portal',
  'Retail vs Restaurant Hub',
  'Inventory Operations',
  'Supplier restock orders',
  'POS Billing register',
  'Invoice PDF checkout',
  'Reports & Statistics',
  'WhatsApp / Email Share',
  'Business Insights Feed'
];

steps.forEach((step, idx) => {
  const nodeY = 110 + (idx * 60);
  drawNode(step, 195, nodeY, 200, 25, idx === 0 || idx === steps.length - 1);
  if (idx < steps.length - 1) {
    drawArrow(295, nodeY + 25, 295, nodeY + 35);
  }
});

// RENDER FOOTERS & PAGE NUMBERS
const range = doc.bufferedPageRange();
for (let i = 0; i < range.count; i++) {
  doc.switchToPage(i);
  
  if (i > 0) {
    // Header
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor(colors.lightText);
    doc.text('POS & INVENTORY SYSTEM  |  VISUAL PROJECT ROADMAP', 40, 25);
    doc.moveTo(40, 32).lineTo(555, 32).strokeColor(colors.line).lineWidth(0.5).stroke();
    
    // Footer
    doc.moveTo(40, 805).lineTo(555, 805).strokeColor(colors.line).lineWidth(0.5).stroke();
    doc.fontSize(7.5).font('Helvetica').fillColor(colors.lightText);
    doc.text('Author: Harshada Nichit', 40, 812);
    doc.text(`Page ${i + 1} of ${range.count}`, 510, 812);
  }
}

// Finalize PDF
doc.end();
console.log('Successfully generated Roadmap PDF at: ' + reportPath);
