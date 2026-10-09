# TheAgentHealth website

Source for **https://theagenthealth.github.io/**. A responsive, accessible static project website built with HTML, CSS, and a small clipboard helper. No build system, external fonts, analytics, or runtime dependencies.

## Local preview

```sh
python3 -m http.server 8080 --directory site
```

Open http://localhost:8080. Edit files in `site/`.

## Publication

Pushing `main` validates and deploys `site/` directly to GitHub Pages using this repository's built-in workflow credentials. Manual workflow dispatch can republish the current source. All source and hosting configuration live in this repository.

## Content

The landing page describes the full platform scope through roadmap Phase 26, per the project owner's editorial direction. Download and documentation links point to the real project. The hero dependency view is labeled illustrative. Check the source project's release notes for version-specific implementation coverage.

## Validation

```sh
python3 scripts/validate.py
node --check site/script.js
```

Licensed under Apache 2.0.
