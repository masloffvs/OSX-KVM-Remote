#!/bin/bash
#   ___  _____  __  ___          _      _    ___                       _           
#  / _ \/ __\ \/ / / __| ___ _ _(_)__ _| |  / __|___ _ _  ___ _ _ __ _| |_ ___ _ _ 
# | (_) \__ \>  <  \__ \/ -_) '_| / _` | | | (_ / -_) ' \/ -_) '_/ _` |  _/ _ \ '_|
#  \___/|___/_/\_\ |___/\___|_| |_\__,_|_|  \___\___|_||_\___|_| \__,_|\__\___/_|  
#
# Repo:             https://github.com/sickcodes/osx-serial-generator/
# Title:            OSX Serial Generator
# Author:           Sick.Codes https://sick.codes/
# Version:          3.1
# License:          GPLv3+

set -e

OPENCORE_IMAGE_MAKER_URL='https://raw.githubusercontent.com/sickcodes/osx-serial-generator/master/opencore-image-ng.sh'
MASTER_PLIST_URL='https://raw.githubusercontent.com/sickcodes/osx-serial-generator/master/config-nopicker-custom.plist'

download_qcow_efi_folder () {

    export EFI_FOLDER=./OpenCore/EFI

    # check if we are inside OSX-KVM already
    # if not, download OSX-KVM locally
    [ -d ./OpenCore/EFI/ ] || {
        [ -d ./OSX-KVM/ ] || git clone --recurse-submodules --depth 1 https://github.com/kholia/OSX-KVM.git
        export EFI_FOLDER="./OSX-KVM/${EFI_FOLDER}"
    }
    
   export RESOURCES_FOLDER="./OSX-KVM/resources/OcBinaryData/Resources"

    # EFI Shell commands
    touch startup.nsh && echo 'fs0:\EFI\BOOT\BOOTx64.efi' > startup.nsh

    cp -a "${EFI_FOLDER}" .

    mkdir -p ./EFI/OC/Resources

    # copy Apple drivers into EFI/OC/Resources
    cp -a "${RESOURCES_FOLDER}"/* ./EFI/OC/Resources
}

generate_bootdisk () {

    # need a config.plist
    if [ "${MASTER_PLIST}" ]; then
        [ -e "${MASTER_PLIST}" ] || echo "Could not find: ${MASTER_PLIST}"
    elif [ "${MASTER_PLIST}" ] && [ "${MASTER_PLIST_URL}" ]; then
        echo 'You specified both a custom plist FILE & custom plist URL.'
        echo 'Use only one of those options.'
    elif [ "${MASTER_PLIST_URL}" ]; then
        curl -L -o "${MASTER_PLIST:=./config-custom.plist}" "${MASTER_PLIST_URL}"
    else
        # default is config-nopicker-custom.plist from OSX-KVM with placeholders used in Docker-OSX
        curl -L -o "${MASTER_PLIST:=./config-nopicker-custom.plist}" "${MASTER_PLIST_URL}"
    fi

    [ -e ./opencore-image-ng.sh ] \
        || { curl -OL "${OPENCORE_IMAGE_MAKER_URL}" \
            && chmod +x opencore-image-ng.sh ; }

    # plist required for bootdisks, so create anyway.
    if [ "${DEVICE_MODEL}" ] \
            && [ "${SERIAL}" ] \
            && [ "${BOARD_SERIAL}" ] \
            && [ "${UUID}" ] \
            && [ "${MAC_ADDRESS}" ]; then
        ROM="${MAC_ADDRESS//\:/}"
        ROM="$(awk '{print tolower($0)}' <<< "${ROM}")"
        sed -e s/\{\{DEVICE_MODEL\}\}/"${DEVICE_MODEL}"/g \
            -e s/\{\{SERIAL\}\}/"${SERIAL}"/g \
            -e s/\{\{BOARD_SERIAL\}\}/"${BOARD_SERIAL}"/g \
            -e s/\{\{UUID\}\}/"${UUID}"/g \
            -e s/\{\{ROM\}\}/"${ROM}"/g \
            -e s/\{\{WIDTH\}\}/"${WIDTH:-1920}"/g \
            -e s/\{\{HEIGHT\}\}/"${HEIGHT:-1080}"/g \
            -e s/\{\{KERNEL_ARGS\}\}/"${KERNEL_ARGS:-}"/g \
            "${MASTER_PLIST}" > ./tmp.config.plist || exit 1
    else
        cat <<EOF && exit 1
Error: one of the following values is missing:

--model "${DEVICE_MODEL:-MISSING}"
--serial "${SERIAL:-MISSING}"
--board-serial "${BOARD_SERIAL:-MISSING}"
--uuid "${UUID:-MISSING}"
--mac-address "${MAC_ADDRESS:-MISSING}"

Optional:

--width "${WIDTH:-1920}"
--height "${HEIGHT:-1080}"
--kernel-args "${KERNEL_ARGS:-}"

EOF
    fi

    ./opencore-image-ng.sh \
        --cfg "./tmp.config.plist" \
        --img "${OUTPUT_QCOW:-./${SERIAL}.OpenCore-nopicker.qcow2}" || exit 1
        rm ./tmp.config.plist

}

main () {
    download_qcow_efi_folder
    generate_bootdisk
}

main

