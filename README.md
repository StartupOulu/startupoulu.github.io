# StartupOulu website

- [How to add an event?](#how-to-add-an-event)
- [How to add a blog post?](#how-to-add-a-blog-post)
- [How to add a service?](#how-to-add-a-service)
- [Public Analytics page](https://plausible.io/share/startupoulu.com?auth=EGvvedQd9yAzpwIIp5-_g)

## Troubleshooting

If something went wrong during an update, you can check [/debug/](debug)-page that shows the status of blog posts and events. 

## Site Structure

### Events

Events are defined in `_events/`-directory. Each event has it's own file. 

The filenames must follow the naming convention. Each filename starts with year and month, after that comes the "slug" of the title. Slug means that the title is written in lowercase and words are separated by dash-character. Here are few examples: `2025-02-koodikorneri.html` or `2025-02-polar-bear-pitching.html`.

The contents of each file is as follows:

```
---
layout: event
title: Apply to OYSTER Pre-incubator for Health Sector Business Ideas by 6.6.
start_time: 2025-09-01 15:00:00
end_time: 2025-11-01 20:00:00
location: OYSTER Pre-incubator, Kiviharjunlenkki 1a
cover_image: oyster-apply.png
cta_title: Register
cta_link: https://oamk.fi/en/apply-with-your-business-idea-to-the-oyster-pre-incubator/
description:  |
  The application period for the OYSTER pre-incubator has started and will continue until June 6, 2025. 
  The 100-day free coaching program begins in September. During the pre-incubator program, 
  participants receive training on key business themes and develop their own business ideas with 
  the support of coaches from Oamk, the University of Oulu, and BusinessOulu. 
  The purpose of these activities is to promote the region's startup activities in the health and life sciences sectors. 
---
```

In event card, an `excerpt` is a brief preview of longer content, like a book blurb or article summary. It gives readers a quick understanding of what the full content contains, rather than just cutting off text at a fixed length. Words beyond the 60-word limit will be truncated. If excerpt is not defined, `description` will be used instead with 60-word limit.

Just copy this piece of text and paste it into your file and change accordingly. The `start_time` and `end_time` has also a specific format: `YYYY-MM-DD HH:MM:SS`.

### Blog Posts

Events are defined in `_posts/`-directory.

### Services

Services are defined in `_data/services.yml`, the file uses YAML file format. 

This is an example file that defines two services.

```
- title: Founder's Corner
  stage: mindset, pre-startup, startup
  description: Rakenna digitaalista liiketoimintaa ohjatusti ja tienaa ensimmäiset eurosi!
  link_title: Avaa
  link_url: http://example.com
- title: KoodiKorner
  stage: mindset, pre-startup
  description: Tuuppa rakentamaan itsellesi hyvä bisnes koodaamalla
  link_title: Avaa
  link_url: http://example.com
```

### Images

All images must be stored in `assets/images/`-directory. 

- Event cover images are stored in assets/images/events folder. 
- Optimal image size is 960 x 540 (fileformat png).


## Guides

### How to add an event?

...here be dragons...

### How to add a blog post?

...here be dragons...

### How to add a service?

...here be dragons...

