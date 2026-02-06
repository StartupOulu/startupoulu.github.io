# AGENTS.md - AI Agent Guidelines for StartupOulu Website

This document provides guidelines for AI agents working on the StartupOulu website codebase.

## Project Overview

StartupOulu is a Jekyll-based static website for the startup and entrepreneurship ecosystem in Oulu, Finland. The site aggregates events, blog posts, ecosystem services, incubator programs, and mentoring resources for entrepreneurs at various stages.

- **Framework:** Jekyll (Ruby-based static site generator)
- **Hosting:** GitHub Pages (auto-deploys on push to `main`)
- **Domain:** startupoulu.com (configured via `CNAME` file)
- **Languages:** Bilingual content (English and Finnish)
- **Analytics:** Plausible and Umami (privacy-focused, configured in `_includes/header.html`)

## Directory Structure

```
.github/
  workflows/
    validate-content.yml # CI: validates content and builds site on push/PR
_config.yml              # Jekyll configuration (PROTECTED)
_data/
  services.yaml          # Ecosystem services/partners data
_events/                 # Event files (YYYY-MM-slug.html)
_posts/                  # Blog posts (YYYY-MM-DD-slug.markdown)
_layouts/                # Page templates
_includes/               # Reusable HTML components
  events/                # Event-specific components (card, datetime, image, badge)
  services/              # Service-specific components (card, filtered-list)
  header.html            # Head tag with analytics (PROTECTED)
  footer.html            # Site footer with sponsors and social links
  menu.html              # Navigation structure
  nav.html               # Navigation links
  meta_tags.html         # SEO meta tags
  newsletter.html        # Newsletter signup
_sass/                   # SCSS stylesheets
  _variables.scss        # Colors, typography, breakpoints
  _main.scss             # Main import file
  _components/           # Component styles (event_card, menu, newsletter, etc.)
  _pages/                # Page-specific styles (home, event, service, blog, etc.)
  _responsive/           # Mobile/responsive overrides
_scripts/
  events.rb              # Utility: convert events CSV to HTML
assets/
  css/styles.scss        # SCSS entry point
  main.js                # Site JavaScript
  images/
    events/              # Event cover images
    blogs/               # Blog post images
    contacts/            # Team member photos
    mentors/             # Mentor profile images
    logos/               # Logo files (SVG, PNG)
services/                # Service pages by entrepreneurship stage
ai-incubator/            # AI incubator program pages
incubator/               # Incubator program pages
mentoring/               # Mentoring program pages
oulu-startup-database/   # Startup database section
debug/                   # Debug/troubleshooting pages
index.html               # Homepage (layout: frontpage)
events.html              # Events listing page
blogs.html               # Blog listing page
archive.html             # Blog archive
contact.html             # Contact page
debug.html               # Debug page showing all events data
ai-content.txt           # AI-readable content feed (all posts/events as plain text)
events.ics               # iCal feed of events
404.html                 # Custom 404 page
```

## Protected Files

These files require explicit user approval before any modification:

- **`_config.yml`** - Site-wide Jekyll configuration affecting the entire build
- **`_includes/header.html`** - Contains Plausible and Umami analytics tracking codes

Do not modify these files without asking the user first.

## File Naming Rules

All filenames in this project follow these rules:

- **All lowercase** — `startup-pitch.html`, not `Startup-Pitch.html`
- **Dashes instead of spaces or underscores** — `my-event.html`, not `my event.html` or `my_event.html`
- **Only one dot** — the dot goes before the file extension. `2026-03-my-event.html`, not `2026-03-my.event.html`
- **No special characters** — only letters (a–z), numbers (0–9), and dashes
- **Start with a date** — events use `YYYY-MM-slug.html`, blog posts use `YYYY-MM-DD-slug.markdown`

| Content type | Format | Example |
|---|---|---|
| Event | `YYYY-MM-slug.html` | `2026-03-startup-pitch.html` |
| Blog post | `YYYY-MM-DD-slug.markdown` | `2026-03-15-building-bridges.markdown` |
| Event image | `descriptive-name.ext` | `2026-03-startup-pitch.jpg` |
| Blog image | `descriptive-name.ext` | `2026-03-building-bridges.png` |

