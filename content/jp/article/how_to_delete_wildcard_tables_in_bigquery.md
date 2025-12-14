---
title: 'Bigquery で、日付別テーブル（_TABLE_SUFFIX付きテーブル）を一括削除する　ワンライナー'
date: 2024-10-24T23:08:40+07:00
# weight: 1
# aliases: ["/first"]
categories: ["one-liner"]
tags: ["CLI","GCP","Bigquery"]
# author: "Me"
# author: ["Me", "You"] # multiple authors
# showToc: true
TocOpen: false
draft: false
hidemeta: false
comments: false
# description: "Desc Text."
# canonicalURL: "https://canonical.url/to/page"
disableHLJS: true # to disable highlightjs
disableShare: false
hideSummary: false
searchHidden: true
ShowReadingTime: true
ShowBreadCrumbs: true
ShowPostNavLinks: true
ShowWordCount: true
ShowRssButtonInSectionTermList: true
UseHugoToc: true
cover:
    image: "<image path/url>" # image path/url
    alt: "<alt text>" # alt text
    caption: "<text>" # display caption under cover
    relative: false # when using page bundles set this to true
    hidden: true # only hide on current single page
#editPost:
#    URL: "https://github.com/<path_to_repo>/content"
#    Text: "Suggest Changes" # edit text
#    appendFilePath: true # to append file path to Edit link
---

### やりたい事・背景
- Bigqueryで、Historicalなデータの保存時に、_YYYYMMDDなどのSuffixを追加して保存していると、気がつくと世代がめちゃくちゃ増えていることがあり、削除をする必要があった。
- が、GCPのコンソールからは、1テーブルづつしか削除できない。また、bqコマンドではワイルドカードをつかった削除機能はなかったため、このアプローチを取った。

### ワンライナー
- <Project_name>, <Dataset_Name>, <削除したいTable名のパターン> を置き換える。

```
bq query --project_id=<Project_name> --use_legacy_sql=false --format=csv --max_rows=1000 "SELECT table_id FROM \`<Product_Name>.<Dataset_Name>.__TABLES__\` WHERE table_id LIKE '%<削除したいTable名のパターン>%'" | tail -n +2 | xargs -I {} bq rm -f -t <Product_Name>:<Dataset_Name>.{}
```

### 補足
‐ 実行前に、対象のテーブルを確認した方がよいので、以下を使用。

```
bq query --project_id=<Project_name>　--use_legacy_sql=false --format=csv --max_rows=1000 "SELECT table_id FROM \`<Product_Name>.<Dataset_Name>.__TABLES__\` WHERE table_id LIKE '%<削除したいTable名のパターン>%'" | tail -n +2 | xargs -I {} echo "Table ID: {}"
```

‐ データセット作成時に、デフォルトの有効期限設定をするのがベストプラクティスとの事。ただ、後から設定しても、作成済みのテーブルは削除されない。。。自分で消さないとダメでした。

https://cloud.google.com/bigquery/docs/best-practices-storage?hl=ja#use-expiration-settings
