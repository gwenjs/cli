import { textTemplate, type GeneratedTemplate } from "./render.js";

export function ciWorkflowTemplate(): GeneratedTemplate {
  return textTemplate(`name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    name: Lint & Format
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v5
        with:
          version: 10
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: pnpm
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm format:check

  typescript:
    name: TypeScript
    runs-on: ubuntu-latest
    needs: [lint]
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v5
        with:
          version: 10
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: pnpm
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Lint
        run: pnpm lint
      - name: Format check
        run: pnpm format:check
      - name: Build
        run: pnpm build
      - name: Typecheck
        run: pnpm typecheck
      - name: Test
        run: pnpm test

  ci-status:
    name: CI Status
    runs-on: ubuntu-latest
    needs: [lint, typescript]
    if: always()
    steps:
      - name: Check all jobs
        run: |
          if [ "\${{ needs.lint.result }}"       != "success" ] || \\
             [ "\${{ needs.typescript.result }}" != "success" ]; then
            echo "❌ CI failed"
            exit 1
          fi
          echo "✅ All checks passed"
`);
}

export function releaseWorkflowTemplate(): GeneratedTemplate {
  return textTemplate(`name: Release

on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]
    branches: [main]

jobs:
  release-please:
    name: Release Please
    runs-on: ubuntu-latest
    if: github.event.workflow_run.conclusion == 'success'
    permissions:
      contents: write
      pull-requests: write
    outputs:
      releases_created: \${{ steps.release.outputs.releases_created }}
    steps:
      - uses: googleapis/release-please-action@v4
        id: release
        with:
          token: \${{ secrets.RELEASE_PLEASE_TOKEN }}
          config-file: release-please-config.json
          manifest-file: .release-please-manifest.json

  publish:
    name: Publish to npm
    runs-on: ubuntu-latest
    needs: [release-please]
    if: needs.release-please.outputs.releases_created == 'true'
    permissions:
      actions: read
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v6
        with:
          ref: \${{ github.event.workflow_run.head_sha }}
      - uses: pnpm/action-setup@v5
        with:
          version: 10
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: pnpm
          registry-url: 'https://registry.npmjs.org'
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Build
        run: pnpm build
      - name: Publish to npm
        env:
          NPM_TOKEN: \${{ secrets.NPM_TOKEN }}
        run: pnpm publish --access public --no-git-checks --provenance
`);
}

export function releasePleaseConfigTemplate(): GeneratedTemplate {
  return textTemplate(
    JSON.stringify(
      {
        $schema:
          "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
        "release-type": "node",
        packages: { ".": {} },
      },
      null,
      2,
    ),
  );
}

export function releasePleaseManifestTemplate(): GeneratedTemplate {
  return textTemplate(JSON.stringify({ ".": "0.1.0" }, null, 2));
}
