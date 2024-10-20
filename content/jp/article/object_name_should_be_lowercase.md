---
title: 'オブジェクトの名称はすべて小文字にしておくこと - PostgreSQL'
date: 2024-10-19T22:46:18+07:00
# weight: 1
# aliases: ["/first"]
tags: ["postgresql"]
# author: "Me"
# author: ["Me", "You"] # multiple authors
showToc: false
TocOpen: false
draft: false
hidemeta: false
comments: false
# description: "Desc Text."
# canonicalURL: "https://canonical.url/to/page"
disableHLJS: true # to disable highlightjs
disableShare: false
disableHLJS: false
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

### **postgresqlでは、オブジェクト(テーブル名、カラム名)の名称はすべて小文字にすること**

### 理由
- DB内には、大文字・小文字で区別して登録される
- SQL内では、"(ダブルクォーテーション)で囲まれているとそのままの文字列だが、囲まれていないと小文字に変換される（らしい）
- 結果、アンマッチが起きる

---

```sql
testdb=> \d iris
                Table "public.iris"
    Column     |         Type          | Modifiers 
---------------+-----------------------+-----------
 Id            | integer               | not null
 SepalLengthCm | numeric(15,2)         | 
 SepalWidthCm  | numeric(15,2)         | 
 PetalLengthCm | numeric(15,2)         | 
 PetalWidthCm  | numeric(15,2)         | 
 Species       | character varying(20) | 
Indexes:
    "iris_pkey" PRIMARY KEY, btree ("Id")

testdb=> select * from iris where SepalLengthCm > 5.0; --<--- NG
ERROR:  列"sepallengthcm"は存在しません
LINE 1: select * from iris where SepalLengthCm > 5.0;
                                 ^
HINT:  Perhaps you meant to reference the column "iris.SepalLengthCm".

testdb=> select * from iris where "iris.SepalLengthCm" > 5.0; --<--- NG
ERROR:  列"iris.SepalLengthCm"は存在しません
LINE 1: select * from iris where "iris.SepalLengthCm" > 5.0;
                                 ^

testdb=> select * from iris where "SepalLengthCm" > 5.0; --<--- OK

testdb=> select * from iris where iris."SepalLengthCm" > 5.0; --<--- OK
```

##### my previous blog post
https://pumpkinpie-tea.blogspot.com/2016/06/postgresql.html