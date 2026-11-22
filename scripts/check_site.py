#!/usr/bin/env python3
"""Validate the built site and its publication scope using the standard library."""

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / '_site'
errors = []


class Page(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.ids = set()
        self.references = []
        self.title = False
        self.lang = False
        self.description = False
        self.images = []
        self.source = source

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'):
            if attrs['id'] in self.ids:
                errors.append(f'{self.source}: duplicate id {attrs["id"]}')
            self.ids.add(attrs['id'])
        if tag == 'html':
            self.lang = bool(attrs.get('lang'))
        if tag == 'title':
            self.title = True
        if tag == 'meta' and attrs.get('name') == 'description':
            self.description = bool(attrs.get('content'))
        if tag == 'a' and attrs.get('target') == '_blank':
            if 'noopener' not in attrs.get('rel', ''):
                errors.append(f'{self.source}: external tab lacks noopener')
        if tag == 'img' and 'alt' not in attrs:
            errors.append(f'{self.source}: image lacks alt attribute')
        if tag == 'img':
            self.images.append(attrs)
        for key in ('href', 'src', 'poster', 'data-video', 'data-poster'):
            if attrs.get(key):
                self.references.append(attrs[key])


def local_target(reference, source):
    url = urlsplit(reference)
    if url.scheme or url.netloc or not url.path and not url.fragment:
        return None, None
    path = unquote(url.path)
    target = BUILD / path.lstrip('/') if path.startswith('/') else source.parent / path
    if not path:
        target = source
    if target.is_dir():
        target = target / 'index.html'
    return target.resolve(), unquote(url.fragment)


if not (BUILD / 'index.html').exists():
    sys.exit('Build the site first: bundle exec jekyll build')

pages = {}
for source in BUILD.rglob('*.html'):
    text = source.read_text()
    if '{{' in text or '{%' in text:
        errors.append(f'{source.relative_to(BUILD)}: unrendered Liquid')
    page = Page(source.relative_to(BUILD))
    page.feed(text)
    pages[source.resolve()] = page

for source, page in pages.items():
    for reference in page.references:
        target, fragment = local_target(reference, source)
        if target is None:
            continue
        if not target.is_relative_to(BUILD.resolve()):
            errors.append(f'{page.source}: reference escapes output: {reference}')
        elif not target.is_file():
            errors.append(f'{page.source}: missing asset or page: {reference}')
        elif fragment and target in pages and fragment not in pages[target].ids:
            errors.append(f'{page.source}: missing anchor: {reference}')

home = pages[(BUILD / 'index.html').resolve()]
for required in ('main', 'research', 'publications', 'news', 'about', 'contact'):
    if required not in home.ids:
        errors.append(f'Homepage is missing section #{required}')
if not all((home.title, home.lang, home.description)):
    errors.append('Homepage is missing title, language, or description')

for css in (BUILD / 'assets/css').glob('*.css'):
    for reference in re.findall(r'url\([\'\"]?([^\)\'\"]+)', css.read_text()):
        target, _ = local_target(reference, css)
        if target is not None and not target.is_file():
            errors.append(f'{css.name}: missing CSS asset: {reference}')

publications = json.loads((ROOT / '_data/publications.json').read_text())
seen = set()
for paper in publications:
    label = paper.get('id', '<missing id>')
    if label in seen:
        errors.append(f'Duplicate publication id: {label}')
    seen.add(label)
    authors = paper.get('authors', '')
    if 'Xingyu Miao' not in authors or paper.get('first_author') is not authors.startswith('Xingyu Miao'):
        errors.append(f'{label}: author list and first-author attribution disagree')
    if not re.fullmatch(r'\d{4}', str(paper.get('year', ''))):
        errors.append(f'{label}: invalid publication year')
    source_record = paper.get('scholar') or paper.get('paper', '')
    if not source_record.startswith(('https://scholar.google.com/citations?', 'https://arxiv.org/abs/')):
        errors.append(f'{label}: missing source record')
    if paper.get('status') == 'Preprint' and paper.get('venue') != 'arXiv':
        errors.append(f'{label}: preprint incorrectly presented as a published venue')
    if paper.get('bibtex'):
        citation = ROOT / 'assets/citations' / (label + '.bib')
        if not citation.is_file() or citation.read_text().strip() != paper['bibtex'].strip():
            errors.append(f'{label}: downloadable citation is missing or out of sync')
    if 'paper-' + label not in home.ids:
        errors.append(f'{label}: publication was not rendered')
    if paper.get('image'):
        source = paper.get('figure_source', {})
        if not source.get('pdf', '').startswith('https://') or source.get('page', 0) < 1:
            errors.append(f'{label}: figure lacks PDF source and page provenance')
        image = next((i for i in home.images if i.get('src') == paper['image']), {})
        if (image.get('width') != str(paper.get('image_width')) or
                image.get('height') != str(paper.get('image_height'))):
            errors.append(f'{label}: image dimensions do not match the figure manifest')
        if not image.get('alt'):
            errors.append(f'{label}: paper figure lacks a description')

for path in ('Gemfile', 'Gemfile.lock', 'README.md', 'scripts/check_site.py', 'images', '_sass', 'package.json'):
    if (BUILD / path).exists():
        errors.append(f'Unneeded source or legacy file is exposed in build: {path}')

if errors:
    print('\n'.join('ERROR: ' + error for error in errors))
    sys.exit(1)
print(f'Passed: {len(pages)} HTML pages, {len(publications)} publications, '
      'local assets, anchors, metadata, source records, and downloadable citations.')
