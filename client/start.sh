#!/usr/bin/env sh

set -e

# rm -f ../shared/@env/*.js ../shared/@env/*.js.map
ENV=local NODE_PATH=../shared tsc ../shared/@env/*.ts --baseUrl ../shared
ENV=local NODE_PATH=source/js:../shared concurrently "webpack" "gulp"
