import os, re, glob
slugs = """ai-automation-accounting-gcc ai-automation-for-accounting-gcc
ai-automation-real-estate-gcc ai-automation-for-real-estate-gcc
ai-automation-small-business-gcc ai-automation-for-small-businesses-gcc
ai-automation-retail-gcc ai-automation-retail-fnb-gcc
ai-automation-whatsapp-gcc ai-whatsapp-automation-gcc whatsapp-ai-chatbot-gcc
ai-customer-service-agent-gcc ai-customer-service-agents-gcc
ai-readiness-assessment-gcc ai-readiness-checklist-gcc""".split()
root='/home/knas/.khatib/khdrepo'
allfiles = glob.glob(root+'/**/*.html', recursive=True)
texts = {f: open(f, encoding='utf-8', errors='ignore').read() for f in allfiles}
sm = open(root+'/sitemap.xml', encoding='utf-8').read()
for s in slugs:
    en = root+'/blog/'+s+'/index.html'
    enin = sum(1 for f,t in texts.items() if ('/blog/'+s+'/' in t) and not f.endswith('/blog/'+s+'/index.html') and '/ar/' not in f)
    arin = sum(1 for f,t in texts.items() if '/ar/blog/'+s+'/' in t and not f.endswith('ar/blog/'+s+'/index.html'))
    words = len(re.sub('<[^>]+>',' ', texts.get(en,'')).split())
    title = re.search(r'<title>(.*?)</title>', texts.get(en,''), re.S)
    date = re.search(r'datePublished"\s*:\s*"([^"]+)', texts.get(en,''))
    print(f"{s:42} EN_in={enin:3} AR_in={arin:3} words={words:5} smEN={sm.count('/blog/'+s+'/')} date={date.group(1) if date else '-'}")
    print("   ", (title.group(1)[:110] if title else '-'))
