#!/usr/bin/env bash

# https://github.com/kraxel/imagefish

iso=""
img=""
cfg=""
WORK="${TMPDIR-/var/tmp}/${0##*/}-$$"
BASE="$(dirname "$0")"
LIBGUESTFS_BACKEND=direct

# Function to display messages with formatting
msg() {
	echo -e "\x1b[1m[$1]: $2\x1b[0m"
}

# Function to perform cleanup tasks
do_cleanup() {
	msg "cleanup" "Cleaning up ..."
	[ -n "$GUESTFISH_PID" ] && guestfish --remote -- exit >/dev/null 2>&1 || true
	sudo rm -rf "$WORK"
}
trap 'do_cleanup' EXIT

mkdir "$WORK" || exit 1

# Function to print help message
print_help() {
cat <<EOF
Usage: $0 [ options ]
Options:
    --iso <iso-image>
    --img <disk-image>
    --cfg <clover-config>
EOF
}

# Main script logic
msg "main" "Starting script execution"

# Parse command line options
while [ "$#" -gt 0 ]; do
	case "$1" in
	--iso) iso="$2"; shift 2 ;;
	--img) img="$2"; shift 2 ;;
	--cfg) cfg="$2"; shift 2 ;;
	*) print_help; exit 1 ;;
	esac
done

# Function to execute guestfish commands
fish() {
	echo "#" "$@"
	guestfish --remote -- "$@" || exit 1
}

# Function to initialize disk image
fish_init() {
	local format="${img##*.}"
	format=${format/raw/raw/qcow2}
	msg "fish_init" "Creating and adding disk image"
	fish disk-create "$img" "${format:-qcow2}" 384M
	fish add "$img"
	fish run
}

# Function to finalize guestfish operations
fish_fini() {
	msg "fish_fini" "Unmounting all"
	fish umount-all
}

# Step 1: Copy files from local folder
msg "step1" "Copying files from local folder"
cp -a "$BASE/EFI" "$WORK"

# Step 2: Start guestfish and set up environment
msg "step2" "Starting guestfish and setting up environment"
eval $(guestfish --listen)
[ -z "$GUESTFISH_PID" ] && { msg "step2" "ERROR: Starting guestfish failed"; exit 1; }

# Step 3: Initialize disk image
fish_init

# Step 4: Partition disk image
msg "step4" "Partitioning disk image"
fish part-init /dev/sda gpt
fish part-add /dev/sda p 2048 300000
fish part-add /dev/sda p 302048 -2048
fish part-set-gpt-type /dev/sda 1 C12A7328-F81F-11D2-BA4B-00A0C93EC93B
fish part-set-bootable /dev/sda 1 true
fish mkfs vfat /dev/sda1 label:EFI
fish mkfs vfat /dev/sda2 label:OpenCore
fish mount /dev/sda2 /
fish mkdir-p /ESP/EFI/OC/{Kexts,ACPI,Resources,Tools}
fish copy-in "$cfg" /ESP/EFI/OC/config.plist
fish copy-in "$WORK/EFI" /ESP

# Final step: Cleanup
fish_fini

# End of script
msg "main" "Script execution completed"
