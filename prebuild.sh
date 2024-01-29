#!/bin/bash

# Function to check if a command is available and install it if not
install_command() {
    local command_name="$1"
    if ! command -v "$command_name" &> /dev/null; then
        echo "$command_name is not found. Installing..."
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo apt-get update
            sudo apt-get install -y "$command_name"
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            brew install "$command_name"
        else
            echo "Error: Unsupported operating system."
            exit 1
        fi
    fi
}

# Check if Python 3.8 or higher is installed
python_version=$(python3 --version 2>&1 | awk '{print $2}')
if [ "$(python3 -c "from distutils.version import LooseVersion; print(LooseVersion('$python_version') < LooseVersion('3.8'))")" = "True" ]; then
    echo "Error: Python 3.8 or higher is required, but you have version $python_version."
    exit 1
fi

# Check if fetcher/getMacOs.py exists
if [ ! -f "fetcher/getMacOs.py" ]; then
    echo "Error: fetcher/getMacOs.py is not found. Please make sure it exists."
    exit 1
fi

# Install dmg2img if not available
install_command "dmg2img"

# Create prebuilt/basesystems/ directory if it doesn't exist
if [ ! -d "prebuilt/basesystems" ]; then
    mkdir -p "prebuilt/basesystems"
    echo "Created prebuilt/basesystems directory."
fi

# Function for converting and moving the IMG file (use the same function as before)
convert_and_move() {
    local system_name_for_python="$1"
    local system_name_for_file="$2"
    local dmg_file="$3"

    cd fetcher

    echo "Downloading $system_name_for_python..."
    python3 getMacOs.py --short "$system_name_for_python"

    echo "Converting $dmg_file to IMG..."
    dmg2img -i "$dmg_file" BaseSystem.img

    if [ -f BaseSystem.img ]; then
        echo "Moving and renaming BaseSystem.img to BaseSystem-$system_name_for_file.img..."
        mv BaseSystem.img "prebuilt/basesystems/BaseSystem-$system_name_for_file.img"
    fi
}

# Download and rename for each system
convert_and_move "sonoma" "Sonoma" "BaseSystem.dmg"
convert_and_move "ventura" "Ventura" "BaseSystem.dmg"
convert_and_move "monterey" "Monterey" "BaseSystem.dmg"
convert_and_move "big-sur" "BigSur" "BaseSystem.dmg"
convert_and_move "catalina" "Catalina" "BaseSystem.dmg"
