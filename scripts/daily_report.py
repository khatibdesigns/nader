#!/usr/bin/env python3
"""Khatib Designs — daily executive performance report.
GA4 + Search Console + site health + 24h shipped changes -> executive summary
+ branded PDF, emailed (SMTP w/ attachment if configured, else FormSubmit text).
Runs in GitHub Actions. No secrets in this file (key/SMTP come from env)."""
import os, json, warnings, urllib.request, datetime, subprocess, smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
warnings.filterwarnings("ignore")

EMAIL    = os.environ.get("REPORT_EMAIL", "nader@khatibdesigns.com")
PROP     = "properties/" + os.environ.get("GA4_PROPERTY", "540327946")
SITE     = "https://khatibdesigns.com"
GSC_SITE = os.environ.get("GSC_SITE", "sc-domain:khatibdesigns.com")
KEYFILE  = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", os.path.expanduser("~/.khatib/ga4-key.json"))
SMTP_USER= os.environ.get("SMTP_USER"); SMTP_PASS=os.environ.get("SMTP_PASS")
SMTP_HOST= os.environ.get("SMTP_HOST","smtp.gmail.com"); SMTP_PORT=int(os.environ.get("SMTP_PORT","465"))
INDEXNOW_KEY = "46c93e9f3befc9978159530178129dc4"
TODAY = datetime.date.today().isoformat()
D = {}   # collected data

def sitemap_urls():
    sm=urllib.request.urlopen(SITE+"/sitemap.xml",timeout=25).read().decode()
    return [l.split("<loc>")[1].split("</loc>")[0] for l in sm.split("\n") if "<loc>" in l]

# ---------- automated action: IndexNow (prompt Bing/Yandex to recrawl) ----------
def indexnow():
    try:
        urls=sitemap_urls()
        payload=json.dumps({"host":"khatibdesigns.com","key":INDEXNOW_KEY,
            "keyLocation":f"{SITE}/{INDEXNOW_KEY}.txt","urlList":urls}).encode()
        req=urllib.request.Request("https://api.indexnow.org/indexnow",data=payload,
            headers={"Content-Type":"application/json; charset=utf-8"})
        code=urllib.request.urlopen(req,timeout=30).getcode()
        D["indexnow"]=(len(urls),code)
    except Exception as e:
        D["indexnow"]=(0,f"err {type(e).__name__}")

# ---------- automated action: on-page SEO audit ----------
def audit():
    try:
        urls=sitemap_urls(); issues=[]; ok=0
        for u in urls:
            try: h=urllib.request.urlopen(u,timeout=15).read().decode("utf-8","ignore")
            except Exception: issues.append(f"{u} (unreachable)"); continue
            miss=[]
            if "<title>" not in h: miss.append("title")
            if 'name="description"' not in h: miss.append("meta-desc")
            if 'rel="canonical"' not in h: miss.append("canonical")
            if 'property="og:image"' not in h: miss.append("og:image")
            if 'application/ld+json' not in h: miss.append("schema")
            if 'hreflang=' not in h: miss.append("hreflang")
            if miss: issues.append(f"{u.replace(SITE,'')}: missing {', '.join(miss)}")
            else: ok+=1
        D["audit"]=(ok,len(urls),issues)
    except Exception as e:
        D["audit"]=(0,0,[str(e)])

def pct(cur, prev):
    if prev == 0: return "new" if cur else "0%"
    return f"{'+' if cur>=prev else ''}{round((cur-prev)/prev*100)}%"

