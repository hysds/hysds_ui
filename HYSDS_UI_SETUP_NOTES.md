# hysds_ui → EAGLE-VSWIR OpenSearch: setup notes

Written against commit `86f2c1d` on `develop` (2026-08-31). Unlike `hysds/tosca`,
this repo is actively maintained — `master` and `develop` are both current, and
the latest tag is `v1.4.0`.

Scope: the **Tosca view only** (dataset facet search). Figaro is out of scope —
EAGLE-VSWIR runs Airflow, so there is no Mozart cluster for it to query.

## What was added

Nothing tracked by git was modified. The three config files are already in the
repo's `.gitignore` (lines 27–29); the rest is in `.git/info/exclude`:

- `src/config/index.js` — endpoints and venue. **Bundled into the browser.**
- `src/config/tosca.js` — facets and columns, copied verbatim from the template
- `src/config/figaro.js` — copied verbatim; needed only so the build succeeds
- `local-proxy/opensearch-proxy.js` — credential-injecting proxy (Node core only)
- `local-proxy/proxy.env.example` — credential template
- `local-proxy/check-domain.sh` — domain probe, prints the real mapping fields

## Changes to tracked files

Three components hardcoded field names that don't exist in this catalog. All
three now read `src/config/tosca.js` instead — 24 insertions, 9 deletions across
three files, `git diff` to review:

| File | Was | Now |
|---|---|---|
| `ToscaResultsList/index.jsx:41` | default sort `"@timestamp"` | `DEFAULT_SORT_FIELD` = `start_time` |
| `ReactiveMap/index.jsx:149` | `geo_shape: { location: ... }` | `[GEO_FIELD]` = `footprint` |
| `ToscaDataViewer/index.jsx:36,72` | `res.location` | `res[GEO_FIELD]` |
| `ToscaDataViewer/index.jsx:50` | `res["@timestamp"]` | `LAST_MODIFIED_FIELD` = `modified` |
| `ReactiveMap/index.jsx:295` | `row.location` in `renderDatasets` | `row[GEO_FIELD]` |

The sort one was not cosmetic. OpenSearch rejects a sort on a field absent from
the mapping, so with `"@timestamp"` the results list failed on **first load** —
before the user could pick a different sort. The geo one made the map's bbox
filter match nothing silently, which is why the map was initially disabled;
`DISPLAY_MAP` is back on now.

Because the default is only a fallback behind `localStorage`, a browser that
previously visited this app could still hold `sort-field-tosca: "@timestamp"`.
If the results list errors while a direct `_search` works, clear site data.

This shape — config keys rather than new constants — is deliberately
upstreamable, should you want to send it to `hysds/hysds_ui` as a PR.

## The map view and `footprint`

`renderDatasets` — the function that actually draws result geometry — had its
own hardcoded `row.location`, separate from the bbox query. Every row hit
`if (!row.location) return;` and was skipped, so the map drew an empty layer
group no matter what was in the index. That was the real reason the map looked
broken. It now reads `GEO_FIELD`.

Two other things in that function:

- A stray `location.type = geoJsonType;` was assigning to the **global
  `window.location`** — `location` was never declared in that scope. It did
  nothing. Removed.
- `mapGeoJsonType` calls `t.toLowerCase()` on the type, so a `footprint` stored
  as a **WKT string** (no `.type`) would throw and take down the whole map
  render rather than skipping one row. There is now a shape guard ahead of it.

Confirmed against the live cluster: `footprint` is a GeoJSON object with
`[lon, lat]` ordering and a **lowercase** `"polygon"` type, identical in both
`products` and `scenes`. Lowercase is fine — `mapGeoJsonType` normalizes it,
and so does the Query Region button's check in `ToscaDataViewer`. Rings are
closed and coordinates in range.

Tested: both real documents produce valid Leaflet `Polygon` GeoJSON, and WKT
strings, OpenSearch `envelope`, `GeometryCollection`, null/missing footprints
and type-without-coordinates are all skipped without throwing. Lowercase
`multipolygon` and `point` also draw, so heterogeneous geometry is safe.

Two cases deliberately **not** handled, because your data does not currently
need them:

