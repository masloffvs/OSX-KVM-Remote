#!/bin/bash

# Requesting sudo password upfront for subsequent commands
echo "Please enter your sudo password to allow the following commands to run without further prompts:"
if sudo -v; then
    if [[ "$(uname)" == "Linux" ]]; then
      # Displaying processor type
      echo "[PROCESSOR_INFO]: Processor Type:"
      sudo lshw -c cpu | grep -i product

      # Displaying GPU information
      echo "[GPU_INFO]: GPU Information:"
      sudo lspci -v | grep -A 12 VGA

      # Installing required packages
      echo "[APT_INSTALL]: Installing required packages..."
      sudo apt install libguestfs-tools build-essential wget git gcc uuid-runtime sudo -y

      # Installing Linux kernel
      echo "[APT_INSTALL]: Installing Linux kernel..."
      sudo apt install linux-generic -y

      # Installing QEMU
      echo "[APT_INSTALL]: Installing QEMU..."
      sudo apt install qemu -y
    fi

    # Checking Node.js version
    echo "[CHECK_NODE_VERSION]: Checking Node.js version..."
    NODE_VERSION=$(node -v)
    REQUIRED_VERSION="v18.0.0"

    if [[ "$NODE_VERSION" > "$REQUIRED_VERSION" ]]; then
        echo "[CHECK_NODE_VERSION]: Node.js version is acceptable: $NODE_VERSION"
    else
        echo "[CHECK_NODE_VERSION]: Node.js version ($NODE_VERSION) is not greater than $REQUIRED_VERSION. Please update Node.js."
        exit 1
    fi

    # Checking Python version
    echo "[CHECK_PYTHON_VERSION]: Checking Python version..."
    PYTHON_VERSION=$(python3 -V 2>&1 | awk '{print $2}')
    REQUIRED_VERSION="3.10"

    if [[ "$PYTHON_VERSION" < "$REQUIRED_VERSION" ]]; then
        echo "[CHECK_PYTHON_VERSION]: Python version ($PYTHON_VERSION) is less than $REQUIRED_VERSION. Please install Python $REQUIRED_VERSION or higher."
        exit 1
    fi

    # Checking QEMU version
    echo "[CHECK_QEMU_VERSION]: Checking QEMU version..."
    QEMU_VERSION=$(qemu-system-x86_64 --version | awk '{print $4}' | head -n1)
    REQUIRED_VERSION="6.2.0"

    if [[ "$(printf '%s\n' "$QEMU_VERSION" "$REQUIRED_VERSION" | sort -V | head -n1)" == "$REQUIRED_VERSION" ]]; then
        echo "[CHECK_QEMU_VERSION]: QEMU version is acceptable: $QEMU_VERSION"
    else
        echo "[CHECK_QEMU_VERSION]: QEMU version ($QEMU_VERSION) is not greater than or equal to $REQUIRED_VERSION. Please update QEMU."
        exit 1
    fi

    # Installing Node.js dependencies
    echo "[NPM_INSTALL]: Installing Node.js dependencies..."
    npm install

    # Creating necessary directories
    echo "[CREATE_DIRECTORIES]: Creating necessary directories..."
    mkdir -p prebuilt/basesystems
    mkdir -p .cache
    mkdir -p .snapshots
    mkdir -p disks

    # Creating .vnc-port file if it doesn't exist with content "1"
    if [ ! -f ".vnc-port" ]; then
        echo "1" > .vnc-port
    fi
else
    echo "Incorrect sudo password. Exiting..."
    exit 1
fi
