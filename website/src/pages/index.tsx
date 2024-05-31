import React from 'react';
import classnames from 'classnames';
import ReactPlayer from 'react-player/youtube'
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './index.module.css';
import CodeBlock from "@theme/CodeBlock";
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

const installs = [
  {
    label: 'Curl',
    language: 'bash',
    children: `# 安装
curl -Lsf https://www.benthos.dev/sh/install | bash

# 构造配置文件
benthos create nats/protobuf/aws_sqs > ./config.yaml

# 运行
benthos -c ./config.yaml`
  },
  {
    label: 'Homebrew',
    language: 'bash',
    children: `# 安装
brew install benthos

# 构造配置文件
benthos create nats/protobuf/aws_sqs > ./config.yaml

# 运行
benthos -c ./config.yaml`
  },
  {
    label: 'Docker',
    language: 'bash',
    children: `# 拉取
docker pull ghcr.io/benthosdev/benthos

# 构造配置文件
docker run --rm ghcr.io/benthosdev/benthos create nats/protobuf/aws_sqs > ./config.yaml

# 运行
docker run --rm -v $(pwd)/config.yaml:/benthos.yaml ghcr.io/benthosdev/benthos`
  },
  {
    label: 'Asdf',
    language: 'bash',
    children: `# 安装
asdf plugin add benthos
asdf install benthos latest
asdf global benthos latest

# 构造配置文件
benthos create nats/protobuf/aws_sqs > ./config.yaml

# 运行
benthos -c ./config.yaml`
  },
]

const snippets = [
  {
    label: 'Mapping',
    further: '/docs/guides/bloblang/about',
    language: 'yaml',
    children: `input:
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
    max_in_flight: 20`,
  },
  {
    label: 'Multiplexing',
    further: '/docs/components/outputs/about#multiplexing-outputs',
    language: 'yaml',
    children: `input:
  kafka:
    addresses: [ TODO ]
    topics: [ foo, bar ]
    consumer_group: foogroup

output:
  switch:
    cases:
      - check: doc.tags.contains("AWS")
        output:
          aws_sqs:
            url: https://sqs.us-west-2.amazonaws.com/TODO/TODO
            max_in_flight: 20

      - output:
          redis_pubsub:
            url: tcp://TODO:6379
            channel: baz
            max_in_flight: 20`,
  },
  {
    label: 'Windowing',
    further: '/docs/configuration/windowed_processing',
    language: 'yaml',
    children: `input:
  nats_jetstream:
    urls: [ nats://TODO:4222 ]
    queue: myqueue
    subject: traffic.light.events
    deliver: all

buffer:
  system_window:
    timestamp_mapping: root = this.created_at
    size: 1h

pipeline:
  processors:
    - group_by_value:
        value: '\${! json("traffic_light_id") }'
    - mapping: |
        root = if batch_index() == 0 {
          {
            "traffic_light_id": this.traffic_light_id,
            "created_at": @window_end_timestamp,
            "total_cars": json("registration_plate").from_all().unique().length(),
            "passengers": json("passengers").from_all().sum(),
          }
        } else { deleted() }

output:
  http_client:
    url: https://example.com/traffic_data
    verb: POST
    max_in_flight: 64`,
  },
  {
    label: 'Enrichments',
    further: '/cookbooks/enrichments',
    language: 'yaml',
    children: `input:
  mqtt:
    urls: [ tcp://TODO:1883 ]
    topics: [ foo ]

pipeline:
  processors:
    - branch:
        request_map: |
          root.id = this.doc.id
          root.content = this.doc.body
        processors:
          - aws_lambda:
              function: sentiment_analysis
        result_map: root.results.sentiment = this

output:
  aws_s3:
    bucket: TODO
    path: '\${! meta("partition") }/\${! timestamp_unix_nano() }.tar.gz'
    batching:
      count: 100
      period: 10s
      processors:
        - archive:
            format: tar
        - compress:
            algorithm: gzip`,
  },
];

