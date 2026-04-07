export function ciWorkflowTemplate(): string {
  return `name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
`;
}

export function releaseWorkflowTemplate(): string {
  return `name: Release

on:
  push:
    branches:
      - main

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        id: release
        with:
          token: \${{ secrets.GITHUB_TOKEN }}
          config-file: release-please-config.json
          manifest-file: .release-please-manifest.json

      - uses: actions/checkout@v4
        if: \${{ steps.release.outputs.releases_created }}

      - uses: pnpm/action-setup@v4
        if: \${{ steps.release.outputs.releases_created }}
        with:
          version: 10

      - uses: actions/setup-node@v4
        if: \${{ steps.release.outputs.releases_created }}
        with:
          node-version: 22
          registry-url: https://registry.npmjs.org

      - name: Install dependencies
        if: \${{ steps.release.outputs.releases_created }}
        run: pnpm install --frozen-lockfile

      - name: Build
        if: \${{ steps.release.outputs.releases_created }}
        run: pnpm build

      - name: Publish to npm
        if: \${{ steps.release.outputs.releases_created }}
        run: pnpm publish --access public --no-git-checks
        env:
          NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}
`;
}

export function releasePleaseConfigTemplate(): string {
  return JSON.stringify(
    {
      $schema:
        "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
      "release-type": "node",
      packages: { ".": {} },
    },
    null,
    2,
  );
}

export function releasePleaseManifestTemplate(): string {
  return JSON.stringify({ ".": "0.1.0" }, null, 2);
}
