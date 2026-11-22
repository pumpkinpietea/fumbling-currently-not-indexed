---
title: "開発ツール・AI開発ブログ — 2026-11-21"
date: 2026-11-21T14:03:43.964Z
lastmod: 2026-11-21T14:03:43.964Z
slug: developer-tools-2026-11-21
translationKey: developer-tools-2026-11-21
draft: false
showToc: false
newsEdition: developer
newsItems: [{"title":"Codex 0.171.0、モデル追加とTUIワークスペースの標準有効化","summary":"OpenAIのCodex 0.171.0はGPT-6.2 SolとAstraを追加し、Solを既定の選択に設定。TUIワークスペースを標準有効化し、遠隔の非対話セッションも追加した。","countries":[],"topics":["developer-tools"],"sourceUrls":["https://github.com/openai/codex/releases/tag/rust-v0.171.0"],"attributions":[]},{"title":"Google、他クラウド上のエージェントにも異常検知を拡張","summary":"Googleによると、Agent Anomaly DetectionはAWS、Azure、オンプレミスのADKエージェントを、Google Cloudに取り込んだトレースとログで監視できる。","countries":[],"topics":["developer-tools"],"sourceUrls":["https://developers.googleblog.com/agent-anomaly-detection-safeguarding-agents-across-other-clouds/"],"attributions":[]},{"title":"Google、Cloud Runの内部MCPとGemini Enterpriseの接続を解説","summary":"GoogleはEgress Agent Gateway、Private Service Connect、デュアルヘッダーOAuth 2.0を使う非公開接続の手順を公開した。","countries":[],"topics":["developer-tools"],"sourceUrls":["https://developers.googleblog.com/how-to-securely-connect-internal-cloud-run-mcp-servers-to-gemini-enterprise/"],"attributions":[]},{"title":"Google、Gemini Enterprise独自UIの認証実装を解説","summary":"Googleは独自UIで必要な3層の認証を解説。利用者やワークロードの認証、コネクタのOAuth、独自エージェントのツール別OAuthが対象となる。","countries":[],"topics":["developer-tools"],"sourceUrls":["https://developers.googleblog.com/how-to-handle-user-connector-and-agent-auth-in-gemini-enterprise-with-a-custom-ui/"],"attributions":[]},{"title":"Google、MaxTextのStreaming DiLoCoによる分散LLM学習を解説","summary":"Googleによると、Streaming DiLoCoは各段階でモデル全体を同期する代わりにパラメーター断片を転送し、地理的に分散したTPUで学習を行う。","countries":[],"topics":["developer-tools"],"sourceUrls":["https://developers.googleblog.com/distributed-llm-training-across-metros-streaming-diloco-in-maxtext/"],"attributions":[]},{"title":"Google、TunixとGemma 4による複数ターンのエージェント学習を解説","summary":"GoogleはCloud TPU上でTunixとGemma 4を使い、GRPOと非同期vLLMロールアウトでツール利用エージェントを学習する手順を公開した。","countries":[],"topics":["developer-tools"],"sourceUrls":["https://developers.googleblog.com/multi-turn-agentic-reinforcement-learning-with-tunix-and-gemma-4-on-google-tpus/"],"attributions":[]},{"title":"Google、大規模Gitリポジトリ向けABFSを紹介","summary":"Googleは、大規模Gitリポジトリでの開発を高速化するオープンソースのコンテンツアドレス型ファイルシステム兼ビルドキャッシュ、ABFSを紹介した。","countries":[],"topics":["developer-tools"],"sourceUrls":["https://developers.googleblog.com/accelerating-development-for-massive-git-repositories/"],"attributions":[]},{"title":"Apple、App Storeの税務変更とSaaS税区分属性を案内","summary":"Appleはボツワナ、カメルーン、コートジボワール、ルワンダで税制変更に伴う対象アプリなどの収益調整を案内。SaaSの税区分属性も追加した。","countries":[],"topics":["developer-tools"],"sourceUrls":["https://developer.apple.com/news/?id=4o5ie73a"],"attributions":[]},{"title":"Apple、macOS 27.3 beta 2で機密性の高いアクセス権を変更","summary":"AppleはmacOS 27.3 beta 2でDevice Control and Data AccessをSystem & App Protection OverrideとAccessibilityに分割すると説明した。","countries":[],"topics":["developer-tools"],"sourceUrls":["https://developer.apple.com/news/?id=oqng0zjk"],"attributions":[]}]
---

