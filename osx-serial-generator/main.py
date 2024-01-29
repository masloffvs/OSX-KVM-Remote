import os
import subprocess
import requests
import argparse


# URL to download the 'opencore-image-ng.sh' script
OPENCORE_IMAGE_MAKER_URL = 'https://raw.githubusercontent.com/sickcodes/osx-serial-generator/master/opencore-image-ng.sh'

# URL to download the master configuration plist file
MASTER_PLIST_URL = 'https://raw.githubusercontent.com/sickcodes/osx-serial-generator/master/config-nopicker-custom.plist'


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

    # Copy the EFI folder from the 'OSX-KVM' repository to the current directory
    subprocess.run(['cp', '-a', efi_folder, '.'], check=True)

    # Copy resources from 'OcBinaryData/Resources' to 'EFI/OC/Resources'
    subprocess.run(['cp', '-a', f"{resources_folder}/*", './EFI/OC/Resources'], shell=True)


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
    size='512GB'
):
    if not bootpath:
        bootpath = f"./{serial}.OpenCore-nopicker.qcow2"

    # Path to the master configuration plist file
    master_plist = './config-custom.plist'

    # Check if the master plist file exists, if not, download it from a URL
    if not os.path.exists(master_plist):
        response = requests.get(MASTER_PLIST_URL)
        with open(master_plist, 'wb') as file:
            file.write(response.content)

    # Check if the 'opencore-image-ng.sh' script exists, if not, download and make it executable
    if not os.path.exists('./opencore-image-ng.sh'):
        response = requests.get(OPENCORE_IMAGE_MAKER_URL)
        with open('./opencore-image-ng.sh', 'wb') as file:
            file.write(response.content)
        os.chmod('./opencore-image-ng.sh', 0o755)

    # Convert MAC address to ROM format
    rom = mac_address.replace(':', '').lower()

    # List of sed expressions to replace placeholders in the master plist
    sed_expressions = [
        f's/{{DEVICE_MODEL}}/{device_model}/g',
        f's/{{SERIAL}}/{serial}/g',
        f's/{{BOARD_SERIAL}}/{board_serial}/g',
        f's/{{UUID}}/{uuid}/g',
        f's/{{ROM}}/{rom}/g',
        f's/{{WIDTH}}/{width}/g',
        f's/{{HEIGHT}}/{height}/g',
        f's/{{KERNEL_ARGS}}/{kernel_args}/g'
    ]

    # Construct the sed command with expressions and apply it to create a temporary config file
    sed_command = ['sed']
    for expr in sed_expressions:
        sed_command.extend(['-e', expr])
    sed_command.append(master_plist)

    with open('./tmp.config.plist', 'w') as file:
        subprocess.run(sed_command, stdout=file)

    imgNgPath = [
        './opencore-image-ng.sh',
        '--cfg',
        './tmp.config.plist',
        '--img',
        bootpath
    ]

    # Execute 'opencore-image-ng.sh' with the temporary config file to generate the bootdisk image
    subprocess.run(imgNgPath, check=True)

    # Remove the temporary config file
    os.remove('./tmp.config.plist')


def main(args):
    # Extract arguments from the provided dictionary
    device_model = args.get('device_model')
    serial = args.get('serial')
    board_serial = args.get('board_serial')
    uuid = args.get('uuid')
    size = args.get('size')
    mac_address = args.get('mac_address')
    bootpath = args.get('bootpath')

    download_qcow_efi_folder()
    generate_bootdisk(device_model, serial, board_serial, uuid, mac_address, bootpath=bootpath, size=size)


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

    # Parse command-line arguments
    args = parser.parse_args()

    # Call the main function with the parsed arguments
    main(vars(args))