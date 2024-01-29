git clone --recurse-submodules --depth 1 https://github.com/kholia/OSX-KVM.git
git clone --depth 1 https://github.com/acidanthera/OpenCorePkg.git

make -C ./OpenCorePkg/Utilities/macserial/
    mv ./OpenCorePkg/Utilities/macserial/macserial .
    chmod +x ./macserial
    stat ./macserial

mkdir -p ./resources/OcBinaryData/Resources/

cp -r ./OSX-KVM/resources/OcBinaryData/Resources/ ./resources/OcBinaryData/Resources/