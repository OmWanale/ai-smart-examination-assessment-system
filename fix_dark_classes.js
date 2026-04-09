#!/usr/bin/env node
// Fix invalid dark mode classes in CreateQuiz.jsx
const fs = require('fs');
const path = require('path');

const filePath = 'c:\\quiz-desktop-app\\apps\\frontend\\src\\pages\\teacher\\CreateQuiz.jsx';

let content = fs.readFileSync(filePath, 'utf8');

// Count before
const countBefore = {
  'dark:text-dark-text': (content.match(/dark:text-dark-text/g) || []).length,
  'dark:text-dark-muted': (content.match(/dark:text-dark-muted/g) || []).length,
  'dark:placeholder-dark-muted': (content.match(/dark:placeholder-dark-muted/g) || []).length,
  'dark:hover:text-dark-text': (content.match(/dark:hover:text-dark-text/g) || []).length
};

console.log('Occurrences BEFORE replacement:');
Object.entries(countBefore).forEach(([pattern, count]) => {
  console.log(`  ${pattern}: ${count}`);
});
console.log(`  Total: ${Object.values(countBefore).reduce((a, b) => a + b, 0)}`);

// Replace all invalid patterns
content = content.replace(/dark:text-dark-text/g, 'dark:text-slate-100');
content = content.replace(/dark:text-dark-muted/g, 'dark:text-slate-400');
content = content.replace(/dark:placeholder-dark-muted/g, 'dark:placeholder-slate-400');
content = content.replace(/dark:hover:text-dark-text/g, 'dark:hover:text-slate-100');

// Count after
const countAfter = {
  'dark:text-slate-100': (content.match(/dark:text-slate-100/g) || []).length,
  'dark:text-slate-400': (content.match(/dark:text-slate-400/g) || []).length,
  'dark:placeholder-slate-400': (content.match(/dark:placeholder-slate-400/g) || []).length,
  'dark:hover:text-slate-100': (content.match(/dark:hover:text-slate-100/g) || []).length
};

console.log('\nOccurrences AFTER replacement:');
Object.entries(countAfter).forEach(([pattern, count]) => {
  console.log(`  ${pattern}: ${count}`);
});

// Verify no invalid patterns remain
const remainingInvalid = {
  'dark:text-dark-text': (content.match(/dark:text-dark-text/g) || []).length,
  'dark:text-dark-muted': (content.match(/dark:text-dark-muted/g) || []).length,
  'dark:placeholder-dark-muted': (content.match(/dark:placeholder-dark-muted/g) || []).length,
  'dark:hover:text-dark-text': (content.match(/dark:hover:text-dark-text/g) || []).length
};

console.log('\nRemaining invalid patterns (should all be 0):');
let allClean = true;
Object.entries(remainingInvalid).forEach(([pattern, count]) => {
  if (count > 0) {
    console.log(`  ${pattern}: ${count}`);
    allClean = false;
  }
});

if (allClean) {
  console.log('  ✓ All invalid patterns removed!');
}

// Verify valid patterns still exist
const validPatterns = {
  'dark:bg-dark-card': (content.match(/dark:bg-dark-card/g) || []).length,
  'dark:bg-dark-hover': (content.match(/dark:bg-dark-hover/g) || []).length,
  'dark:bg-dark-border': (content.match(/dark:bg-dark-border/g) || []).length,
  'dark:border-dark-border': (content.match(/dark:border-dark-border/g) || []).length
};

console.log('\nValid patterns (should NOT be changed):');
Object.entries(validPatterns).forEach(([pattern, count]) => {
  console.log(`  ${pattern}: ${count}`);
});

// Write back
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✓ All replacements completed and file saved!');