# ---------------- GA4 ----------------
def ga4():
    try:
        from google.analytics.data_v1beta import BetaAnalyticsDataClient
        from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Metric, Dimension, OrderBy
        c=BetaAnalyticsDataClient()
        def run(dims,mets,s,e,limit=8,order=None):
            ob=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name=order),desc=True)] if order else None
            return c.run_report(RunReportRequest(property=PROP,date_ranges=[DateRange(start_date=s,end_date=e)],
                dimensions=[Dimension(name=d) for d in dims],metrics=[Metric(name=m) for m in mets],order_bys=ob,limit=limit)).rows
        def kpi(s,e):
            r=run([],["activeUsers","newUsers","sessions","screenPageViews","engagementRate","averageSessionDuration"],s,e)
            if not r: return dict(users=0,new=0,sess=0,views=0,eng=0.0,dur=0.0)
            m=r[0].metric_values
            return dict(users=int(m[0].value),new=int(m[1].value),sess=int(m[2].value),views=int(m[3].value),eng=float(m[4].value),dur=float(m[5].value))
        D["ga_today"]=kpi("today","today"); D["ga_7"]=kpi("7daysAgo","today"); D["ga_prev7"]=kpi("14daysAgo","8daysAgo"); D["ga_28"]=kpi("28daysAgo","today")
        D["pages"]=[(r.dimension_values[0].value,r.metric_values[0].value) for r in run(["pagePath"],["screenPageViews"],"28daysAgo","today",order="screenPageViews")]
        D["channels"]=[(r.dimension_values[0].value,r.metric_values[0].value) for r in run(["sessionDefaultChannelGroup"],["sessions"],"28daysAgo","today",order="sessions")]
        D["countries"]=[(r.dimension_values[0].value,r.metric_values[0].value) for r in run(["country"],["activeUsers"],"28daysAgo","today",order="activeUsers")]
        leads={"generate_lead":0,"whatsapp_click":0,"store_click":0,"cta_start_project":0}
        for r in run(["eventName"],["eventCount"],"28daysAgo","today",limit=50,order="eventCount"):
            if r.dimension_values[0].value in leads: leads[r.dimension_values[0].value]=int(r.metric_values[0].value)
        D["leads"]=leads
    except Exception as e:
        D["ga_err"]=f"{type(e).__name__}: {str(e)[:140]}"

# ---------------- Search Console ----------------
def gsc():
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
        creds=service_account.Credentials.from_service_account_file(KEYFILE,scopes=["https://www.googleapis.com/auth/webmasters.readonly"])
        sc=build("searchconsole","v1",credentials=creds,cache_discovery=False)
        site=GSC_SITE
        def q(body):
            return sc.searchanalytics().query(siteUrl=site,body=body).execute()
        # date window: SC data lags ~2-3 days
        end=(datetime.date.today()-datetime.timedelta(days=3)).isoformat()
        start=(datetime.date.today()-datetime.timedelta(days=30)).isoformat()
        pstart=(datetime.date.today()-datetime.timedelta(days=60)).isoformat(); pend=(datetime.date.today()-datetime.timedelta(days=31)).isoformat()
        try:
            tot=q({"startDate":start,"endDate":end})
        except Exception:
            site="https://khatibdesigns.com/"; D["gsc_site"]=site
            def q(body): return sc.searchanalytics().query(siteUrl=site,body=body).execute()
            tot=q({"startDate":start,"endDate":end})
        D["gsc_site"]=site
        def agg(resp):
            r=resp.get("rows",[{}])
            r=r[0] if r else {}
            return dict(clicks=int(r.get("clicks",0)),impr=int(r.get("impressions",0)),ctr=r.get("ctr",0.0),pos=r.get("position",0.0))
        D["gsc_cur"]=agg(tot);
        try: D["gsc_prev"]=agg(q({"startDate":pstart,"endDate":pend}))
        except Exception: D["gsc_prev"]=dict(clicks=0,impr=0,ctr=0,pos=0)
        qr=q({"startDate":start,"endDate":end,"dimensions":["query"],"rowLimit":10})
        D["gsc_queries"]=[(row["keys"][0],int(row["clicks"]),int(row["impressions"]),round(row["position"],1)) for row in qr.get("rows",[])]
        # indexed-page count via URL Inspection over sitemap URLs
        try:
            sm=urllib.request.urlopen(SITE+"/sitemap.xml",timeout=20).read().decode()
            locs=[l.split("<loc>")[1].split("</loc>")[0] for l in sm.split("\n") if "<loc>" in l]
            idx=0; checked=0
            for u in locs:
                try:
                    res=sc.urlInspection().index().inspect(body={"inspectionUrl":u,"siteUrl":site}).execute()
                    cov=res.get("inspectionResult",{}).get("indexStatusResult",{}).get("coverageState","")
                    checked+=1
                    if "indexed" in cov.lower(): idx+=1
                except Exception: pass
            D["gsc_index"]=(idx,checked,len(locs))
        except Exception: pass
    except Exception as e:
        D["gsc_err"]=f"{type(e).__name__}: {str(e)[:140]}"

# ---------------- health + shipped ----------------
def health():
    try:
        sm=urllib.request.urlopen(SITE+"/sitemap.xml",timeout=25).read().decode()
        locs=[l.split("<loc>")[1].split("</loc>")[0] for l in sm.split("\n") if "<loc>" in l]
        bad=[]
        for u in locs:
            try:
                if urllib.request.urlopen(urllib.request.Request(u,method="HEAD"),timeout=15).getcode()!=200: bad.append(u)
            except Exception: bad.append(u)
        D["health"]=(len(locs)-len(bad),len(locs),bad)
    except Exception as e: D["health"]=(0,0,[str(e)])

