#!/usr/bin/env python3
"""
Fix invalid dark mode classes in CreateQuiz.jsx
"""

file_path = r'c:\quiz-desktop-app\apps\frontend\src\pages\teacher\CreateQuiz.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Count before
import re
count_before = {
    'dark:text-dark-text': len(re.findall(r'dark:text-dark-text', content)),
    'dark:text-dark-muted': len(re.findall(r'dark:text-dark-muted', content)),
    'dark:placeholder-dark-muted': len(re.findall(r'dark:placeholder-dark-muted', content)),
    'dark:hover:text-dark-text': len(re.findall(r'dark:hover:text-dark-text', content))
}

print('Occurrences BEFORE replacement:')
for pattern, count in count_before.items():
    print(f'  {pattern}: {count}')
print(f'  Total: {sum(count_before.values())}')

# Replace all invalid patterns
content = content.replace('dark:text-dark-text', 'dark:text-slate-100')
content = content.replace('dark:text-dark-muted', 'dark:text-slate-400')
content = content.replace('dark:placeholder-dark-muted', 'dark:placeholder-slate-400')
content = content.replace('dark:hover:text-dark-text', 'dark:hover:text-slate-100')

# Count after
count_after = {
    'dark:text-slate-100': len(re.findall(r'dark:text-slate-100', content)),
    'dark:text-slate-400': len(re.findall(r'dark:text-slate-400', content)),
    'dark:placeholder-slate-400': len(re.findall(r'dark:placeholder-slate-400', content)),
    'dark:hover:text-slate-100': len(re.findall(r'dark:hover:text-slate-100', content))
}

print('\nOccurrences AFTER replacement:')
for pattern, count in count_after.items():
    print(f'  {pattern}: {count}')

# Verify no invalid patterns remain
remaining_invalid = {
    'dark:text-dark-text': len(re.findall(r'dark:text-dark-text', content)),
    'dark:text-dark-muted': len(re.findall(r'dark:text-dark-muted', content)),
    'dark:placeholder-dark-muted': len(re.findall(r'dark:placeholder-dark-muted', content)),
    'dark:hover:text-dark-text': len(re.findall(r'dark:hover:text-dark-text', content))
}

print('\nRemaining invalid patterns (should all be 0):')
for pattern, count in remaining_invalid.items():
    if count > 0:
        print(f'  {pattern}: {count}')

if all(v == 0 for v in remaining_invalid.values()):
    print('  ✓ All invalid patterns removed!')

# Verify valid patterns still exist
valid_patterns = {
    'dark:bg-dark-card': len(re.findall(r'dark:bg-dark-card', content)),
    'dark:bg-dark-hover': len(re.findall(r'dark:bg-dark-hover', content)),
    'dark:bg-dark-border': len(re.findall(r'dark:bg-dark-border', content)),
    'dark:border-dark-border': len(re.findall(r'dark:border-dark-border', content))
}

print('\nValid patterns (should NOT be changed):')
for pattern, count in valid_patterns.items():
    print(f'  {pattern}: {count}')

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('\n✓ All replacements completed and file saved!')
