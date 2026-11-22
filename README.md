# Xingyu Miao

Personal research homepage for [xingy038.github.io](https://xingy038.github.io), focused on embodied AI, world models, and robot learning.

A compact academic layout puts the researcher, biography, contact links, and publications first. It uses Jekyll, plain CSS, and vanilla JavaScript, with no theme or client-side framework. Content is readable without JavaScript; filters, citation dialogs, and figure enlargement are progressive enhancements.

## Develop

```sh
bundle install
bundle exec jekyll serve --host 127.0.0.1
```

Open `http://127.0.0.1:4000`. Build and validate with:

```sh
bundle exec jekyll build
python3 scripts/check_site.py
```

The verifier uses Python 3.9+ and only the standard library. It checks local links, assets, internal anchors, metadata, first-author scope, downloadable citations, and figure provenance. GitHub Pages can build the repository directly using its existing publishing settings.

## Content

| File | Purpose |
| --- | --- |
| `index.html` | Biography, News, publications, and education |
| `_data/profile.yml` | Contact links and update date |
| `_data/publications.json` | First-author papers, citations, figure dimensions, and PDF sources |
| `_data/news.yml` | Research updates, including collaborative work |
| `_includes/publication.html` | Publication rows and links to complete figures |
| `_layouts/home.html` | Metadata, navigation, footer, and dialogs |
| `assets/css/site.css` | Responsive academic layout |
| `assets/js/site.js` | Filtering, search, citations, and figure enlargement |
| `assets/media/` | Portrait and figures extracted from original papers |
| `assets/citations/` | Downloadable BibTeX, synchronized with publication data |

All 11 first-author papers are displayed by default. Other collaborations belong in News. Equal contribution is marked with `*` when verified. The dissertation is not counted as a research paper.

Metadata was checked against the author's Google Scholar profile on **8 November 2026**, with proceedings, arXiv, and university records used where available. M²StyleGS uses BMVC 2025, the actual conference year, rather than Scholar's 2026 entry. DS-Depth uses its 2023 online publication year; its citation uses the 2024 journal issue. Dreamer XL uses the published journal author order and DOI from the Durham University repository. InternW0-Δ is listed as a technical report; other preprints remain labeled arXiv.

## Paper figures

The 11 main research papers have figures extracted directly from the source PDFs. Each `figure_source` records the source URL, page, and bounds in PDF points. The extraction retains the entire illustration, including its panels and labels. Thumbnails use their natural aspect ratio, without fixed-height containers, cropping, or hover scaling. Clicking a figure opens a dialog with fit-to-window and original-size views. Without JavaScript, the same link opens the image itself.

To reproduce the assets, install the optional development dependencies `pymupdf` and `Pillow`, download the PDFs from the recorded URLs as `<publication-id>.pdf`, and run:

```sh
python3 scripts/extract_figures.py --pdf-directory /path/to/pdfs
```

PDFs and extraction dependencies are not needed for building or serving the site. The large source PDFs are not committed.

The portrait is retained from the author's original site. DM Sans and Hedvig Letters Serif are self-hosted from [Google Fonts](https://github.com/google/fonts) with their SIL Open Font Licenses in `assets/fonts/`. See `LICENSE` for retained upstream attribution.
