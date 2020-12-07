#!/bin/bash

# Exit script as soon as a command fails.
set -o errexit

CURRENT_DIR=`pwd`

build_contracts() {
  echo "Fetching contracts repo..."
  if [[ $contracts_repo == *".git"* ]]
  then
    git clone $contracts_repo --quiet ./build/contracts > /dev/null
  else
    cp -R $contracts_repo ./build/contracts
  fi
  cd build/contracts
  echo "Running yarn in contracts..."
  if [ -z ${TRAVIS+x} ]
  then
    yarn &> ../logs/contracts_yarn.out
  else
    yarn
  fi
  echo "Running yarn build in contracts..."
  if [ -z ${TRAVIS+x} ]
  then
    yarn build &> ../logs/contracts_yarn.out
  else
    yarn build
  fi
  cd - > /dev/null
}

rm -rf build
mkdir build
mkdir build/logs
source abi.config

build_contracts