def shipped():
    try:
        out=subprocess.run(["git","log","--since=24 hours ago","--pretty=format:%s"],capture_output=True,text=True,
            cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))).stdout.strip()
        D["shipped"]=[m for m in out.split("\n") if m and not m.startswith("Merge")]
    except Exception: D["shipped"]=[]

TIPS=[
 "Search Console -> Pages: Request indexing on any of the 28 URLs not yet indexed.",
 "Publish or expand a blog post targeting a specific GCC query (e.g. 'app development company Dubai').",
 "Earn one quality backlink: a relevant directory or partner linking to khatibdesigns.com.",
 "Set up / optimise the Google Business Profile (big for GCC + local search).",
 "Add contextual internal links from a blog post to the most relevant case study.",
 "Find a query with impressions but low CTR in Search Console and sharpen that page's title/H1.",
 "Run mobile PageSpeed on the homepage + a case page; fix the top Core Web Vitals issue.",
]
def tip(): return TIPS[datetime.date.today().toordinal() % len(TIPS)]

# ---------------- executive summary ----------------
def exec_summary():
    s=[]
    if "ga_7" in D:
        g=D["ga_7"]; pv=D["ga_prev7"]
        s.append(f"Traffic: {g['users']} users this week ({pct(g['users'],pv['users'])} vs last week), {g['sess']} sessions, {g['eng']*100:.0f}% engagement.")
    elif "ga_err" in D: s.append("Traffic: GA4 not available.")
    if "gsc_cur" in D:
        c=D["gsc_cur"]; p=D["gsc_prev"]
        s.append(f"Search: {c['impr']} impressions ({pct(c['impr'],p['impr'])}), {c['clicks']} clicks, avg position {c['pos']:.1f} (last 30d).")
        if D.get("gsc_index"): s.append(f"Indexing: {D['gsc_index'][0]}/{D['gsc_index'][2]} pages indexed by Google.")
    elif "gsc_err" in D: s.append("Search: Search Console not connected yet.")
    if "leads" in D:
        tl=sum(D["leads"].values()); s.append(f"Leads: {tl} lead action(s) in 28d (" + ", ".join(f"{k}={v}" for k,v in D['leads'].items()) + ").")
    if "health" in D:
        ok,tot,bad=D["health"]; s.append(f"Health: {ok}/{tot} pages OK." + ("" if not bad else f" DOWN: {', '.join(b[:60] for b in bad[:3])}"))
    acts=[]
    if D.get("indexnow") and isinstance(D["indexnow"][1],int): acts.append(f"submitted {D['indexnow'][0]} URLs to IndexNow for recrawl")
    if D.get("audit"): acts.append(f"audited on-page SEO ({D['audit'][0]}/{D['audit'][1]} pages clean)")
    if acts: s.append("Automated today: " + "; ".join(acts) + ".")
    s.append("Focus today: " + tip())
    return s

# ---------------- text body ----------------
def text_body():
    L=[f"KHATIB DESIGNS — Daily Performance Report · {TODAY}","="*52,"","EXECUTIVE SUMMARY"]
    for line in exec_summary(): L.append("  • "+line)
    if "ga_7" in D:
        g7=D["ga_7"]; g28=D["ga_28"]; gt=D["ga_today"]
        L+=["","TRAFFIC",
            f"  Today: {gt['users']} users · 7d: {g7['users']} users / {g7['sess']} sessions / {g7['views']} views · 28d: {g28['users']} users",
            f"  Avg session 7d: {g7['dur']:.0f}s"]
        L+=["","TOP PAGES (28d)"]+[f"  {v:>4}  {p}" for p,v in D["pages"]]
        L+=["","CHANNELS (28d)"]+[f"  {v:>4}  {p}" for p,v in D["channels"]]
        L+=["","COUNTRIES (28d)"]+[f"  {v:>4}  {p}" for p,v in D["countries"]]
    if "gsc_cur" in D:
        c=D["gsc_cur"]; L+=["","SEARCH CONSOLE (last 30d)",
            f"  Impressions {c['impr']} · Clicks {c['clicks']} · CTR {c['ctr']*100:.1f}% · Avg pos {c['pos']:.1f}"]
        if D.get("gsc_queries"):
            L+=["  Top queries (query · clicks · impr · pos):"]+[f"    {q} · {cl} · {im} · {po}" for q,cl,im,po in D["gsc_queries"]]
    elif "gsc_err" in D: L+=["","SEARCH CONSOLE: not connected ("+D["gsc_err"]+")"]
    if "health" in D:
        ok,tot,bad=D["health"]; L+=["","SITE HEALTH",f"  {ok}/{tot} pages return 200"]+[f"  ! DOWN {b}" for b in bad[:8]]
    L+=["","IMPROVEMENTS SHIPPED (last 24h)"]+([f"  • {m}" for m in D["shipped"]] or ["  • No changes deployed in the last 24h."])
    L+=["","AUTOMATED SEO ACTIONS (today)"]
    if D.get("indexnow"):
        n,st=D["indexnow"]; L.append(f"  • IndexNow: submitted {n} URLs for recrawl (status {st})")
    if D.get("audit"):
        ok,tot,iss=D["audit"]; L.append(f"  • On-page audit: {ok}/{tot} pages have full title/meta/canonical/OG/schema/hreflang")
        for i in iss[:6]: L.append(f"    - fix: {i}")
    L+=["","RECOMMENDED NEXT ACTION","  "+tip(),"","— PDF attached. Dashboards: GA4 + Search Console."]
    return "\n".join(L)

