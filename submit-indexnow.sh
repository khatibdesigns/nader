#!/usr/bin/env bash
# Ping IndexNow → Bing/Yandex/Naver/Seznam/Yep (NOT Google) to recrawl URLs.
# Run AFTER deploy (key file must be live):  bash submit-indexnow.sh
set -euo pipefail
cd "$(dirname "$0")"
KEY="46c93e9f3befc9978159530178129dc4"
HOST="khatibdesigns.com"
python3 - "$KEY" "$HOST" <<'PY'
import sys,json,re,urllib.request
key,host=sys.argv[1],sys.argv[2]
sm=open("sitemap.xml",encoding="utf-8").read()
urls=re.findall(r"<loc>([^<]+)</loc>",sm)
body=json.dumps({"host":host,"key":key,
  "keyLocation":f"https://{host}/{key}.txt","urlList":urls}).encode()
req=urllib.request.Request("https://api.indexnow.org/indexnow",data=body,
  headers={"Content-Type":"application/json; charset=utf-8"},method="POST")
try:
    r=urllib.request.urlopen(req,timeout=30)
    print(f"IndexNow: HTTP {r.status} — submitted {len(urls)} URLs")
except urllib.error.HTTPError as e:
    print(f"IndexNow: HTTP {e.code} — {e.read().decode()[:200]} ({len(urls)} URLs)")
PY
