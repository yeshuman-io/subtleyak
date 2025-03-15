#!/bin/sh

# Write environment variables to .env file
cat <<EOF > .env
DATABASE_URL=${DATABASE_URL}
REDIS_URL=${REDIS_URL}
JWT_SECRET=${JWT_SECRET}
COOKIE_SECRET=${COOKIE_SECRET}
PORT=${PORT:-9000}  # Default to 9000 if PORT is not set
EOF

# Pass all arguments to pnpm
exec pnpm "$@"
