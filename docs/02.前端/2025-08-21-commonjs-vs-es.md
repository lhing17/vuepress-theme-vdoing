---
title: CommonJS与ES模块：新手完全指南
date: 2025-08-21 20:00:00
permalink: /pages/commonjs-vs-es
sidebar: auto
categories:
  - 前端
  - 技术分享
tags:
  - CommonJS
  - ES模块
  - JavaScript
  - 模块化
author: 
  name: 吉森
  link: https://github.com/lhing17
description: 深入浅出地介绍CommonJS和ES模块的区别，包括历史背景、语法差异、加载机制、实际应用场景和常见问题解决方案，帮助新手开发者全面理解JavaScript模块化。
---

# CommonJS与ES模块：新手完全指南

如果你是JavaScript新手，一定会对代码中时而出现的`require()`，时而出现的`import`感到困惑。为什么JavaScript会有两套不同的模块导入方式？它们有什么区别？什么时候该用哪一个？本文将用最通俗易懂的方式为你解答这些问题。

## 🎯 什么是模块化？

在深入了解CommonJS和ES模块之前，我们先来理解什么是模块化。

想象一下，你在搭建乐高积木。每个积木块都有特定的功能，你可以把它们组合起来创造出复杂的作品。JavaScript的模块化就是这个道理——我们把代码分割成一个个独立的"积木块"（模块），每个模块负责特定的功能，然后通过导入导出的方式把它们组合起来。

### 模块化的好处

- **代码复用**：写一次，到处使用
- **维护性**：每个模块职责单一，容易维护
- **协作开发**：团队成员可以并行开发不同模块
- **避免命名冲突**：每个模块有自己的作用域

## 📚 历史背景：为什么会有两套规范？

### JavaScript的模块化之路

在很久很久以前（大约2009年之前），JavaScript是没有官方模块系统的。开发者只能通过全局变量或者立即执行函数表达式来组织代码（如果你写过jquery，一定印象深刻），但是这也带来了很多问题。

```js
// 古老的方式：全局变量（容易冲突）
var myLibrary = {
  add: function(a, b) {
    return a + b;
  }
};

// 或者使用IIFE（立即执行函数表达式）组织代码（写法复杂）
(function() {
  var privateVar = 'secret';
  window.myLibrary = {
    add: function(a, b) {
      return a + b;
    }
  };
})();
```

### CommonJS的诞生（2009年）

2009年，Node.js诞生了。Node.js需要在服务器端运行JavaScript，而服务器端需要一个模块系统来组织代码。于是，Node.js建立并采用了CommonJS规范。

**CommonJS的设计理念**：
- 专为服务器端设计
- 同步加载模块（因为服务器端文件都在本地）
- 简单直观的语法

### ES模块的出现（2015年）

2015年，ECMAScript 2015（ES6）正式引入了官方的模块系统——ES模块（ESM）。这是JavaScript语言层面的标准，不再依赖于特定的运行环境（即浏览器或Node.js中都可以执行）。

**ES模块的设计理念**：
- 语言层面的标准
- 支持静态分析（编译时就能确定依赖关系）
- 异步加载（适合浏览器环境）
- 更好的Tree Shaking支持

## 🔍 基础语法对比

让我们通过实际例子来看看两种模块系统的语法差异。

### CommonJS语法

```js
// math.js - 导出模块
function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

// 方式1：逐个导出
exports.add = add;
exports.subtract = subtract;

// 方式2：整体导出
module.exports = {
  add,
  subtract
};

// 方式3：导出单个函数
module.exports = add;
```

```js
// main.js - 导入模块
const math = require('./math'); // 导入整个模块
const { add, subtract } = require('./math'); // 解构导入
const add = require('./math'); // 如果模块只导出一个函数

console.log(math.add(2, 3)); // 5
console.log(add(2, 3)); // 5
```

### ES模块语法

```js
// math.js - 导出模块
function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

// 方式1：命名导出
export { add, subtract };

// 方式2：直接导出
export function multiply(a, b) {
  return a * b;
}

// 方式3：默认导出
export default function divide(a, b) {
  return a / b;
}

// 方式4：混合导出
export { add, subtract };
export default divide;
```

```js
// main.js - 导入模块
import { add, subtract } from './math.js'; // 命名导入
import divide from './math.js'; // 默认导入
import divide, { add, subtract } from './math.js'; // 混合导入
import * as math from './math.js'; // 导入所有

console.log(add(2, 3)); // 5
console.log(divide(10, 2)); // 5
console.log(math.add(2, 3)); // 5
```

## ⚡ 核心差异详解

CommonJS和ES模块不仅仅是语法上的差异，它们就像大黄蜂和蜜蜂一样，长的很像，但是原理却完全不同。下面，将简要介绍二者的差异：

### 1. 加载机制

**CommonJS：同步加载**
```js
console.log('开始');
const math = require('./math'); // 这里会阻塞，直到模块加载完成
console.log('模块加载完成');
math.add(1, 2);
```

**ES模块：异步加载**
```js
console.log('开始');
import { add } from './math.js'; // 这里不会阻塞
console.log('继续执行');
// 模块会在后台异步加载
```

### 2. 导出值的性质

**CommonJS：导出的是值的拷贝**
```js
// counter.js
let count = 0;
function increment() {
  count++;
}
module.exports = { count, increment };

// main.js
const { count, increment } = require('./counter');
console.log(count); // 0
increment();
console.log(count); // 还是0！因为count是拷贝的值
```

