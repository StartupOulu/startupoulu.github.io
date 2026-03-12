# StartupOulu website

This is the source code for [startupoulu.com](https://www.startupoulu.com). The website is built automatically from the files in this repository. To add or edit content (events, blog posts, services), you edit files here on GitHub. All changes go through a **pull request** — a simple review step where the system checks your changes for errors before they are published to the live site. No coding experience is needed; just follow the guides below.

- [Create an event in GitHub](#create-an-event-in-github) — step-by-step walkthrough
- [Something not working? How to find and fix errors](#something-not-working-how-to-find-and-fix-errors)
- [File naming rules](#file-naming-rules)
- [Event template reference](#how-to-add-an-event)
- [How to add a blog post?](#how-to-add-a-blog-post)
- [How to add a service?](#how-to-add-a-service)
- [How to make changes (general)](#how-to-make-changes)
- [Public Analytics page](https://cloud.umami.is/analytics/eu/share/TRXfirUynZGCZDPq)

## Something not working? How to find and fix errors

Every time you save changes (through a pull request), the system automatically checks your files for common mistakes. If something is wrong, it will tell you exactly what the problem is and how to fix it.

You can always check the status of these checks on the **Actions** page:

### How to check for errors

1. Go to the repository on GitHub
2. Click the **"Actions"** tab at the top of the page (between "Pull requests" and "Projects")
3. You will see a list of recent checks. Each one has a status icon:
   - **Green checkmark** — everything is fine, no errors
   - **Red X** — something went wrong, click on it to see what
4. Click on the failed check (the one with the red X) to open it
5. Click on **"validate"** in the left sidebar
6. Look for the **red error messages** — each one tells you what is wrong and suggests how to fix it

For example, you might see messages like:
- *"Missing closing '---' in front matter. Add a line containing only --- after your last field."*
- *"Missing 'start_time' field. Add 'start_time: 2026-04-22 18:00:00' to the front matter."*
- *"Cover image 'MyImage.png' has uppercase letters. Filenames must be all lowercase."*

### How to fix errors

1. Read the error message carefully — it tells you which file has the problem and what to change
2. Go back to your pull request and click the **"Files changed"** tab
3. Click the **pencil icon** on the file that needs fixing
4. Make the correction based on the error message
5. Click **"Commit changes"** to save — the checks will run again automatically

If you're not sure what went wrong, you can also check the [/debug/](debug) page for an overview of all events and blog posts.

For questions or help, contact information can be found at [startupoulu.com](https://www.startupoulu.com).

---

## Create an event in GitHub

This walkthrough covers everything from start to finish — uploading an image and creating the event file — in a **single pull request**.

> **What is a pull request?** Think of it like a draft. Instead of changing the website directly, you save your changes to a separate draft. The system automatically checks the draft for errors. If everything looks good, you click a button to publish the draft to the live site. If there are errors, you can fix them before anything goes live.

### Step 1: Prepare your image

- Recommended size: **960x540 pixels** (16:9 ratio)
- Accepted formats: JPG, PNG
- Rename the file to be **all lowercase with dashes** instead of spaces, and **start with the year and month** (`YYYY-MM-`)
  - Good: `2026-03-startup-pitch-night.jpg`
  - Bad: `Startup Pitch Night.JPG`

### Step 2: Upload the image to GitHub

1. Go to the repository on GitHub
2. Navigate to the **`assets/images/events/`** folder
3. Click **"Add file"** > **"Upload files"**
4. Drag your image into the upload area, or click "choose your files" to browse
5. At the bottom of the page, select **"Create a new branch for this commit and start a pull request"**
6. Give the branch a short descriptive name, for example: `add-march-pitch-event`
   (use only lowercase letters, numbers, and dashes — no spaces)
7. Click **"Propose changes"**
8. On the next page ("Open a pull request"), click **"Create pull request"**

Your image is now on its own branch, and you have an open pull request. **Don't merge yet** — first you'll add the event file to the same branch.

### Step 3: Create the event file on the same branch

9. Near the top of the pull request page, you'll see the branch name (e.g., `add-march-pitch-event`). **Click the branch name** to browse the repository on that branch
10. Navigate to the **`_events/`** folder
11. Click **"Add file"** > **"Create new file"**
12. In the filename field at the top, type your filename:
    ```
    YYYY-MM-slug.html
    ```
    For example: `2026-03-startup-pitch.html`

    The filename must be **all lowercase**, use **dashes** instead of spaces, and start with the event's **year and month** (zero-padded)

13. In the large text area, paste this template and fill in your event details:

```yaml
---
layout: event
title: Your Event Title
start_time: 2026-03-15 18:00:00
end_time: 2026-03-15 21:00:00
location: Venue Name, Address
cover_image: 2026-03-your-image-filename.jpg
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

14. Make sure `cover_image` matches the **exact filename** of the image you uploaded in Step 2
15. Click the green **"Commit changes..."** button
16. In the dialog, make sure it says **"Commit directly to the `add-march-pitch-event` branch"** (your branch name). Do NOT select "Create a new branch"
17. Click **"Commit changes"**

### Step 4: Wait for checks and merge

18. Go back to your pull request (click **"Pull requests"** tab, then click on your PR)
19. The system will automatically check your files. Wait for the status at the bottom:
    - **Yellow circle** — checks are running, wait a moment
    - **Green checkmark** — everything looks good, continue below
    - **Red X** — there's an error. See [how to find and fix errors](#something-not-working-how-to-find-and-fix-errors)
20. Click the green **"Merge pull request"** button
21. Click **"Confirm merge"**

Your event is now live! The website will update within a few minutes.

22. Click **"Delete branch"** to clean up (optional but recommended)

### Quick reference: event fields

| Field | Required? | Notes |
|---|---|---|
| `layout` | Yes | Always `event` |
| `title` | Yes | The event name |
| `start_time` | Yes | Format: `YYYY-MM-DD HH:MM:SS` |
| `end_time` | No | Format: `YYYY-MM-DD HH:MM:SS` |
| `location` | No | Venue name and address |
| `cover_image` | No | Just the filename (e.g., `2026-03-my-event.jpg`). Path is added automatically. If omitted, a placeholder image is shown |
| `description` | Yes | Full event description. Use `\|` and indent text below |
| `excerpt` | No | Short preview text (max 60 words). If omitted, `description` is used |
| `cta_title` | No | Button text (e.g., "Register"). Omit to hide the button |
| `cta_link` | No | Button URL. Only used if `cta_title` is also set |
| `published` | No | Set to `false` to hide the event without deleting the file |

---

## Guides

All changes to the website are made through **pull requests** on GitHub. This means your changes are checked for errors before going live. See [How to Make Changes](#how-to-make-changes) for a general walkthrough of the pull request process.

### File naming rules

All filenames in this project follow the same simple rules:

- **All lowercase** — use `startup-pitch.html`, not `Startup-Pitch.html`
- **Dashes instead of spaces** — use `my-event.html`, not `my event.html`
- **Only one dot in the filename** — the dot goes right before the file extension (`.html`, `.markdown`, `.jpg`). For example: `2026-03-my-event.html`, not `2026-03-my.event.html`
- **No special characters** — stick to letters (a–z), numbers (0–9), and dashes. No underscores, accented letters, or symbols
- **Start with a date** — events and their images use `YYYY-MM-` (e.g., `2026-03-`), blog posts use `YYYY-MM-DD-` (e.g., `2026-03-15-`)

| Content type | Format | Example |
|---|---|---|
| Event | `YYYY-MM-slug.html` | `2026-03-startup-pitch.html` |
| Blog post | `YYYY-MM-DD-slug.markdown` | `2026-03-15-building-bridges.markdown` |
| Event image | `YYYY-MM-descriptive-name.jpg` | `2026-03-startup-pitch.jpg` |
| Blog image | `YYYY-MM-descriptive-name.jpg` | `2026-03-building-bridges.png` |

### How to add an event?

**Step 1: Prepare your event image**

- Recommended size: 960x540 pixels (16:9 ratio)
- Accepted formats: JPG, PNG
- Use lowercase filenames with dashes instead of spaces
- Start with `YYYY-MM-` matching the event date
- Example: `2025-03-startup-pitch-night.jpg`

Upload the image to the `assets/images/events/` folder on GitHub.

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

These won't work:
- `2025-3-My Event.html` — has uppercase letters, spaces, and the month needs a leading zero (`03`)
- `PBP_express.html` — missing the date prefix, and uses an underscore instead of a dash

**Step 3: Add the event content**

Copy this template and fill in your event details:

```yaml
---
layout: event
title: Your Event Title
start_time: 2026-03-15 18:00:00
end_time: 2026-03-15 21:00:00
location: Venue Name, Address
cover_image: 2026-03-your-image-filename.jpg
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
- To hide an event from the website without deleting the file, add `published: false` to the front matter. The event will be excluded from the build entirely

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
blog_image: /assets/images/blogs/2026-03-your-image-filename.jpg
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
- To hide a blog post from the website without deleting the file, add `published: false` to the front matter. The post will be excluded from the build entirely

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

All changes go through **pull requests**. This means you propose your changes first, the system checks them for errors, and then you publish them. This prevents mistakes from reaching the live website.

For creating events, see the complete [Create an event in GitHub](#create-an-event-in-github) walkthrough above. The same approach (upload files to a branch, add content to the same branch, merge one PR) works for blog posts and other changes too.

### Making changes via the GitHub web interface

The general steps for any change are:

1. Navigate to the file or folder you want to change
2. Make your edit or upload your file
3. Select **"Create a new branch for this commit and start a pull request"**
4. Give the branch a short name (lowercase, dashes, no spaces)
5. Click **"Propose changes"**, then **"Create pull request"**
6. Wait for the green checkmark, then click **"Merge pull request"** > **"Confirm merge"**

If you need to make **multiple changes** in one pull request (e.g., upload an image and create a content file), commit additional files to the **same branch** instead of creating a new one. See the [event walkthrough](#step-3-create-the-event-file-on-the-same-branch) for a detailed example.

**If a check fails (red X):** See [how to find and fix errors](#something-not-working-how-to-find-and-fix-errors).

### Making changes via local development

1. Clone the repository
2. Create a new branch: `git checkout -b my-change`
3. Make your changes locally
4. Commit and push: `git push -u origin my-change`
5. Open a pull request on GitHub

Using a pull request is recommended so that changes are validated before going live.

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
