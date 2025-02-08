#!/bin/bash

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Set Node version
nvm use 20 2>/dev/null || nvm install 20

# Set project specific environment variables
export NODE_ENV=development

# Add any other project-specific initialization here 