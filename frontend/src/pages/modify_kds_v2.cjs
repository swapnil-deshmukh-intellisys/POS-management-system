const fs = require('fs');

const kdsPath = 'c:\\Users\\HP\\OneDrive\\Desktop\\POS_Inventory\\POS\\frontend\\src\\pages\\KitchenDisplay.tsx';
const supPath = 'c:\\Users\\HP\\OneDrive\\Desktop\\POS_Inventory\\POS\\frontend\\src\\pages\\Suppliers.tsx';

// 1. Modify KitchenDisplay.tsx
if (fs.existsSync(kdsPath)) {
  let content = fs.readFileSync(kdsPath, 'utf8');

  // Add import
  if (!content.includes("import { KitchenStockRequest }")) {
    content = content.replace(
      "import { useAuth } from '../context/AuthContext';",
      "import { useAuth } from '../context/AuthContext';\nimport { KitchenStockRequest } from './KitchenStockRequest';"
    );
  }

  // Update tabs array to include STOCK_REQUEST tab
  const oldTabs = `        {[\n          { tabId: 'NEW', label: 'NEW', count: newCount },\n          { tabId: 'PREPARING', label: 'PREPARING', count: preparingCount },\n          { tabId: 'READY', label: 'READY', count: readyCount }\n        ]`;
  const newTabs = `        {[\n          { tabId: 'NEW', label: 'NEW', count: newCount },\n          { tabId: 'PREPARING', label: 'PREPARING', count: preparingCount },\n          { tabId: 'READY', label: 'READY', count: readyCount },\n          { tabId: 'STOCK_REQUEST', label: 'STOCK REQUEST', count: stockRequests.length }\n        ]`;
  
  content = content.replace(oldTabs, newTabs);
  content = content.replace(oldTabs.replace(/\n/g, '\r\n'), newTabs.replace(/\n/g, '\r\n'));

  // Replace rows rendering block using boolean disabled pattern
  const oldRowsPattern = `        {/* Rows */}\n        {activeTab === 'STOCK_REQUEST' ? (`;
  const newRowsPattern = `        {/* Rows */}\n        {activeTab === 'STOCK_REQUEST' ? (\n          <KitchenStockRequest />\n        ) : false && activeTab === 'STOCK_REQUEST' ? (`;

  content = content.replace(oldRowsPattern, newRowsPattern);
  content = content.replace(oldRowsPattern.replace(/\n/g, '\r\n'), newRowsPattern.replace(/\n/g, '\r\n'));

  fs.writeFileSync(kdsPath, content, 'utf8');
  console.log('Modified KitchenDisplay.tsx successfully!');
}

// 2. Modify Suppliers.tsx
if (fs.existsSync(supPath)) {
  let content = fs.readFileSync(supPath, 'utf8');

  // Add import
  if (!content.includes("import { KitchenStockRequest }")) {
    content = content.replace(
      "import { useAuth } from '../context/AuthContext';",
      "import { useAuth } from '../context/AuthContext';\nimport { KitchenStockRequest } from './KitchenStockRequest';"
    );
  }

  // Replace requests tab content using boolean disabled pattern
  const oldRequestsPattern = `          {activeTab === 'requests' && (\n            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">`;
  const newRequestsPattern = `          {activeTab === 'requests' && (\n            <KitchenStockRequest />\n          )}\n          {false && activeTab === 'requests' && (\n            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">`;

  content = content.replace(oldRequestsPattern, newRequestsPattern);
  content = content.replace(oldRequestsPattern.replace(/\n/g, '\r\n'), newRequestsPattern.replace(/\n/g, '\r\n'));

  fs.writeFileSync(supPath, content, 'utf8');
  console.log('Modified Suppliers.tsx successfully!');
}
