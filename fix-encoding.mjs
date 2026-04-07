import { readFileSync, writeFileSync } from 'fs';

const file = 'src/pages/ProductManagement.jsx';
const buf = readFileSync(file);

// Work with raw bytes - hex pattern matching
let hex = buf.toString('hex');
let count = 0;

const replacements = [
  // "──" section comment dashes (triple-encoded)
  ['c383c692c382c2a2c383c2a2c3a2e2809ac2acc382c29dc383c2a2c3a2e282acc5a1c382c2acc383c692c382c2a2c383c2a2c3a2e2809ac2acc382c29dc383c2a2c3a2e282acc5a1c382c2ac', 'e29480e29480'], // ──

  // Line 1019 variant: Ã¢â€â‚¬Ã¢â€â‚¬ 
  ['c3a2c3a2e282acc5a1c3a2e282acc5a1', 'e29480e29480'], // alternative ──

  // Temperature en-dash – (between numbers like 15–30)
  ['c383c692c382c2a2c383c2a2c3a2e282acc5a1c382c2acc383c2a2c3a2e2809ac2acc385e2809c', 'e28093'],

  // Degree symbol °
  ['c383c2a2c3a2e2809ac2acc382c2b0', 'c2b0'],
  ['c383c692c382c2b0', 'c2b0'],
];

for (const [bad, good] of replacements) {
  const re = new RegExp(bad, 'g');
  const matches = hex.match(re);
  if (matches) {
    hex = hex.replace(re, good);
    count += matches.length;
    console.log(`Pattern ${bad.substring(0, 20)}... -> ${good} (${matches.length}x)`);
  }
}

writeFileSync(file, Buffer.from(hex, 'hex'));
console.log(`\nDone! Total hex replacements: ${count}`);

// Verify
const verify = readFileSync(file, 'utf8');
const lines = [14, 51, 52, 53, 54, 60, 66];
for (const n of lines) {
  console.log(`Line ${n}: ${verify.split('\n')[n-1].trim()}`);
}
