---
title: "開発ツール・AI開発ブログ — 2026-10-17"
date: 2026-10-17T11:31:28.396Z
lastmod: 2026-10-17T11:31:28.396Z
slug: developer-tools-2026-10-17
translationKey: developer-tools-2026-10-17
draft: false
showToc: false
newsEdition: developer
newsItems: [{"title":"Claude Code v2.1.302、/configで待機中の圧縮を切り替え可能に","summary":"Claude Code v2.1.302は、/configに待機中のコンテキスト圧縮の切り替え項目を追加した。CLAUDE_CODE_AUTO_MODE_MODELはクライアント側の自動モード分類モデルを選択し、サーバー側のモデルは変更しない。","countries":[],"topics":["developer-tools"],"sourceUrls":["https://github.com/anthropics/claude-code/releases/tag/v2.1.302"],"attributions":[]},{"title":"Claude Code v2.1.301、無人再試行で利用上限の解除待ち時間を制限","summary":"Claude Code v2.1.301は、CLAUDE_CODE_RETRY_WATCHDOG_MAX_USAGE_LIMIT_WAIT_MSを追加した。無人再試行モードで利用上限の解除が遠い場合に、待ち続けずリクエストを終了できる。","countries":[],"topics":["developer-tools"],"sourceUrls":["https://github.com/anthropics/claude-code/releases/tag/v2.1.301"],"attributions":[]},{"title":"Claude Code v2.1.299、ファイル参照の制御と待機中の圧縮を追加","summary":"Claude Code v2.1.299は、CLAUDE_CODE_DISABLE_FILE_MENTIONSを追加した。ファイル内容を直接渡す代わりに、Claudeがファイルツールで読み取るパスを渡す。ターミナルで待機中のコンテキスト圧縮も追加した。","countries":[],"topics":["developer-tools"],"sourceUrls":["https://github.com/anthropics/claude-code/releases/tag/v2.1.299"],"attributions":[]},{"title":"Codex 0.163.0、設定検索と応答中の方向修正を追加","summary":"Codex 0.163.0は、/configでの設定検索、応答中に追加メッセージで方向修正する機能、/keymapでのリーダーキー設定を追加した。即時変更できる設定と、再起動が必要な変更を確認できる。","countries":[],"topics":["developer-tools"],"sourceUrls":["https://github.com/openai/codex/releases/tag/rust-v0.163.0"],"attributions":[]},{"title":"Google、ADKレシピを再利用できるエージェント開発の構成に整理","summary":"Googleは、google/adk-recipesのAgent Development Kit関連リソースをcore/、plugins/、contrib/に整理した。公式ブログは、参照パターン、コーディング支援ツールに導入できるスキル、複数言語でのサービスのデプロイを紹介している。","countries":[],"topics":["developer-tools"],"sourceUrls":["https://developers.googleblog.com/three-layers-one-repo-a-tour-of-googleadk-recipes/"],"attributions":[]},{"title":"Google、AIエージェントの継続評価に関する実践ガイドを公開","summary":"Googleの開発者ブログは、複数ターンにわたるAIエージェントを継続評価するための実践ガイドと参照アーキテクチャを紹介した。Gemini Enterprise Agent Platform、Google ADK、OpenInferenceを利用する。","countries":[],"topics":["developer-tools"],"sourceUrls":["https://developers.googleblog.com/evaluating-ai-agents-moving-past-the-vibe-check/"],"attributions":[]},{"title":"Google OAuth、リフレッシュトークンを暗号的に結び付けるDPoPに対応","summary":"GoogleはOAuth基盤で、リフレッシュトークンを暗号的に結び付けるDPoPへの対応を発表した。公式ブログでは、Google Cloud Secure Token Serviceを使った複数エージェントやModel Context Protocol向けの安全なトークン委譲も紹介している。","countries":[],"topics":["developer-tools"],"sourceUrls":["https://developers.googleblog.com/announcing-dpop-support-for-google-oauth-securing-refresh-tokens/"],"attributions":[]},{"title":"Apple、App Reviewガイドラインを改定","summary":"AppleはApp Reviewガイドラインを更新した。クリエイティブ素材に関するガイドラインを追加し、隠された機能、休止中の機能、文書化されていない機能に関する方針を明確にした。","countries":[],"topics":["developer-tools"],"sourceUrls":["https://developer.apple.com/news/?id=92th7e5i"],"attributions":[]},{"title":"Apple、Developer Program使用許諾契約を更新","summary":"AppleはDeveloper Program使用許諾契約を改定した。セキュリティ要件、Live Assistance API、App Replacement Entitlementなどに関する条件が含まれ、変更内容の確認と更新後の条件への同意を求めている。","countries":[],"topics":["developer-tools"],"sourceUrls":["https://developer.apple.com/news/?id=17mwd36z"],"attributions":[]},{"title":"Apple、iPhone Duo向けアプリの準備にXcode 27.1とDevice Hubを案内","summary":"AppleはiPhone Duo向けアプリの準備として、Xcode 27.1での再コンパイルと、Device Hubで姿勢や画面の向きごとのアプリの動作を確認する方法を案内した。","countries":[],"topics":["developer-tools"],"sourceUrls":["https://developer.apple.com/news/?id=kkphp5qo"],"attributions":[]},{"title":"DeepSeek、自社検索APIを公開","summary":"DeepSeekは自社検索APIの公開を発表した。変更履歴では、サービスの利用方法を説明するSearch & Fetchガイドを案内している。","countries":[],"topics":["developer-tools"],"sourceUrls":["https://api-docs.deepseek.com/updates/#opening-up-the-in-house-search-api"],"attributions":[]},{"title":"DeepSeek、FlashをDeepSeek-V4.1-Flash-1017に更新","summary":"DeepSeekは、FlashモデルをDeepSeek-V4.1-Flash-1017に更新し、Web版とアプリ版にも反映したと発表した。APIの呼び出し方法と料金は変更せず、deepseek-flashで更新後のモデルを利用できるとしている。","countries":[],"topics":["developer-tools"],"sourceUrls":["https://api-docs.deepseek.com/updates/#deepseek-v41-flash-1017-update"],"attributions":[]}]
---

