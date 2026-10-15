# TheAgentHealth website

Source for **https://theagenthealth.github.io/**. A responsive, accessible static project website built with HTML, CSS, and a small clipboard helper. No build system, external fonts, analytics, or runtime dependencies.

## Local preview

```sh
python3 -m http.server 8080 --directory site
```

Open http://localhost:8080. Edit files in `site/`.

## Publication

Pushing `main` regenerates the docs from `agenthealth/main`, validates and deploys `site/` to GitHub Pages using this repository's built-in workflow credentials. A daily scheduled run picks up upstream documentation changes; manual workflow dispatch can refresh them immediately. The workflow records the exact documentation source commit in its run summary. Failed generation or validation stops deployment. All source and hosting configuration live in this repository.

## Content

The landing page describes the full platform scope through roadmap Phase 26, per the project owner's editorial direction. The hero dependency view is labeled illustrative. Check the source project's release notes for version-specific implementation coverage.

`site/docs/` is a generated wiki mirroring select guides from `agenthealth/docs/` and
examples from `agenthealth/examples/`. Regenerate it after those change, with a sibling
`agenthealth` checkout available:

```sh
python3 scripts/build_docs.py ../agenthealth
```

This requires `markdown-it-py` (`pip install -r scripts/requirements.txt`). The script is a
local maintenance tool and a required deployment step. Its output (`site/docs/`) is committed for local preview; deployment always regenerates it from current source.
Edit `scripts/build_docs.py`'s `DOCS`/`EXAMPLES` lists to add or remove mirrored pages.
The build also refreshes the sitemap. Current guides include the v0.14.0
JavaScript/TypeScript SDK, Python SDK, examples and publication verification.
When syncing a new release, update the landing page's release and registry links too.

## Validation

```sh
python3 scripts/validate.py
node --check site/script.js
```

Licensed under Apache 2.0.
