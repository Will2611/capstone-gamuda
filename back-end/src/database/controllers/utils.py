import os
import inspect

def get_subcontrollers(dirname):
    caller_name = inspect.currentframe().f_back.f_globals.get("__name__")
    routers = []
    for f in os.listdir(dirname):
        # Reset/Init
        module_name=None
        moduleVar= None
        # Exclude self, where its only in __init__, and the file utils itself
        if f == "__init__.py" or f == "utils.py" :
            continue
        if os.path.isfile("%s/%s" % (dirname, f)) and f[-3:]=='.py':
            module_name=f[:-3]    
        elif os.path.isdir("%s/%s" % (dirname, f)) and os.path.isfile("%s/%s/__init__.py" % (dirname, f)):
            module_name=f
        # Only if module exists
        if(module_name is not None):
            moduleVar = __import__(f"{caller_name}.{module_name}", fromlist=[''])
            if hasattr(moduleVar, 'router'):
                routers.append(getattr(moduleVar, 'router'))
        
    return routers  