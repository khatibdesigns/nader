#!/usr/bin/env python3
"""Khatib Designs — daily SEO/traffic report (runs in GitHub Actions, always-on).
Reads GA4 via the service-account key in $GOOGLE_APPLICATION_CREDENTIALS,
checks site health, lists improvements shipped in the last 24h (git log),
and emails the summary via FormSubmit. No secrets live in this file."""
import os, json, warnings, urllib.request, datetime, subprocess
warnings.filterwarnings("ignore")

EMAIL = os.environ.get("REPORT_EMAIL", "nader@khatibdesigns.com")
PROP  = "properties/" + os.environ.get("GA4_PROPERTY", "540327946")
SITE  = "https://khatibdesigns.com"
today = datetime.date.today().isoformat()
L=[]; p=lambda s="": L.append(s)

def ga4():
    try:
        from google.analytics.data_v1beta import BetaAnalyticsDataClient
        from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Metric, Dimension, OrderBy
        c=BetaAnalyticsDataClient()
        def rep(dims,mets,days,limit=8,order=None):
            ob=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name=order),desc=True)] if order else None
            return c.run_report(RunReportRequest(property=PROP,date_ranges=[DateRange(start_date=f"{days}daysAgo",end_date="today")],
                dimensions=[Dimension(name=d) for d in dims],metrics=[Metric(name=m) for m in mets],order_bys=ob,limit=limit)).rows
        def tot(days):
            r=rep([],["activeUsers","newUsers","sessions","screenPageViews","engagementRate"],days)
            if not r: return (0,0,0,0,0.0)
            m=r[0].metric_values; return (int(m[0].value),int(m[1].value),int(m[2].value),int(m[3].value),float(m[4].value))
        u1=tot(1); u7=tot(7); u28=tot(28)
        p("TRAFFIC")
        p(f"  Today so far : {u1[0]} users, {u1[2]} sessions")
        p(f"  Last 7 days  : {u7[0]} users, {u7[2]} sessions, {u7[3]} pageviews, {u7[4]*100:.0f}% engagement")
        p(f"  Last 28 days : {u28[0]} users, {u28[2]} sessions, {u28[3]} pageviews")
        p(""); p("TOP PAGES (28d)")
        for r in rep(["pagePath"],["screenPageViews"],28,order="screenPageViews"): p(f"  {r.metric_values[0].value:>4}  {r.dimension_values[0].value}")
        p(""); p("CHANNELS (28d)")
        for r in rep(["sessionDefaultChannelGroup"],["sessions"],28,order="sessions"): p(f"  {r.metric_values[0].value:>4}  {r.dimension_values[0].value}")
        p(""); p("COUNTRIES (28d)")
        for r in rep(["country"],["activeUsers"],28,order="activeUsers"): p(f"  {r.metric_values[0].value:>4}  {r.dimension_values[0].value}")
        p(""); p("LEADS (28d)")
        leads={"generate_lead":"0","whatsapp_click":"0","store_click":"0","cta_start_project":"0"}
        for r in rep(["eventName"],["eventCount"],28,limit=50,order="eventCount"):
            en=r.dimension_values[0].value
            if en in leads: leads[en]=r.metric_values[0].value
        p("  " + " · ".join(f"{k}={v}" for k,v in leads.items()))
    except Exception as e:
        p(f"TRAFFIC: GA4 unavailable ({type(e).__name__}: {str(e)[:140]})")

def health():
    p(""); p("SITE HEALTH")
    try:
        sm=urllib.request.urlopen(SITE+"/sitemap.xml",timeout=25).read().decode()
        locs=[l.split("<loc>")[1].split("</loc>")[0] for l in sm.split("\n") if "<loc>" in l]
        bad=[]
        for u in locs:
            try:
                if urllib.request.urlopen(urllib.request.Request(u,method="HEAD"),timeout=15).getcode()!=200: bad.append(u)
            except Exception: bad.append(u)
        p(f"  {len(locs)-len(bad)}/{len(locs)} pages return 200")
        for b in bad[:8]: p(f"  ! DOWN: {b}")
    except Exception as e:
        p(f"  health check failed: {e}")

def shipped():
    p(""); p("IMPROVEMENTS SHIPPED (last 24h)")
    try:
        out=subprocess.run(["git","log","--since=24 hours ago","--pretty=format:%s"],
            capture_output=True,text=True,cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))).stdout.strip()
        msgs=[m for m in out.split("\n") if m and not m.startswith("Merge")]
        if msgs:
            for m in msgs: p(f"  • {m}")
        else:
            p("  • No code/SEO changes deployed in the last 24h.")
    except Exception as e:
        p(f"  (git history unavailable: {e})")

TIPS=[
 "Search Console -> Pages: check how many of the 28 URLs are Indexed; Request indexing on any pending.",
 "Publish/expand one blog post targeting a specific GCC query (e.g. 'app development company Dubai').",
 "Build one quality backlink: a relevant directory or partner site linking to khatibdesigns.com.",
 "Set up / optimise the Google Business Profile (big for GCC + local search).",
 "Add contextual internal links from a blog post to the most relevant case study.",
 "Search Console -> Performance: find a query with impressions but low CTR and sharpen that page's title.",
 "Run PageSpeed (mobile) on the homepage + a case page; fix the top Core Web Vitals issue.",
]
def tip():
    p(""); p("RECOMMENDED NEXT ACTION"); p("  " + TIPS[datetime.date.today().toordinal() % len(TIPS)])

def send(subject, body):
    data=json.dumps({"_subject":subject,"_template":"box","report":body}).encode()
    req=urllib.request.Request("https://formsubmit.co/ajax/"+EMAIL,data=data,headers={
        "Content-Type":"application/json","Accept":"application/json",
        "User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        "Origin":"https://khatibdesigns.com","Referer":"https://khatibdesigns.com/"})
    try: return urllib.request.urlopen(req,timeout=40).read().decode()[:160]
    except Exception as e: return f"EMAIL ERROR: {e}"

p(f"KHATIB DESIGNS — Daily Report · {today}"); p("="*48)
ga4(); health(); shipped(); tip()
p(""); p("— Dashboards: GA4 (Realtime/Acquisition) + Search Console (Performance/Pages).")
body="\n".join(L)
print(body)
print("\n[email]", send(f"Khatib Designs — Daily Report {today}", body))
