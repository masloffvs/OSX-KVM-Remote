#!/bin/bash

# Function to log steps
log_step() {
    local step_name="$1"
    local log_text="$2"
    echo "[$step_name]: $log_text"
}

# Function to check if a directory exists
check_directory_exists() {
    local directory="$1"
    if [ ! -d "$directory" ]; then
        log_step "ERROR" "Directory '$directory' does not exist."
        exit 1
    fi
}

# Function to check if a file exists
check_file_exists() {
    local file="$1"
    if [ ! -f "$file" ]; then
        log_step "ERROR" "File '$file' does not exist."
        exit 1
    fi
}

# Requesting sudo password upfront for subsequent commands
log_step "PASSWORD_REQUEST" "Please enter your sudo password to allow the following commands to run without further prompts:"
if sudo -v; then
    # Check existence and validity of XML files
    log_step "CHECK_XML_FILES" "Checking XML files..."
    check_file_exists "config-custom.plist"
    check_file_exists "config-custom-nosip.plist"
    check_file_exists "config-custom-sonoma.plist"
    check_file_exists "config-legacy.plist"
    check_file_exists "config-nopicker-custom.plist"
    check_file_exists "config-nopicker-legacy.plist"
    check_file_exists "config-nopicker-sonoma.plist"

    # Validate XML files as config files
    for config_file in "config-custom.plist" "config-custom-nosip.plist" "config-custom-sonoma.plist" "config-legacy.plist" "config-nopicker-custom.plist" "config-nopicker-legacy.plist" "config-nopicker-sonoma.plist"; do
        if ! xmllint --noout "$config_file"; then
            log_step "ERROR" "File '$config_file' is not a valid XML file."
            exit 1
        fi
    done

    # Check if main.py file exists
    log_step "CHECK_MAIN_PY" "Checking if 'main.py' file exists..."
    if [ ! -f "main.py" ]; then
        log_step "ERROR" "'main.py' file does not exist."
        exit 1
    fi

    # Remove macserial if it exists
    if [ -f "macserial" ]; then
        log_step "REMOVE_FILE" "Removing existing 'macserial' file..."
        rm -f macserial
    fi

    # Remove existing directories if they exist
    if [ -d "OSX-KVM" ]; then
        log_step "REMOVE_DIRECTORY" "Removing existing 'OSX-KVM' directory..."
        rm -rf OSX-KVM
    fi

    if [ -d "OpenCorePkg" ]; then
        log_step "REMOVE_DIRECTORY" "Removing existing 'OpenCorePkg' directory..."
        rm -rf OpenCorePkg
    fi

    # Clone necessary repositories
    log_step "GIT_CLONE" "Cloning repositories..."
    git clone --recurse-submodules --depth 1 https://github.com/kholia/OSX-KVM.git
    git clone --depth 1 https://github.com/acidanthera/OpenCorePkg.git

    # Build macserial
    log_step "BUILD_MACSERIAL" "Building macserial..."
    make -C ./OpenCorePkg/Utilities/macserial/
    mv ./OpenCorePkg/Utilities/macserial/macserial .
    chmod +x ./macserial
    stat ./macserial

    # Create directories and copy resources
    log_step "CREATE_DIRECTORIES" "Creating directories and copying resources..."
    mkdir -p ./resources/OcBinaryData/Resources/
    check_directory_exists "./OSX-KVM/resources/OcBinaryData/Resources/"
    cp -r ./OSX-KVM/resources/OcBinaryData/Resources/ ./resources/OcBinaryData/Resources/

    log_step "REMOVE_SERIAL_SETS" "Removing 'serial_sets' files..."
    rm -f serial_sets*

#    log_step "RUN_MAINPY" "Running main.py..."
#    python3 main.py

else
    echo "Incorrect sudo password. Exiting..."
    exit 1
fi