# ---------------- PDF ----------------
def asc(s):
    return (str(s).replace("•","-").replace("—","-").replace("–","-").replace("·","-")
            .replace("’","'").replace("‘","'").replace("“",'"').replace("”",'"')
            .replace("…","...").encode("ascii","ignore").decode())
def make_pdf(path):
    from fpdf import FPDF
    INK=(20,18,34); ACC=(255,128,40); MUT=(110,110,130); LINE=(225,222,235)
    pdf=FPDF(format="A4"); pdf.set_auto_page_break(True,15); pdf.add_page(); pdf.set_margins(12,12,12)
    # header band
    pdf.set_fill_color(11,10,24); pdf.rect(0,0,210,26,"F")
    pdf.set_xy(12,7); pdf.set_text_color(255,255,255); pdf.set_font("Helvetica","B",15); pdf.cell(0,8,"KHATIB DESIGNS")
    pdf.set_xy(12,15); pdf.set_text_color(255,170,90); pdf.set_font("Helvetica","",10); pdf.cell(0,6,f"Daily Performance Report  -  {TODAY}")
    pdf.ln(20)
    def h(t):
        pdf.ln(3); pdf.set_text_color(*ACC); pdf.set_font("Helvetica","B",11); pdf.cell(0,7,asc(t),new_x="LMARGIN",new_y="NEXT")
        pdf.set_draw_color(*LINE); pdf.line(12,pdf.get_y(),198,pdf.get_y()); pdf.ln(1)
    def body(t,size=10,color=INK):
        pdf.set_x(pdf.l_margin); pdf.set_text_color(*color); pdf.set_font("Helvetica","",size)
        pdf.multi_cell(0,5,asc(t),new_x="LMARGIN",new_y="NEXT")
    # exec summary
    pdf.set_text_color(*INK); pdf.set_font("Helvetica","B",13); pdf.cell(0,8,"Executive Summary",new_x="LMARGIN",new_y="NEXT")
    pdf.ln(1)
    for line in exec_summary():
        pdf.set_x(pdf.l_margin); pdf.set_text_color(*INK); pdf.set_font("Helvetica","",10)
        pdf.multi_cell(0,5,asc("- "+line),new_x="LMARGIN",new_y="NEXT"); pdf.ln(0.5)
    # KPI table
    if "ga_7" in D:
        h("Traffic (week over week)")
        rows=[("Users",D["ga_7"]["users"],D["ga_prev7"]["users"]),("Sessions",D["ga_7"]["sess"],D["ga_prev7"]["sess"]),
              ("Pageviews",D["ga_7"]["views"],D["ga_prev7"]["views"]),("New users",D["ga_7"]["new"],D["ga_prev7"]["new"])]
        pdf.set_font("Helvetica","B",9); pdf.set_text_color(*MUT)
        pdf.cell(60,6,"Metric"); pdf.cell(40,6,"This week"); pdf.cell(40,6,"Last week"); pdf.cell(40,6,"Change",new_x="LMARGIN",new_y="NEXT")
        pdf.set_font("Helvetica","",10); pdf.set_text_color(*INK)
        for n,a,b in rows:
            pdf.cell(60,6,asc(n)); pdf.cell(40,6,str(a)); pdf.cell(40,6,str(b)); pdf.cell(40,6,asc(pct(a,b)),new_x="LMARGIN",new_y="NEXT")
        h("Top pages (28d)"); body("\n".join(f"{v:>4}  {asc(p)}" for p,v in D["pages"][:8]))
        h("Channels & countries (28d)")
        body("Channels:  "+", ".join(f"{asc(p)} ({v})" for p,v in D["channels"][:5]))
        body("Countries: "+", ".join(f"{asc(p)} ({v})" for p,v in D["countries"][:6]))
    # GSC
    if "gsc_cur" in D:
        c=D["gsc_cur"]; h("Search Console (last 30d)")
        body(f"Impressions {c['impr']} ({pct(c['impr'],D['gsc_prev']['impr'])})   Clicks {c['clicks']}   CTR {c['ctr']*100:.1f}%   Avg position {c['pos']:.1f}")
        if D.get("gsc_index"): body(f"Indexed by Google: {D['gsc_index'][0]} of {D['gsc_index'][2]} pages")
        if D.get("gsc_queries"):
            body("Top search queries:")
            body("\n".join(f"  {asc(q)}  -  {cl} clicks, {im} impr, pos {po}" for q,cl,im,po in D["gsc_queries"][:8]))
    elif "gsc_err" in D:
        h("Search Console"); body("Not connected yet — grant the service account access in Search Console to populate this.",color=MUT)
    # health + shipped + action
    if "health" in D:
        ok,tot,bad=D["health"]; h("Site health"); body(f"{ok}/{tot} pages return HTTP 200." + ("" if not bad else "  DOWN: "+", ".join(bad[:4])))
    h("Improvements shipped (last 24h)")
    body("\n".join(f"- {asc(m)}" for m in D["shipped"]) if D["shipped"] else "- No changes deployed in the last 24h.")
    h("Automated SEO actions (today)")
    al=[]
    if D.get("indexnow"): al.append(f"IndexNow: submitted {D['indexnow'][0]} URLs for recrawl (status {D['indexnow'][1]})")
    if D.get("audit"):
        ok,tot,iss=D["audit"]; al.append(f"On-page audit: {ok}/{tot} pages fully optimized" + ("" if not iss else "; fixes needed: "+ "; ".join(iss[:4])))
    body("\n".join("- "+a for a in al) if al else "- none")
    h("Recommended next action"); body(tip())
    pdf.output(path)

