import os
import subprocess
import requests
import argparse
import shutil
import xml.etree.ElementTree as ET

from root import WORK, BASE, TEMP_PATH_CONFIG_PLIST

# URL to download the 'opencore-image-ng.sh' script
OPENCORE_IMAGE_MAKER_URL = 'https://raw.githubusercontent.com/sickcodes/osx-serial-generator/master/opencore-image-ng.sh'

# URL to download the master configuration plist file
MASTER_PLIST_URL = 'https://raw.githubusercontent.com/sickcodes/osx-serial-generator/master/config-nopicker-custom.plist'

def print_node(node, indent=0):
    # Create a string with spaces for indentation
    space = " " * indent

    if node.tag == "key":
        # If the node is a key, print it followed by a colon
        print(f"{space}{node.text}: ", end="")
    elif node.tag in ["string", "integer", "true", "false", "data"]:
        # If the node is one of these types, print its text
        print(f"{node.text}")
    elif node.tag in ["dict", "array"]:
        # If the node is a dictionary or an array, print a newline
        print()
        # Iterate through its children and print them with increased indentation
        for child in node:
            print_node(child, indent + 2)
    else:
        # For other node types, just iterate through the children
        for child in node:
            print_node(child, indent)

def parse_plist_for_platform_info(xml_data):
    print("PlatformInfo:")
    # Parse the XML data into an ElementTree object
    try:
        root = ET.fromstring(xml_data)
        inside_platform_info = False

        for child in root.iter():
            if child.tag == "key" and child.text == "PlatformInfo":
                # If we find a "PlatformInfo" key, set a flag to indicate we are inside it
                inside_platform_info = True
            elif child.tag == "dict" and inside_platform_info:
                # If we are inside "PlatformInfo" and find a dictionary, start printing its contents
                print_node(child, 1)
                break  # Exit the loop after printing the first dictionary
    except:
        print("Unfortunately, this plist cannot be visualized")

# This function is responsible for downloading an EFI folder required for running macOS on a KVM virtual machine.
# It first checks if the 'EFI' folder already exists locally. If not, it proceeds to clone the 'OSX-KVM' repository.
# The 'startup.nsh' file is created to specify the EFI bootloader path for the virtual machine.
# Directories are created for the 'EFI/OC/Resources' path if they don't exist.
# The EFI folder is then copied from the 'OSX-KVM' repository to the current directory.
# Additionally, resources from the 'OcBinaryData/Resources' folder are copied to 'EFI/OC/Resources'.
def download_qcow_efi_folder():
    # Path to the local EFI folder
    efi_folder = './OpenCore/EFI'

    # Path to the resources folder within the 'OSX-KVM' repository
    resources_folder = './OSX-KVM/resources/OcBinaryData/Resources'

    # Check if the local EFI folder exists
    if not os.path.isdir(efi_folder):
        # Check if the 'OSX-KVM' repository doesn't exist, and if so, clone it with necessary submodules
        if not os.path.isdir('./OSX-KVM'):
            subprocess.run(['git', 'clone', '--recurse-submodules', '--depth', '1', 'https://github.com/kholia/OSX-KVM.git'], check=True)

        # Update the path to the EFI folder after cloning if needed
        efi_folder = f"./OSX-KVM/{efi_folder}"

    # Create a 'startup.nsh' file to specify the EFI bootloader path
    with open('startup.nsh', 'w') as file:
        file.write('fs0:\\EFI\\BOOT\\BOOTx64.efi')

    # Create directories if they don't exist for 'EFI/OC/Resources'
    os.makedirs('./EFI/OC/Resources', exist_ok=True)

    # Check if the source EFI folder exists
    if os.path.isdir(efi_folder):
        # Copy the EFI folder from the 'OSX-KVM' repository to the current directory
        for root, dirs, files in os.walk(efi_folder):
            for dir in dirs:
                src_path = os.path.join(root, dir)
                dst_path = os.path.join('.', dir)
                if not os.path.exists(dst_path):
                    os.makedirs(dst_path)
            for file in files:
                src_path = os.path.join(root, file)
                dst_path = os.path.join('.', file)
                if not os.path.exists(dst_path):
                    shutil.copy2(src_path, dst_path)

    # Check if the source resources folder exists
    if os.path.isdir(resources_folder):
        # Copy resources from 'OcBinaryData/Resources' to 'EFI/OC/Resources'
        for root, dirs, files in os.walk(resources_folder):
            for dir in dirs:
                src_path = os.path.join(root, dir)
                dst_path = os.path.join('./EFI/OC/Resources', dir)
                if not os.path.exists(dst_path):
                    os.makedirs(dst_path)
            for file in files:
                src_path = os.path.join(root, file)
                dst_path = os.path.join('./EFI/OC/Resources', file)
                if not os.path.exists(dst_path):
                    shutil.copy2(src_path, dst_path)


