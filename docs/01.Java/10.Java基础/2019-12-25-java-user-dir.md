---
title: Java中System.getProperty("user.dir")详解
date: 2019-12-25 19:00:00
permalink: /pages/c35b22/
categories:
  - Java
  - Java基础
tags:
  - Java
  - System属性
  - user.dir
author: 
  name: 吉森
  link: https://github.com/lhing17
description: 深入解析Java中System.getProperty("user.dir")的原理和用法，包括源码分析、系统属性详解和实际应用场景。
---

## 问题引入

```java
String workDirectory = System.getProperty("user.dir");
```

很多同学一定写过或者见过上面的代码。那么大家有没有思考过，"user.dir"到底是什么意思？是系统环境变量？还是用户文件夹？

<!-- more -->

## 源码分析

正所谓"万事不决问源码"，让我们一起到源代码里一探究竟：

```java
public static String getProperty(String key) {
    checkKey(key);
    SecurityManager sm = getSecurityManager();
    if (sm != null) {
        sm.checkPropertyAccess(key);
    }

    return props.getProperty(key);
}

// 本地方法，用于初始化props属性
private static native Properties initProperties(Properties props);
```

从上面源码中我们可以看出，getProperty方法是从System类的一个静态属性props里面获取相应的值，而props属性是通过本地方法initProperties来赋予初值的。也就是说，在JVM启动时通过执行本地方法自动初始化了这个系统属性。

## 系统属性表

好在jdk的文档注释上向我们说明了JVM确保有哪些属性，我们通过下表列出：

| 属性名 | 说明 | 示例值 |
|--------|------|---------|
| java.version | Java版本号 | 11.0.5 |
| java.version.date | Java版本日期 | 2019-10-15 |
| java.vendor | Java供应商标识 | Oracle Corporation |
| java.vendor.url | 供应商URL | http://java.oracle.com/ |
| java.vendor.version | 供应商版本 | 18.9 |
| java.home | Java安装根目录 | /usr/lib/jvm/jdk-11.0.5 |
| java.class.version | Java 类文件版本号 | 55.0 |
| java.class.path | Java 类路径 | 太长，这里省略 |
| os.name | 操作系统名 | Linux |
| os.arch | 操作系统架构 | amd64 |
| os.version | 操作系统版本 | 5.0.0-37-generic |
| file.separator | 文件分隔符 | / |
| path.separator | 路径分隔符 | : |
| line.separator | 换行符 | \n |
| user.name | 用户账号 | lhing |
| user.home | 用户根目录 | /home/lhing |
| user.dir | 用户当前工作目录 | /home/lhing/rd/ |
## 实际应用

上表中的示例值是在我个人电脑上通过测试类输出的结果。我们可以清楚地看到，"user.dir"是指用户当前工作目录。如果你是在IDE中运行项目，这个目录就是你当前项目所在的根目录。

除了"user.dir"外，这里还提供了其他一些有用的属性，比如"java.home"、"user.home"等。JVM（指java虚拟机）保证上表中的属性是有值的，在项目中我们可以放心通过以下方式获取：

```java
String userDir = System.getProperty("user.dir");
String javaHome = System.getProperty("java.home");
String userHome = System.getProperty("user.home");
```

不必担心发生空指针异常。

## 注意事项

我们还可以通过`System.setProperty(propertyName, propertyValue)`的方式去修改这些属性，或者自定义一些新的属性：

```java
// 修改系统属性
System.setProperty("user.dir", "/new/path");

// 自定义属性
System.setProperty("my.custom.property", "custom value");
```

但是，java官方文档中明确提醒我们，修改这些系统属性可能造成不可预料的副作用，通常情况下我们不应该去修改这些属性。

## 总结

System.getProperty方法获取的属性是由JVM加载时初始化的属性，如"user.dir"代表用户当前的工作目录。JVM确保一些指定的属性值存在，我们可以放心调用。