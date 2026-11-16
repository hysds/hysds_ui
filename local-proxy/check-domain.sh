#!/usr/bin/env bash
# Probe the EAGLE-VSWIR OpenSearch domain before starting hysds_ui.
# Run from inside the VPC or on JPL VPN, after sourcing local-proxy/proxy.env.
set -uo pipefail

HOST="${OS_HOST:-vpc-eaglevswir-proto-ylwe6yiuzvfjv5voxzmk57vxfy.us-west-2.es.amazonaws.com}"
: "${OS_USER:?source local-proxy/proxy.env first}"
: "${OS_PASS:?source local-proxy/proxy.env first}"

# -u keeps the credential out of the URL, so it stays out of your shell history
# and out of any error output curl prints.
CURL=(curl -sS --max-time 15 -u "${OS_USER}:${OS_PASS}")

step() { printf '\n=== %s ===\n' "$1"; }

step "1. DNS resolution (fails outside the VPC/VPN)"
if getent hosts "$HOST" >/dev/null 2>&1 || nslookup "$HOST" >/dev/null 2>&1; then
  echo "resolves OK"
else
  echo "WARN: $HOST does not resolve here -- you are not in the VPC or on VPN."
  echo "      Everything below will fail; fix this first."
fi

step "2. TLS + auth + engine version"
"${CURL[@]}" -w '\nHTTP %{http_code}\n' "https://${HOST}/" || true
echo "  401 => wrong OS_USER/OS_PASS."
echo "  403 => the DOMAIN ACCESS POLICY is denying you, not fine-grained access"
echo "         control. Check the policy before blaming the password."

step "3. Cluster health"
"${CURL[@]}" "https://${HOST}/_cluster/health?pretty" || true

step "4. Indices -- is the catalog populated?"
"${CURL[@]}" "https://${HOST}/_cat/indices?v&s=index" || true

step "5. Aliases -- does GRQ_ES_INDICES=grq resolve?"
"${CURL[@]}" "https://${HOST}/_cat/aliases?v&s=alias" || true

# Indices to inspect. Override by passing names: ./check-domain.sh products scenes
INDICES=("$@")
if [ ${#INDICES[@]} -eq 0 ]; then INDICES=(products scenes); fi

step "6. The exact search reactivesearch will issue"
# NOTE: hysds_ui appends ignore_unavailable=true&allow_no_indices=true
# (src/utils/esHelpers.js), which SILENTLY SWALLOWS a wrong index name -- you get
# HTTP 200 with zero hits instead of index_not_found_exception. The giveaway is
# "_shards": {"total": 0}. So query without those params first.
for idx in "${INDICES[@]}"; do
  echo "--- ${idx} (strict, no ignore_unavailable) ---"
  "${CURL[@]}" -H 'Content-Type: application/json' \
    -w '\nHTTP %{http_code}\n' \
    -d '{"size":1,"track_total_hits":true,"query":{"match_all":{}}}' \
    "https://${HOST}/${idx}/_search?pretty&filter_path=hits.total,_shards.total,error.type" \
    || true
done
echo "  _shards.total of 0, or an index_not_found_exception, means the name is"
echo "  wrong -- set GRQ_ES_INDICES in src/config/index.js from step 4/5."

step "7. Mapping field names -- use these to fix the sidebar facets"
# src/config/tosca.js ships generic HySDS facets; any dataField absent from the
# mapping renders as an empty filter rather than an error. These are the fields
# that actually exist, and which of them a terms facet can aggregate on.
if ! command -v python3 >/dev/null 2>&1; then
  echo "  python3 not found; raw mapping follows"
  for idx in "${INDICES[@]}"; do
    "${CURL[@]}" "https://${HOST}/${idx}/_mapping?pretty" || true
  done
else
  for idx in "${INDICES[@]}"; do
    echo "--- ${idx} ---"
    # -I: ignore cwd/PYTHONPATH so a stray json.py in the repo can't be imported
    "${CURL[@]}" "https://${HOST}/${idx}/_mapping" 2>/dev/null | python3 -I -c '
import json, sys

raw = sys.stdin.read()
if not raw.strip():
    print("  (empty response -- index missing, or auth failed; see step 2)")
    sys.exit()
try:
    m = json.loads(raw)
except ValueError:
    print("  (non-JSON response) " + raw[:200])
    sys.exit()

# An error response looks like {"error": {...}, "status": 404} -- NOT a mapping.
if isinstance(m, dict) and "error" in m:
    err = m["error"]
    kind = err.get("type", "?") if isinstance(err, dict) else str(err)
    print("  ERROR %s: %s" % (m.get("status", "?"), kind))
    print("  => this index or alias does not exist. Use a name from step 4/5.")
    sys.exit()

def walk(props, prefix=""):
    rows = []
    for name, body in sorted(props.items()):
        path = prefix + name
        if "properties" in body:
            rows += walk(body["properties"], path + ".")
        else:
            t = body.get("type", "?")
            subs = body.get("fields", {})
            # a terms facet needs an aggregatable field: keyword, or a
            # .keyword subfield, or a numeric/bool/date
            if t == "keyword":
                agg = path
            elif "keyword" in subs:
                agg = path + ".keyword"
            elif t in ("boolean", "byte", "short", "integer", "long",
                       "float", "double", "date", "ip"):
                agg = path
            else:
                agg = ""
            rows.append((path, t, agg))
    return rows

# A multi-index alias returns one entry per concrete index; they normally share
# a mapping, so report the union and flag any field that is not everywhere.
per_index = {}
for index, body in m.items():
    per_index[index] = {
        r[0]: r for r in walk(body.get("mappings", {}).get("properties", {}))
    }
if not per_index:
    print("  (no mappings in response)")
    sys.exit()

print("  %d concrete index/indices behind this name" % len(per_index))
union, counts = {}, {}
for fields in per_index.values():
    for path, row in fields.items():
        union[path] = row
        counts[path] = counts.get(path, 0) + 1

n = len(per_index)
print("  %-50s %-12s %s" % ("FIELD", "TYPE", "USE AS dataField"))
for path in sorted(union):
    _, t, agg = union[path]
    mark = "" if counts[path] == n else "  [only %d/%d indices]" % (counts[path], n)
    print("  %-50s %-12s %s%s" % (path, t, agg or "-- not aggregatable", mark))
' || true
  done
fi

printf '\nDone.\n'
