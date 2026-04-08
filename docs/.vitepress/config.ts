import { defineConfig } from "vitepress";

function commandsSidebar(base: string, labels: { section: string; overview: string }) {
  return [
    {
      text: labels.section,
      items: [
        { text: labels.overview, link: `${base}/commands/` },
        { text: "init", link: `${base}/commands/init` },
        { text: "dev", link: `${base}/commands/dev` },
        { text: "build", link: `${base}/commands/build` },
        { text: "prepare", link: `${base}/commands/prepare` },
        { text: "preview", link: `${base}/commands/preview` },
        { text: "add", link: `${base}/commands/add` },
        { text: "scaffold", link: `${base}/commands/scaffold` },
        { text: "lint", link: `${base}/commands/lint` },
        { text: "format", link: `${base}/commands/format` },
        { text: "info", link: `${base}/commands/info` },
        { text: "doctor", link: `${base}/commands/doctor` },
      ],
    },
  ];
}

export default defineConfig({
  title: "GWEN CLI",
  description: "GWEN Game Engine — Command Line Interface Reference",
  base: "/cli/",

  locales: {
    root: {
      label: "English",
      lang: "en-US",
      themeConfig: {
        nav: [{ text: "Commands", link: "/commands/" }],
        sidebar: {
          "/commands/": commandsSidebar("", { section: "Commands", overview: "Overview" }),
        },
      },
    },
    fr: {
      label: "Français",
      lang: "fr-FR",
      themeConfig: {
        nav: [{ text: "Commandes", link: "/fr/commands/" }],
        sidebar: {
          "/fr/commands/": commandsSidebar("/fr", {
            section: "Commandes",
            overview: "Vue d'ensemble",
          }),
        },
      },
    },
  },

  themeConfig: {
    socialLinks: [{ icon: "github", link: "https://github.com/gwenjs/cli" }],
    search: { provider: "local" },
  },
});
