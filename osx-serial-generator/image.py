#!/usr/bin/env python3

import os
import subprocess

# Function to display messages with formatting
def msg(operation, message):
    print(f"[{operation}]: {message}")

# Function to perform cleanup tasks
def do_cleanup():
    msg("cleanup", "Cleaning up ...")
    if os.getenv("GUESTFISH_PID"):
        subprocess.run(["guestfish", "--remote", "--", "exit"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    os.rmdir(WORK)

# Function to initialize disk image
def fish_init():
    format = "raw" if img.endswith(".raw") else "qcow2"
    msg("fish_init", "Creating and adding disk image")
    subprocess.run(["guestfish", "--remote", "--", "disk-create", img, format, "384M"])
    subprocess.run(["guestfish", "--remote", "--", "add", img])
    subprocess.run(["guestfish", "--remote", "--", "run"])

# Function to finalize guestfish operations
def fish_fini():
    subprocess.run(["guestfish", "--remote", "--", "umount-all"])

# Check if guestfish utility exists
def check_guestfish():
    try:
        subprocess.run(["guestfish", "--version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except FileNotFoundError:
        print("ERROR: guestfish utility not found. Please install it.")
        exit(1)

# Main script
if __name__ == "__main__":
    iso = ""
    img = ""
    cfg = ""

    # Check if guestfish utility exists
    check_guestfish()

    # Create work directory
    WORK = f"{os.getenv('TMPDIR', '/var/tmp')}/{os.path.basename(__file__)}-{os.getpid()}"
    os.mkdir(WORK)

    # Set trap for cleanup
    import atexit
    atexit.register(do_cleanup)

    BASE = os.path.dirname(__file__)

    # Parse command line options
    import argparse
    parser = argparse.ArgumentParser(description="Script to perform some task.")
    parser.add_argument("--iso", help="ISO image")
    parser.add_argument("--img", help="Disk image")
    parser.add_argument("--cfg", help="Clover config")
    args = parser.parse_args()
    iso = args.iso
    img = args.img
    cfg = args.cfg

    # Copy files from local folder
    source_dir = f"{BASE}/EFI"
    if os.path.exists(source_dir):
        msg("main", "Copying files from local folder")
        subprocess.run(["cp", "-a", source_dir, WORK])
    else:
        msg("main", f"ERROR: Source directory '{source_dir}' not found")
        exit(1)

    # Start guestfish and set up environment
    msg("main", "Starting guestfish and setting up environment")
    guestfish = subprocess.Popen(["guestfish", "--listen"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    _, stderr = guestfish.communicate()
    if stderr:
        msg("main", "ERROR: Starting guestfish failed")
        exit(1)

    # Initialize disk image
    fish_init()

    # Partition disk image
    msg("main", "Partitioning disk image")
    commands = [
        "part-init /dev/sda gpt",
        "part-add /dev/sda p 2048 300000",
        "part-add /dev/sda p 302048 -2048",
        "part-set-gpt-type /dev/sda 1 C12A7328-F81F-11D2-BA4B-00A0C93EC93B",
        "part-set-bootable /dev/sda 1 true",
        "mkfs vfat /dev/sda1 label:EFI",
        "mkfs vfat /dev/sda2 label:OpenCore",
        "mount /dev/sda2 /",
        "mkdir /ESP/EFI/OC/{Kexts,ACPI,Resources,Tools}",
        f"copy-in {cfg} /ESP/EFI/OC/config.plist",
        f"copy-in {WORK}/EFI /ESP"
    ]
    for command in commands:
        subprocess.run(["guestfish", "--remote", "--", command])

    # Finalize
    fish_fini()
