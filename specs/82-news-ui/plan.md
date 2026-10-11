# Design

Use repository-owned Hugo overrides, CSS/JS and source metadata without updating the theme. Add front matter newsItems through the edition renderer and migrate the two current editions; old news stays accessible in the directory. Browser filters operate on server-rendered cards with no remote search. Validate generated HTML and XML after the build, including hostile search text. Preserve completed run markers and roll out a compatible runtime before the next schedule.

Runtime rollout requires the two public JSON metadata files in the otherwise deny-all Docker context. Keep credentials, editorial content and private reader artifacts excluded; verify the immutable main image after CI. Build 38130913852 exposed the missing allowlist and did not deploy.