const features = [
  {
    title: '处理一些烦人的事情',
    imageUrl: 'img/Blobboring.svg',
    description: (
      <>
        <p>
          Benthos 可以解决诸如转换、集成和使用声明性和可单元测试配置的多路复用等常见数据工程任务。这使你能够在需求变化时轻松且渐进地调整数据流，让你专注于更有趣的事情。
        </p>
        <p>
          它配备了许多不同方面的<a href="/docs/components/processors/about">处理器</a>、一种轻量级的映射语言<a href="/docs/guides/bloblang/about">映射语言</a>、无状态的<a href="/docs/configuration/windowed_processing">窗口化处理能力</a>以及<a href="/blobfish">业界领先的吉祥物</a>。
        </p>
      </>
    ),
  },
  {
    title: '美妙的连接',
    imageUrl: 'img/Blobborg.svg',
    description: (
      <>
        <p>
          Benthos 可以将各种各样的<a href="/docs/components/inputs/about">数据源</a>和<a href="/docs/components/outputs/about">接收器</a>连接在一起并通过钩子（hook）将其转到各种<a href="/docs/components/processors/sql">数据库</a>， <a href="/docs/components/processors/cache">缓存</a>， <a href="/docs/components/processors/http">HTTP APIs</a>，<a href="/docs/components/processors/aws_lambda">lambdas</a>还有<a href="/docs/components/processors/about">更多</a>， 使得你能够无缝地将其嵌入到你现有的功能中去。
        </p>
        <p>
          处理各种API和服务是一个艰巨的任务，尤其是在数据流处理的任务中。使用Benthos，可以将这些任务拆分，并且会自动并行处理这些<a href="/cookbooks/enrichments">工作流</a>任务。
        </p>
      </>
    ),
  },
  {
    description: (
      <ReactPlayer
        className={classnames('col col-6 padding--lg')}
        url='https://youtu.be/uvbp2LCmQMY'
        controls={true}
      />
    ),
  },
  {
    title: '可视化地创建，测试，和部署配置',
    imageUrl: 'img/Blobartist.svg',
    description: (
      <>
        <p>声明式的YAML文件可以很好地跟版本控制工具配合，但是在当配置变得庞大的时候将相当的烦人</p>
        <p><a target="_blank" rel="noopener noreferrer" href="https://studio.benthos.dev">Benthos Studio</a> 是一个可视化的页面应用，你可以在上面创建/导入配置文件，然后编辑，测试，分享和部署。你会在制作配置的时候感叹：“这真好玩！”。</p>
      </>
    ),
  },
  {
    title: '操作简单且可靠',
    imageUrl: 'img/Blobscales.svg',
    description: (
      <>
        <p>
          消息可达性保证<a href="https://youtu.be/QmpBOCvY8mY">是一个棘手的问题</a>。Benthos 使用基于进程的事务模型来处理和确认消息, 无需任何磁盘持久化状态, 所以当连接到至少一个数据源和接收器时, 即使在崩溃、磁盘损坏或其他意外服务器故障的情况下, 它也能保证至少一次的投递. 
        </p>
        <p>
          这个动作是默认的且没有任何警告，这也使得部署和扩展Benthos变得更加简单。
        </p>
      </>
    ),
  },
  {
    title: '可扩展',
    imageUrl: 'img/Blobextended.svg',
    description: (
      <>
        <p>
          有时候，Benthos 自带的组件是不够的。幸好，Benthos 设计成可以很容易地与你需要的任何组件相连接。
        </p>
        <p>
          你可以<a href="https://pkg.go.dev/github.com/benthosdev/benthos/v4/public">直接用 Go 编写插件（推荐）</a>，也可以让 Benthos 将你的插件作为<a href="/docs/components/processors/subprocess">子进程</a>运行。
        </p>
      </>
    ),
  },
];

interface FeatureArgs {
  imageUrl?: string;
  title?: string;
  description: JSX.Element;
};

function Feature({imageUrl, title, description}: FeatureArgs) {
  const imgUrl = useBaseUrl(imageUrl);
  return (
    <div className={classnames('col col--6')}>
      {imgUrl && (
        <div className="text--center">
          <img className={classnames('padding-vert--md', styles.featureImage)} src={imgUrl} alt={title} />
        </div>
      )}
      <h3>{title}</h3>
      {description}
    </div>
  );
}

