# AGENTS.md - AI Agent Guidelines for StartupOulu Website

This document provides guidelines for AI agents working on the StartupOulu website codebase.

## Project Overview

StartupOulu is a Jekyll-based static website for an entrepreneurial community hub in Oulu, Finland. The site serves as a central resource for entrepreneurs, featuring events, blog posts, ecosystem services, and incubator programs.

- **Framework:** Jekyll (Ruby-based static site generator)
- **Hosting:** GitHub Pages
- **Domain:** www.startupoulu.com
- **Languages:** Bilingual (English and Finnish)

## Directory Structure

```
_config.yml          # Site configuration (PROTECTED)
_data/services.yaml  # Ecosystem services data
_events/             # Event files (YYYY-MM-slug.html)
_posts/              # Blog posts (YYYY-MM-DD-slug.markdown)
_layouts/            # HTML templates
_includes/           # Reusable components (header.html contains analytics - PROTECTED)
_sass/               # SCSS stylesheets
assets/              # CSS, JS, and images
services/            # Service pages by stage
incubator/           # Incubator program pages
```

## Protected Files

The following files require explicit user approval before modification:

- `_config.yml` - Site-wide Jekyll configuration
- `_includes/header.html` - Contains analytics tracking codes (Plausible, Umami)

Do not modify these files without asking the user first.

## Content Guidelines

### Language

Content can be written in either English or Finnish depending on context. Match the language of surrounding content or ask the user if unclear.

### Creating New Content

**Always ask before creating new files.** This includes:
- New events in `_events/`
- New blog posts in `_posts/`
- New pages or layouts

### Event Files

Location: `_events/`
Naming: `YYYY-MM-slug.html` (e.g., `2026-02-startup-pitch-night.html`)

Required front matter:
```yaml
---
layout: event
title: Event Title
start_time: 2026-02-15 18:00:00
end_time: 2026-02-15 21:00:00
location: Venue Name
cover_image: event-image.jpg
cta_title: Register Now
cta_link: https://registration-link.com
excerpt: Brief description (max 60 words)
---

Full event description in HTML...
```

Images go in `assets/images/events/`.

### Blog Posts

Location: `_posts/`
Naming: `YYYY-MM-DD-slug.markdown` (e.g., `2026-01-15-startup-ecosystem-update.markdown`)

Required front matter:
```yaml
---
layout: blog
title: Post Title
description: Meta description for SEO
blog_image: /assets/images/blogs/image.jpg
---

Post content in Markdown...
```

### Services Data

Location: `_data/services.yaml`

Structure:
```yaml
- title: Service Name
  description: Brief description
  link_label: Learn More
  link_url: https://service-url.com
  stage:
    - just-exploring
    - getting-started
    - ready-to-grow
```

Stages correspond to entrepreneur journey phases.

## Development Workflow

### Building the Site

Before committing changes, verify the build succeeds:

```bash
bundle exec jekyll build
```

This ensures no Liquid syntax errors or broken templates.

### Local Development (Optional)

For live preview during development:

```bash
bundle install
bundle exec jekyll serve
```

Site will be available at `http://localhost:4000`.

## Code Style

### SCSS

- Styles are modularized in `_sass/`
- Component styles: `_sass/_components/`
- Page-specific styles: `_sass/_pages/`
- Responsive styles: `_sass/_responsive/`
- Variables defined in `_sass/_variables.scss`

### JavaScript

- Main JS in `assets/main.js`
- Uses jQuery 1.12.4
- Slick.js for carousels
- Keep scripts minimal and focused

### Liquid Templates

- Use existing patterns from `_layouts/` and `_includes/`
- Follow Jekyll best practices for template inheritance

## Commit Messages

Use short, descriptive commit messages without prefixes:

```
add new startup pitch event
update services page layout
fix mobile navigation toggle
```

Match the existing commit style in the repository.

## Image Guidelines

Image requirements vary by use case. When adding images:
- Check existing images in the same category for reference
- Use descriptive, lowercase filenames with dashes
- Optimize images for web (compress appropriately)
- Ask the user about specific size requirements if needed

Common locations:
- Event images: `assets/images/events/`
- Blog images: `assets/images/blogs/`
- General images: `assets/images/`

## Testing Checklist

Before finalizing changes:

1. Run `bundle exec jekyll build` - must complete without errors
2. Verify Liquid syntax is correct
3. Check that front matter YAML is valid
4. Ensure image paths are correct
5. Test responsive behavior if modifying layouts

## External Integrations

- **Plausible Analytics** - Privacy-focused analytics
- **Umami Analytics** - Self-hosted analytics
- **GitHub Pages** - Automatic deployment on push to main

## Useful Commands

```bash
# Install dependencies
bundle install

# Build site (required before commits)
bundle exec jekyll build

# Local development server
bundle exec jekyll serve

# Convert events CSV to HTML (utility script)
ruby _scripts/events.rb
```

## Questions?

If uncertain about any changes, ask the user before proceeding. This is especially important for:
- Creating new content files
- Modifying protected files
- Changes affecting site-wide behavior
- Architectural or structural changes
