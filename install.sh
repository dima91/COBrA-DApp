#|/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

cd $DIR

echo -e "\n===============================\nInstalling truffle framework...\n"
sleep 1
cd truffle
npm install

echo -e "\n================================\nInstalling electron framework...\n"
sleep 1
cd ../electron
npm install
npm run rebuild

echo -e "\n===================\nReady to run!\n"