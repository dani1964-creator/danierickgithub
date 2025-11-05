#!/usr/bin/env python3
import re
import sys

files = [
    "frontend/components/layout/PersistentLayout.tsx",
    "frontend/components/properties/PropertyDetailPage.tsx",
    "frontend/components/properties/PropertyCard.tsx",
    "frontend/components/ui/page-transition.tsx",
    "frontend/components/home/Footer.tsx",
    "frontend/components/home/FixedHeader.tsx",
    "frontend/pages/dashboard.tsx",
    "frontend/pages/terms-of-use.tsx",
    "frontend/pages/public-site.tsx",
    "frontend/pages/privacy-policy.tsx",
    "frontend/pages/about-us.tsx",
    "frontend/pages/auth.tsx",
    "frontend/pages/notfound.tsx",
]

replacements = [
    # Imports
    (r"import\s+{([^}]*?)}\s+from\s+['\"]react-router-dom['\"];?", r"import { useRouter } from 'next/router';"),
    
    # Hooks declarations
    (r"const\s+navigate\s*=\s*useNavigate\(\);?", r"const router = useRouter();"),
    (r"const\s+location\s*=\s*useLocation\(\);?", r"const router = useRouter();"),
    (r"const\s+params\s*=\s*useParams\(\);?", r"const router = useRouter();"),
    (r"const\s+{\s*([^}]+)\s*}\s*=\s*useParams\(\);?", r"const router = useRouter(); const { \1 } = router.query;"),
    
    # Usage patterns
    (r"navigate\(([^)]+)\)", r"router.push(\1)"),
    (r"location\.pathname", r"router.pathname"),
    (r"location\.search", r"router.asPath.split('?')[1] || ''"),
    (r"params\.(\w+)", r"router.query.\1"),
]

for file_path in files:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        for pattern, replacement in replacements:
            content = re.sub(pattern, replacement, content)
        
        if content != original:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ {file_path}")
        else:
            print(f"⏭️  {file_path} (sem alterações)")
            
    except FileNotFoundError:
        print(f"❌ {file_path} (não encontrado)")
    except Exception as e:
        print(f"❌ {file_path} (erro: {e})")

print("\n🎉 Migração concluída!")
print("\n⚠️  REVISAR MANUALMENTE:")
print("  - Componentes <Navigate /> devem ser removidos")
print("  - Componentes <Outlet /> devem ser substituídos por {children}")
print("  - Declarações duplicadas de 'const router' devem ser mescladas")
