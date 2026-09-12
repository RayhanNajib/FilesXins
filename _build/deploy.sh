#!/usr/bin/env bash
# Deploy a directory to Vercel production using the OAuth token that the
# Vercel MCP connector keeps refreshed on this machine.
#
#   ./_build/deploy.sh                 # deploy the repo root -> project "filesxins"
#   ./_build/deploy.sh site/ummart ummart-demo
#
# Why not `vercel login`: the CLI's interactive login is awkward to drive, and
# the MCP token is already authorised for the FilesXins team. Its access token
# is rotated roughly hourly, so read it fresh on every run instead of caching it.
set -euo pipefail

DIR="${1:-.}"
PROJECT="${2:-filesxins}"
SCOPE="${3:-files-xins}"
TOKEN_FILE="$LOCALAPPDATA/hermes/mcp-tokens/vercel.json"
CLI="$LOCALAPPDATA/Temp/vercelcli/node_modules/.bin/vercel"

[ -x "$CLI" ] || { echo "Vercel CLI missing at $CLI" >&2; exit 1; }
[ -f "$TOKEN_FILE" ] || { echo "Vercel token not found at $TOKEN_FILE" >&2; exit 1; }

export VERCEL_TOKEN
VERCEL_TOKEN=$(python -c "import json,os;print(json.load(open(os.path.expandvars(r'%LOCALAPPDATA%\hermes\mcp-tokens\vercel.json')))['access_token'])")

cd "$DIR"
echo ">> $PROJECT  ($(pwd))"

# link once, then deploy
"$CLI" link --yes --project "$PROJECT" --scope "$SCOPE" >/dev/null 2>&1 || true
"$CLI" deploy --prod --yes --archive=tgz --scope "$SCOPE"
