---
title: "Developer Tools and AI Engineering Digest — 2026-10-17"
date: 2026-10-17T11:31:28.396Z
lastmod: 2026-10-17T11:31:28.396Z
slug: developer-tools-2026-10-17
translationKey: developer-tools-2026-10-17
draft: false
showToc: false
newsEdition: developer
newsItems: [{"title":"Claude Code v2.1.302 adds idle-compaction controls in /config","summary":"Claude Code v2.1.302 adds an Idle compaction row in /config to turn idle compaction off or on. It also adds CLAUDE_CODE_AUTO_MODE_MODEL to select the client-side auto-mode classifier model; this does not change the server-side auto-mode model.","countries":[],"topics":["developer-tools"],"sourceUrls":["https://github.com/anthropics/claude-code/releases/tag/v2.1.302"],"attributions":[]},{"title":"Claude Code v2.1.301 adds a limit on unattended usage-limit waiting","summary":"Claude Code v2.1.301 adds CLAUDE_CODE_RETRY_WATCHDOG_MAX_USAGE_LIMIT_WAIT_MS. In unattended retry mode, it ends a request when a usage-limit reset is too far away, rather than continuing to wait.","countries":[],"topics":["developer-tools"],"sourceUrls":["https://github.com/anthropics/claude-code/releases/tag/v2.1.301"],"attributions":[]},{"title":"Claude Code v2.1.299 adds file-mention control and idle compaction","summary":"Claude Code v2.1.299 adds CLAUDE_CODE_DISABLE_FILE_MENTIONS: file mentions supply paths for Claude to read with its file tools instead of injecting the file contents. The release also adds idle compaction in the terminal.","countries":[],"topics":["developer-tools"],"sourceUrls":["https://github.com/anthropics/claude-code/releases/tag/v2.1.299"],"attributions":[]},{"title":"Codex 0.163.0 adds searchable preferences and mid-response steering","summary":"Codex 0.163.0 adds searchable preferences through /config, follow-up messages that steer an ongoing response, and configurable leader keys in /keymap. Supported preferences can change immediately, while changes requiring a restart are identified.","countries":[],"topics":["developer-tools"],"sourceUrls":["https://github.com/openai/codex/releases/tag/rust-v0.163.0"],"attributions":[]},{"title":"Google organises ADK recipes into reusable agent-development layers","summary":"Google’s google/adk-recipes repository organises Agent Development Kit resources into core/, plugins/ and contrib/. Its developer post describes reference patterns, installable skills for coding assistants and multilingual service deployment, according to Google.","countries":[],"topics":["developer-tools"],"sourceUrls":["https://developers.googleblog.com/three-layers-one-repo-a-tour-of-googleadk-recipes/"],"attributions":[]},{"title":"Google publishes a practical guide to continuous AI-agent evaluation","summary":"Google’s developer blog introduces an engineering guide and reference architecture for continuous evaluation of multi-turn AI agents, using Gemini Enterprise Agent Platform, Google ADK and OpenInference standards.","countries":[],"topics":["developer-tools"],"sourceUrls":["https://developers.googleblog.com/evaluating-ai-agents-moving-past-the-vibe-check/"],"attributions":[]},{"title":"Google OAuth adds DPoP support to bind refresh tokens cryptographically","summary":"Google announced DPoP support for its OAuth platform to cryptographically bind refresh tokens. The developer post also describes secure token delegation for multi-agent and Model Context Protocol workloads using Google Cloud Secure Token Service.","countries":[],"topics":["developer-tools"],"sourceUrls":["https://developers.googleblog.com/announcing-dpop-support-for-google-oauth-securing-refresh-tokens/"],"attributions":[]},{"title":"Apple revises App Review Guidelines for new features and policies","summary":"Apple published updated App Review Guidelines, adding a guideline for creative assets and clarifying its policy on hidden, dormant or undocumented features.","countries":[],"topics":["developer-tools"],"sourceUrls":["https://developer.apple.com/news/?id=92th7e5i"],"attributions":[]},{"title":"Apple updates its Developer Program License Agreement","summary":"Apple revised the Developer Program License Agreement, including security requirements and terms for the Live Assistance API and App Replacement Entitlement, and asks developers to review and accept the updated terms.","countries":[],"topics":["developer-tools"],"sourceUrls":["https://developer.apple.com/news/?id=17mwd36z"],"attributions":[]},{"title":"Apple recommends Xcode 27.1 and Device Hub for iPhone Duo app preparation","summary":"Apple’s developer guidance recommends recompiling apps with Xcode 27.1 for iPhone Duo support and using Device Hub to check app behaviour across poses and orientations.","countries":[],"topics":["developer-tools"],"sourceUrls":["https://developer.apple.com/news/?id=kkphp5qo"],"attributions":[]},{"title":"DeepSeek opens its in-house search API","summary":"DeepSeek announced the opening of its in-house search API. Its change log links developers to a Search & Fetch guide for using the service.","countries":[],"topics":["developer-tools"],"sourceUrls":["https://api-docs.deepseek.com/updates/#opening-up-the-in-house-search-api"],"attributions":[]},{"title":"DeepSeek updates Flash to DeepSeek-V4.1-Flash-1017","summary":"DeepSeek says its Flash model has been updated to DeepSeek-V4.1-Flash-1017, including its web and app models. It says the API calling method and pricing remain unchanged, and developers can use deepseek-flash to access the updated model.","countries":[],"topics":["developer-tools"],"sourceUrls":["https://api-docs.deepseek.com/updates/#deepseek-v41-flash-1017-update"],"attributions":[]}]
---

