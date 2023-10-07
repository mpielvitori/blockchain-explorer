#!/bin/sh

set -eux

npm run lint \
  && npm run test \
  && npm run startDev
