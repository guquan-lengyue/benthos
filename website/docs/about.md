---
title: 什么是Benthos？
sidebar_label: 简介
hide_title: false
---

<div style={{textAlign: 'center'}}><img src="/img/what-is-blob.svg" /></div>

Benthos 是一种声明性的数据流服务，通过简单、链式、无状态的[处理步骤][docs.processors]来解决各种数据工程问题。它使用[背压策略][backPressure]实现了基于事务的弹性处理，因此当至少有一个数据源和接收器连接时，它不需要将消息持久化就能保证消息至少投递一次。

import ReactPlayer from 'react-player/youtube';

<div className='container margin-vert--lg'>
  <div className='row row--no-gutters'>
    <ReactPlayer
        className='col'
        height='300px'
        url='https://www.youtube.com/embed/88DSzCFV4Ng'
        controls={true}
    />
  </div>
</div>


它[易于部署][docs.guides.getting_started]，而且携带了大量的[连接器](#components)且完全与数据无关，这样你可以轻松地将其用于你现有的业务中。Benthos 具有与集成框架、日志工具和ETL工作流引擎组合的能力，因此可以用于这些传统数据工程工具的补充或者作为这些传统工具的“平替版”。

Benthos准备承诺这份关系了，你呢？

import Link from '@docusaurus/Link';

<Link to="/docs/guides/getting_started" className="button button--lg button--outline button--block button--primary">开始吧</Link>

## 组件

import ComponentsByCategory from '@theme/ComponentsByCategory';

### 输入

<ComponentsByCategory type="inputs"></ComponentsByCategory>

---

### 处理

<ComponentsByCategory type="processors"></ComponentsByCategory>

---

### 输出

<ComponentsByCategory type="outputs"></ComponentsByCategory>

[guides]: /cookbooks
[docs.guides.getting_started]: /docs/guides/getting_started
[docs.processors]: /docs/components/processors/about
[backPressure]: https://developer.baidu.com/article/detail.html?id=3287217