**ES模块：导出的是值的引用**
```js
// counter.js
let count = 0;
export function increment() {
  count++;
}
export { count };

// main.js
import { count, increment } from './counter.js';
console.log(count); // 0
increment();
console.log(count); // 1！因为count是引用
```

### 3. 循环依赖处理

**CommonJS：可能导致部分加载**
```js
// a.js
const b = require('./b');
console.log('a.js:', b.name);
module.exports = { name: 'module-a' };

// b.js
const a = require('./a'); // 这时a.js还没执行完
console.log('b.js:', a.name); // undefined
module.exports = { name: 'module-b' };
```

**ES模块：更好的循环依赖处理**
```js
// a.js
import { name as bName } from './b.js';
console.log('a.js:', bName);
export const name = 'module-a';

// b.js
import { name as aName } from './a.js';
console.log('b.js:', aName); // 可以正确获取到值
export const name = 'module-b';
```

## 📁 文件扩展名：.js、.cjs、.mjs

这是很多新手困惑的地方。让我们来理清楚：

### .js文件
- **在Node.js中**：默认被当作CommonJS模块
- **在浏览器中**：需要通过`<script type="module">`来使用ES模块
- **在package.json中设置`"type": "module"`**：.js文件会被当作ES模块

### .cjs文件
- **明确表示**：这是一个CommonJS模块
- **无论package.json如何设置**：始终使用CommonJS语法

### .mjs文件
- **明确表示**：这是一个ES模块
- **无论package.json如何设置**：始终使用ES模块语法

### 实际例子

```json
// package.json
{
  "type": "module"
}
```

```js
// math.js - 现在被当作ES模块
export function add(a, b) {
  return a + b;
}

// utils.cjs - 明确指定为CommonJS
function helper() {
  return 'helper';
}
module.exports = { helper };

// main.mjs - 明确指定为ES模块
import { add } from './math.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { helper } = require('./utils.cjs');
```

## 🌍 使用场景

### 什么时候使用CommonJS？

1. **Node.js服务器端项目**
```js
// 典型的Node.js应用
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
// ...
```

2. **需要动态导入**
```js
// 根据条件动态加载模块
const moduleName = process.env.NODE_ENV === 'production' ? './prod' : './dev';
const config = require(moduleName);
```

3. **与旧项目兼容**
```js
// 大量现有的npm包仍然使用CommonJS
const lodash = require('lodash');
const moment = require('moment');
```

### 什么时候使用ES模块？

1. **现代前端项目**
```js
// React项目
import React from 'react';
import { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}

export default App;
```

2. **需要Tree Shaking**
```js
// 只导入需要的函数，减少打包体积
import { debounce } from 'lodash-es';
import { format } from 'date-fns';
```

3. **现代Node.js项目**
```js
// package.json中设置"type": "module"
import express from 'express';
import { readFile } from 'fs/promises';

const app = express();
```

## 🔧 常见问题与解决方案

### 问题1：Cannot use import statement outside a module

**错误示例**：
```js
// main.js
import { add } from './math.js'; // 报错！
```

**解决方案**：
```json
// package.json
{
  "type": "module"
}
```

或者使用.mjs扩展名：
```js
// main.mjs
import { add } from './math.js'; // 正确！
```

### 问题2：require is not defined

**错误示例**：
```js
// 在ES模块中使用require
const fs = require('fs'); // 报错！
```

**解决方案**：
```js
// 方法1：使用ES模块语法
import fs from 'fs';

// 方法2：创建require函数
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fs = require('fs');
```

### 问题3：混合使用CommonJS和ES模块

**在ES模块中导入CommonJS**：
```js
// commonjs-module.cjs
module.exports = { name: 'CommonJS Module' };

// es-module.mjs
import cjsModule from './commonjs-module.cjs'; // 正确！
console.log(cjsModule.name);
```

**在CommonJS中导入ES模块**：
```js
// es-module.mjs
export const name = 'ES Module';

// commonjs-module.cjs
// const esModule = require('./es-module.mjs'); // 错误！

// 正确的方式：使用动态import
(async () => {
  const esModule = await import('./es-module.mjs');
  console.log(esModule.name);
})();
```

### 问题4：__dirname和__filename在ES模块中不可用

**解决方案**：
```js
// ES模块中获取当前文件路径
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(__dirname);
console.log(__filename);
```

## 🎯 总结与建议

### 核心要点回顾

1. **CommonJS**：Node.js的传统模块系统，同步加载，适合服务器端
2. **ES模块**：JavaScript的官方标准，异步加载，适合现代开发
3. **文件扩展名**：.cjs明确表示CommonJS，.mjs明确表示ES模块
4. **互操作性**：ES模块可以导入CommonJS，反之需要使用动态import

### 新手建议

1. **新项目优先选择ES模块**：这是未来的趋势
2. **学会两种语法**：现实中你会遇到两种模块系统
3. **理解加载机制**：这有助于理解性能和行为差异
4. **掌握互操作**：知道如何在两种系统间转换

### 选择指南

| 场景 | 推荐 | 原因 |
|------|------|------|
| 新的前端项目 | ES模块 | 现代标准，工具链支持好 |
| 新的Node.js项目 | ES模块 | 面向未来，功能更强大 |
| 维护旧项目 | 保持现状 | 避免不必要的迁移成本 |
| 发布npm包 | 双格式 | 最大化兼容性 |
| 学习阶段 | 两者都学 | 理解差异，应对各种场景 |

记住，模块化的目标是让代码更好维护、更易复用。无论选择哪种方式，保持代码的清晰和一致性才是最重要的！

---

希望这篇文章能帮助你理解CommonJS和ES模块的区别。如果你还有疑问，欢迎在评论区讨论！
