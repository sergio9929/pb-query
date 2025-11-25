---
seo:
  title: Build type-safe PocketBase queries using TypeScript
  description: pb-query provides useful helpers, suggestions based on your schema, documentation and examples right in your IDE.
---

::u-page-hero
#title
Build type-safe PocketBase queries using TypeScript

#description
:app-header-logo{.inline.text-default style="height: 1lh;"} provides useful helpers, suggestions based on your schema, documentation and examples right in your IDE.

#links
  :::u-button
  ---
  color: neutral
  size: xl
  to: /getting-started/introduction
  trailing-icon: i-lucide-arrow-right
  ---
  Get started
  :::

  :::star-on-github
  Star on GitHub
  :::
::

::u-page-section
  :::u-page-grid{.lg:grid-cols-2}
    ::::u-page-card
    ---
    spotlight: true
    ---
    ![Field name suggestions](/suggestions.webp)

    #title
    Full TypeScript Integration

    #description
    Get autocompletion for fields and type safety based on your schema.
    ::::

    ::::u-page-card
    ---
    spotlight: true
    ---
    ![JSDoc](/jsdoc.webp)

    #title
    Built-in Documentation

    #description
    Get examples and explanations directly in your IDE with JSDoc.
    ::::

    ::::u-page-card
    ---
    spotlight: true
    class: lg:col-span-2
    orientation: horizontal
    to: /operators/helpers
    ---
    :UIcon{name="i-lucide-arrow-right" class="text-muted w-8 h-8" style="margin-left: auto;"}

    #title
    Helper Operators

    #description
    Use built-in helpers like `.search()`, `.between()`, `.in()`, `.isNull()`, and more.
    ::::
  :::
::
