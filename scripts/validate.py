"""Check the static artifact for missing local files and broken fragment links."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parents[1] / 'site'
class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.links = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            assert attrs['id'] not in self.ids, f"Duplicate ID: {attrs['id']}"
            self.ids.add(attrs['id'])
        for attribute in ('href', 'src'):
            if attrs.get(attribute):
                self.links.append(attrs[attribute])
for path in root.rglob('*.html'):
    doc = Document()
    doc.feed(path.read_text())
    for link in doc.links:
        parsed = urlsplit(link)
        if parsed.scheme or parsed.netloc:
            assert parsed.scheme == 'https', f'Unexpected external URL: {link}'
            continue
        if parsed.path:
            base = root if link.startswith('/') else path.parent
            target = base / parsed.path.lstrip('/')
            assert target.exists(), f'Missing local file: {link}'
        elif parsed.fragment:
            assert parsed.fragment in doc.ids, f'Missing fragment: {link}'
ET.parse(root / 'sitemap.xml')
assert (root / '.nojekyll').exists()
print('Static files, internal links, unique IDs, and sitemap validated.')
