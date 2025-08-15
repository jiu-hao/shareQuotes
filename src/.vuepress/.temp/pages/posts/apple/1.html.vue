<template><div><h1 id="import-和-require-的区别" tabindex="-1"><a class="header-anchor" href="#import-和-require-的区别"><span>import 和 require 的区别：</span></a></h1>
<h2 id="模块规范" tabindex="-1"><a class="header-anchor" href="#模块规范"><span>模块规范：</span></a></h2>
<p>import 是 ES6 规范，应用于 JS 开发和现代浏览器<br>
require 是 CommonJS 模块规范，主要应用于 Node.js 环境</p>
<h2 id="编译规则" tabindex="-1"><a class="header-anchor" href="#编译规则"><span>编译规则：</span></a></h2>
<p>require 执行时会把导入的模块进行缓存，下次再调用会返回同一个实例，默认时同步的，但是在微博 pack 中能异步加载；<br>
import 默认是静态编译的，有引用提升置顶效果，通过 import()动态引入是异步的，执行返回一个 Promise</p>
<h2 id="基本用法" tabindex="-1"><a class="header-anchor" href="#基本用法"><span>基本用法：</span></a></h2>
<p>require 一般不直接用于前端框架，是用于 Node.js 环境和一些前端构建工具（Webpack），导入模块(第三方库)，导入本地写好的模块<br>
import 一般应用于浏览器和各种主流前端框架，有静态引入和动态引入</p>
<h2 id="性能对比" tabindex="-1"><a class="header-anchor" href="#性能对比"><span>性能对比：</span></a></h2>
<p>ES6 支持 Tree Shaking 摇树优化，能减小打包体积，import 性能更好，且 import() 动态导入模块性能也更好，而 require 不支持动态导入</p>
</div></template>


