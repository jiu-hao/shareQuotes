---
icon: pen-to-square
date: 2025-08-13
category:
  - 前端开发
tag:
  - JavaScript
  - 模块化
  - npm
---

# import 和 require 的区别

## 模块规范

import 是 ES6 规范，应用于 JS 开发和现代浏览器

require 是 CommonJS 模块规范，主要应用于 Node.js 环境

## 编译规则

require 执行时会把导入的模块进行缓存，下次再调用会返回同一个实例，默认是同步的，但是在 Webpack 中能异步加载

import 默认是静态编译的，有引用提升置顶效果，通过 `import()` 动态引入是异步的，执行返回一个 Promise

## 基本用法

require 一般不直接用于前端框架，是用于 Node.js 环境和一些前端构建工具（Webpack），导入模块(第三方库)，导入本地写好的模块

import 一般应用于浏览器和各种主流前端框架，有静态引入和动态引入

## 性能对比

ES6 支持 Tree Shaking 摇树优化，能减小打包体积，import 性能更好，且 `import()` 动态导入模块性能也更好，而 require 不支持动态导入
