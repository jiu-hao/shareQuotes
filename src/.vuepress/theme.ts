import { hopeTheme } from "vuepress-theme-hope";

import { zhNavbar } from "./navbar/index.js";
import { zhSidebar } from "./sidebar/index.js";

export default hopeTheme({
  hostname: "https://jiu-hao.github.io",

  author: {
    name: "Roxyy",
    url: "https://jiu-hao.github.io/shareQuotes/",
  },

  logo: "/logo.svg",

  repo: "jiu-hao/shareQuotes",

  docsDir: "src",

  blog: {
    medias: {
      Email: "mailto:dsss_13@163.com",
      GitHub: "https://github.com/jiu-hao",
      QQ: "https://wpa.qq.com/msgrd?v=3&uin=1204254846&site=qq&menu=yes",
      description: "一个前端开发者",
      intro: "/intro.html",
    },
  },

  // 单语言配置
  navbar: zhNavbar,
  sidebar: zhSidebar,
  footer: "Roxyy的博客",
  displayFooter: true,

  metaLocales: {
    editLink: "在 GitHub 上编辑此页",
  },

  // 开启热更新
  hotReload: true,

  markdown: {
    align: true,
    attrs: true,
    codeTabs: true,
    component: true,
    demo: true,
    figure: true,
    gfm: true,
    imgLazyload: true,
    imgSize: true,
    include: true,
    mark: true,
    plantuml: true,
    spoiler: true,
    stylize: [
      {
        matcher: "Recommended",
        replacer: ({ tag }) => {
          if (tag === "em")
            return {
              tag: "Badge",
              attrs: { type: "tip" },
              content: "Recommended",
            };
        },
      },
    ],
    sub: true,
    sup: true,
    tabs: true,
    tasklist: true,
    vPre: true,
  },

  plugins: {
    blog: true,

    components: {
      components: ["Badge", "VPCard"],
    },

    icon: {
      prefix: "fa6-solid:",
    },
  },
});
