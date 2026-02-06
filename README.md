# StartupOulu website

A guide for collaborators on how to add content to the StartupOulu website.

- [How to add an event?](#how-to-add-an-event)
- [How to add a blog post?](#how-to-add-a-blog-post)
- [How to add a service?](#how-to-add-a-service)
- [Public Analytics page](https://cloud.umami.is/analytics/eu/share/TRXfirUynZGCZDPq)

## Troubleshooting

If something went wrong during an update, you can check [/debug/](debug)-page that shows the status of blog posts and events.

For questions or help, contact information can be found at [startupoulu.com](https://www.startupoulu.com).

---

## Guides

### How to add an event?

**Step 1: Prepare your event image**

- Recommended size: 960x540 pixels (16:9 ratio)
- Accepted formats: JPG, PNG
- Use lowercase filenames with dashes instead of spaces
- Example: `2025-03-startup-pitch-night.jpg`

Upload the image to `assets/images/events/` folder.

**Step 2: Create the event file**

Create a new file in the `_events/` folder. The filename **must** follow this format:

```
YYYY-MM-slug.html
```

- Use the event's year and month (zero-padded), followed by a short slug
- Slug must be **lowercase**, use **dashes** instead of spaces, and **no special characters**
- The filename determines the event's URL: `startupoulu.com/events/YYYY-MM-slug.html`

Examples:
- `2025-02-koodikorneri.html`
- `2025-03-polar-bear-pitching.html`
- `2026-02-pbp-express.html`

Bad examples:
- `2025-3-My Event.html` (uppercase, spaces, month not zero-padded)
- `PBP_express.html` (missing date prefix, uses underscores)

**Step 3: Add the event content**

Copy this template and fill in your event details:

```yaml
---
layout: event
title: Your Event Title
start_time: 2026-03-15 18:00:00
end_time: 2026-03-15 21:00:00
location: Venue Name, Address
cover_image: your-image-filename.jpg
cta_title: Register
cta_link: https://registration-link.com
excerpt: |
  A brief description of the event (max 60 words). This appears
  on event cards and in previews. Keep it concise and engaging.
description: |
  The full event description. This is displayed on the event page
  as the main content. Use the pipe character (|) followed by
  indented text for multi-line descriptions.
---
```

**Important notes:**
- `description` is **required** — without it the event page will have no content
- `description` must use the `|` (pipe) syntax for multi-line text — indent the text with two spaces below it
- `start_time` is **required** — events without it will not appear on the events page or homepage
- `start_time` and `end_time` format: `YYYY-MM-DD HH:MM:SS`
- `cover_image` is just the filename (the path is added automatically). If omitted, a default placeholder image is shown
- `excerpt` is truncated at 60 words — if not provided, `description` is used instead
- `cta_title` and `cta_link` are optional — if omitted, no button is shown on the event page

---

### How to add a blog post?

**Step 1: Prepare your blog image**

- Recommended size: 960x540 pixels (16:9 ratio)
- Accepted formats: JPG, PNG
- Use lowercase filenames with dashes

Upload the image to `assets/images/blogs/` folder.

**Step 2: Create the blog post file**

Create a new file in the `_posts/` folder. The filename must follow this format:

```
YYYY-MM-DD-slug.markdown
```

Examples:
- `2025-03-15-startup-ecosystem-update.markdown`
- `2025-04-01-how-to-pitch-your-idea.markdown`

**Step 3: Add the blog content**

Copy this template and fill in your post details:

```yaml
---
layout: blog
title: Your Blog Post Title
description: A brief meta description for search engines and social media sharing (1-2 sentences).
blog_image: /assets/images/blogs/your-image-filename.jpg
---

Your blog content goes here. You can use **Markdown formatting**.

## Subheadings

Use ## for main sections and ### for subsections.

- Bullet points work
- Like this

You can also include [links](https://example.com) and *italic text*.
```

**Important notes:**
- `blog_image` requires the full path starting with `/assets/images/blogs/`
- `description` is used for SEO and social media previews
- Content is written in Markdown format
- The publication date comes from the filename

---

### How to add a service?

Services are ecosystem partners displayed on the Services page. They are defined in `_data/services.yaml`.

**Step 1: Open the services file**

Edit `_data/services.yaml`

**Step 2: Add your service**

Add a new entry at the end of the file:

```yaml
- title: Service Name
  description: A brief description of what this service offers to entrepreneurs.
  link_label: Learn More
  link_url: https://service-website.com
  stage:
    - just-exploring
    - getting-started
    - ready-to-grow
```

**Stage options:**
- `just-exploring` - For people exploring entrepreneurship
- `getting-started` - For early-stage startups
- `ready-to-grow` - For growth-stage companies

A service can belong to multiple stages.

---

## Site Structure

### Events

Events are defined in the `_events/` directory. Each event has its own file.

The filenames must follow the naming convention: `YYYY-MM-slug.html`

Full event template with all fields:

```yaml
---
layout: event
title: Apply to OYSTER Pre-incubator for Health Sector Business Ideas by 6.6.
start_time: 2025-09-01 15:00:00
end_time: 2025-11-01 20:00:00
location: OYSTER Pre-incubator, Kiviharjunlenkki 1a
cover_image: oyster-apply.png
cta_title: Register
cta_link: https://oamk.fi/en/apply-with-your-business-idea-to-the-oyster-pre-incubator/
excerpt: |
  The application period for the OYSTER pre-incubator has started and will continue until June 6, 2025.
  The 100-day free coaching program begins in September.
description: |
  The application period for the OYSTER pre-incubator has started and will continue until June 6, 2025.
  The 100-day free coaching program begins in September. During the pre-incubator program,
  participants receive training on key business themes and develop their own business ideas with
  the support of coaches from Oamk, the University of Oulu, and BusinessOulu.
---
```

### Blog Posts

Blog posts are defined in the `_posts/` directory using Markdown format.

### Services

Services are defined in `_data/services.yaml` using YAML format.

Example with two services:

```yaml
- title: Founder's Corner
  stage:
    - just-exploring
    - getting-started
    - ready-to-grow
  description: Build digital business with guidance and earn your first euros!
  link_label: Open
  link_url: https://example.com

- title: Business Corner
  stage:
    - just-exploring
    - getting-started
  description: Student entrepreneurship hub at Linnanmaa campus
  link_label: Learn More
  link_url: https://example.com
```

---

## Images

All images must be uploaded under `assets/images/` directory.

| Content Type | Location | Recommended Size |
|-------------|----------|------------------|
| Event covers | `assets/images/events/` | 960x540 px |
| Blog images | `assets/images/blogs/` | 960x540 px |

**Image requirements:**
- Formats: JPG, PNG
- Filenames: lowercase only, no spaces (use dashes)
- Aspect ratio: 16:9 recommended

**Filename examples:**
- Good: `2025-03-startup-pitch-night.jpg`
- Bad: `Startup Pitch Night.JPG`

### Directory structure

```
assets/
└── images/
    ├── events/    # Event cover images
    ├── blogs/     # Blog post images
    └── contacts/  # Team member photos
```

---

## How to Make Changes

You can add content using either method:

### Option 1: GitHub Web Interface

1. Go to the repository on GitHub
2. Navigate to the appropriate folder (`_events/`, `_posts/`, or `_data/`)

![Navigate to the _events folder and click Add file button](assets/images/readme/github-add-file.png)

3. Click "Add file" > "Create new file"
4. Name your file following the conventions above 

![Enter filename and paste the event content](assets/images/readme/github-create-file.png)

5. Paste your content

6. Commit the changes

![Enter filename and paste the event content](assets/images/readme/github-commit-button.png)

![Enter filename and paste the event content](assets/images/readme/github-commit-dialog.png)

7. Scroll down and click "Commit changes"

For images, use "Add file" > "Upload files" in the `assets/images/` folder.

### Option 2: Local Development

1. Clone the repository
2. Make your changes locally
3. Commit and push to GitHub

Some collaborators can push directly to main, others may need to create a pull request for review.

---

## Technical Details

This site is built using [Jekyll](https://jekyllrb.com/) and hosted on [GitHub Pages](https://docs.github.com/en/pages).

### Local Development Setup

To run the site locally, you need Ruby installed. We recommend using a version manager:
- [Rbenv](https://github.com/rbenv/rbenv)
- [asdf](https://github.com/asdf-vm/asdf-ruby)
- [mise](https://github.com/jdx/mise)

Then run:

```bash
bundle install
bundle exec jekyll serve
```

The site will be available at `http://localhost:4000`.

### Verifying Changes

To check that your changes don't break the build:

```bash
bundle exec jekyll build
```

If this completes without errors, your changes are safe to commit.
