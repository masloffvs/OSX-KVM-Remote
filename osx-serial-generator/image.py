#!/usr/bin/env python3
import asyncio
import os
import subprocess
import pexpect

# Function to display messages with formatting
def msg(operation, message):
    print(f"[{operation}]: {message}")

# Function to perform cleanup tasks
def do_cleanup():
    msg("cleanup", "Cleaning up ...")
    if os.getenv("GUESTFISH_PID"):
        child.sendline("exit")
        child.expect(pexpect.EOF)
    os.rmdir(WORK)

# Check if guestfish utility exists
def check_guestfish():
    try:
        subprocess.run(["guestfish", "--version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except FileNotFoundError:
        print("ERROR: guestfish utility not found. Please install it.")
        exit(1)

def execute_guestfish_commands(commands):
    for command in commands:
        child.sendline(command)
        child.expect(">")
    child.sendline("exit")
    child.expect(pexpect.EOF)

async def main():
    # Starting guestfish and setting up environment
    msg("main", "Starting guestfish and setting up environment")
    global child
    child = pexpect.spawn("guestfish --listen")
    child.expect(">")

    # Initialize disk image
    msg("main", "Initializing disk image")
    commands = [
        "disk-create {} {} 384M".format(img, "raw" if img.endswith(".raw") else "qcow2"),
        "add {}".format(img),
        "run"
    ]
    execute_guestfish_commands(commands)

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
    execute_guestfish_commands(commands)

    # Finalize
    msg("main", "Finishing up")
    subprocess.run(["guestfish", "--remote", "--", "umount-all"])

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

    asyncio.run(main())
