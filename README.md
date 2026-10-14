# OpenStudio

A browser-based visualization editor and interactive demo of [OpenChart](https://github.com/tryopendata/openchart). Import your data, prepare it, design a chart, table or map, and download the result. The GitHub Pages demo runs the complete editor locally in your browser, with no account or backend.

**[Open the demo](https://tryopendata.github.io/openstudio/)** · [Authoring guide](docs/authoring.md) · [Changelog](CHANGELOG.md) · [OpenChart library](https://github.com/tryopendata/openchart)

## What you can do

- Explore eight sample documents or import CSV, TSV, OpenChart JSON and Studio project backups.
- Edit values and field types, filter rows, calculate explicit grouped summaries, and replace a dataset while retaining its design.
- Compose bars, lines, areas, scatterplots, lollipops, intervals, histograms and tables; edit axes, colors, labels, facets and annotations.
- Configure table columns, inline visuals, search and phone layouts; inspect map joins, palettes and zoom.
- Inspect exact observations, compare values, preview phone/article/wide layouts, and use suggestions and design diagnostics.
- Undo and redo edits, recover a local draft, download project backups and JSON, and export chart/map SVG or PNG and data CSV.

See the [authoring guide](docs/authoring.md) for the supported controls and the limits of each workflow. Sample datasets are examples, not live data feeds.

## Your data

Local CSV, TSV and JSON files are parsed in the browser. OpenStudio does not send imported datasets to a server. One draft is stored in browser local storage, scoped to the current browser profile and origin. Different paths on the same origin share that storage; private browsing, clearing site data or switching browsers/hosts can remove or separate drafts.

Use **Download Studio project** to keep the source data, preparation and visualization together. Plain JSON preserves the visualization document; CSV and image exports are not lossless project backups. Browser storage can be smaller than an accepted import, so a successful import does not guarantee the draft can be saved. The editor reports storage failures.

Plain CSV/TSV/JSON imports accept up to **5 MB and 20,000 rows**. Studio project backups accept **20 MB**. There are no cloud projects, accounts, collaborative sessions, public share links or publishing APIs. You can publish downloaded artifacts through your own tools.

## Develop

Install Bun 1.4.2 and Node.js 24, then run:

```sh
bun install --frozen-lockfile
bun run dev                    # http://127.0.0.1:6007/
```

OpenStudio consumes pinned public OpenChart packages. It builds independently; an OpenChart checkout or library build is not required.

```sh
bun run lint
bun run typecheck
bun run test
bun run build                  # dist/
bun run preview                # http://127.0.0.1:6008/
```

For the production browser suite:

```sh
bunx playwright install chromium webkit
STUDIO_TEST_BASE_PATH=/openstudio/ bun run test:e2e
```

On Linux CI, install browsers with `bunx playwright install --with-deps chromium webkit`. The suite builds the static artifact and serves it beneath `/openstudio/` in desktop Chromium, throttled phone Chromium, narrow Chromium and phone WebKit. Port 6008 must be free. Browser reports and traces are written to ignored `playwright-report/` and `test-results/` directories.

## GitHub Pages deployment

The repository's [CI and Pages workflow](.github/workflows/ci.yml) checks pull requests and pushes to `main`. It deploys the tested `dist/` artifact after all checks pass on `main`.

1. In repository **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source.
2. Allow the `github-pages` environment to deploy from `main`; retain any desired reviewer protection.
3. Push or merge to `main`, or manually run **CI and Pages** on `main` from the Actions tab.
4. Open the URL shown by the deployment job: [tryopendata.github.io/openstudio/](https://tryopendata.github.io/openstudio/).

The deploy job uses GitHub's built-in token and OIDC. No application secrets, API credentials or backend deployment are needed. See [GitHub's custom workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) for repository and environment setup.

Vite keeps `base: './'`: scripts, styles and the bundled font use relative URLs. Preserve the trailing slash for nested deployments. To use another static host, serve the whole `dist/` directory over HTTPS, cache hashed assets immutably and revalidate HTML. Development, preview and QA servers are local tools. To roll back the demo, revert the affected commit on `main` and let the workflow rebuild and deploy it.

## License

Application code is licensed under [Apache-2.0](LICENSE). The bundled Inter font is licensed under the [SIL Open Font License 1.1](public/Inter-LICENSE.txt); that license is also included in the deployed site. See [NOTICE](NOTICE) for attribution.