- **`envelope`** (OpenSearch's two-corner bbox type) is skipped with a console
  warning. It would need converting to a 5-point polygon before Leaflet draws
  it. Add that if the catalog ever stores bboxes.
- **Antimeridian crossing.** Leaflet renders a polygon whose longitudes jump
  from +179 to -179 as a smear across the whole map. Every footprint seen so
  far is CONUS with uniformly negative longitudes — and frankly looks
  synthetic (uniform 0.35° x 0.80° boxes). Real global swaths will eventually
  cross the dateline and will need normalizing, so re-check this when the
  catalog holds flight data.

The default map center is `[36.7783, -119.4179]` (California), which happens to
suit the current CONUS test footprints. There is no zoom-to-results behaviour;
the map keeps whatever center/zoom is in `localStorage`.

## Why there is a proxy

This is the thing that shapes the whole setup. `hysds_ui` is a **static SPA** —
`@appbaseio/reactivesearch` queries OpenSearch straight from the browser
(`src/pages/Tosca/index.jsx:100`), and `src/redux/actions/tosca/index.js:30`
fetches `_count` the same way. There is no server side. Three consequences:

1. **The credential cannot go in `src/config/`.** Everything there is compiled
   into `dist/index_bundle.js` and served to every user. Basic auth in
   `GRQ_ES_URL` would be readable with View Source.
2. **CORS.** AWS OpenSearch Service sends no CORS headers, so a cross-origin
   browser request fails at the preflight regardless of credentials.
3. **The endpoint is VPC-only.** It resolves only inside the VPC or on JPL VPN.

Upstream's answer is the relative path in `src/config/index.template.js:11` —
`GRQ_ES_URL = "/grq_es"` — served same-origin by the GRQ host's webserver, which
proxies to OpenSearch. Note the repo's own `nginx.conf` has **no** `/grq_es`
block, so the Docker image does not provide this; a real HySDS cluster supplies
it outside this repo.

`local-proxy/opensearch-proxy.js` is the local stand-in: it listens on
`127.0.0.1:9200`, adds the `Authorization` header, answers CORS preflights, and
forwards to the domain over TLS. Loopback-bound on purpose — it holds a
credential and adds it to everything it forwards.

Verified behaviour (tested against a stub upstream, not the real domain):
preflight returns 204 with correct headers; `POST /_msearch` arrives with path,
query string, body and `Content-Type` intact and the right `Authorization`;
browser `Origin` and `Cookie` are stripped; a hostile upstream
`Access-Control-Allow-Origin` is overridden rather than forwarded; upstream
401/403/404 pass through with a diagnostic hint on the console; DNS failure
returns 502 with a "are you on VPN?" hint; and the password appears in no log
line or error response.

## Running it

`local-proxy/proxy.env` already holds the credentials; `proxy.env.example` is a
placeholder-only template, safe to share.

```sh
set -a && source ./local-proxy/proxy.env && set +a

./local-proxy/check-domain.sh products scenes    # confirm the domain first

npm install
node local-proxy/opensearch-proxy.js &   # terminal 1, must stay running
npm start                                 # terminal 2, opens localhost:8080
```

### Node version — you need the wrapper

`package.json` pins webpack 4 and the README asks for Node < 13. On a modern
Node, `npm start` dies with `ERR_OSSL_EVP_UNSUPPORTED` from webpack's use of
MD4. **Always start it through the wrapper instead:**

```sh
./run-with-legacy-openssl.sh npm start
./run-with-legacy-openssl.sh npm run build
```

Verified 2026-11-09 on **Node v26.13.0**: `--openssl-legacy-provider` still
exists and MD4 still works under it, so the wrapper is sufficient and there is
no need to downgrade Node.

Do not try to fix this with `output.hashFunction` instead. It would get the dev
server running — `NormalModule.js:417` does read `compilation.outputOptions.hashFunction`
— but webpack 4.41 hardcodes `createHash("md4")` in five more places
(`ConcatenatedModule.js:506`, `SplitChunksPlugin.js:25`,
`NamedModulesPlugin.js:11`, `ModuleFilenameHelpers.js:45`,
`SourceMapDevToolPlugin.js:345`), as does
`terser-webpack-plugin/dist/index.js:217`. Production builds would still fail.

### Do not run `npm audit fix --force`

`npm install` reports ~91 advisories. That is the 2019-era dependency tree;
forcing upgrades replaces webpack 4 and breaks the build. Leave it.

## What the domain actually contains (probed 2026-11-09)

- **OpenSearch 3.7.0**, 3 data nodes, cluster `eaglevswir-proto`, health green.
- **There is no `grq` index or alias.** The catalog is 19 monthly indices
  `products-2026-01` … `products-2027-06` behind the alias **`products`**
  (~43.6M docs, ~1 GB each), plus a standalone **`scenes`** index (1.55M docs)
  that is in no alias.
- `GRQ_ES_INDICES` is now `"products,scenes"`.

Two traps that came out of this probe:

**A wrong index name looks like an empty catalog, not an error.** hysds_ui
appends `ignore_unavailable=true&allow_no_indices=true`
(`src/utils/esHelpers.js`) to every query. Searching the nonexistent `grq`
returned HTTP 200 with zero hits and `"_shards": {"total": 0}` — no
`index_not_found_exception` anywhere. If the UI ever shows an empty result set,
check `_shards.total` in the browser network tab before assuming the data is
missing. `check-domain.sh` step 6 now queries strictly, without those params.

**Facets across two differently-mapped names.** Since `GRQ_ES_INDICES` spans
both `products` and `scenes`, any field present in only one of them yields a
filter that silently excludes the other's documents. Step 7 of
`check-domain.sh` now flags fields that exist in only some of the concrete
indices behind a name — compare the two before trusting the sidebar.

## The mapping conflict between `products` and `scenes`

Five paths exist in **both** indices with **incompatible shapes** — leaf numbers
in `products`, objects in `scenes`:

| Path | `products` | `scenes` |
|---|---|---|
| `properties.cloud_fraction` | `float` | object `{value: float, source: keyword}` |
| `properties.nodata_fraction` | `float` | object |
| `properties.num_valid_lines` | `integer` | object |
| `properties.solar_azimuth` | `float` | object |
| `properties.solar_zenith` | `float` | object |

Because `GRQ_ES_INDICES = "products,scenes"`, aggregating or sorting on any of
those across both indices is a mapping conflict. `src/config/tosca.js`
therefore never facets or sorts on them. They are still safe to **return** in
`_source`, which is why they remain available in the Full Metadata view.

Worth knowing what this costs: the two indices share only six compatible fields
(`created`, `modified`, `start_time`, `stop_time`, `footprint`, `scene_id`).
Everything that makes a useful facet belongs to one index or the other —
`product`, `level`, `version`, `crid`, `pge_*`, `is_latest`, `daac.status` are
products-only; `daynight`, `instrument_mode`, `submode` are scenes-only. A
field present in only one index is harmless (a terms agg just returns no
buckets for the other's documents), but it does mean most of the sidebar will
appear to "do nothing" for roughly half your result set. If that proves
confusing in use, splitting into two separate views is the cleaner answer than
one combined one.

## Still unverified

1. **Facet cardinality and labels.** The facets are built from your real
   mappings and validated against them, but I have not seen a single document,
   so the `size` values are guesses at bucket counts and the titles are guesses
   at what the fields mean. `crid`, `dcid` and `environment` especially may want
   different `size` or better labels once you see real values.
2. **OpenSearch 3.7 against a 2019-era client.** `@appbaseio/reactivesearch` is
   pinned at 3.2.4, written for Elasticsearch 6/7; the domain reports
   `minimum_wire_compatibility_version: 2.19.0`. Plain `_search` works (proved
   by the probe), but reactivesearch drives the UI through `_msearch`, which I
   have not exercised. If facets come up blank while a direct `_search` works,
   look at the `_msearch` request/response in the network tab first.
3. **`npm install` and the webpack build.** No registry access here, untested.
4. **Browse links are not wired.** Neither index has `urls` or `browse_urls`,
   which is what `ToscaDataViewer:30` looks for, so the Browse link never
   renders. Both indices have a `files` object that probably holds the S3
   paths; left alone for now by choice. Full Metadata still works, since it
   reads whole `_source` via a `_doc` lookup.
5. **The reactivecore patch.** `scripts/patch-reactivecore.js` runs on
   `postinstall`/`prestart`/`prebuild` and fixes a stale-results bug. The
   Dockerfile warns that npm 6 as root silently skips `postinstall`, so an
   unpatched bundle looks identical. After `npm install`, confirm:
   `grep -q "_msearchSeq" node_modules/@appbaseio/reactivecore/lib/actions/query.js`

## For deployment, not local dev

Replace the Node proxy with a real one and switch `src/config/index.js` back to
the upstream shape — `LOCAL_DEV = false` and `GRQ_ES_URL = "/grq_es"` — then add
to `nginx.conf`:

```nginx
location /grq_es/ {
    proxy_pass https://vpc-eaglevswir-proto-ylwe6yiuzvfjv5voxzmk57vxfy.us-west-2.es.amazonaws.com/;
    proxy_set_header Authorization "Basic <base64 of user:pass>";
    proxy_set_header Host vpc-eaglevswir-proto-ylwe6yiuzvfjv5voxzmk57vxfy.us-west-2.es.amazonaws.com;
}
```

Two cautions. The credential becomes part of your nginx config, so it needs to
come from a secret store rather than the image — don't bake it into a layer.
And this makes the full OpenSearch API reachable by anyone who can load the
page, including deletes; upstream HySDS relies on the cluster being inside a
trusted network. If this ever faces a wider audience, restrict the proxy to
`_search`, `_msearch`, `_count` and `_mapping`, and put real authentication in
front of the UI.

One cosmetic bug worth knowing about: with `LOCAL_DEV = false`,
`src/pages/Tosca/index.jsx:47` builds `${window.origin}/${GRQ_ES_URL}`, which
yields a double slash (`https://host//grq_es`). nginx normalises it with
`merge_slashes on` by default, so it works — but it will break if you ever turn
that off, and `location /grq_es` won't match `//grq_es` on a proxy that doesn't
normalise.
