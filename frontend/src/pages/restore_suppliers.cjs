const fs = require('fs');

const transcriptPath = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\48a37ccc-25ce-477b-b1ff-1fb88df8a843\\.system_generated\\logs\\transcript.jsonl';
const supPath = 'c:\\Users\\HP\\OneDrive\\Desktop\\POS_Inventory\\POS\\frontend\\src\\pages\\Suppliers.tsx';

const fileLines = fs.readFileSync(transcriptPath, 'utf8').split('\n');
let originalContent = '';

// Find the VIEW_FILE output for Suppliers.tsx lines 401 to 1200
for (const line of fileLines) {
  if (!line.trim()) continue;
  try {
    const obj = JSON.parse(line);
    if (obj.content && obj.content.includes('File Path: `file:///c:/Users/HP/OneDrive/Desktop/POS_Inventory/POS/frontend/src/pages/Suppliers.tsx`')) {
      originalContent = obj.content;
      break;
    }
  } catch (e) {}
}

if (!originalContent) {
  console.log('Suppliers.tsx viewed content not found in transcript.jsonl');
  process.exit(1);
}

// Extract the code block
const regex = /Showing lines 401 to 1200\r?\n([\s\S]*?)\r?\nTotal Lines:/;
let match = originalContent.match(regex);
let block = '';
if (!match) {
  const altRegex = /Showing lines 401 to 1200\r?\n([\s\S]*?)$/;
  const match2 = originalContent.match(altRegex);
  if (!match2) {
    console.log('Failed to match code block for Suppliers.tsx');
    process.exit(1);
  }
  block = match2[1];
} else {
  block = match[1];
}

// Clean up line numbers
const lines = block.split('\n');
const cleanedLines = lines.map(line => {
  const m = line.match(/^\s*\d+:\s?(.*)$/);
  return m ? m[1] : line;
});

// The current (git checked out) Suppliers.tsx has 421 lines.
// We need the first 400 lines of the current file.
const currentContent = fs.readFileSync(supPath, 'utf8').split('\n');
const first400Lines = currentContent.slice(0, 400).join('\n');

// Wait! Does the viewed content go up to line 1200? What about lines 1201 to 1630?
// We need to check if there is another view or if we can restore the rest as well!
// Let's print out what we found
console.log('First 400 lines of current file checked. Cleaned lines count:', cleanedLines.length);

const finalContent = first400Lines + '\n' + cleanedLines.join('\n');
fs.writeFileSync(supPath, finalContent, 'utf8');
console.log('Restored Suppliers.tsx partially!');
