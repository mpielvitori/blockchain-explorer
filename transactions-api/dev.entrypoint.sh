#!/bin/sh

set -eux

npm run lint \
  && npm run startDev
