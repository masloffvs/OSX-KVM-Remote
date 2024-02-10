import os
import tempfile
from datetime import datetime

current_dir = os.path.dirname(os.path.abspath(__file__))

# Define working directory
WORK = tempfile.mkdtemp(prefix=os.path.basename(__file__) + "-")
BASE = os.path.dirname(os.path.abspath(__file__))
TEMP_PATH_CONFIG_PLIST = os.path.join(current_dir, "tmp.config.plist")

def msg(txt):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    gray = "\033[90m"
    bold = "\033[1m"
    normal = "\033[0m"
    print(f"{gray}[{timestamp}]: {normal}{bold}{txt}{normal}")
