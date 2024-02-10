/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

brew install trunk
brew install libguestfs

cd ~ || exit
git clone https://github.com/libguestfs/libguestfs.git
cd libguestfs || exit
./configure
make
sudo make install
