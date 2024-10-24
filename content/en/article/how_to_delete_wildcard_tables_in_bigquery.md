---
title: 'One-liner for Bulk Deletion of Date-Suffixed Tables in BigQuery'
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

### Objective and Background
- In BigQuery, we often save historical data by appending suffixes like _YYYYMMDD to table names. Over time, this can lead to an accumulation of many versions of data that need to be deleted.
- However, the GCP console only allows deletion of one table at a time, and the bq command does not support wildcard deletions. To address this, we use the following approach.

### One-liner
- Replace <Project_name>, <Dataset_Name>, and <Table_Name_Pattern_To_Delete> in the command below.

```
bq query --project_id=<Project_name> --use_legacy_sql=false --format=csv --max_rows=1000 "SELECT table_id FROM \`<Product_Name>.<Dataset_Name>.__TABLES__\` WHERE table_id LIKE '%<Table_Name_Pattern_To_Delete>%'" | tail -n +2 | xargs -I {} bq rm -f -t <Product_Name>:<Dataset_Name>.{}
```

### Additional Notes
‐ It is advisable to verify the target tables before executing the deletion. Use the following command to check:

```
bq query --project_id=<Project_name> --use_legacy_sql=false --format=csv --max_rows=1000 "SELECT table_id FROM \`<Product_Name>.<Dataset_Name>.__TABLES__\` WHERE table_id LIKE '%<Table_Name_Pattern_To_Delete>%'" | tail -n +2 | xargs -I {} echo "Table ID: {}"
```

‐ Setting a default expiration for datasets upon creation is considered best practice. However, this setting does not apply to already created tables, which must be manually deleted.

https://cloud.google.com/bigquery/docs/best-practices-storage#use-expiration-settings
