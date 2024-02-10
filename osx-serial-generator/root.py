import os
import tempfile

current_dir = os.path.dirname(os.path.abspath(__file__))

# Define working directory
WORK = tempfile.mkdtemp(prefix=os.path.basename(__file__) + "-")
BASE = os.path.dirname(os.path.abspath(__file__))
TEMP_PATH_CONFIG_PLIST = os.path.join(current_dir, "tmp.config.plist")
