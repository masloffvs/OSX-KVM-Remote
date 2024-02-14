#!/bin/bash

# Check if git is installed
if ! command -v git &> /dev/null; then
    # Install git based on the operating system
    if [[ "$(uname)" == "Linux" ]]; then
        # Check if pacman is available
        if command -v pacman &> /dev/null; then
            echo "[INSTALL_GIT]: Git is not installed. Installing Git via pacman..."
            sudo pacman -S git --noconfirm
        elif command -v apt &> /dev/null; then
            echo "[INSTALL_GIT]: Git is not installed. Installing Git via apt..."
            sudo apt install git -y
        else
            echo "[INSTALL_GIT]: Git is not installed, and the package manager is not recognized. Please install Git manually and try again."
            exit 1
        fi
    elif [[ "$(uname)" == "Darwin" ]]; then
        echo "[INSTALL_GIT]: Git is not installed. Installing Git via brew..."
        brew install git
    else
        echo "[INSTALL_GIT]: Git is not installed, and the operating system is not recognized. Please install Git manually and try again."
        exit 1
    fi
fi

# Cloning the GitHub repository
echo "[CLONE_REPO]: Cloning the GitHub repository..."
git clone https://github.com/masloffvs/OSX-KVM-Remote wireforce-osx-kvm-remote

# Changing directory to the cloned repository
cd wireforce-osx-kvm-remote || exit

# Running the install script
echo "[RUN_INSTALL_SCRIPT]: Running install.sh..."
chmod +x install.sh
./install.sh
