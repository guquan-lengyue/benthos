![Benthos](icon.png "Benthos")

[![godoc for benthosdev/benthos][godoc-badge]][godoc-url]
[![Build Status][actions-badge]][actions-url]
[![Discord invite][discord-badge]][discord-url]
[![Docs site][website-badge]][website-url]

Benthos是一个高性能且弹性的流处理器, 能够将各种[数据源][inputs]和[接收器][outputs]连接起来, 在各种模式中[流转, 丰富, 转换, 过滤][processors]你的数据.

它自带了一种[强大的映射语言][bloblang-about], 这个语言易于的部署和监控, 并且可以让你轻松的在管道(pipeline)中使用. 无论是直接编译成可执行文件, 使用docker镜像, 还是[serverless][serverless]方式, 它都能完全适应云端.

Benthos 是声明式的, 你可以在配置文件中定义你输入, 输出和其中的一系列的转换


```yaml
input:
  gcp_pubsub:
    project: foo
    subscription: bar

pipeline:
  processors:
    - mapping: |
        root.message = this
        root.meta.link_count = this.links.length()
        root.user.age = this.user.age.number()

output:
  redis_streams:
    url: tcp://TODO:6379
    stream: baz
    max_in_flight: 20
```

### 消息可达性保证

消息可达性保证[是一个棘手的问题](https://youtu.be/QmpBOCvY8mY). Benthos 使用基于进程的事务模型来处理和确认消息, 无需任何磁盘持久化状态, 所以当连接到至少一个数据源和接收器时, 即使在崩溃、磁盘损坏或其他意外服务器故障的情况下, 它也能保证至少一次的投递. 

这种行为是默认的且没有任何警告，这也使得部署和扩展Benthos变得更加简单。

## 支持的数据源和接收器

AWS (DynamoDB, Kinesis, S3, SQS, SNS), Azure (Blob storage, Queue storage, Table storage), GCP (Pub/Sub, Cloud storage, Big query), Kafka, NATS (JetStream, Streaming), NSQ, MQTT, AMQP 0.91 (RabbitMQ), AMQP 1, Redis (streams, list, pubsub, hashes), Cassandra, Elasticsearch, HDFS, HTTP (server and client, including websockets), MongoDB, SQL (MySQL, PostgreSQL, Clickhouse, MSSQL),  [更多的内容可以点击这里查看][about-categories].

更多的连接器还在开发中，如果没有你想要的，请提[issue](https://github.com/benthosdev/benthos/issues/new).

## 文档

如果你想直接深入了解Benthos, 可以直接点击跳转到具体的[文档][general-docs].

关于如何配置告警的流处理如流链接, 丰富工作流等, 可以查看[烹饪部分][cookbooks]

关于如何开发自己的插件, 可以查看[公开API][godoc-url]

## 可视化界面

当被迫阅读时会生气并砸东西吗? 如果你正在寻找一个 Benthos 的可视化界面，请查看[Benthos Studio][benthos-studio], 它是一个配置构建器、语法检查工具和部署管理解决方案, 集成在一个单一的应用程序中。

## 安装

在[这里][releases]获取你操作系统的可执行文件, 或者使用这个脚本: 

```shell
curl -Lsf https://www.benthos.dev/sh/install | bash
```

或者拉取docker镜像: 

```shell
docker pull ghcr.io/benthosdev/benthos
```

Benthos也可以用Homebrew安装: 


```shell
brew install benthos
```

想要更多的信息可以点击这里[开启教程][getting-started].

## 运行

```shell
benthos -c ./config.yaml
```

或者使用docker

```shell
# Using a config file
docker run --rm -v /path/to/your/config.yaml:/benthos.yaml ghcr.io/benthosdev/benthos

# Using a series of -s flags
docker run --rm -p 4195:4195 ghcr.io/benthosdev/benthos \
  -s "input.type=http_server" \
  -s "output.type=kafka" \
  -s "output.kafka.addresses=kafka-server:9092" \
  -s "output.kafka.topic=benthos_topic"
```

## 监控

### 健康检测

Benthos服务有两个Http接口用于健康检测: 
- `/ping` 可以用于存活检测, 它永远返回200
- `/ready` 可以用于就绪检测, 只有当输入和输出都连接时才会返回200, 否则返回503.

### 指标

Benthos [exposes lots of metrics][metrics] either to Statsd, Prometheus, a JSON HTTP endpoint, [and more][metrics].

### Tracing

Benthos also [emits open telemetry tracing events][tracers], which can be used to visualise the processors within a pipeline.

## Configuration

Benthos provides lots of tools for making configuration discovery, debugging and organisation easy. You can [read about them here][config-doc].

## Build

Build with Go (any [currently supported version](https://go.dev/dl/)):

```shell
git clone git@github.com:benthosdev/benthos
cd benthos
make
```

## Lint

Benthos uses [golangci-lint][golangci-lint] for linting, which you can install with:

```shell
curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(go env GOPATH)/bin
```

And then run it with `make lint`.

## Plugins

It's pretty easy to write your own custom plugins for Benthos in Go, for information check out [the API docs][godoc-url], and for inspiration there's an [example repo][plugin-repo] demonstrating a variety of plugin implementations.

## Extra Plugins

By default Benthos does not build with components that require linking to external libraries, such as the `zmq4` input and outputs. If you wish to build Benthos locally with these dependencies then set the build tag `x_benthos_extra`:

```shell
# With go
go install -tags "x_benthos_extra" github.com/benthosdev/benthos/v4/cmd/benthos@latest

# Using make
make TAGS=x_benthos_extra
```

Note that this tag may change or be broken out into granular tags for individual components outside of major version releases. If you attempt a build and these dependencies are not present you'll see error messages such as `ld: library not found for -lzmq`.

## Docker Builds

There's a multi-stage `Dockerfile` for creating a Benthos docker image which results in a minimal image from scratch. You can build it with:

```shell
make docker
```

Then use the image:

```shell
docker run --rm \
	-v /path/to/your/benthos.yaml:/config.yaml \
	-v /tmp/data:/data \
	-p 4195:4195 \
	benthos -c /config.yaml
```

## Contributing

Contributions are welcome, please [read the guidelines](CONTRIBUTING.md), come and chat (links are on the [community page][community]), and watch your back.

[inputs]: https://www.benthos.dev/docs/components/inputs/about
[about-categories]: https://www.benthos.dev/docs/about#components
[processors]: https://www.benthos.dev/docs/components/processors/about
[outputs]: https://www.benthos.dev/docs/components/outputs/about
[metrics]: https://www.benthos.dev/docs/components/metrics/about
[tracers]: https://www.benthos.dev/docs/components/tracers/about
[config-interp]: https://www.benthos.dev/docs/configuration/interpolation
[streams-api]: https://www.benthos.dev/docs/guides/streams_mode/streams_api
[streams-mode]: https://www.benthos.dev/docs/guides/streams_mode/about
[general-docs]: https://www.benthos.dev/docs/about
[bloblang-about]: https://www.benthos.dev/docs/guides/bloblang/about
[config-doc]: https://www.benthos.dev/docs/configuration/about
[serverless]: https://www.benthos.dev/docs/guides/serverless/about
[cookbooks]: https://www.benthos.dev/cookbooks
[releases]: https://github.com/benthosdev/benthos/releases
[plugin-repo]: https://github.com/benthosdev/benthos-plugin-example
[getting-started]: https://www.benthos.dev/docs/guides/getting_started
[benthos-studio]: https://studio.benthos.dev

[godoc-badge]: https://pkg.go.dev/badge/github.com/benthosdev/benthos/v4/public
[godoc-url]: https://pkg.go.dev/github.com/benthosdev/benthos/v4/public
[actions-badge]: https://github.com/benthosdev/benthos/actions/workflows/test.yml/badge.svg
[actions-url]: https://github.com/benthosdev/benthos/actions/workflows/test.yml
[discord-badge]: https://img.shields.io/discord/746368194196799589
[discord-url]: https://discord.com/invite/6VaWjzP
[website-badge]: https://img.shields.io/badge/Docs-Learn%20more-ffc7c7
[website-url]: https://www.benthos.dev

[community]: https://www.benthos.dev/community

[golangci-lint]: https://golangci-lint.run/
[jaeger]: https://www.jaegertracing.io/
