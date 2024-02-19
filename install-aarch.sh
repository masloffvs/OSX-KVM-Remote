#!/bin/bash
# --------------------------------------------------------------
# Script for installing required packages and setting up the environment
# This script should replace install and add support for Arch Linux
# --------------------------------------------------------------

# Color codes for formatting
GREEN='\033[1;32m'
RED='\033[1;31m'
NC='\033[0m' # No Color

# Requesting sudo password upfront for subsequent commands
echo "Please enter your sudo password to allow the following commands to run without further prompts:"
if sudo -v; then
    if [[ "$(uname)" == "Linux" ]]; then
        if command -v pacman &> /dev/null; then
            # Displaying processor type
            echo -e "${GREEN}[PROCESSOR_INFO]: Processor Type:${NC}"
            sudo lshw -c cpu | grep -i product

            # Displaying GPU information
            echo -e "${GREEN}[GPU_INFO]: GPU Information:${NC}"
            sudo lspci -v | grep -A 12 VGA

            # Installing required packages on Arch Linux
            echo -e "${GREEN}[PACMAN_INSTALL]: Installing required packages on Arch Linux...${NC}"
            sudo pacman -S --needed base-devel wget git gcc libxml2-utils libtool automake qemu libguestfs --noconfirm
        elif command -v apt &> /dev/null; then
            # Displaying processor type
            echo -e "${GREEN}[PROCESSOR_INFO]: Processor Type:${NC}"
            sudo lshw -c cpu | grep -i product

            # Displaying GPU information
            echo -e "${GREEN}[GPU_INFO]: GPU Information:${NC}"
            sudo lspci -v | grep -A 12 VGA

            # Installing required packages on Debian/Ubuntu
            echo -e "${GREEN}[APT_INSTALL]: Installing required packages on Debian/Ubuntu...${NC}"
            sudo apt install libguestfs-tools build-essential wget git gcc uuid-runtime sudo -y
            sudo apt-get install libxml2-utils -y

            # Installing Linux kernel
            echo -e "${GREEN}[APT_INSTALL]: Installing Linux kernel...${NC}"
            sudo apt install linux-generic -y

            # Check if QEMU is already installed on Debian
            if [[ -e /etc/debian_version && $(dpkg-query -W -f='${Status}' qemu 2>/dev/null | grep -c "ok installed") -eq 1 ]]; then
                echo -e "${GREEN}[APT_INSTALL]: QEMU is already installed on Debian.${NC}"
            else
                # Check the operating system
                if [[ -e /etc/debian_version ]]; then
                    # If it's Debian, try to install QEMU from backports
                    echo -e "${GREEN}[APT_INSTALL]: Detected Debian. Attempting to install QEMU from backports...${NC}"
                    sudo echo "deb http://deb.debian.org/debian buster-backports main" >> /etc/apt/sources.list.d/backports.list
                    sudo apt update
                    sudo apt install qemu-system-x86-64 qemu-system-common -y
                else
                    # If it's Ubuntu, install QEMU from official repositories
                    echo -e "${GREEN}[APT_INSTALL]: Detected Ubuntu. Installing QEMU from official repositories...${NC}"
                    sudo apt install qemu -y
                fi

                # Check if QEMU installation was successful
                if [ $? -eq 0 ]; then
                    echo -e "${GREEN}[SUCCESS]: QEMU has been successfully installed.${NC}"
                else
                    # If installation failed, display an error message and exit
                    echo -e "${RED}[ERROR]: Failed to install QEMU.${NC}"
                    exit 1
                fi
            fi
        else
            echo -e "${RED}[ERROR]: Unsupported Linux distribution.${NC}"
            exit 1
        fi

        # Checking Node.js version
        echo -e "${GREEN}[CHECK_NODE_VERSION]: Checking Node.js version...${NC}"
        NODE_VERSION=$(node -v)
        REQUIRED_VERSION="v18.0.0"

        if [[ "$NODE_VERSION" > "$REQUIRED_VERSION" ]]; then
            echo "[CHECK_NODE_VERSION]: Node.js version is acceptable: $NODE_VERSION"
        else
            echo "[CHECK_NODE_VERSION]: Node.js version ($NODE_VERSION) is not greater than $REQUIRED_VERSION. Please update Node.js."
            echo "[INSTALL_NVM]: Installing nvm"
            curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

            export NVM_DIR="$HOME/.nvm"
            [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
            [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

            nvm install 18
            nvm use 18
            nvm alias default 18
        fi

        # Checking Python version
        echo -e "${GREEN}[CHECK_PYTHON_VERSION]: Checking Python version...${NC}"
        PYTHON_VERSION=$(python3 -V 2>&1 | awk '{print $2}')
        REQUIRED_VERSION="3.10"

        if [[ "$PYTHON_VERSION" < "$REQUIRED_VERSION" ]]; then
            echo "[CHECK_PYTHON_VERSION]: Python version ($PYTHON_VERSION) is less than $REQUIRED_VERSION. Please install Python $REQUIRED_VERSION or higher."
            exit 1
        fi
    elif [[ "$(uname)" == "Darwin" ]]; then
        # Displaying processor type
        echo -e "${GREEN}[PROCESSOR_INFO]: Processor Type:${NC}"
        sysctl -n machdep.cpu.brand_string

        # Displaying GPU information
        echo -e "${GREEN}[GPU_INFO]: GPU Information:${NC}"
        system_profiler SPDisplaysDataType

        # Installing required packages on macOS
        echo -e "${GREEN}[BREW_INSTALL]: Installing required packages on macOS...${NC}"
        brew install wget git qemu libguestfs

        # Checking Node.js version
        echo -e "${GREEN}[CHECK_NODE_VERSION]: Checking Node.js version...${NC}"
        NODE_VERSION=$(node -v)
        REQUIRED_VERSION="v18.0.0"

        if [[ "$NODE_VERSION" > "$REQUIRED_VERSION" ]]; then
            echo "[CHECK_NODE_VERSION]: Node.js version is acceptable: $NODE_VERSION"
        else
            echo "[CHECK_NODE_VERSION]: Node.js version ($NODE_VERSION) is not greater than $REQUIRED_VERSION. Please update Node.js."
            echo "[INSTALL_NVM]: Installing nvm"
            curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

            export NVM_DIR="$HOME/.nvm"
            [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
            [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

            nvm install 18
            nvm use 18
            nvm alias default 18
        fi

        # Checking Python version
        echo -e "${GREEN}[CHECK_PYTHON_VERSION]: Checking Python version...${NC}"
        PYTHON_VERSION=$(python3 -V 2>&1 | awk '{print $2}')
        REQUIRED_VERSION="3.10"

        if [[ "$PYTHON_VERSION" < "$REQUIRED_VERSION" ]]; then
            echo "[CHECK_PYTHON_VERSION]: Python version ($PYTHON_VERSION) is less than $REQUIRED_VERSION. Please install Python $REQUIRED_VERSION or higher."
            exit 1
        fi
    else
        echo -e "${RED}[ERROR]: Unsupported operating system.${NC}"
        exit 1
    fi

    # Checking QEMU version
    echo -e "${GREEN}[CHECK_QEMU_VERSION]: Checking QEMU version...${NC}"
    QEMU_VERSION=$(qemu-system-x86_64 --version | awk '{print $4}' | head -n1)
    REQUIRED_VERSION="6.2.0"

    if [[ "$(printf '%s\n' "$QEMU_VERSION" "$REQUIRED_VERSION" | sort -V | head -n1)" == "$REQUIRED_VERSION" ]]; then
        echo "[CHECK_QEMU_VERSION]: QEMU version is acceptable: $QEMU_VERSION"
    else
        echo "[CHECK_QEMU_VERSION]: QEMU version ($QEMU_VERSION) is not greater than or equal to $REQUIRED_VERSION. Please update QEMU."
        exit 1
    fi

    # Installing Node.js dependencies
    echo -e "${GREEN}[NPM_INSTALL]: Installing Node.js dependencies...${NC}"
    npm install

    # Creating necessary directories
    echo -e "${GREEN}[CREATE_DIRECTORIES]: Creating necessary directories...${NC}"
    mkdir -p prebuilt/basesystems
    mkdir -p .cache
    mkdir -p .snapshots
    mkdir -p .tty
    mkdir -p disks

    # Creating .vnc-port file if it doesn't exist with content "1"
    if [ ! -f ".vnc-port" ]; then
        echo "1" > .vnc-port
    fi

    chmod +x prebuild.sh
    chmod +x install.sh
    chmod +x get.sh
    chmod +x thanks.sh
    chmod +x run-server.sh

    # Prebuild all BaseSystem.img
    ./prebuild.sh

    # Changing directory to the cloned repository
    cd osx-serial-generator || exit

    # Running the install script
    echo -e "${GREEN}[RUN_PREBUILT_SCRIPT]: Running prebuild.sh...${NC}"
    chmod +x prebuild.sh
    ./prebuild.sh

    cd .. || exit

    ./thanks.sh

else
    echo "Incorrect sudo password. Exiting..."
    exit 1
fi