# ---------------- send ----------------
def send_smtp(subject, body, pdf_path):
    msg=MIMEMultipart(); msg["From"]=SMTP_USER; msg["To"]=EMAIL; msg["Subject"]=subject
    msg.attach(MIMEText(body,"plain","utf-8"))
    with open(pdf_path,"rb") as f:
        a=MIMEApplication(f.read(),_subtype="pdf"); a.add_header("Content-Disposition","attachment",filename=f"khatib-report-{TODAY}.pdf"); msg.attach(a)
    with smtplib.SMTP_SSL(SMTP_HOST,SMTP_PORT,timeout=40) as s:
        s.login(SMTP_USER,SMTP_PASS); s.sendmail(SMTP_USER,[EMAIL],msg.as_string())
    return "SMTP sent with PDF attachment"
def send_formsubmit(subject, body):
    data=json.dumps({"_subject":subject,"_template":"box","report":body+"\n\n(PDF attachment needs SMTP — add SMTP_USER/SMTP_PASS secrets.)"}).encode()
    req=urllib.request.Request("https://formsubmit.co/ajax/"+EMAIL,data=data,headers={
        "Content-Type":"application/json","Accept":"application/json",
        "User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        "Origin":"https://khatibdesigns.com","Referer":"https://khatibdesigns.com/"})
    return urllib.request.urlopen(req,timeout=40).read().decode()[:160]

if __name__=="__main__":
    ga4(); gsc(); health(); shipped(); audit(); indexnow()
    body=text_body(); print(body)
    pdf_path=os.environ.get("PDF_OUT","/tmp/khatib-report.pdf")
    try: make_pdf(pdf_path); print("\n[pdf]",pdf_path)
    except Exception as e: pdf_path=None; print("\n[pdf ERROR]",e)
    subject=f"Khatib Designs — Daily Report {TODAY}"
    try:
        if SMTP_USER and SMTP_PASS and pdf_path: print("[email]",send_smtp(subject,body,pdf_path))
        else: print("[email]",send_formsubmit(subject,body))
    except Exception as e: print("[email ERROR]",e)
