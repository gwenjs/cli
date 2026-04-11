import { toPascalCase, toPackageName } from "./base.js";
import { textTemplate, type GeneratedTemplate } from "./render.js";

/**
 * Generates the VitePress configuration file.
 *
 * @param name - The package name in kebab-case.
 * @param scope - Optional npm scope without `@`
 */
export function vitepressConfigTemplate(name: string, scope?: string): string {
  const Pascal = toPascalCase(name);
  const pkg = toPackageName(name, scope);
  return `import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '${Pascal}',
  description: '${Pascal} — GWEN plugin',

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
      { text: 'Examples', link: '/examples/' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
        ],
      },
      {
        text: 'API',
        items: [
          { text: 'Reference', link: '/api/' },
        ],
      },
      {
        text: 'Examples',
        items: [
          { text: 'Basic Usage', link: '/examples/' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/YOUR_ORG/${name}' },
    ],
  },
})
`;
}

/**
 * Generates the docs index page.
 *
 * @param name - The package name in kebab-case.
 * @param scope - Optional npm scope without `@`
 */
export function docsIndexTemplate(name: string, scope?: string): GeneratedTemplate {
  const Pascal = toPascalCase(name);
  const pkg = toPackageName(name, scope);
  return textTemplate(`---
layout: home

hero:
  name: "${Pascal}"
  text: "GWEN plugin ${pkg}"
  tagline: A plugin for the GWEN game engine
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: API Reference
      link: /api/

features:
  - title: Easy Integration
    details: Drop-in plugin for any GWEN project.
  - title: Typed API
    details: Full TypeScript support with declaration merging.
  - title: Tree-shakeable
    details: Only pay for what you use.
---
`);
}

/**
 * Generates the getting started documentation page.
 *
 * @param name - The package name in kebab-case.
 * @param scope - Optional npm scope without `@`
 */
export function docsGettingStartedTemplate(name: string, scope?: string): GeneratedTemplate {
  const Pascal = toPascalCase(name);
  const pkg = toPackageName(name, scope);
  return textTemplate(`# Getting Started

## Installation

\`\`\`bash
pnpm add ${pkg}
\`\`\`

## Setup

Register the module in your \`gwen.config.ts\`:

\`\`\`typescript
import { defineConfig } from '@gwenjs/core'

export default defineConfig({
  modules: ['${pkg}'],
})
\`\`\`

## Usage

Use the composable in your game code:

\`\`\`typescript
import { use${Pascal} } from '${pkg}'

const ${name} = use${Pascal}()
\`\`\`
`);
}

/**
 * Generates the API reference documentation page.
 *
 * @param name - The package name in kebab-case.
 * @param scope - Optional npm scope without `@`
 */
export function docsApiTemplate(name: string, scope?: string): GeneratedTemplate {
  const Pascal = toPascalCase(name);
  const pkg = toPackageName(name, scope);
  return textTemplate(`# API Reference

## \`use${Pascal}()\`

Returns the \`${Pascal}Service\` instance registered by \`${Pascal}Plugin\`.

\`\`\`typescript
import { use${Pascal} } from '${pkg}'

const ${name} = use${Pascal}()
\`\`\`

**Throws** \`GwenPluginNotFoundError\` if \`${Pascal}Plugin\` is not registered.

## \`${Pascal}Config\`

Configuration options passed to the plugin.

\`\`\`typescript
interface ${Pascal}Config {
  // Add your options here
}
\`\`\`

## \`${Pascal}Service\`

Runtime service provided by the plugin.

\`\`\`typescript
interface ${Pascal}Service {
  // Add your methods here
}
\`\`\`
`);
}

/**
 * Generates the examples documentation page.
 *
 * @param name - The package name in kebab-case.
 * @param scope - Optional npm scope without `@`
 */
export function docsExamplesTemplate(name: string, scope?: string): GeneratedTemplate {
  const Pascal = toPascalCase(name);
  const pkg = toPackageName(name, scope);
  return textTemplate(`# Examples

## Basic Usage

\`\`\`typescript
import { use${Pascal} } from '${pkg}'

// Inside a GWEN system or composable
const ${name} = use${Pascal}()
\`\`\`

## With Custom Config

\`\`\`typescript
// gwen.config.ts
export default defineConfig({
  modules: [
    ['${pkg}', {
      // your options
    }],
  ],
})
\`\`\`
`);
}

/**
 * Generates the deploy docs to GitHub Pages workflow file.
 */
export function deployDocsWorkflowTemplate(): GeneratedTemplate {
  return textTemplate(`name: Deploy Docs to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
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
      - name: Build docs
        run: pnpm docs:build
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist

  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`);
}
