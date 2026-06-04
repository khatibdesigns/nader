/* Khatib Designs — content model
 * Countries + 26 projects (5 flagship deep-dives + 21 others).
 * Real screenshots live in assets/img/. Client names default to the app name.
 */
(function () {
  const COUNTRIES = {
    kuwait:   { id:'kuwait',   name:'Kuwait',         flag:'🇰🇼', lat:29.3759, lng:47.9774 },
    bulgaria: { id:'bulgaria', name:'Bulgaria',       flag:'🇧🇬', lat:42.6977, lng:23.3219 },
    usa:      { id:'usa',      name:'United States',  flag:'🇺🇸', lat:39.5,    lng:-98.35 },
    lebanon:  { id:'lebanon',  name:'Lebanon',        flag:'🇱🇧', lat:33.8938, lng:35.5018 },
    uk:       { id:'uk',       name:'United Kingdom', flag:'🇬🇧', lat:51.5074, lng:-0.1278 },
    algeria:  { id:'algeria',  name:'Algeria',        flag:'🇩🇿', lat:36.7538, lng:3.0588 },
  };

  // hue used for per-category accents (oklch hue degrees, shared chroma/lightness)
  const CAT_HUE = {
    'On-demand': 55, 'Delivery': 40, 'Fintech': 155, 'Health': 165,
    'Enterprise': 265, 'Marketplace': 35, 'Shopping': 350, 'Lifestyle': 320,
    'Real estate': 230, 'Education': 250, 'Utility': 200, 'Entertainment': 290,
    'Games': 25, 'Productivity': 220, 'Social': 330,
  };

  const HERO = [
    {
      id:'connecthere', name:'Connect Here', country:'usa', tier:'hero',
      category:'Social', tagline:'Meet the people in the room.',
      client:'Connect Here LLC', year:'2024', platforms:['iOS','Android'],
      shots:['assets/img/screen-connecthere-1.png','assets/img/screen-connecthere-2.png'],
      desc:"A social-networking app that revolutionises how you connect with people inside any establishment. Walk into a coffee shop, restaurant or bar, see who else is checked in, browse profiles and send a request to connect and chat — turning any venue into real-time, real-world introductions.",
      features:['Find nearby establishments','See who’s here right now','Send connect & chat requests','Real-time in-venue messaging'],
      store:{ ios:'https://apps.apple.com/kw/app/connect-here/id6502897211', android:'https://play.google.com/store/apps/details?id=com.khd.CH' },
    },
    {
      id:'iwash', name:'iWASH', country:'kuwait', tier:'hero',
      category:'On-demand', tagline:'Book a wash, get on shining.',
      client:'iWASH', year:'2018', platforms:['iOS','Android'],
      shots:['assets/img/screen-iwash-1.png','assets/img/screen-iwash-2.png','assets/img/screen-iwash-3.png'],
      desc:"One of Kuwait’s most popular delivery car-wash platforms. Browse the car washes available in your area, compare ratings, check open time slots and book an appointment — then track your shine, all from your phone.",
      features:['Real-time slot booking','Ratings & reviews','Cash / KNET checkout','In-app coupon wallet'],
      store:{ ios:'#', android:'#' },
    },
    {
      id:'coines', name:'Coines', country:'bulgaria', tier:'hero',
      category:'Fintech', tagline:'Crypto exchange, simplified.',
      client:'Coines', year:'2018', platforms:['iOS','Android'],
      shots:['assets/img/screen-coines-1.png','assets/img/screen-coines-2.png','assets/img/screen-coines-3.png'],
      desc:"Coines brings the freedom and flexibility of crypto exchange to everyone. Register, link your wallet and start exchanging in minutes — with secure peer-to-peer transfers, live status tracking and built-in messaging between traders.",
      features:['Peer-to-peer exchange','Secure wallet linking','Live exchange status','Trader messaging'],
      store:{ ios:'#', android:'#' },
    },
    {
      id:'dwa', name:'DWA', country:'kuwait', tier:'hero',
      category:'Health', tagline:'Your pharmacy, delivered.',
      client:'DWA', year:'2018', platforms:['iOS','Android','Web'],
      shots:['assets/img/screen-dwa-1.png','assets/img/screen-dwa-2.png','assets/img/screen-dwa-3.png'],
      desc:"A unique pharmaceutical delivery system that combines products from nearby pharmacies into convenient, browsable categories. Search, scan a prescription, order, track and receive your medicine right at the door — in Arabic or English.",
      features:['Nearby-pharmacy aggregation','Prescription scanning','Live order tracking','Bilingual: AR / EN'],
      store:{ ios:'#', android:'#', web:'#' },
    },
    {
      id:'wcs', name:'WCS', country:'usa', tier:'hero',
      category:'Enterprise', tagline:'Run the factory floor.',
      client:'WCS Management', year:'2018', platforms:['iOS','Android'],
      shots:['assets/img/screen-wcs-1.png','assets/img/screen-wcs-2.png','assets/img/screen-wcs-3.png'],
      desc:"A management system for major steel factories across the USA. Supervisors view timesheets and wages, manage employees and projects, track budgets and live-chat with operation managers right on the site — keeping every shift in sync.",
      features:['Timesheets & wages','Project & task tracking','On-site live chat','Budget reporting'],
      store:{ ios:'#', android:'#' },
    },
    {
      id:'printit', name:'PrintIt', country:'kuwait', tier:'hero',
      category:'Marketplace', tagline:'Printing, delivered to your door.',
      client:'PrintIt', year:'2018', platforms:['iOS','Android'],
      shots:['assets/img/screen-printit-1.png','assets/img/screen-printit-2.png','assets/img/screen-printit-3.png'],
      desc:"The ultimate solution for everyday printing. Upload your files, spec the job — prints, posters, business cards, folds — get instant quotes from nearby print shops on a live map and have the finished work delivered to your door.",
      features:['Upload & instant quote','Nearby print-shop map','Full job spec builder','Doorstep delivery'],
      store:{ ios:'#', android:'#' },
    },
  ];

  const OTHERS = [
    { id:'buywrd',   name:'BUYWRD',         country:'kuwait',   category:'Shopping',      desc:'Flowers delivery shopping app.' },
    { id:'locally',  name:'LOCALLY',        country:'kuwait',   category:'Shopping',      desc:'Fashion & clothing shopping app.' },
    { id:'salon',    name:'SALON',          country:'kuwait',   category:'Lifestyle',     desc:'Barber shop & hair salon booking app.' },
    { id:'wanasah',  name:'WANASAH',        country:'kuwait',   category:'Real estate',   desc:'Resort, chalet & farm rental app.' },
    { id:'ordeo',    name:'ORDEO',          country:'bulgaria', category:'Enterprise',    desc:'Restaurant management system.' },
    { id:'arabis',   name:'ARABIS',         country:'bulgaria', category:'Education',     desc:'Arabic language courses & projects.' },
    { id:'safesync', name:'SAFESYNC',       country:'bulgaria', category:'Utility',       desc:'Safe cloud storage for pictures & data.' },
    { id:'bimsave',  name:'BIMSAVE',        country:'usa',      category:'Health',        desc:'Medical-purpose money-saving app.' },
    { id:'homechk',  name:'HOME CHECKER',   country:'usa',      category:'Utility',       desc:'Home maintenance & info app.' },
    { id:'spebau',   name:'SPE BAU',        country:'lebanon',  category:'Education',     desc:'Society of Petroleum Engineers chapter app.' },
    { id:'suc',      name:'SUC',            country:'lebanon',  category:'Education',     desc:'SUC Education university app.' },
    { id:'spss',     name:'SPSS',           country:'lebanon',  category:'Education',     desc:'Student’s Paradise secondary-school app.' },
    { id:'jobdir',   name:'JOB DIRECTORY',  country:'lebanon',  category:'Productivity',  desc:'Job directory mobile app.' },
    { id:'networth', name:'NETWORTH',       country:'uk',       category:'Fintech',       desc:'Personal net-worth calculator.' },
    { id:'shadchan', name:'SHADCHAN',       country:'uk',       category:'Lifestyle',     desc:'Professional matching app.' },
    { id:'novellino',name:'NOVELLINO',      country:'uk',       category:'Enterprise',    desc:'Restaurant menu & ordering app.' },
    { id:'giveaways',name:'GIVEAWAYS',      country:'uk',       category:'Games',         desc:'Random picker game app.' },
    { id:'wordgame', name:'WORDGAME',       country:'uk',       category:'Games',         desc:'Word game mobile app.' },
    { id:'vstream',  name:'VSTREAMING',     country:'uk',       category:'Entertainment', desc:'Video streaming mobile app.' },
    { id:'wifigen',  name:'WIFI GENERATOR', country:'algeria',  category:'Utility',       desc:'WiFi password generating app.' },
    { id:'ips',      name:'I.P.S.',         country:'algeria',  category:'Utility',       desc:'Incorrect-Password Selfie security app.' },
  ];

  const ALL = HERO.concat(OTHERS);
  Object.values(COUNTRIES).forEach(function (c) {
    c.count = ALL.filter(function (p) { return p.country === c.id; }).length;
  });

  // Studio contact (from portfolio)
  const CONTACT = {
    email:'nader@khatibdesigns.com',
    phones:[
      { c:'Bulgaria', num:'+359 87 6375875' },
      { c:'Kuwait',   num:'+965 50003758'  },
    ],
  };

  window.KHD = {
    countries: COUNTRIES,
    countryList: Object.values(COUNTRIES),
    hero: HERO,
    others: OTHERS,
    all: ALL,
    catHue: CAT_HUE,
    contact: CONTACT,
    byId: function (id) { return ALL.find(function (p) { return p.id === id; }); },
    byCountry: function (cid) { return ALL.filter(function (p) { return p.country === cid; }); },
    accent: function (cat) {
      const h = CAT_HUE[cat] != null ? CAT_HUE[cat] : 40;
      return 'oklch(0.74 0.15 ' + h + ')';
    },
  };
})();