function Home() {
  const context = useDocusaurusContext();
  const siteConfig = context.siteConfig;
  return (
    <Layout
      title={`${siteConfig.title}`}
      description={`${siteConfig.tagline}`}>
      <header className={classnames('hero', styles.heroBanner)}>
        <div className="container">
          <div className="row">
            <div className={classnames('col col--5 col--offset-1')}>
              <h1 className="hero__title">{siteConfig.title}</h1>
              <p className="hero__subtitle">{siteConfig.tagline}</p>
              <div className={styles.buttons}>
                <Link
                  className={classnames(
                    'button button--outline button--primary button--lg',
                    styles.getStarted,
                  )}
                  to={useBaseUrl('docs/guides/getting_started')}>
                  开始
                </Link>
              </div>
            </div>
            <div className={classnames('col col--5')}>
              <img className={styles.heroImg} src="img/logo_hero.svg" />
            </div>
          </div>
        </div>
      </header>
      <main>
        <div className="container">
          <div className="row">
            <div className={classnames(`${styles.pitch} col col--6`)}>
              <h2>这用起来很容易</h2>
              <p>
                用Go语言编写, 用二进制文件部署, 具有声明是的配置. <a href="https://github.com/benthosdev/benthos">开源</a>并且是彻底的云原生
              </p>
              {installs && installs.length && (
                <Tabs defaultValue={installs[0].label} values={installs.map((props, idx) => {
                  return {label:props.label, value:props.label};
                })}>
                  {installs.map((props, idx) => (
                    <TabItem key={idx} value={props.label}>
                      <CodeBlock {...props}/>
                    </TabItem>
                  ))}
                </Tabs>
              )}
            </div>
            <div className={classnames('col col--6')}>
                {snippets && snippets.length && (
                  <section className={styles.configSnippets}>
                    <Tabs defaultValue={snippets[0].label} values={snippets.map((props, idx) => {
                      return {label:props.label, value:props.label};
                    })}>
                      {snippets.map((props, idx) => (
                        <TabItem key={idx} value={props.label}>
                          <div style={{position: 'relative'}}>
                            <CodeBlock {...props}/>
                            {props.further && <Link
                              className={classnames(styles.furtherButton, 'button button--outline button--primary')}
                              to={props.further}>
                              阅读更多
                            </Link>}
                          </div>
                        </TabItem>
                      ))}
                    </Tabs>
                  </section>
                )}
            </div>
          </div>
        </div>
        {features && features.length && (
          <section className={styles.features}>
            <div className="container margin-vert--md">
              <div className="row">
                {features.map((props, idx) => (
                  <Feature key={idx} {...props} />
                ))}
              </div>
            </div>
          </section>
        )}
        <section className={styles.loveSection}>
          <div className="container">
            <div className="row">
              <div className={classnames('col col--6')}>
                <h3 id="sponsored-by">Sponsored by the following heroes</h3>
                <div className="container">
                  <div>
                    <a href="https://synadia.com"><img className={styles.synadiaImg} src="/img/sponsors/synadia.svg" /></a>
                  </div>
                  <div className={classnames(styles.sponsorsBox, styles.goldSponsors)}>
                    <a href="https://www.warpstream.com/"><img src="/img/sponsors/warpstream_logo.svg" /></a>
                  </div>
                  <div className={classnames(styles.sponsorsBox, styles.silverSponsors)}>
                    <a href="https://www.meltwater.com/"><img src="/img/sponsors/mw_logo.png" /></a>
                    <a href="https://www.humansecurity.com"><img src="/img/sponsors/HUMAN_logo.png" /></a>
                    <a href="https://community.com/"><img src="/img/sponsors/community.svg" /></a>
                    <a href="https://www.optum.com/"><img src="/img/sponsors/optum_logo.png" /></a>
                    <a href="https://aurora.dev/"><img src="/img/sponsors/aurora.svg" /></a>
                    <a href="https://www.opala.com"><img src="/img/sponsors/opala.svg" /></a>
                    <a href="https://formance.com"><img src="/img/sponsors/formance.svg" /></a>
                    <a href="https://www.umh.app/"><img src="/img/sponsors/umh_logo.svg" /></a>
                  </div>
                </div>
              </div>
              <div className={classnames('col col--6', styles.loveSectionPlea)}>
                <div>
                  <a href="https://github.com/sponsors/Jeffail">
                    <img className={styles.loveImg} src="img/blobheart.svg" alt="Blob Heart" />
                  </a>
                </div>
                <Link
                  className={classnames('button button--danger')}
                  to="https://github.com/sponsors/Jeffail">
                  Become a sponsor
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}

export default Home;