## Content Types and Front Matter

### Events

**Location:** `_events/`
**Naming:** `YYYY-MM-slug.html` (e.g., `2026-02-polar-bear-pitching.html`)
**Layout:** `event`

```yaml
---
layout: event
title: Event Title
start_time: 2026-02-15 18:00:00    # Format: YYYY-MM-DD HH:MM:SS
end_time: 2026-02-15 21:00:00      # Format: YYYY-MM-DD HH:MM:SS
location: Venue Name, Address
cover_image: event-image.jpg        # Filename only (path added automatically)
cta_title: Register                 # Button text (optional)
cta_link: https://example.com       # Button URL (optional)
excerpt: |                          # Short description, max 60 words (optional)
  Brief event description for cards and previews.
description: |                      # Full event description (required)
  Complete event description with all details.
---
```

Notes:
- `cover_image` is just the filename; the path `assets/images/events/` is prepended automatically. Do NOT use `image_url` — that is a deprecated field name that won't work
- If `excerpt` is omitted, `description` is used for previews (truncated at 60 words)
- `start_time` and `end_time` must use the exact format `YYYY-MM-DD HH:MM:SS` (e.g., `2026-02-15 18:00:00`). Omitting the time component or using non-zero-padded months (e.g., `2026-4-22`) causes YAML to parse the value as an array instead of a date, which breaks sorting
- Event images go in `assets/images/events/` (recommended: 960x540px, 16:9 ratio)
- To hide an event without deleting the file, add `published: false` to the front matter

### Blog Posts

**Location:** `_posts/`
**Naming:** `YYYY-MM-DD-slug.markdown` (e.g., `2026-02-06-building-bridges.markdown`)
**Layout:** `blog`

```yaml
---
layout: blog
title: Blog Post Title
description: Meta description for SEO and social sharing (1-2 sentences)
blog_image: /assets/images/blogs/image.jpg    # Full path required
---

Post content in Markdown format...
```

Notes:
- `blog_image` requires the full path starting with `/assets/images/blogs/`
- The publication date is derived from the filename
- Blog images go in `assets/images/blogs/` (recommended: 960x540px, 16:9 ratio)
- To hide a blog post without deleting the file, add `published: false` to the front matter

### Services

**Location:** `_data/services.yaml`

```yaml
- title: Service Name
  description: Brief description of the service
  link_label: Learn More
  link_url: https://service-url.com
  stage:
    - just-exploring       # For people exploring entrepreneurship
    - getting-started      # For early-stage startups
    - ready-to-grow        # For growth-stage companies
```

A service can belong to one or more stages.

## YAML Front Matter Gotchas

- **Quote values containing colons** — a title like `Experience the Avanto: Dive In` will break YAML parsing. Wrap it in quotes: `title: "Experience the Avanto: Dive In"`
- **Use `|` pipe syntax for multi-line text** — `description` and `excerpt` fields must use `|` followed by indented text on the next lines
- **`start_time` must include the time** — `2026-04-22 09:00:00` works, but `2026-4-22` gets parsed as a YAML array `[2026, 4, 22]` and breaks the site
- **Use `cover_image`, not `image_url`** — older events may use `image_url` but the current layouts expect `cover_image`

## Content Guidelines

### Language

Content can be in English or Finnish. Match the language of surrounding content or ask the user if unclear.

### Creating New Content

**Always ask the user before creating new content files.** This includes:
- New events in `_events/`
- New blog posts in `_posts/`
- New pages or layouts

### Image Requirements

| Content Type | Directory | Recommended Size | Formats |
|---|---|---|---|
| Event covers | `assets/images/events/` | 960x540px (16:9) | JPG, PNG |
| Blog images | `assets/images/blogs/` | 960x540px (16:9) | JPG, PNG |
| Contact photos | `assets/images/contacts/` | As needed | JPG, PNG |
| Mentor photos | `assets/images/mentors/` | As needed | JPG, PNG |

Filenames must be lowercase with dashes (no spaces). Example: `2026-02-startup-pitch.jpg`

## Layouts

