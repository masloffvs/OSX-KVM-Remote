#!/bin/bash

# Color codes for formatting
GREEN='\033[1;32m'
RED='\033[1;31m'
PURPLE='\033[1;35m'
NC='\033[0m' # No Color

# Function to check if a command is available
check_command() {
  command -v $1 >/dev/null 2>&1 || { echo -e "[ERROR]: $1 is not installed.${NC}"; exit 1; }
}

# Check Node.js version
echo -e "${GREEN}[CHECK_NODE_VERSION]: Checking Node.js version...${NC}"
node_version=$(node -v)
if [[ "$node_version" < "v18.0.0" ]]; then
  echo -e "${RED}[ERROR]: Node.js version must be at least 18.x.x.${NC}"
  exit 1
else
  echo "[SUCCESS]: Node.js version is $node_version"
fi

# Check Python version based on the operating system
echo -e "${GREEN}[CHECK_PYTHON_VERSION]: Checking Python version...${NC}"
if [[ "$(uname)" == "Darwin" ]]; then
  # macOS
  python_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:3])))')
else
  # Ubuntu and Debian
  python_version=$(python3 --version 2>&1 | grep -oP '(?<=Python )(\d+\.\d+\.\d+)')
fi

required_python_version="3.8" # Minimum required Python version

if python3 -c "import sys; exit(sys.version_info < ($required_python_version,))"; then
  echo -e "${RED}[ERROR]: Python version must be at least $required_python_version.${NC}"
  exit 1
else
  echo "[SUCCESS]: Python version is $python_version"
fi

# Check if required image files exist
echo -e "${GREEN}[CHECK_IMAGE_FILES]: Checking for required image files...${NC}"
required_images=("BaseSystem-BigSur.img" "BaseSystem-Catalina.img" "BaseSystem-Monterey.img" "BaseSystem-Sonoma.img" "BaseSystem-Ventura.img")
missing_images=()
for image in "${required_images[@]}"; do
  if [ ! -f "prebuilt/basesystems/$image" ]; then
    echo -e "${RED}[WARNING]: $image not found in prebuilt/basesystems directory.${NC}"
    read -p "Do you want to continue without this image? (y/n): " choice
    if [[ "$choice" != "y" ]]; then
      echo -e "${RED}[ERROR]: Setup aborted.${NC}"
      exit 1
    else
      missing_images+=("$image")
    fi
  else
    echo "[SUCCESS]: $image found"
  fi
done

if [ ${#missing_images[@]} -gt 0 ]; then
  echo -e "${RED}[WARNING]: Continuing without the following missing images: ${missing_images[@]}${NC}"
fi

# Check if pm2 is installed
check_command "pm2"

# Check if qemu is installed
check_command "qemu-system-x86_64"

# Check if port 3000 is available
echo -e "${GREEN}[CHECK_PORT_AVAILABILITY]: Checking port 3000...${NC}"
if nc -z -w1 localhost 3000; then
  echo -e "${RED}[ERROR]: Port 3000 is already in use.${NC}"
  exit 1
else
  echo "[SUCCESS]: Port 3000 is available"
fi

# Start web-driver.js with pm2
echo -e "${GREEN}[START_WEB_DRIVER]: Starting web-driver.js with pm2...${NC}"
pm2 start web-driver.js
pm2 save
pm2 startup

echo -e "${GREEN}[SUCCESS]: Setup completed successfully.${NC}"
