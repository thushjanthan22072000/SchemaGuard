# SmartSchema

SmartSchema is a frontend database schema analysis interface for inspecting SQL schemas and exploring database design quality.

## Features represented in the supplied project

- SQL schema input and analysis
- Schema dashboard and table/column summaries
- Entity relationship diagram view
- Schema smell detection and recommendations
- Normalization and functional dependency analysis tools
- Candidate-key and query-advisor tools
- Schema improvement suggestions
- SQL generation and report download features

## Technologies

- HTML5
- CSS3
- Vanilla JavaScript

## Run locally

1. Download or clone this repository.
2. Open `index.html` in a modern web browser.

## Project files

- `index.html` — supplied HTML page. It contains embedded CSS and JavaScript.
- `style.css` — separately supplied stylesheet.
- `scripts.js` — separately supplied JavaScript source.

## Important integration note

The supplied `index.html` already contains its own `<style>` and `<script>` blocks and does not link to `style.css` or `scripts.js`. The separate CSS and JavaScript files are preserved in this repository as supplied, but they are not loaded by `index.html` unless you integrate them by moving the relevant code into external files and adding the appropriate `<link>` and `<script src>` references. Open `index.html` to run the self-contained page.
