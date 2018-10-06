#|/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

cd $DIR

cd truffle
npm install

cd ../electron
npm install

echo -e "\n===================\nReady to run!\n"