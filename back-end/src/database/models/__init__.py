import importlib
import pkgutil
import os
# 1. Look up the current package name and path
package_name = __name__
package_path = __path__

# 2. Iterate through all Python files inside this folder
for _, module_name, is_pkg in pkgutil.iter_modules(package_path):
    if not is_pkg:
        # 3. Dynamically import the module (e.g., "models.user")
        full_module_name = f"{package_name}.{module_name}"
        importlib.import_module(full_module_name,package=f'{package_name}')
