# Media-Counter
A Tampermonkey userscript that displays a detailed, on-screen panel for analyzing all media resources on any webpage.

This tool is designed for developers, QA engineers, and content analysts to quickly audit the media assets on any live site. It provides a comprehensive, real-time breakdown of images and videos, categorized by their visibility and loading strategy, with a fully interactive UI.

## ✅ Features

Comprehensive Media Breakdown

The script counts and categorizes all media into logical groups:
On Screen: Counts media currently visible in the viewport, updating in real-time as you scroll.
Hidden on Page: Counts rendered <img> and <video> tags that are currently invisible (e.g., hidden by CSS, outside the viewport, or used for hover effects).
All on Page: A sum of all rendered media (On Screen + Hidden).
Alternative Sources (srcset): Finds and counts all unique image URLs provided in srcset attributes, which are used for responsive design.
Preloaded: Counts resources being fetched in the background via <link rel="preload">, which affect load time but are not rendered on the page.
Sub-Categories: Provides a separate count for media containing pre-gen in their URL across all relevant categories.

Instant Link Discovery

Hover Tooltip: Simply hover your mouse over any image, video, or complex media component to instantly see its source URL(s) in a clickable tooltip.
Toggleable: The hover tooltip can be easily enabled or disabled with a single click on the 🖰 icon in the panel header. Its state is saved for future sessions.
Intelligent Filtering: Automatically ignores common "garbage" media, like 1x1 tracking pixels, to provide a clean and relevant count.


## 🔗 Installation

1. Install [Tampermonkey extension](https://www.tampermonkey.net/).
2. Enable [Developer mode](https://www.tampermonkey.net/faq.php?locale=en#Q209) and allow userscripts.
3. [Install](https://raw.githubusercontent.com/bohdan-gen-tech/Media-Counter/main/media-counter.user.js) userscript