| Layout | Purpose |
|---|---|
| `default.html` | Minimal wrapper (header only) |
| `frontpage.html` | Homepage with hero, nav, footer |
| `event.html` | Single event detail page |
| `events.html` | Events listing page |
| `blog.html` | Single blog post page |
| `blogs.html` | Blog listing page |
| `service.html` | Single service page |
| `services.html` | Services listing page |
| `contact.html` | Contact page |
| `plain.html` | Minimal layout for standalone pages |
| `post.html` | Simple post wrapper |
| `about.html` | About page |

## Technology Stack

- **Jekyll** with GitHub Pages gem
- **SCSS** (compressed output, modular architecture)
- **jQuery 1.12.4** for DOM manipulation
- **Slick.js** for carousels
- **Font Awesome 6.7.1** (CDN) for icons
- **Google Fonts** (Hanken Grotesk typeface)
- **Plugins:** `jekyll-redirect-from`, `jekyll-feed`, `jekyll-sass-converter`

### Brand Colors (from `_sass/_variables.scss`)

- Brand (dark navy): `#070540`
- Orange: `#FF4600`
- Pink: `#FF3198`
- Gray: `#EAEAEA`
- Responsive breakpoint: `800px`

## Development Workflow

### Local Development

```bash
bundle install              # Install Ruby dependencies
bundle exec jekyll serve    # Start local server at http://localhost:4000
```

### CI Validation

A GitHub Actions workflow (`.github/workflows/validate-content.yml`) runs on every push to `main` and on pull requests. It validates:

- YAML front matter syntax and required fields
- File naming conventions (`YYYY-MM-slug.html` for events, `YYYY-MM-DD-slug.markdown` for posts)
- Referenced image files exist
- Full Jekyll build succeeds

Errors appear as annotations in the Actions tab and on the commit/PR page.

### Build Verification

Before committing changes, verify the build succeeds:

```bash
bundle exec jekyll build
```

This catches Liquid syntax errors, invalid YAML front matter, and broken templates.

### Debugging

Visit `/debug/` on the live site (or `debug.html` locally) to see a table of all events with their parsed data. This helps verify that event front matter is correctly formatted.

### Utility Scripts

```bash
ruby _scripts/events.rb     # Convert events CSV to HTML format
```

## Code Style

### SCSS

- Styles are modularized under `_sass/`
- Component styles in `_sass/_components/` (e.g., `_event_card.scss`, `_menu.scss`)
- Page-specific styles in `_sass/_pages/` (e.g., `_home.scss`, `_single_event.scss`)
- Responsive overrides in `_sass/_responsive/` (mirror page style files)
- Variables in `_sass/_variables.scss`
- Main entry point: `_sass/_main.scss` (imports all partials)

### JavaScript

- Main file: `assets/main.js`
- Keep scripts minimal and focused
- Uses jQuery for DOM manipulation

### Liquid Templates

- Follow existing patterns in `_layouts/` and `_includes/`
- Event components are in `_includes/events/` (card, datetime, image, badge)
- Service components are in `_includes/services/` (card, filtered-list)

## Commit Messages

Use short, descriptive commit messages without conventional commit prefixes:

```
add new startup pitch event
update services page layout
fix mobile navigation toggle
remove outdated event
```

Match the existing commit style in the repository history.

## Testing Checklist

Before finalizing changes:

1. Run `bundle exec jekyll build` - must complete without errors
2. Verify YAML front matter syntax is valid
3. Check that image paths are correct and images exist
4. Ensure Liquid template syntax is correct
5. Test responsive behavior if modifying layouts or styles

## Key Considerations

- The homepage shows only future events (filtered by `start_time`)
- Events display a "Today" badge when `start_time` matches the current date
- The `excerpt` field on events is truncated at 60 words on cards
- Blog post dates come from the filename, not front matter
- Services are filtered by stage on dedicated pages under `/services/`
- The site generates an iCal feed (`events.ics`) and an AI content feed (`ai-content.txt`)
- The `mentoring/` section is a standalone page, not a Jekyll collection

## Questions?

If uncertain about any changes, ask the user before proceeding. This is especially important for:
- Creating new content files
- Modifying protected files (`_config.yml`, `_includes/header.html`)
- Changes affecting site-wide behavior or layout
- Architectural or structural changes