対象期間：2026-11-14～2026-11-20。出典の公開・更新日を各項目に記載。

## 今回のハイライト

- [Codex 0.171.0、モデル追加とTUIワークスペースの標準有効化](#news-1)

- [Google、他クラウド上のエージェントにも異常検知を拡張](#news-2)

- [Google、Cloud Runの内部MCPとGemini Enterpriseの接続を解説](#news-3)

## Codex 0.171.0、モデル追加とTUIワークスペースの標準有効化 {#news-1}

OpenAIのCodex 0.171.0はGPT-6.2 SolとAstraを追加し、Solを既定の選択に設定。TUIワークスペースを標準有効化し、遠隔の非対話セッションも追加した。

[出典: OpenAI Codex · 公開 2026-11-20 00:44:47 UTC](https://github.com/openai/codex/releases/tag/rust-v0.171.0)

## Google、他クラウド上のエージェントにも異常検知を拡張 {#news-2}

Googleによると、Agent Anomaly DetectionはAWS、Azure、オンプレミスのADKエージェントを、Google Cloudに取り込んだトレースとログで監視できる。

[出典: Google for Developers · 公開 2026-11-20](https://developers.googleblog.com/agent-anomaly-detection-safeguarding-agents-across-other-clouds/)

## Google、Cloud Runの内部MCPとGemini Enterpriseの接続を解説 {#news-3}

GoogleはEgress Agent Gateway、Private Service Connect、デュアルヘッダーOAuth 2.0を使う非公開接続の手順を公開した。

[出典: Google for Developers · 公開 2026-11-20](https://developers.googleblog.com/how-to-securely-connect-internal-cloud-run-mcp-servers-to-gemini-enterprise/)

## Google、Gemini Enterprise独自UIの認証実装を解説 {#news-4}

Googleは独自UIで必要な3層の認証を解説。利用者やワークロードの認証、コネクタのOAuth、独自エージェントのツール別OAuthが対象となる。

[出典: Google for Developers · 公開 2026-11-20](https://developers.googleblog.com/how-to-handle-user-connector-and-agent-auth-in-gemini-enterprise-with-a-custom-ui/)

## Google、MaxTextのStreaming DiLoCoによる分散LLM学習を解説 {#news-5}

Googleによると、Streaming DiLoCoは各段階でモデル全体を同期する代わりにパラメーター断片を転送し、地理的に分散したTPUで学習を行う。

[出典: Google for Developers · 公開 2026-11-19](https://developers.googleblog.com/distributed-llm-training-across-metros-streaming-diloco-in-maxtext/)

## Google、TunixとGemma 4による複数ターンのエージェント学習を解説 {#news-6}

GoogleはCloud TPU上でTunixとGemma 4を使い、GRPOと非同期vLLMロールアウトでツール利用エージェントを学習する手順を公開した。

[出典: Google for Developers · 公開 2026-11-19](https://developers.googleblog.com/multi-turn-agentic-reinforcement-learning-with-tunix-and-gemma-4-on-google-tpus/)

## Google、大規模Gitリポジトリ向けABFSを紹介 {#news-7}

Googleは、大規模Gitリポジトリでの開発を高速化するオープンソースのコンテンツアドレス型ファイルシステム兼ビルドキャッシュ、ABFSを紹介した。

[出典: Google for Developers · 公開 2026-11-17](https://developers.googleblog.com/accelerating-development-for-massive-git-repositories/)

## Apple、App Storeの税務変更とSaaS税区分属性を案内 {#news-8}

Appleはボツワナ、カメルーン、コートジボワール、ルワンダで税制変更に伴う対象アプリなどの収益調整を案内。SaaSの税区分属性も追加した。

[出典: Apple Developer · 公開 2026-11-18 00:00:25 UTC](https://developer.apple.com/news/?id=4o5ie73a)

## Apple、macOS 27.3 beta 2で機密性の高いアクセス権を変更 {#news-9}

AppleはmacOS 27.3 beta 2でDevice Control and Data AccessをSystem & App Protection OverrideとAccessibilityに分割すると説明した。

[出典: Apple Developer · 公開 2026-11-16 16:00:11 UTC](https://developer.apple.com/news/?id=oqng0zjk)