Source window: 2026-10-04–2026-10-17. Publication or update dates are shown with each source.

## Highlights

- [Claude Code v2.1.302 adds idle-compaction controls in /config](#news-1)

- [Claude Code v2.1.301 adds a limit on unattended usage-limit waiting](#news-2)

- [Claude Code v2.1.299 adds file-mention control and idle compaction](#news-3)

## Claude Code v2.1.302 adds idle-compaction controls in /config {#news-1}

Claude Code v2.1.302 adds an Idle compaction row in /config to turn idle compaction off or on. It also adds CLAUDE_CODE_AUTO_MODE_MODEL to select the client-side auto-mode classifier model; this does not change the server-side auto-mode model.

[Source: Anthropic Claude Code · Updated 2026-10-16 20:53:06 UTC](https://github.com/anthropics/claude-code/releases/tag/v2.1.302)

## Claude Code v2.1.301 adds a limit on unattended usage-limit waiting {#news-2}

Claude Code v2.1.301 adds CLAUDE_CODE_RETRY_WATCHDOG_MAX_USAGE_LIMIT_WAIT_MS. In unattended retry mode, it ends a request when a usage-limit reset is too far away, rather than continuing to wait.

[Source: Anthropic Claude Code · Updated 2026-10-15 19:22:06 UTC](https://github.com/anthropics/claude-code/releases/tag/v2.1.301)

## Claude Code v2.1.299 adds file-mention control and idle compaction {#news-3}

Claude Code v2.1.299 adds CLAUDE_CODE_DISABLE_FILE_MENTIONS: file mentions supply paths for Claude to read with its file tools instead of injecting the file contents. The release also adds idle compaction in the terminal.

[Source: Anthropic Claude Code · Updated 2026-10-14 02:49:42 UTC](https://github.com/anthropics/claude-code/releases/tag/v2.1.299)

## Codex 0.163.0 adds searchable preferences and mid-response steering {#news-4}

Codex 0.163.0 adds searchable preferences through /config, follow-up messages that steer an ongoing response, and configurable leader keys in /keymap. Supported preferences can change immediately, while changes requiring a restart are identified.

[Source: OpenAI Codex · Published 2026-10-15 21:30:38 UTC](https://github.com/openai/codex/releases/tag/rust-v0.163.0)

## Google organises ADK recipes into reusable agent-development layers {#news-5}

Google’s google/adk-recipes repository organises Agent Development Kit resources into core/, plugins/ and contrib/. Its developer post describes reference patterns, installable skills for coding assistants and multilingual service deployment, according to Google.

[Source: Google for Developers · Published 2026-10-15](https://developers.googleblog.com/three-layers-one-repo-a-tour-of-googleadk-recipes/)

## Google publishes a practical guide to continuous AI-agent evaluation {#news-6}

Google’s developer blog introduces an engineering guide and reference architecture for continuous evaluation of multi-turn AI agents, using Gemini Enterprise Agent Platform, Google ADK and OpenInference standards.

[Source: Google for Developers · Published 2026-10-15](https://developers.googleblog.com/evaluating-ai-agents-moving-past-the-vibe-check/)

## Google OAuth adds DPoP support to bind refresh tokens cryptographically {#news-7}

Google announced DPoP support for its OAuth platform to cryptographically bind refresh tokens. The developer post also describes secure token delegation for multi-agent and Model Context Protocol workloads using Google Cloud Secure Token Service.

[Source: Google for Developers · Published 2026-10-15](https://developers.googleblog.com/announcing-dpop-support-for-google-oauth-securing-refresh-tokens/)

## Apple revises App Review Guidelines for new features and policies {#news-8}

Apple published updated App Review Guidelines, adding a guideline for creative assets and clarifying its policy on hidden, dormant or undocumented features.

[Source: Apple Developer · Published 2026-10-16 20:05:42 UTC](https://developer.apple.com/news/?id=92th7e5i)

## Apple updates its Developer Program License Agreement {#news-9}

Apple revised the Developer Program License Agreement, including security requirements and terms for the Live Assistance API and App Replacement Entitlement, and asks developers to review and accept the updated terms.

[Source: Apple Developer · Published 2026-10-13 22:00:09 UTC](https://developer.apple.com/news/?id=17mwd36z)

## Apple recommends Xcode 27.1 and Device Hub for iPhone Duo app preparation {#news-10}

Apple’s developer guidance recommends recompiling apps with Xcode 27.1 for iPhone Duo support and using Device Hub to check app behaviour across poses and orientations.

[Source: Apple Developer · Published 2026-10-06 00:05:33 UTC](https://developer.apple.com/news/?id=kkphp5qo)

## DeepSeek opens its in-house search API {#news-11}

DeepSeek announced the opening of its in-house search API. Its change log links developers to a Search & Fetch guide for using the service.

[Source: DeepSeek · Published 2026-10-17](https://api-docs.deepseek.com/updates/#opening-up-the-in-house-search-api)

## DeepSeek updates Flash to DeepSeek-V4.1-Flash-1017 {#news-12}

DeepSeek says its Flash model has been updated to DeepSeek-V4.1-Flash-1017, including its web and app models. It says the API calling method and pricing remain unchanged, and developers can use deepseek-flash to access the updated model.

[Source: DeepSeek · Published 2026-10-17](https://api-docs.deepseek.com/updates/#deepseek-v41-flash-1017-update)
