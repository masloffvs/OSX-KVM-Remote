import os
import shutil
import subprocess
import tempfile

from root import WORK, BASE

# Define defaults
iso = ""
img = ""
cfg = ""


# Function to print messages
def msg(txt):
    bold = "\033[1m"
    normal = "\033[0m"
    print(f"{bold}### {txt}{normal}")


# Function to perform cleanup
def do_cleanup():
    msg("cleaning up ...")
    subprocess.run(["guestfish", "--remote", "--", "exit"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    shutil.rmtree(WORK)


def imager(img="", cfg=""):
    # Change directory to the working directory
    os.chdir(WORK)

    # Function to execute commands in guestfish
    def fish(*args):
        print("#", *args)
        subprocess.run(["guestfish", "--remote", "--"] + list(args), check=True)

    # Function to initialize disk image in guestfish
    def fish_init():
        format = "raw" if img.endswith(".raw") else "qcow2"
        msg("creating and adding disk image")
        fish("disk-create", img, format, "384M")
        fish("add", img)
        fish("run")

    # Function to finalize disk image in guestfish
    def fish_fini():
        fish("umount-all")

    # Copy files from local folder
    msg("copy files from local folder")
    shutil.copytree(os.path.join(BASE, "EFI"), os.path.join(WORK, "EFI"))

    # Initialize guestfish
    p = subprocess.Popen(["guestfish", "--listen"], stdout=subprocess.PIPE)
    output, _ = p.communicate()
    if p.returncode == 0:
        guestfish_pid = output.decode().split('=')[1].strip()
        os.environ["GUESTFISH_PID"] = guestfish_pid
    else:
        print("ERROR: starting guestfish failed")
        os.sys.exit(1)

    fish_init()

    # Partition disk image in guestfish
    msg("partition disk image")
    fish("part-init", "/dev/sda", "gpt")
    fish("part-add", "/dev/sda", "p", "2048", "300000")
    fish("part-add", "/dev/sda", "p", "302048", "-2048")
    fish("part-set-gpt-type", "/dev/sda", "1", "C12A7328-F81F-11D2-BA4B-00A0C93EC93B")
    fish("part-set-bootable", "/dev/sda", "1", "true")
    fish("mkfs", "vfat", "/dev/sda1", "label:EFI")
    fish("mkfs", "vfat", "/dev/sda2", "label:OpenCore")
    fish("mount", "/dev/sda2", "/")
    fish("mkdir", "/ESP")
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

    fish("mkdir", "/ESP/EFI")
    fish("mkdir", "/ESP/EFI/OC")
    fish("mkdir", "/ESP/EFI/OC/Kexts")
    fish("mkdir", "/ESP/EFI/OC/ACPI")
    fish("mkdir", "/ESP/EFI/OC/Resources")
    fish("mkdir", "/ESP/EFI/OC/Tools")
    fish("copy-in", os.path.join(WORK, "EFI/BOOT"), "/ESP/EFI")
    fish("copy-in", os.path.join(WORK, "EFI/OC/OpenCore.efi"), "/ESP/EFI/OC")
    fish("copy-in", os.path.join(WORK, "EFI/OC/Drivers"), "/ESP/EFI/OC/")
    fish("copy-in", os.path.join(WORK, "EFI/OC/Kexts"), "/ESP/EFI/OC/")
    fish("copy-in", os.path.join(WORK, "EFI/OC/ACPI"), "/ESP/EFI/OC/")
    fish("copy-in", os.path.join(BASE, "resources/OcBinaryData/Resources"), "/ESP/EFI/OC/")
    fish("copy-in", os.path.join(WORK, "EFI/OC/Tools"), "/ESP/EFI/OC/")

    # Note
    fish("copy-in", "startup.nsh", "/")
    shutil.copy2(os.path.join(WORK, "config.plist"), "/ESP/EFI/OC/")

    fish("find", "/ESP/")
    fish_fini()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Imager")
    parser.add_argument("--img", help="Path to disk image")
    parser.add_argument("--cfg", help="Path to clover config")
    args = parser.parse_args()

    imager(args.img, args.cfg)