# This function generates a bootdisk configuration for a given device.
# It takes various parameters like device model, serial number, board serial number, UUID, MAC address, display resolution, and kernel arguments.
# The function first checks if a master configuration plist file exists, and if not, it downloads it from a URL and saves it locally.
# It also checks if the 'opencore-image-ng.sh' script exists and downloads it if necessary, making it executable.
# The MAC address is converted to a ROM value for customization.
# A list of sed expressions is created to replace placeholders in the master plist file with the provided values.
# A sed command is constructed with these expressions and applied to the master plist to create a temporary configuration file.
# The 'opencore-image-ng.sh' script is then executed with the temporary config file to generate the bootdisk image.
# Finally, the temporary config file is removed.
def generate_bootdisk(
    device_model,
    serial,
    board_serial,
    uuid,
    mac_address,
    width=1920,
    height=1080,
    kernel_args="",
    bootpath=None,
    size='512GB',
    master_plist='./config-nopicker-custom.plist'
):
    plist = None

    if not bootpath:
        bootpath = f"./{serial}.OpenCore-nopicker.qcow2"

    if not os.path.exists(TEMP_PATH_CONFIG_PLIST):
        shutil.copyfile(
            master_plist,
            TEMP_PATH_CONFIG_PLIST
        )

    # Convert MAC address to ROM format
    rom = mac_address.replace(':', '').lower()

    # List of sed expressions to replace placeholders in the master plist
    replacement = {
        "{{DEVICE_MODEL}}": device_model,
        "{{SERIAL}}": serial,
        "{{SERIAL_OLD}}": serial,
        "{{BOARD_SERIAL}}": board_serial,
        "{{BOARD_SERIAL_OLD}}": board_serial,
        "{{UUID}}": uuid,
        "{{UUID_OLD}}": uuid,
        "{{SYSTEM_UUID_OLD}}": uuid,
        "{{ROM}}": rom,
        "{{WIDTH}}": width,
        "{{HEIGHT}}": height,
        "{{KERNEL_ARGS}}": kernel_args
    }

    try:
        with open(TEMP_PATH_CONFIG_PLIST, 'r') as file:
            plist = file.read()

        for word, initial in replacement.items():
            plist = plist.replace(str(word), str(initial))

        with open(TEMP_PATH_CONFIG_PLIST, 'w+') as file:
            file.write(plist)

    except FileNotFoundError:
        print("File tmp.config.plist not found.")
    except IOError:
        print("Input/output error occurred while reading or writing the file.")
    except Exception as e:
        print("An error occurred:", e)

    if not plist:
        exit(0)

    parse_plist_for_platform_info(plist)

    from image import imager

    imager(
        bootpath,
        TEMP_PATH_CONFIG_PLIST
    )


def main(args):
    # Extract arguments from the provided dictionary
    device_model = args.get('device_model')
    serial = args.get('serial')
    board_serial = args.get('board_serial')
    uuid = args.get('uuid')
    size = args.get('size')
    mac_address = args.get('mac_address')
    bootpath = args.get('bootpath')
    master_plist = args.get('master_plist')

    # Validate serial number
    if len(serial) != 12 or not all(c in "0123456789ABCDEF" for c in serial):
        raise ValueError("Invalid serial number format for macOS.")

    # Validate UUID
    import uuid as uuid_lib
    try:
        uuid_obj = uuid_lib.UUID(uuid)
    except ValueError:
        raise ValueError("Invalid UUID format.")

    # Validate MAC address
    import re
    mac_regex = re.compile('^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$')
    if not mac_regex.match(mac_address):
        raise ValueError("Invalid MAC address format.")

    download_qcow_efi_folder()
    generate_bootdisk(device_model, serial, board_serial, uuid, mac_address, master_plist=master_plist, bootpath=bootpath, size=size)


if __name__ == '__main__':
    # Define the command-line argument parser
    parser = argparse.ArgumentParser(description="Generate a bootdisk with custom parameters.")
    parser.add_argument('--device_model', required=True, help="Device model")
    parser.add_argument('--serial', required=True, help="Serial number")
    parser.add_argument('--board_serial', required=True, help="Board serial number")
    parser.add_argument('--uuid', required=True, help="UUID")
    parser.add_argument('--mac_address', required=True, help="MAC address")
    parser.add_argument('--bootpath', required=True, help="Path to qcow2 disk out")
    parser.add_argument('--size', required=True, help="qcow2 size")
    parser.add_argument('--master_plist', required=True, help="master plist file")

    # Parse command-line arguments
    args = parser.parse_args()

    if os.path.exists(TEMP_PATH_CONFIG_PLIST):
        os.remove(TEMP_PATH_CONFIG_PLIST)

    if not vars(args).get('bootpath').endswith(".qcow2"):
        raise ValueError('bootpath must be a valid path to the qcow disk')

    if os.path.exists(vars(args).get('bootpath')):
        raise ValueError('you are referencing an existing qcow file, it cannot be overwritten for security reasons')

    if not os.path.exists(vars(args).get('master_plist')):
        raise ValueError('you are referencing an not existing master_plist file')

    # Call the main function with the parsed arguments
    main(vars(args))
