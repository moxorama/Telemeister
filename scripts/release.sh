#!/bin/bash
set -e

VERSION_TYPE=${1:-patch}
PUBLISH=${2:-}

echo "==> Building..."
pnpm run build

echo "==> Bumping version ($VERSION_TYPE)..."
NEW_VERSION=$(node -p "require('./package.json').version")
pnpm version $VERSION_TYPE -m "chore: release v%s"
NEW_VERSION=$(node -p "require('./package.json').version")

echo "==> Pushing commit and tag..."
git push origin HEAD "v$NEW_VERSION"

echo "==> Creating GitHub release..."
gh release create "v$NEW_VERSION" --title "v$NEW_VERSION" --generate-notes

if [ "$PUBLISH" = "--publish" ]; then
  echo "==> Publishing to npm..."
  pnpm publish --access public
  echo "==> Published v$NEW_VERSION to npm"
else
  echo ""
  echo "==> Done! Released v$NEW_VERSION"
  echo "To publish to npm, run: pnpm publish --access public"
fi
