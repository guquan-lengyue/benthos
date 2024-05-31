---
title: 配置
sidebar_label: 简介
description: 学习Benthos的配置
---

Benthos的管道配置是使用YAML文件配置的, 其中有若干根节点, 如下所示

import Tabs from '@theme/Tabs';

<Tabs defaultValue="common" values={[
  { label: 'Common', value: 'common', },
  { label: 'Full', value: 'full', },
]}>

import TabItem from '@theme/TabItem';

<TabItem value="common">

```yaml
input:
  kafka:
    addresses: [ TODO ]
    topics: [ foo, bar ]
    consumer_group: foogroup

pipeline:
  processors:
  - mapping: |
      root.message = this
      root.meta.link_count = this.links.length()

output:
  aws_s3:
    bucket: TODO
    path: '${! meta("kafka_topic") }/${! json("message.id") }.json'
```

</TabItem>
<TabItem value="full">

```yaml
http:
  address: 0.0.0.0:4195
  debug_endpoints: false

input:
  kafka:
    addresses: [ TODO ]
    topics: [ foo, bar ]
    consumer_group: foogroup

buffer:
  none: {}

pipeline:
  processors:
  - mapping: |
      root.message = this
      root.meta.link_count = this.links.length()

output:
  aws_s3:
    bucket: TODO
    path: '${! meta("kafka_topic") }/${! json("message.id") }.json'

input_resources: []
cache_resources: []
processor_resources: []
rate_limit_resources: []
output_resources: []

logger:
  level: INFO
  static_fields:
    '@service': benthos

metrics:
  prometheus: {}

tracer:
  none: {}

shutdown_timeout: 20s
shutdown_delay: ""
```

</TabItem>

</Tabs>

大多数语句都代表着个一组件, 你可以在[这个文档][components]中了解更多

这些类型是分层的。 例如，一个`input`可以有多个子`processor`，这些`processor`也可以有他们自己的`processor`。

这很强大，但是会导致庞大而繁琐的配置文件，这个文档概述了Benthos提供的工具，以用于辅助编写和管理复杂的配置文件。
### 测试

如何为你的配置文件编写测试用例并测试，你可以阅读这个[教程][config.testing]

## 自定义你的配置

有时候，在部署期间定义某些字段的配置非常有用。为此，Benthos提供了[环境变量差值][config-interp]，可以让你通过环境变量来设置你配置文件的字段值。如下：


```yaml
input:
  kafka:
    addresses:
    - ${KAFKA_BROKER:localhost:9092}
    topics:
    - ${KAFKA_TOPIC:default-topic}
```

这可以让你很方便的在不同的环境中使用相同的配置文件。

## 复用配置片段

有些时候需要重复的同一个很大的组件若干次。为了不代替复制粘贴复用配置，你可以定义自己的组件作为[resource][config.resources]。

在下面这个例子中，我们使用我们的内容来构造一个HTTP请求。 偶尔，因为我们的内容存在垃圾数据会被拒绝访问，因此我们需要捕捉这些被拒绝的请求，然后尝试清空内容并重新请求一次。由于HTTP请求组件相当庞大（而且会随着时间改变）我们将其定义为`get_foo`的`resource`以避免重复。

```yaml
pipeline:
  processors:
    - resource: get_foo
    - catch:
      - mapping: |
          root = this
          root.content = this.content.strip_html()
      - resource: get_foo

processor_resources:
  - label: get_foo
    http:
      url: http://example.com/foo
      verb: POST
      headers:
        SomeThing: "set-to-this"
        SomeThingElse: "set-to-something-else"
```

### 功能切换

`resource` 通过不同的文件导入到你的配置文件中，只需使用cli参数`-r`或`-resources`。 在你需要区分不同环境中切换不同的`resource`但是其名字是相同的时候非常有用。举个例子，在主配置文件`config.yaml`中：
```yaml
pipeline:
  processors:
    - resource: get_foo
```

然后分别有两个`resource`文件，一个存放在路径`./staging/request.yaml`:
```yaml
processor_resources:
  - label: get_foo
    http:
      url: http://example.com/foo
      verb: POST
      headers:
        SomeThing: "set-to-this"
        SomeThingElse: "set-to-something-else"
```

一个存放在路径 `./production/request.yaml`:

```yaml
processor_resources:
  - label: get_foo
    http:
      url: http://example.com/bar
      verb: PUT
      headers:
        Desires: "are-empty"
```

我们可以通过选择导入不同的文件来更改不同的`resource`，运行命令：

```sh
benthos -r ./staging/request.yaml -c ./config.yaml
```

或:

```sh
benthos -r ./production/request.yaml -c ./config.yaml
```
这个cli参数是支持通配符的，你可以导入一整个文件夹的`resource`只要使用以下命令
```sh
benthos -r "./staging/*.yaml" -c ./config.yaml
```
你可以在[resource文档][config.resources]中查找更多关于配置`resource`的知识。
### 模板

