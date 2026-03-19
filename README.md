# Uncle Gray — Photography Portfolio

A minimal, image-first photography portfolio built with [Eleventy](https://www.11ty.dev/).

## Quick Start

```bash
npm install
npm run dev      # Local dev server at http://localhost:8080
npm run build    # Build to _site/
```

## Adding Photos

1. Drop your images into `src/images/<category>/` (e.g., `src/images/portraits/`)
2. Edit the corresponding page in `src/pages/<category>.njk`
3. Add a gallery item:

```html
<a class="gallery-item" href="/images/portraits/my-photo.jpg" data-lightbox>
  <img src="/images/portraits/my-photo.jpg" alt="Description" loading="lazy">
</a>
```

## Adding a New Category

1. Add the category to `src/_data/categories.json`
2. Create a new page in `src/pages/` (copy an existing one)
3. Add a `cover.jpg` to `src/images/<new-category>/`

## Structure

```
src/
├── _data/           # Site data (categories, site info)
├── _includes/
│   ├── layouts/     # Base HTML layout
│   └── partials/    # Reusable components (lightbox)
├── css/             # Styles
├── images/          # Photos organized by category
├── pages/           # Category gallery pages + about
└── index.njk        # Homepage
```
