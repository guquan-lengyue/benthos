import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import ComponentCard from '@theme/ComponentCard';

let descriptions = {
  inputs: [
    {
      name: "Services",
      description: "从存储或消息流服务中输入",
    },
    {
      name: "Network",
      description: "从网络接口中输入",
    },
    {
      name: "AWS",
      description: "从Amazon网络服务产品中输入",
    },
    {
      name: "GCP",
      description: "从谷歌云平台服务中输入",
    },
    {
      name: "Azure",
      description: "从微软Azure服务中输入",
    },
    {
      name: "Social",
      description: "从社交平台应用和服务中输入",
    },
    {
      name: "Local",
      description: "从本地机器/文件系统中输入",
    },
    {
      name: "Utility",
      description: "从提供的工具中生成数据或组合/封装其他输入中输入",
    },
  ],
  buffers: [
    {
      name: "Windowing",
      description: "Buffers that provide message windowing capabilities.",
    },
    {
      name: "Utility",
      description: "Buffers that are intended for niche but general use.",
    },
  ],
  processors: [
    {
      name: "Mapping",
      description: "重构消息",
    },
    {
      name: "Integration",
      description: "与外部服务交互",
    },
    {
      name: "Parsing",
      description: "解析消息",
    },
    {
      name: "Composition",
      description: "较高级别的处理器，用于组合其他处理器并修改其行为",
    },
    {
      name: "Utility",
      description: "提供通用功能或不适合其他类别的处理器",
    },
  ],
  outputs: [
    {
      name: "Services",
      description: "输出到存储或消息流服务。",
    },
    {
      name: "Network",
      description: "输出到网络接口",
    },
    {
      name: "AWS",
      description: "输出到Amazon网络服务产品",
    },
    {
      name: "GCP",
      description: "输出到谷歌云平台服务",
    },
    {
      name: "Azure",
      description: "输出到微软Azure服务",
    },
    {
      name: "Social",
      description: "输出到社交应用",
    },
    {
      name: "Local",
      description: "输出到本地机器/文件系统",
    },
    {
      name: "Utility",
      description: "组合/封装其他输出组件提供更实用的输出",
    },
  ],
};

function ComponentsByCategory(props) {
  let {type} = props;
  const context = useDocusaurusContext();
  const types = context.siteConfig.customFields.components[type];

  let summaries = descriptions[type] || [];

  let categories = {};
  let categoryList = [];
  for (let i = 0; i < summaries.length; i++) {
    categoryList.push(summaries[i].name);
    categories[summaries[i].name.toLowerCase()] = {
      summary: summaries[i].description,
      items: [],
    }
  }

  for (let i = 0; i < types.length; i++) {
    let cats = types[i].categories;
    if ( Array.isArray(cats) ) {
      for (let j = 0; j < cats.length; j++) {
        let catLower = cats[j].toLowerCase();
        if ( categories[catLower] === undefined ) {
          categoryList.push(catLower.charAt(0).toUpperCase() + catLower.slice(1));
          categories[catLower] = {
            summary: "",
            items: [types[i]],
          };
        } else {
          categories[catLower].items.push(types[i]);
        }
      }
    }
  }

  return (
    <Tabs defaultValue={categoryList[0].toLowerCase()} values={categoryList.map((cat) => (
      { label: cat, value: cat.toLowerCase() }
    ))}>
      {categoryList.map((cat) => (
        <TabItem key={cat.toLowerCase()} value={cat.toLowerCase()}>
          <p>{categories[cat.toLowerCase()].summary}</p>
          {categories[cat.toLowerCase()].items.map((data, idx) => (
            <ComponentCard key={idx} type={type} component={data} />
          ))}
        </TabItem>
      ))}
    </Tabs>
  );
}

export default ComponentsByCategory;