`resource`只能试一个配置的实例化, 这意味这它没法通过参数来适应不同情况的配置。emmm。。。

但是, 冷静一下伙计。Benthos有这个功能（目前处于实验阶段），叫做模板。在这个功能中，可以定义自定义配置模式和用于从该模式构建配置的模板。你可以在这个[教程][config.templating]中获取更多的关于模板的知识。

## Reloading

It's possible to have a running instance of Benthos reload configurations, including resource files imported with `-r`/`--resources`, automatically when the files are updated without needing to manually restart the service. This is done by specifying the `-w`/`--watcher` flag when running Benthos in normal mode or in streams mode:

```sh
# Normal mode
benthos -w -r ./production/request.yaml -c ./config.yaml
```

```sh
# Streams mode
benthos -w -r ./production/request.yaml streams ./stream_configs/*.yaml
```

If a file update results in configuration parsing or linting errors then the change is ignored (with logs informing you of the problem) and the previous configuration will continue to be run (until the issues are fixed).

## Enabling Discovery

The discoverability of configuration fields is a common headache with any configuration driven application. The classic solution is to provide curated documentation that is often hosted on a dedicated site.

However, a user often only needs to get their hands on a short, runnable example config file for their use case. They just need to see the format and field names as the fields themselves are usually self explanatory. Forcing such a user to navigate a website, scrolling through paragraphs of text, seems inefficient when all they actually needed to see was something like:

```yaml
input:
  amqp_0_9:
    urls: [ amqp://guest:guest@localhost:5672/ ]
    consumer_tag: benthos-consumer
    queue: benthos-queue
    prefetch_count: 10
    prefetch_size: 0
output:
  stdout: {}
```

In order to make this process easier Benthos is able to generate usable configuration examples for any types, and you can do this from the binary using the `create` subcommand.

If, for example, we wanted to generate a config with a websocket input, a Kafka output and a [`mapping` processor][processors.mapping] in the middle, we could do it with the following command:

```text
benthos create websocket/mapping/kafka
```

> If you need a gentle reminder as to which components Benthos offers you can see those as well with `benthos list`.

All of these generated configuration examples also include other useful config sections such as `metrics`, `logging`, etc with sensible defaults.

For more information read the output from `benthos create --help`.

## Help With Debugging

Once you have a config written you now move onto the next headache of proving that it works, and understanding why it doesn't. Benthos, like most good config driven services, performs validation on configs and tries to provide sensible error messages.

However, with validation it can be hard to capture all problems, and the user usually understands their intentions better than the service. In order to help expose and diagnose config errors Benthos provides two mechanisms, linting and echoing.

### Linting

If you attempt to run a config that has linting errors Benthos will print the errors and halt execution. If, however, you want to test your configs before deployment you can do so with the `lint` subcommand:

For example, imagine we have a config `foo.yaml`, where we intend to read from AMQP, but there is a typo in our config struct:

```text
input:
  amqp_0_9:
    yourl: amqp://guest:guest@rabbitmqserver:5672/
```

We can catch this error before attempting to run the config:

```sh
$ benthos lint ./foo.yaml
./foo.yaml: line 3: field yourl not recognised
```

For more information read the output from `benthos lint --help`.

### Echoing

Echoing is where Benthos can print back your configuration _after_ it has been parsed. It is done with the `echo` subcommand, which is able to show you a normalised version of your config, allowing you to see how it was interpreted:

```sh
benthos -c ./your-config.yaml echo
```

You can check the output of the above command to see if certain sections are missing or fields are incorrect, which allows you to pinpoint typos in the config.

## Shutting down

Under normal operating conditions, the Benthos process will shut down when there are no more messages produced by inputs and the final message has been processed. The shutdown procedure can also be initiated by sending the process a interrupt (`SIGINT`) or termination (`SIGTERM`) signal. There are two top-level configuration options that control the shutdown behaviour: `shutdown_timeout` and `shutdown_delay`.

### Shutdown delay

The `shutdown_delay` option can be used to delay the start of the shutdown procedure. This is useful for pipelines that need a short grace period to have their metrics and traces scraped. While the shutdown delay is in effect, the HTTP metrics endpoint continues to be available for scraping and any active tracers are free to flush remaining traces.

The shutdown delay can be interrupted by sending the Benthos process a second OS interrupt or termination signal.

### Shutdown timeout

The `shutdown_timeout` option sets a hard deadline for Benthos process to gracefully terminate. If this duration is exceeded then the process is forcefully terminated and any messages that were in-flight will be dropped.

This option takes effect after the `shutdown_delay` duration has passed if that is enabled.

[processors]: /docs/components/processors/about
[processors.mapping]: /docs/components/processors/mapping
[config-interp]: /docs/configuration/interpolation
[config.testing]: /docs/configuration/unit_testing
[config.templating]: /docs/configuration/templating
[config.resources]: /docs/configuration/resources
[json-references]: https://tools.ietf.org/html/draft-pbryan-zyp-json-ref-03
[components]: /docs/components/about
