"""Generate the static /docs wiki pages under site/ from the agenthealth repo's
docs/ and examples/ markdown. Maintenance-time tool, not part of serving the
site: re-run it after agenthealth/docs or agenthealth/examples change, then
commit the regenerated site/docs/ output like any other static file.

Usage:
    python3 scripts/build_docs.py [path-to-agenthealth-repo]

Defaults to a sibling "agenthealth" checkout next to this website repo.
"""
import os
import re
import sys
from pathlib import Path

from markdown_it import MarkdownIt

SITE_ROOT = Path(__file__).resolve().parents[1] / "site"
GITHUB_REPO = "https://github.com/TheAgentHealth/agenthealth"

# (source .md relative to agenthealth/docs, slug, nav title, meta description)
DOCS = [
    ("architecture.md", "architecture", "Architecture", "Project foundation and architecture decisions."),
    ("cli.md", "cli", "CLI", "Commands, formats, doctor advice, OAuth login, and exit codes."),
    ("installation.md", "installation", "Installation", "Download, verify, and run AgentHealth across distribution channels."),
    ("docker.md", "docker", "Docker", "Running AgentHealth as a container image."),
    ("kubernetes.md", "kubernetes", "Kubernetes", "Manifests, Helm chart, probes, and deployment guidance."),
    ("distribution.md", "distribution", "Distribution", "Release channels and synchronized package publication."),
    ("http-adapter.md", "http-adapter", "HTTP adapter", "Status, headers, bearer auth, body checks, and transport diagnostics."),
    ("mcp-adapter.md", "mcp-adapter", "MCP adapter", "HTTP/stdio transport, protocol selection, OAuth, and functional probes."),
    ("a2a-adapter.md", "a2a-adapter", "A2A adapter", "Agent card discovery, authentication, skills, and safe interactions."),
    ("agent-adapter.md", "agent-adapter", "Agent adapter", "Health resource, capabilities, and safe communication-path probes."),
    ("agent-router.md", "agent-router", "Agent Router", "Router signals and route/backend evidence."),
    ("agentgateway.md", "agentgateway", "Agentgateway", "Gateway signals and backend/path evidence."),
    ("dependency-graph.md", "dependency-graph", "Dependency graph", "Shared nodes, edge policies, budgets, and concurrency."),
    ("ahp.md", "ahp", "AHP (experimental)", "Experimental HTTP serving of health snapshots."),
    ("interoperability.md", "interoperability", "Interoperability", "Standardization status and ecosystem compatibility."),
    ("phase-status.md", "phase-status", "Phase status", "Implementation, documentation, and example coverage by phase."),
]

# (dir under agenthealth/examples, slug, config files to embed inline)
EXAMPLES = [
    ("a2a-check", "a2a-check", ["agenthealth.yaml", "bearer.yaml", "custom-card.yaml", "functional.yaml", "v1.yaml"]),
    ("agent-check", "agent-check", ["agenthealth.yaml"]),
    ("ahp-check", "ahp-check", ["agenthealth.yaml"]),
    ("distribution", "distribution", []),
    ("gateway-check", "gateway-check", ["agenthealth.yaml"]),
    ("graph-check", "graph-check", ["agenthealth.yaml"]),
    ("kubernetes", "kubernetes", ["agenthealth.yaml"]),
    ("router-check", "router-check", ["agenthealth.yaml"]),
]

md = MarkdownIt("commonmark", {"html": False}).enable(["table", "strikethrough"])

HEADING_RE = re.compile(r"<h([1-4])>(.*?)</h\1>", re.S)
TAG_RE = re.compile(r"<[^>]+>")
HREF_RE = re.compile(r'href="([^"]*)"')


def slugify(text: str) -> str:
    text = TAG_RE.sub("", text).strip().lower()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"\s+", "-", text)


def add_heading_ids(html: str) -> str:
    used: set[str] = set()

    def repl(match: re.Match) -> str:
        level, inner = match.group(1), match.group(2)
        slug = base = slugify(inner) or "section"
        i = 1
        while slug in used:
            slug = f"{base}-{i}"
            i += 1
        used.add(slug)
        return f'<h{level} id="{slug}">{inner}</h{level}>'

    return HEADING_RE.sub(repl, html)


def build_path_map(repo: Path) -> dict[str, str]:
    """repo-relative markdown path -> site-relative generated page path."""
    mapping = {"docs/README.md": "docs/index.html", "examples/README.md": "docs/examples/index.html"}
    for source, slug, _, _ in DOCS:
        mapping[f"docs/{source}"] = f"docs/{slug}.html"
    for dir_name, slug, _ in EXAMPLES:
        mapping[f"examples/{dir_name}/README.md"] = f"docs/examples/{slug}.html"
    return mapping


def rewrite_links(html: str, current_repo_path: str, path_map: dict[str, str], current_site_path: str, repo: Path) -> str:
    current_dir = os.path.dirname(current_repo_path)

    def repl(match: re.Match) -> str:
        href = match.group(1)
        if href.startswith(("http://", "https://", "mailto:", "#")):
            return match.group(0)
        path_part, _, fragment = href.partition("#")
        target_repo_path = os.path.normpath(os.path.join(current_dir, path_part)).replace(os.sep, "/")
        if target_repo_path in path_map:
            target_site_path = path_map[target_repo_path]
            rel = os.path.relpath(target_site_path, os.path.dirname(current_site_path)).replace(os.sep, "/")
            new_href = rel + (f"#{fragment}" if fragment else "")
        else:
            is_dir = (repo / target_repo_path).is_dir()
            kind = "tree" if is_dir else "blob"
            new_href = f"{GITHUB_REPO}/{kind}/main/{target_repo_path}" + (f"#{fragment}" if fragment else "")
        return f'href="{new_href}"'

    return HREF_RE.sub(repl, html)


