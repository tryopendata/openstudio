# Changelog

## [0.1.0] - 2026-10-14

### Added

- Standalone OpenStudio browser app, extracted from OpenChart and consuming its published public packages.
- CSV/TSV/JSON imports, explicit data preparation, chart/table/map controls, suggestions and diagnostics, responsive preview, local drafts, undo/redo, portable projects and exports.
- GitHub Pages demo deployment after production tests pass at `/openstudio/` in desktop Chromium, throttled phone Chromium, narrow Chromium and WebKit.

### Fixed

- Source replacement, editing and grouping changes require explicit filtering or summarization when observations would otherwise be combined silently.
- Composition controls and suggestions retain transformed fields and the source preparation pipeline across recovery.
- Lollipop composition validates its supported axis orientation and preserves separate series.
- Delimited imports reject malformed quotes and correctly distinguish quoted tabs from TSV delimiters.

### Privacy and hosting

- Imported data stays in the browser. Drafts use local storage, and downloaded project files preserve source data and preparation. The demo has no backend, accounts, cloud storage or collaboration service.
