# Authoring in OpenStudio

OpenStudio is a client-side editor built on the public [OpenChart](https://github.com/tryopendata/openchart) packages. The [GitHub Pages demo](https://tryopendata.github.io/openstudio/) runs the same application as a local build. All authoring, preparation, preview, validation and export work happens in the browser.

## Start with data

Choose one of eight sample documents, paste CSV/TSV, open a local file, or import a supported chart, table or map JSON document. A sample replaces the current document and can be undone. Example datasets are not live data feeds; read each chart's source and methodology.

Plain document and delimited imports accept at most 5 MB, including normalized row expansion, and 20,000 rows. Studio project backups accept 20 MB to accommodate the source plus prepared document. Headers must be unique and nonempty, and row lengths must match. Quoted delimiters, escaped quotes and newlines work; malformed quoting is rejected before parsing. Leading-zero identifiers remain text. Dates require valid ISO calendar dates or timezone-qualified timestamps.

CSV/TSV rows receive unique persistent keys. Explicit type corrections are saved in field metadata; internal identity fields remain out of ordinary data controls. Blank cells remain missing observations. Edit source values or field types in **Data → Source data**. Preparation and the visualization are recomputed from those source rows.

## Prepare and replace

Preparation filters exact values first, then applies an explicitly selected grouped sum, mean, minimum, maximum or row count. Numeric summaries exclude missing and nonnumeric observations; groups with no measurements remain missing. Count includes every row and receives separate row-count metadata, without inherited currency or percentage formatting.

The source stays intact. **Prepared data** shows the rows passed to the visualization document. **Restore all source rows** removes the Studio preparation recipe. Each applied preparation is one undoable edit.

**Import data → Replace data · keep this design** maps every existing field to a different replacement column. It retains the headline, appearance and preparation. Replacement observations receive new imported identities when an internal identity field is used. Undo restores the preceding source and design together.

Repeated category/series observations require an explicit filter or summary before composition. Source replacement, source edits, regrouping and changes to the plotted grouping cannot silently collapse observations into an implicit total. Change to a table when you want to expose every source row before choosing a new summary. An explicitly authored chart imported through JSON can retain its existing aggregation semantics.

## Compose and design

| Workflow | Available controls |
| --- | --- |
| Compose | Bars, lines, areas, scatterplots, lollipops, intervals/before-and-after, histograms and tables, with explicit field roles |
| Axes | Fields, titles, visibility, numeric formats, zero baselines and category order |
| Series | Field mapping, individual colors, label density, facets and area stacking |
| Annotations | Anchored text callouts and reference lines; direct text editing and label/annotation dragging |
| Motion | Fluid, subtle, legacy and off |
| Tables | Column order, headings, formats, priorities, inline bars, heatmaps, change chips, search, pagination and phone layouts |
| Maps | Data and feature join fields, color measure/format/palette, zoom, and duplicate/missing/unmatched key feedback |

**Change composition** retains data, headline and source while resetting composition-specific axes, labels and annotations. Undo restores them. Lines use dates or ordered categories along X. Lollipops require a numeric X field and a category Y field. Interval authoring uses numeric X/start and endpoint fields with a category Y field; supplied bounds are used as supplied and are not calculated confidence intervals.

Chart-to-chart composition and **Suggest** retain authored transform pipelines. Field selectors use those pipelines' output fields, so a calculated or aggregated measure remains available. Summarizing an authored pipeline requires changing to its source table first. Converting to a table exposes source rows; it does not invent another aggregation. For a chart with authored transforms, the prepared-row preview and CSV reflect the rows supplied to the transform pipeline, not necessarily its final plotted marks.

Map joins leave ambiguous observations uncolored and explain the join problem. A duplicate never silently wins. Missing observations remain distinct from measured zeroes. Maps start from a supplied geography or imported map document; the editor does not fetch or infer a new geography from place names.

## Preview and inspect

Canvas width is a target capped by available space. Phone, article and wide previews help check the same document at different widths. Mobile authoring uses sheets and preserves unfinished composition/annotation choices when dismissed. Replacing the source clears obsolete pending field choices.

Chart reader mode supports hover previews, pinning up to two observations, arrow-key navigation, Enter to pin, and Escape to clear. Map and table activation pins one observation, cleared when the document changes. Aggregate groups are identified explicitly. A selection without persistent identity does not silently survive a data revision.

Direct chart editing and reader inspection are separate modes. Entering **Edit chart elements** returns a temporal chart to all years before an edit can be committed. Timeline scrubbing filters only the preview; complete data stays editable and saved. SVG/PNG follow the displayed time window; CSV and JSON retain the complete document data. Editing in the Data view retains the composition used for image export.

**Suggest** uses chosen field roles and deterministic rules. **Review** offers measurable diagnostics and optional, undoable patches. A patch is guarded against a later document edit. Geometry review covers Cartesian charts; map/table checks and a complete editorial or accessibility audit still require author judgment.

## Save, recover and export

| Output | Preserves |
| --- | --- |
| Download Studio project | Source rows, source metadata/identity, preparation recipe and ordinary OpenChart `VizSpec` |
| JSON document | The visualization specification and its data; not the separate Studio source/preparation recipe |
| Source CSV | Complete source rows |
| Plotted CSV / CSV export | Complete data supplied to the visualization, including Studio preparation; independent of timeline preview and table pagination |
| SVG / PNG | Displayed chart or map, using terminal geometry even during an update; available from Canvas or Data view |

Tables export CSV, not images. All supported documents can be downloaded as JSON. The JSON drawer is optional; it reads and writes the same `VizSpec` used by OpenChart library consumers.

History stores up to 100 complete project edits. Native text-field undo applies while typing; document undo applies outside text controls. Undo history, temporary panel choices and transient inspection are not saved across reloads.

One draft is saved after edits and flushed when the page is hidden. Drafts belong to the current browser profile and origin, not an account or repository path. Pages hosted beneath different paths on the same origin can share the same local draft. Storage restrictions, private browsing or clearing site data can prevent recovery. Moving to another browser, device or origin requires downloading and importing a Studio project.

Storage failures are reported explicitly. A malformed saved draft remains untouched until the author makes another edit. Use project downloads for durable backups, especially for larger datasets: browser local storage may not hold a project within the import limit. Files are parsed locally; OpenStudio does not upload imported datasets. Hosting serves the application assets, and author-supplied external resource URLs can still be requested by the browser.

## Application boundary and limitations

OpenStudio owns its React/Motion UI, data imports, projects, local drafts, examples, fonts and build tooling. OpenChart owns the public specification, compiler and renderer packages. The application imports only public package exports and does not require the OpenChart repository to build. `StudioProject` is an app-owned persistence envelope around a `VizSpec`, not another visualization grammar.

The demo has no accounts, cloud persistence, collaborative editing, hosted share links, publish/revoke service or embed service. Hosting it on GitHub Pages enables the complete browser editor; those server-side workflows are outside its scope. Download artifacts for use in your own publishing workflow.

Controls expose a supported subset of OpenChart. Existing settings can be retained through JSON, but the UI does not author every chart family, layer grammar, transform or annotation option. Linked-view orchestration, uncertainty-band authoring and generalized narrative documents are not implemented. Design checks do not establish statistical correctness or replace testing with readers.

## Build and verification

See the [README](../README.md) for installation, deployment and rollback instructions. `vite.config.ts` retains a relative base, so the whole `dist/` directory can be served at an origin or a trailing-slash path without a rewrite router, backend or external font service.

`playwright.config.ts` tests the production artifact in desktop Chromium, 390px Chromium with 4× CPU throttling, 320px Chromium, and 390px WebKit. CI runs the matrix at `/openstudio/`, covering patterns, fonts, imports/type correction, preparation, edits, undo/redo, draft recovery, field selections, keyboard values, selection invalidation, exports, reduced motion and resize. Unit/integration tests exercise document and preparation behavior against the actual OpenChart packages. Failure screenshots, traces and videos are attached to CI runs.