対象期間：2026-10-04～2026-10-17。出典の公開・更新日を各項目に記載。

## 今回のハイライト

- [Claude Code v2.1.302、/configで待機中の圧縮を切り替え可能に](#news-1)

- [Claude Code v2.1.301、無人再試行で利用上限の解除待ち時間を制限](#news-2)

- [Claude Code v2.1.299、ファイル参照の制御と待機中の圧縮を追加](#news-3)

## Claude Code v2.1.302、/configで待機中の圧縮を切り替え可能に {#news-1}

Claude Code v2.1.302は、/configに待機中のコンテキスト圧縮の切り替え項目を追加した。CLAUDE_CODE_AUTO_MODE_MODELはクライアント側の自動モード分類モデルを選択し、サーバー側のモデルは変更しない。

[出典: Anthropic Claude Code · 更新 2026-10-16 20:53:06 UTC](https://github.com/anthropics/claude-code/releases/tag/v2.1.302)

## Claude Code v2.1.301、無人再試行で利用上限の解除待ち時間を制限 {#news-2}

Claude Code v2.1.301は、CLAUDE_CODE_RETRY_WATCHDOG_MAX_USAGE_LIMIT_WAIT_MSを追加した。無人再試行モードで利用上限の解除が遠い場合に、待ち続けずリクエストを終了できる。

[出典: Anthropic Claude Code · 更新 2026-10-15 19:22:06 UTC](https://github.com/anthropics/claude-code/releases/tag/v2.1.301)

## Claude Code v2.1.299、ファイル参照の制御と待機中の圧縮を追加 {#news-3}

Claude Code v2.1.299は、CLAUDE_CODE_DISABLE_FILE_MENTIONSを追加した。ファイル内容を直接渡す代わりに、Claudeがファイルツールで読み取るパスを渡す。ターミナルで待機中のコンテキスト圧縮も追加した。

[出典: Anthropic Claude Code · 更新 2026-10-14 02:49:42 UTC](https://github.com/anthropics/claude-code/releases/tag/v2.1.299)

## Codex 0.163.0、設定検索と応答中の方向修正を追加 {#news-4}

Codex 0.163.0は、/configでの設定検索、応答中に追加メッセージで方向修正する機能、/keymapでのリーダーキー設定を追加した。即時変更できる設定と、再起動が必要な変更を確認できる。

[出典: OpenAI Codex · 公開 2026-10-15 21:30:38 UTC](https://github.com/openai/codex/releases/tag/rust-v0.163.0)

## Google、ADKレシピを再利用できるエージェント開発の構成に整理 {#news-5}

Googleは、google/adk-recipesのAgent Development Kit関連リソースをcore/、plugins/、contrib/に整理した。公式ブログは、参照パターン、コーディング支援ツールに導入できるスキル、複数言語でのサービスのデプロイを紹介している。

[出典: Google for Developers · 公開 2026-10-15](https://developers.googleblog.com/three-layers-one-repo-a-tour-of-googleadk-recipes/)

## Google、AIエージェントの継続評価に関する実践ガイドを公開 {#news-6}

Googleの開発者ブログは、複数ターンにわたるAIエージェントを継続評価するための実践ガイドと参照アーキテクチャを紹介した。Gemini Enterprise Agent Platform、Google ADK、OpenInferenceを利用する。

[出典: Google for Developers · 公開 2026-10-15](https://developers.googleblog.com/evaluating-ai-agents-moving-past-the-vibe-check/)

## Google OAuth、リフレッシュトークンを暗号的に結び付けるDPoPに対応 {#news-7}

GoogleはOAuth基盤で、リフレッシュトークンを暗号的に結び付けるDPoPへの対応を発表した。公式ブログでは、Google Cloud Secure Token Serviceを使った複数エージェントやModel Context Protocol向けの安全なトークン委譲も紹介している。

[出典: Google for Developers · 公開 2026-10-15](https://developers.googleblog.com/announcing-dpop-support-for-google-oauth-securing-refresh-tokens/)

## Apple、App Reviewガイドラインを改定 {#news-8}

AppleはApp Reviewガイドラインを更新した。クリエイティブ素材に関するガイドラインを追加し、隠された機能、休止中の機能、文書化されていない機能に関する方針を明確にした。

[出典: Apple Developer · 公開 2026-10-16 20:05:42 UTC](https://developer.apple.com/news/?id=92th7e5i)

## Apple、Developer Program使用許諾契約を更新 {#news-9}

AppleはDeveloper Program使用許諾契約を改定した。セキュリティ要件、Live Assistance API、App Replacement Entitlementなどに関する条件が含まれ、変更内容の確認と更新後の条件への同意を求めている。

[出典: Apple Developer · 公開 2026-10-13 22:00:09 UTC](https://developer.apple.com/news/?id=17mwd36z)

## Apple、iPhone Duo向けアプリの準備にXcode 27.1とDevice Hubを案内 {#news-10}

AppleはiPhone Duo向けアプリの準備として、Xcode 27.1での再コンパイルと、Device Hubで姿勢や画面の向きごとのアプリの動作を確認する方法を案内した。

[出典: Apple Developer · 公開 2026-10-06 00:05:33 UTC](https://developer.apple.com/news/?id=kkphp5qo)

## DeepSeek、自社検索APIを公開 {#news-11}

DeepSeekは自社検索APIの公開を発表した。変更履歴では、サービスの利用方法を説明するSearch & Fetchガイドを案内している。

[出典: DeepSeek · 公開 2026-10-17](https://api-docs.deepseek.com/updates/#opening-up-the-in-house-search-api)

## DeepSeek、FlashをDeepSeek-V4.1-Flash-1017に更新 {#news-12}

DeepSeekは、FlashモデルをDeepSeek-V4.1-Flash-1017に更新し、Web版とアプリ版にも反映したと発表した。APIの呼び出し方法と料金は変更せず、deepseek-flashで更新後のモデルを利用できるとしている。

[出典: DeepSeek · 公開 2026-10-17](https://api-docs.deepseek.com/updates/#deepseek-v41-flash-1017-update)
