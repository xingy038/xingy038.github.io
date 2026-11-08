#!/usr/bin/env python3
"""Recreate complete paper figures from the source PDF bounds in publication data.

Optional development dependencies: pymupdf and Pillow.
PDFs must be saved as <publication-id>.pdf in --pdf-directory.
This script is never run by the Jekyll build.
"""

import argparse
import io
import json
from pathlib import Path

import fitz
from PIL import Image

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--pdf-directory', required=True, type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
manifest = root / '_data/publications.json'
papers = json.loads(manifest.read_text())

for paper in papers:
    source = paper.get('figure_source')
    if not source:
        continue
    pdf = args.pdf_directory / (paper['id'] + '.pdf')
    if not pdf.is_file():
        parser.error(f'Missing {pdf}. Source: {source["pdf"]}')
    with fitz.open(pdf) as document:
        clip = fitz.Rect(source['bounds'])
        scale = 1800 / clip.width
        pixmap = document[source['page'] - 1].get_pixmap(
            matrix=fitz.Matrix(scale, scale), clip=clip, alpha=False)
        image = Image.open(io.BytesIO(pixmap.tobytes('png'))).convert('RGB')
        destination = root / paper['image'].lstrip('/')
        image.save(destination, 'WEBP', quality=93, method=6)
        paper['image_width'], paper['image_height'] = image.size
        print(paper['id'], image.size)

manifest.write_text(json.dumps(papers, indent=2, ensure_ascii=False) + '\n')
