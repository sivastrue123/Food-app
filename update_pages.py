import re
import os

# List of pages to update
pages = [
    'Outlets.tsx',
    'Employees.tsx',
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
    
    # Add useSidebarState import if not present
    if 'useSidebarState' not in content:
        # Find the import section and add the hook import
        import_pattern = r"(import.*from '@/contexts/AuthContext')"
        replacement = r"\1\nimport { useSidebarState } from '@/hooks/useSidebarState'"
        content = re.sub(import_pattern, replacement, content)
    
    # Add isCollapsed variable in component
    if 'isCollapsed = useSidebarState()' not in content:
        # Find the component function and add the hook call
        component_pattern = r"(const { user.*} = useAuth\(\))"
        replacement = r"\1\n  const isCollapsed = useSidebarState()"
        content = re.sub(component_pattern, replacement, content)
    
    # Update the layout div
    content = re.sub(
        r'<div className="flex min-h-screen bg-gray-50">',
        r'<div className="min-h-screen bg-gray-50">',
        content
    )
    
    # Update main element
    content = re.sub(
        r'<main className="flex-1 overflow-auto">',
        r'<main className={`${isCollapsed ? \'ml-16\' : \'ml-64\'} transition-all duration-300`}>',
        content
    )
    
    # Make headers sticky (find first div after main)
    content = re.sub(
        r'(<main[^>]*>\s*{/\* Header \*/}\s*)<div className="bg-white border-b',
        r'\1<div className="sticky top-0 z-10 bg-white border-b',
        content
    )
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Updated {page}")

print("\nAll pages updated successfully!")