def nav_sidebar(current_site_path: str) -> str:
    def rel(target: str) -> str:
        return os.path.relpath(target, os.path.dirname(current_site_path)).replace(os.sep, "/")

    def link(target: str, label: str) -> str:
        cls = ' class="current"' if target == current_site_path else ""
        return f'<a href="{rel(target)}"{cls}>{label}</a>'

    guides = "".join(link(f"docs/{slug}.html", title) for _, slug, title, _ in DOCS)
    examples = "".join(
        link(f"docs/examples/{slug}.html", slug.replace("-", " "))
        for _, slug, _ in EXAMPLES
    )
    return (
        '<aside class="doc-sidebar" aria-label="Documentation menu">'
        f'<div class="doc-sidebar-group"><span class="doc-sidebar-title">GUIDES</span><nav>{link("docs/index.html", "Overview")}{guides}</nav></div>'
        f'<div class="doc-sidebar-group"><span class="doc-sidebar-title">EXAMPLES</span><nav>{link("docs/examples/index.html", "Overview")}{examples}</nav></div>'
        "</aside>"
    )


def page_shell(site_path: str, title: str, description: str, body_html: str) -> str:
    depth = site_path.count("/")
    root = "../" * depth
    docs_index = os.path.relpath("docs/index.html", os.path.dirname(site_path)).replace(os.sep, "/")
    examples_index = os.path.relpath("docs/examples/index.html", os.path.dirname(site_path)).replace(os.sep, "/")
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} — TheAgentHealth docs</title>
<meta name="description" content="{description}">
<meta name="theme-color" content="#0b1110"><link rel="canonical" href="https://theagenthealth.github.io/{site_path}">
<link rel="icon" href="{root}favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="{root}style.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="header"><a class="brand" href="{root}index.html" aria-label="TheAgentHealth home"><span class="logo" aria-hidden="true">⌁</span>TheAgentHealth</a><nav aria-label="Main navigation"><a href="{docs_index}">Docs</a><a href="{examples_index}">Examples</a><a class="nav-github" href="{GITHUB_REPO}">GitHub ↗</a></nav></header>
<main id="main">
<div class="doc-shell wrap">
{nav_sidebar(site_path)}
<article class="doc-content">
<p class="doc-back"><a href="{docs_index}">← All documentation</a></p>
{body_html}
</article>
</div>
</main>
<footer class="wrap"><a class="brand" href="{root}index.html"><span class="logo" aria-hidden="true">⌁</span>TheAgentHealth</a><p>Universal health & readiness for agentic systems.</p><div><a href="{GITHUB_REPO}">Source</a><a href="https://github.com/TheAgentHealth/theagenthealth.github.io">Website source</a><a href="{GITHUB_REPO}/blob/main/LICENSE">Apache 2.0</a></div></footer>
</body></html>
"""


def render_markdown_file(repo: Path, repo_relative: str, path_map: dict[str, str], site_path: str) -> tuple[str, str]:
    text = (repo / repo_relative).read_text()
    title_match = re.match(r"#\s+(.+)", text.lstrip())
    title = title_match.group(1).strip() if title_match else repo_relative
    # Drop the leading H1; the page shell already renders one implicitly via content.
    body = re.sub(r"^#\s+.+\n+", "", text.lstrip(), count=1)
    html = add_heading_ids(md.render(body))
    html = rewrite_links(html, repo_relative, path_map, site_path, repo)
    return title, f"<h1>{title}</h1>\n{html}"


def config_block(repo: Path, dir_name: str, filenames: list[str]) -> str:
    if not filenames:
        return ""
    parts = ['<div class="doc-config"><h2>Configuration files</h2>']
    for name in filenames:
        content = (repo / "examples" / dir_name / name).read_text()
        parts.append(f'<h3>{name}</h3><pre><code>{html_escape(content)}</code></pre>')
    parts.append("</div>")
    return "\n".join(parts)


def html_escape(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def write(site_path: str, html: str) -> None:
    target = SITE_ROOT / site_path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(html)
    print(f"wrote {site_path}")


def main() -> None:
    repo = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[2] / "agenthealth"
    if not (repo / "docs" / "README.md").is_file():
        sys.exit(f"agenthealth repo not found at {repo} (pass the path as an argument)")
    path_map = build_path_map(repo)

    # Docs hub + guides.
    site_path = "docs/index.html"
    title, body = render_markdown_file(repo, "docs/README.md", path_map, site_path)
    write(site_path, page_shell(site_path, "Documentation", "Documentation index for AgentHealth.", body))

    for source, slug, nav_title, description in DOCS:
        site_path = f"docs/{slug}.html"
        title, body = render_markdown_file(repo, f"docs/{source}", path_map, site_path)
        write(site_path, page_shell(site_path, title, description, body))

    # Examples hub + pages.
    site_path = "docs/examples/index.html"
    title, body = render_markdown_file(repo, "examples/README.md", path_map, site_path)
    write(site_path, page_shell(site_path, "Examples", "Example AgentHealth configurations.", body))

    for dir_name, slug, configs in EXAMPLES:
        site_path = f"docs/examples/{slug}.html"
        title, body = render_markdown_file(repo, f"examples/{dir_name}/README.md", path_map, site_path)
        body += config_block(repo, dir_name, configs)
        write(site_path, page_shell(site_path, title, f"Example configuration: {title}.", body))


if __name__ == "__main__":
    main()
