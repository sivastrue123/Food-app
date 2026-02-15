import re
import os

# List of pages to update
pages = [
    'Dashboard.tsx',
    'Reports.tsx',
    'Payments.tsx',
    'Users.tsx',
    'Products.tsx',
    'Inventory.tsx',
    'Orders.tsx',
    'AuditLogs.tsx'
]

base_path = r'd:\fodd-project\src\pages'

for page in pages:
    file_path = os.path.join(base_path, page)
    
    if not os.path.exists(file_path):
        print(f"Skipping {page} - file not found")
        continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Replace the main className logic
    # Pattern to match the specific template string and class
    # <main className={`${isCollapsed ? 'ml-16' : 'ml-64'} transition-all duration-300`}>
    
    # We look for the main tag with the dynamic class. 
    # Since specific spacing might vary, we use regex.
    
    pattern = r'<main className=\{`\$\{isCollapsed \? \'ml-16\' : \'ml-64\'\} transition-all duration-300`\}>'
    replacement = r'<main className="transition-all duration-300 ease-in-out" style={{ marginLeft: \'var(--sidebar-width, 16rem)\' }}>'
    
    new_content = re.sub(pattern, replacement, content)
    
    if new_content == content:
        print(f"No main tag match found in {page}")
        # Try a more loose pattern just in case
        pattern2 = r'<main className=\{`\$\{isCollapsed \? \'ml-16\' : \'ml-64\'\} [^`]+`\}>'
        new_content = re.sub(pattern2, replacement, content)
        if new_content == content:
             print(f"Still no match for {page}")
    
    # 2. Remove the useSidebarState hook usage to clean up
    # Remove: const isCollapsed = useSidebarState()
    new_content = re.sub(r'\s+const isCollapsed = useSidebarState\(\)\n', '\n', new_content)
    
    # 3. Remove the import
    # import { useSidebarState } from '@/hooks/useSidebarState'
    new_content = re.sub(r'import \{ useSidebarState \} from \'@/hooks/useSidebarState\'\n', '', new_content)

    # Write back if changed
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {page}")
    else:
        print(f"No changes made to {page}")

print("\nBatch update complete!")
