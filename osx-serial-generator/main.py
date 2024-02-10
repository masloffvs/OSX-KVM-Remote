import argparse
import os
import shutil
import subprocess

from root import msg, TEMP_PATH_CONFIG_PLIST


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


def print_macos_parameters(replacement):
    # ANSI escape sequences for colors
    green = "\033[92m"  # green
    blue = "\033[94m"   # blue
    magenta = "\033[95m" # magenta
    cyan = "\033[96m"   # cyan
    yellow = "\033[93m" # yellow
    bold = "\033[1m"    # bold
    end_color = "\033[0m"  # end color

    # Print header
    print(f"{bold}{blue}Your new MacOS configuration:{end_color}")

    # Print parameters
    for key, value in replacement.items():
        if value is not None:
            # Determine color based on parameter
            if key in ["{{DEVICE_MODEL}}", "{{SERIAL}}", "{{SERIAL_OLD}}", "{{BOARD_SERIAL}}", "{{BOARD_SERIAL_OLD}}"]:
                color = cyan
            elif key in ["{{UUID}}", "{{UUID_OLD}}", "{{SYSTEM_UUID_OLD}}", "{{ROM}}"]:
                color = magenta
            elif key in ["{{WIDTH}}", "{{HEIGHT}}"]:
                color = yellow
            else:
                color = green

            # Print parameter
            print(f"{bold}{color}{key}: {end_color}{value}")


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
        msg("File tmp.config.plist not found.")
    except IOError:
        msg("Input/output error occurred while reading or writing the file.")
    except Exception as e:
        msg("An error occurred:", e)

    if not plist:
        exit(0)

    from image import imager

    print_macos_parameters(replacement)

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
    parser = argparse.ArgumentParser(description="Generate a bootdisk with custom parameters.")

    parser.add_argument('--device_model', required=True, help="Device model")
    parser.add_argument('--serial', required=True, help="Serial number")
    parser.add_argument('--board_serial', required=True, help="Board serial number")
    parser.add_argument('--uuid', required=True, help="UUID")
    parser.add_argument('--mac_address', required=True, help="MAC address")
    parser.add_argument('--bootpath', required=True, help="Path to qcow2 disk out")
    parser.add_argument('--size', required=True, help="qcow2 size")
    parser.add_argument('--master_plist', required=True, help="master plist file")

    args = parser.parse_args()

    if os.path.exists(TEMP_PATH_CONFIG_PLIST):
        os.remove(TEMP_PATH_CONFIG_PLIST)

    if not vars(args).get('bootpath').endswith(".qcow2"):
        raise ValueError('bootpath must be a valid path to the qcow disk')

    if os.path.exists(vars(args).get('bootpath')):
        raise ValueError('you are referencing an existing qcow file, it cannot be overwritten for security reasons')

    if not os.path.exists(vars(args).get('master_plist')):
        raise ValueError('you are referencing an not existing master_plist file')

    main(vars(args))
