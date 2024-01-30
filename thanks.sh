#!/bin/bash

# ASCII-арт "Hypervisor" с благодарностью
cat << "EOF"
██╗░░██╗██╗░░░██╗██████╗░███████╗██████╗░██╗░░░██╗██╗░██████╗░█████╗░██████╗░
██║░░██║╚██╗░██╔╝██╔══██╗██╔════╝██╔══██╗██║░░░██║██║██╔════╝██╔══██╗██╔══██╗
███████║░╚████╔╝░██████╔╝█████╗░░██████╔╝╚██╗░██╔╝██║╚█████╗░██║░░██║██████╔╝
██╔══██║░░╚██╔╝░░██╔═══╝░██╔══╝░░██╔══██╗░╚████╔╝░██║░╚═══██╗██║░░██║██╔══██╗
██║░░██║░░░██║░░░██║░░░░░███████╗██║░░██║░░╚██╔╝░░██║██████╔╝╚█████╔╝██║░░██║
╚═╝░░╚═╝░░░╚═╝░░░╚═╝░░░░░╚══════╝╚═╝░░╚═╝░░░╚═╝░░░╚═╝╚═════╝░░╚════╝░╚═╝░░╚═╝

EOF


# Color codes for formatting
GREEN='\033[1;32m'
BLUE='\033[1;34m'
PURPLE='\033[1;35m'
NC='\033[0m' # No Color

# Thank you message with color formatting
echo -e "${GREEN}Thank you for the installation!${NC}"

# List of acknowledgments with numbers and authors
echo "1. Main Author:"
echo -e "   ${BLUE}OSX-KVM by kholia${NC}"
echo -e " "
echo "2. Authors and References:"
echo -e "   ${BLUE}macOS-Simple-KVM by foxlet${NC}"
echo -e "   ${BLUE}Docker-OSX by sickcodes${NC}"
echo -e "   ${BLUE}osx-serial-generator by sickcodes${NC}"

# Instructions for running the system
echo -e "\nTo start the system, use ${PURPLE}node web-driver.js${NC} or ${PURPLE}pm2 web-driver.js${NC} or ${PURPLE}./run-server.sh (better)${NC}"

# Usage instructions
echo -e "\n${GREEN}Usage instructions:${NC}"
echo '$ export HOST="localhost:3000"'
echo '$ curl -X POST http://$HOST/api/vms/create -d `{"name": "myVmName", "version": "sonoma"}`'
echo '$ curl -X POST http://$HOST/api/vms/myVmName/stop'
echo '$ curl -X POST http://$HOST/api/vms/myVmName/start'
echo '$ curl -X GET http://$HOST/api/vms/list'