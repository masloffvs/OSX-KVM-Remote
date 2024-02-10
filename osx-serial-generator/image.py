import os
import shutil
import subprocess

from root import WORK, BASE, msg


def check_file_exists(file_path):
    if os.path.exists(file_path):
        msg(f"File '{file_path}' exists.")
    else:
        msg(f"Error: File '{file_path}' does not exist.")


def check_directories():
    check_file_exists(os.path.join(BASE, "EFI", "BOOT"))
    check_file_exists(os.path.join(BASE, "EFI", "OC"))
    check_file_exists(os.path.join(BASE, "EFI", "OC", "OpenCore.efi"))
    check_file_exists(os.path.join(BASE, "EFI", "OC", "Drivers"))
    check_file_exists(os.path.join(BASE, "EFI", "OC", "Kexts"))
    check_file_exists(os.path.join(BASE, "EFI", "OC", "ACPI"))


def check_config_and_startup(cfg_path):
    check_file_exists(cfg_path)
    check_file_exists(os.path.join(BASE, "startup.nsh"))


# Function to perform cleanup
def do_cleanup():
    msg("cleaning up ...")
    subprocess.run(["guestfish", "--remote", "--", "exit"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    shutil.rmtree(WORK)


def imager(img="", cfg="", disk_size='384M'):
    check_directories()
    check_config_and_startup(cfg)

    # Function to execute commands in guestfish
    def fish(*args):
        subprocess.run(["guestfish", "--remote", "--"] + list(args), check=False)

    # Function to initialize disk image in guestfish
    def fish_init():
        format = "raw" if img.endswith(".raw") else "qcow2"
        msg("Creating and adding disk image")
        fish("disk-create", img, format, disk_size)
        fish("add", img)
        fish("run")

    # Function to finalize disk image in guestfish
    def fish_fini():
        fish("umount-all")

    # Copy files from local folder
    msg("Copy files from local folder")
    shutil.copytree(os.path.join(BASE, "EFI"), os.path.join(WORK, "EFI"))

    # Initialize guestfish
    p = subprocess.Popen(["guestfish", "--listen"], stdout=subprocess.PIPE)
    output, _ = p.communicate()
    if p.returncode == 0:
        guestfish_pid = output.decode().split('=')[1].strip()
        os.environ["GUESTFISH_PID"] = guestfish_pid
    else:
        print("ERROR: starting guestfish failed")
        exit(1)

    fish_init()

    # Partition disk image in guestfish
    msg("Partitioning disk image")

    # Initialize GUID Partition Table (GPT)
    msg("Initialize GUID Partition Table (GPT)")
    fish("part-init", "/dev/sda", "gpt")

    # Add partitions to the disk image

    # Partition 1: EFI partition
    msg("Adding EFI partition")
    fish("part-add", "/dev/sda", "p", "2048", "300000")

    # Partition 2: OpenCore partition
    msg("Adding OpenCore partition")
    fish("part-add", "/dev/sda", "p", "302048", "-2048")

    # Set the partition type of the EFI partition to EFI System
    msg("Setting EFI partition type to EFI System")
    fish("part-set-gpt-type", "/dev/sda", "1", "C12A7328-F81F-11D2-BA4B-00A0C93EC93B")

    # Mark the EFI partition as bootable
    msg("Marking EFI partition as bootable")
    fish("part-set-bootable", "/dev/sda", "1", "true")

    # Format the EFI partition with FAT32 file system
    msg("Formatting EFI partition with FAT32 file system")
    fish("mkfs", "vfat", "/dev/sda1", "label:EFI")

    # Format the OpenCore partition with FAT32 file system
    msg("Formatting OpenCore partition with FAT32 file system")
    fish("mkfs", "vfat", "/dev/sda2", "label:OpenCore")

    # Mount the OpenCore partition
    msg("Mounting the OpenCore partition")
    fish("mount", "/dev/sda2", "/")

    # Create a directory named ESP on the OpenCore partition
    msg("Creating a directory named ESP on the OpenCore partition")
    fish("mkdir", "/ESP")

    # Mount the EFI partition
    msg("Mounting the EFI partition")
    fish("mount", "/dev/sda1", "/ESP")

    # Copy files to disk image
    msg("copy files to disk image")
    cfg_path = os.path.join(WORK, "config.plist")

    if os.path.exists(cfg):
        try:
            shutil.copy2(cfg, cfg_path)
        except FileNotFoundError:
            print(f"ERROR: Config file '{cfg}' not found.")
            exit(1)
    else:
        print(f"ERROR: Config file '{cfg}' does not exist.")
        exit(1)

    # Create necessary directories on the OpenCore partition
    msg("Creating necessary directories on the OpenCore partition")
    fish("mkdir", "/ESP/EFI")

    msg("Creating OC directory")
    fish("mkdir", "/ESP/EFI/OC")

    msg("Creating Kexts directory")
    fish("mkdir", "/ESP/EFI/OC/Kexts")

    msg("Creating ACPI directory")
    fish("mkdir", "/ESP/EFI/OC/ACPI")

    msg("Creating Resources directory")
    fish("mkdir", "/ESP/EFI/OC/Resources")

    msg("Creating Tools directory")
    fish("mkdir", "/ESP/EFI/OC/Tools")

    # Copy files to the OpenCore partition
    msg("Copying files to the OpenCore partition")
    fish("copy-in", os.path.join(WORK, "EFI/BOOT"), "/ESP/EFI")

    msg("Copying OpenCore EFI file")
    fish("copy-in", os.path.join(WORK, "EFI/OC/OpenCore.efi"), "/ESP/EFI/OC")

    msg("Copying Drivers directory")
    fish("copy-in", os.path.join(WORK, "EFI/OC/Drivers"), "/ESP/EFI/OC/")

    msg("Copying Kexts directory")
    fish("copy-in", os.path.join(WORK, "EFI/OC/Kexts"), "/ESP/EFI/OC/")

    msg("Copying ACPI directory")
    fish("copy-in", os.path.join(WORK, "EFI/OC/ACPI"), "/ESP/EFI/OC/")

    msg("Copying OC Resources directory")
    fish("copy-in", os.path.join(BASE, "resources/OcBinaryData/Resources"), "/ESP/EFI/OC/")

    msg("Copying OC Tools directory")
    fish("copy-in", os.path.join(WORK, "EFI/OC/Tools"), "/ESP/EFI/OC/")

    msg("Copying config.plist")
    fish("copy-in", os.path.join(WORK, "config.plist"), "/ESP/EFI/OC/")

    msg("Copying startup.nsh")
    fish("copy-in", "startup.nsh", "/")

    # Find files on the OpenCore partition
    # msg("Finding files on the OpenCore partition")
    # fish("find", "/ESP/")

    fish_fini()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Imager")
    parser.add_argument("--img", help="Path to disk image")
    parser.add_argument("--cfg", help="Path to clover config")
    args = parser.parse_args()

    imager(args.img, args.cfg)
