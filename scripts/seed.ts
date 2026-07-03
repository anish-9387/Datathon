import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

// ─────────────────────────── STATIC DATA ───────────────────────────

const KARNATAKA_DISTRICTS = [
  "Bagalkote", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban",
  "Bidar", "Chamarajanagara", "Chikkaballapura", "Chikkamagaluru", "Chitradurga",
  "Dakshina Kannada", "Davanagere", "Dharwada", "Gadaga", "Hassan",
  "Haveri", "Kalaburagi", "Kodagu", "Kolara", "Koppala",
  "Mandya", "Mysuru", "Raichuru", "Ramanagara", "Shivamogga",
  "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgiri",
  "Bengaluru",
];

const POLICE_STATIONS_BY_DISTRICT: Record<string, string[]> = {
  "Bengaluru Urban": [
    "Cubbon Park", "High Grounds", "Ulsoor", "Indiranagar", "Mahadevapura",
    "Whitefield", "K R Puram", "HAL Airport", "Koramangala", "BTM Layout",
    "Madiwala", "HSR Layout", "Electronic City", "Banashankari", "Kumaraswamy Layout",
    "J P Nagar", "Basavanagudi", "Vijayanagar", "Rajajinagar", "Malleswaram",
    "Yeshwanthpur", "Peenya", "Dasarahalli", "Bagalgunte", "Hessarghatta",
    "Kengeri", "Nagarbhavi", "Kumbalgodu", "Yelahanka", "Hebbal",
    "RT Nagar", "Byatarayanapura", "Vidhana Soudha", "Nandi durga Road", "Mysore Road",
  ],
  "Mysuru": [
    "Devaraja", "K R Nagar", "Nanjangud", "Hunsur", "K R Pete",
    "T Narasipura", "Periyapatna", "Srirangapatna", "Chikka Devamma", "Lakshmipuram",
    "Saraswathipuram", "V V Puram", "Kuvempunagar", "Metagalli", "Bannimantap",
  ],
  "Belagavi": [
    "Belagavi City", "Khanapur", "Bailhongal", "Gokak", "Ramdurga",
    "Chikodi", "Athni", "Raibag", "Sampgaon", "Hukkeri",
    "Sadashiv Nagar", "Tilakwadi", "Camp", "Bharat Nagar", "Vadagaon",
  ],
  "Kalaburagi": [
    "Kalaburagi City", "Afzalpur", "Aland", "Chincholi", "Sedam",
    "Chitapur", "Jevargi", "Kalagi", "Kamalapur", "Shahabad",
  ],
  "Dharwada": [
    "Dharwad City", "Hubli City", "Hubli Rural", "Kalghatgi", "Kundgol",
    "Navalgund", "Hubli Traffic", "Dharwad Traffic", "Vidyanagar", "Deshpande Nagar",
  ],
  "Ballari": [
    "Ballari City", "Kampli", "Sandur", "Kudligi", "Hospet",
    "Siruguppa", "Hagaribommanahalli", "Hoovina Hadagali", "Kottur", "T B Dam",
  ],
  "Tumakuru": [
    "Tumkur City", "Gubbi", "Tiptur", "Chikkanayakanahalli", "Koratagere",
    "Madhugiri", "Pavagada", "Kunigal", "Sira", "Turuvekere",
  ],
  "Dakshina Kannada": [
    "Mangaluru City", "Mangaluru Rural", "Bantwal", "Puttur", "Sullia",
    "Belthangady", "Kadaba", "Konaje", "Surathkal", "Ullal",
    "Panambur", "Bunder", "Kankanady", "Kavoor", "Moodbidri",
  ],
  "Udupi": [
    "Udupi Town", "Kundapura", "Karkala", "Hebri", "Koteshwara",
    "Brahmavara", "Malpe", "Shankarapura", "Byndoor", "Udyavara",
  ],
  "Shivamogga": [
    "Shivamogga City", "Bhadravati", "Sagara", "Shikaripura", "Soraba",
    "Hosanagara", "Tirthahalli", "Jog", "Kargal", "Mandagadde",
  ],
  "Chitradurga": [
    "Chitradurga City", "Challakere", "Hiriyur", "Holalkere", "Hosadurga",
    "Molakalmuru", "Pavagada", "Mayakonda", "Nayakanahatti", "Tarikere",
  ],
  "Hassan": [
    "Hassan City", "Arsikere", "Belur", "Channarayapatna", "Holenarsipura",
    "Sakleshapura", "Alur", "Arkalgud", "Beltangadi", "Javagal",
  ],
  "Mandya": [
    "Mandya City", "Malavalli", "Maddur", "K R Pet", "Nagamangala",
    "Pandavapura", "Shrirangapattana", "Farm", "Katteri", "Muthathi",
  ],
  "Belagavi Area": [],
  "Bengaluru Rural": [
    "Doddaballapura", "Devanahalli", "Nelamangala", "Hosakote", "Magadi",
    "Ramanagara", "Channapatna", "Kanakapura", "Harohalli", "Kunigal Road",
  ],
  "Bidar": [
    "Bidar City", "Basavakalyan", "Bhalki", "Aurad", "Humnabad",
    "Chita", "Kamthana", "Manhalli", "Mirajga", "Nidoda",
  ],
  "Chamarajanagara": [
    "Chamarajanagar City", "Gundlupet", "Kollegal", "Yelandur", "Hanur",
    "Sargur", "K Gudi", "M M Hills", "Doddakowlande", "Terakanambi",
  ],
  "Chikkaballapura": [
    "Chikkaballapur City", "Chintamani", "Sidlaghatta", "Bagepalli", "Gudibande",
    "Gowribidanur", "Shanthinagar", "Mudugere", "Nandi", "Puluvalli",
  ],
  "Chikkamagaluru": [
    "Chikkamagaluru City", "Kadur", "Koppa", "Mudigere", "Narasimharajapura",
    "Sringeri", "Kalasa", "Aldur", "Banakal", "Javali",
  ],
  "Davanagere": [
    "Davanagere City", "Harapanahalli", "Jagalur", "Channagiri", "Honnali",
    "Harihara", "Nyamathi", "Mayakonda", "Chigateri", "Santalagodu",
  ],
  "Gadaga": [
    "Gadag City", "Betageri", "Nargund", "Mundargi", "Shirahatti",
    "Lakshmeshwar", "Ron", "Gajendragad", "Dambal", "Hombal",
  ],
  "Haveri": [
    "Haveri City", "Ranebennur", "Savanur", "Byadagi", "Hirekerur",
    "Shiggaon", "Hangal", "Rattihalli", "Masanagi", "Takkalaki",
  ],
  "Kodagu": [
    "Madikeri City", "Virajpet", "Somwarpet", "Kushalanagar", "Gonikoppal",
    "Siddapura", "Bhagamandala", "Napoklu", "Ponnampet", "Hudikeri",
  ],
  "Kolara": [
    "Kolar City", "Bangarpet", "KGF", "Malur", "Srinivasapura",
    "Mulbagal", "Robertsonpet", "Andersonpet", "Bethamangala", "Chickballapur Road",
  ],
  "Koppala": [
    "Koppal City", "Gangavathi", "Yelburga", "Kushtagi", "Kanakagiri",
    "Karatagi", "Hanumasagar", "Alwandi", "Hirevankalakunta", "Chicklambi",
  ],
  "Raichuru": [
    "Raichur City", "Sindhanur", "Mannavi", "Devadurga", "Lingasugur",
    "Maski", "Sirwar", "Gangavathi", "Hatti", "Mudgal",
  ],
  "Ramanagara": [
    "Ramanagara City", "Channapatna", "Kanakapura", "Magadi", "Harohalli",
    "Bidadi", "Sathanur", "Kudur", "Kelagina Kere", "Dodda Maralavadi",
  ],
  "Uttara Kannada": [
    "Karwar City", "Sirsi", "Kumta", "Honnavar", "Bhatkal",
    "Ankola", "Haliyal", "Yellapur", "Siddapura", "Gokarna",
    "Dandeli", "Joida", "Mundgod", "Kallagaddi", "Kurandi",
  ],
  "Vijayapura": [
    "Vijayapura City", "Indi", "Sindagi", "Basavana Bagewadi", "Jamakhandi",
    "Muddebihal", "Tikota", "Devara Hipparagi", "Bableshwar", "Kudagi",
  ],
  "Yadgiri": [
    "Yadgir City", "Shahapur", "Shorapur", "Gurumitkal", "Wadagera",
    "Hattikuni", "Kembhavi", "Bonal", "Kodla", "Mugalihalli",
  ],
  "Bagalkote": [
    "Bagalkot City", "Jamkhandi", "Badami", "Guledgudda", "Mudhol",
    "Bilgi", "Rabkavi Banhatti", "Teradal", "Ilkal", "Hunagund",
  ],
};

const ACTS = [
  { ActCode: "IPC", ActDescription: "Indian Penal Code, 1860", ShortName: "IPC", Active: true },
  { ActCode: "BNS", ActDescription: "Bharatiya Nyaya Sanhita, 2023", ShortName: "BNS", Active: true },
  { ActCode: "NDPS", ActDescription: "Narcotic Drugs and Psychotropic Substances Act, 1985", ShortName: "NDPS", Active: true },
  { ActCode: "ARMS", ActDescription: "Arms Act, 1959", ShortName: "Arms Act", Active: true },
  { ActCode: "CrPC", ActDescription: "Code of Criminal Procedure, 1973", ShortName: "CrPC", Active: true },
  { ActCode: "IT", ActDescription: "Information Technology Act, 2000", ShortName: "IT Act", Active: true },
  { ActCode: "SCST", ActDescription: "Scheduled Castes and Scheduled Tribes (Prevention of Atrocities) Act, 1989", ShortName: "SC/ST Act", Active: true },
  { ActCode: "KA-PE", ActDescription: "Karnataka Police Act, 1963", ShortName: "KA Police Act", Active: true },
  { ActCode: "EXPLO", ActDescription: "Explosives Act, 1884", ShortName: "Explosives Act", Active: true },
  { ActCode: "POCSO", ActDescription: "Protection of Children from Sexual Offences Act, 2012", ShortName: "POCSO", Active: true },
  { ActCode: "KAMC", ActDescription: "Karnataka Mines and Minerals Act", ShortName: "KA Mines Act", Active: true },
  { ActCode: "ENV", ActDescription: "Environment Protection Act, 1986", ShortName: "Env Act", Active: true },
];

const SECTIONS: { ActCode: string; SectionCode: string; SectionDescription: string }[] = [
  { ActCode: "IPC", SectionCode: "302", SectionDescription: "Punishment for murder" },
  { ActCode: "IPC", SectionCode: "304B", SectionDescription: "Dowry death" },
  { ActCode: "IPC", SectionCode: "307", SectionDescription: "Attempt to murder" },
  { ActCode: "IPC", SectionCode: "308", SectionDescription: "Attempt to commit culpable homicide" },
  { ActCode: "IPC", SectionCode: "323", SectionDescription: "Punishment for voluntarily causing hurt" },
  { ActCode: "IPC", SectionCode: "324", SectionDescription: "Voluntarily causing hurt by dangerous weapons" },
  { ActCode: "IPC", SectionCode: "326", SectionDescription: "Voluntarily causing grievous hurt by dangerous weapons" },
  { ActCode: "IPC", SectionCode: "341", SectionDescription: "Punishment for wrongful restraint" },
  { ActCode: "IPC", SectionCode: "342", SectionDescription: "Punishment for wrongful confinement" },
  { ActCode: "IPC", SectionCode: "354", SectionDescription: "Assault or criminal force to woman with intent to outrage her modesty" },
  { ActCode: "IPC", SectionCode: "354A", SectionDescription: "Sexual harassment" },
  { ActCode: "IPC", SectionCode: "354B", SectionDescription: "Assault or use of criminal force to woman with intent to disrobe" },
  { ActCode: "IPC", SectionCode: "354C", SectionDescription: "Voyeurism" },
  { ActCode: "IPC", SectionCode: "354D", SectionDescription: "Stalking" },
  { ActCode: "IPC", SectionCode: "363", SectionDescription: "Punishment for kidnapping" },
  { ActCode: "IPC", SectionCode: "364", SectionDescription: "Kidnapping for ransom" },
  { ActCode: "IPC", SectionCode: "365", SectionDescription: "Kidnapping with intent to secretly confine" },
  { ActCode: "IPC", SectionCode: "366", SectionDescription: "Kidnapping, abducting or inducing woman to compel marriage" },
  { ActCode: "IPC", SectionCode: "376", SectionDescription: "Punishment for rape" },
  { ActCode: "IPC", SectionCode: "376A", SectionDescription: "Punishment for causing death or persistent vegetative state" },
  { ActCode: "IPC", SectionCode: "376D", SectionDescription: "Gang rape" },
  { ActCode: "IPC", SectionCode: "377", SectionDescription: "Unnatural offences" },
  { ActCode: "IPC", SectionCode: "379", SectionDescription: "Punishment for theft" },
  { ActCode: "IPC", SectionCode: "380", SectionDescription: "Theft in dwelling house" },
  { ActCode: "IPC", SectionCode: "381", SectionDescription: "Theft by clerk or servant of property in possession of master" },
  { ActCode: "IPC", SectionCode: "382", SectionDescription: "Theft after preparation made for causing death" },
  { ActCode: "IPC", SectionCode: "383", SectionDescription: "Extortion" },
  { ActCode: "IPC", SectionCode: "384", SectionDescription: "Punishment for extortion" },
  { ActCode: "IPC", SectionCode: "392", SectionDescription: "Punishment for robbery" },
  { ActCode: "IPC", SectionCode: "393", SectionDescription: "Attempt to commit robbery" },
  { ActCode: "IPC", SectionCode: "394", SectionDescription: "Voluntarily causing hurt in committing robbery" },
  { ActCode: "IPC", SectionCode: "395", SectionDescription: "Punishment for dacoity" },
  { ActCode: "IPC", SectionCode: "396", SectionDescription: "Dacoity with murder" },
  { ActCode: "IPC", SectionCode: "397", SectionDescription: "Robbery or dacoity with attempt to cause death" },
  { ActCode: "IPC", SectionCode: "398", SectionDescription: "Attempt to commit robbery or dacoity when armed" },
  { ActCode: "IPC", SectionCode: "399", SectionDescription: "Making preparation to commit dacoity" },
  { ActCode: "IPC", SectionCode: "400", SectionDescription: "Punishment for belonging to gang of dacoits" },
  { ActCode: "IPC", SectionCode: "403", SectionDescription: "Dishonest misappropriation of property" },
  { ActCode: "IPC", SectionCode: "406", SectionDescription: "Punishment for criminal breach of trust" },
  { ActCode: "IPC", SectionCode: "407", SectionDescription: "Criminal breach of trust by carrier" },
  { ActCode: "IPC", SectionCode: "408", SectionDescription: "Criminal breach of trust by servant" },
  { ActCode: "IPC", SectionCode: "409", SectionDescription: "Criminal breach of trust by public servant" },
  { ActCode: "IPC", SectionCode: "411", SectionDescription: "Dishonestly receiving stolen property" },
  { ActCode: "IPC", SectionCode: "413", SectionDescription: "Habitually dealing in stolen property" },
  { ActCode: "IPC", SectionCode: "414", SectionDescription: "Assisting in concealment of stolen property" },
  { ActCode: "IPC", SectionCode: "417", SectionDescription: "Punishment for cheating" },
  { ActCode: "IPC", SectionCode: "418", SectionDescription: "Cheating with knowledge that wrongful loss may ensue" },
  { ActCode: "IPC", SectionCode: "419", SectionDescription: "Punishment for cheating by personation" },
  { ActCode: "IPC", SectionCode: "420", SectionDescription: "Cheating and dishonestly inducing delivery of property" },
  { ActCode: "IPC", SectionCode: "426", SectionDescription: "Punishment for mischief" },
  { ActCode: "IPC", SectionCode: "427", SectionDescription: "Mischief causing damage to property" },
  { ActCode: "IPC", SectionCode: "428", SectionDescription: "Mischief by killing or maiming animal" },
  { ActCode: "IPC", SectionCode: "429", SectionDescription: "Mischief by killing or maiming cattle" },
  { ActCode: "IPC", SectionCode: "435", SectionDescription: "Mischief by fire with intent to cause damage" },
  { ActCode: "IPC", SectionCode: "436", SectionDescription: "Mischief by fire with intent to destroy house" },
  { ActCode: "IPC", SectionCode: "447", SectionDescription: "Punishment for criminal trespass" },
  { ActCode: "IPC", SectionCode: "448", SectionDescription: "Punishment for house-trespass" },
  { ActCode: "IPC", SectionCode: "449", SectionDescription: "House-trespass with intent to commit offence" },
  { ActCode: "IPC", SectionCode: "451", SectionDescription: "House-trespass with preparation to assault" },
  { ActCode: "IPC", SectionCode: "452", SectionDescription: "House-trespass after preparation for hurt" },
  { ActCode: "IPC", SectionCode: "453", SectionDescription: "Punishment for lurking house-trespass" },
  { ActCode: "IPC", SectionCode: "454", SectionDescription: "Lurking house-trespass with intent to commit offence" },
  { ActCode: "IPC", SectionCode: "456", SectionDescription: "Punishment for lurking house-trespass by night" },
  { ActCode: "IPC", SectionCode: "457", SectionDescription: "Lurking house-trespass by night with intent to commit offence" },
  { ActCode: "IPC", SectionCode: "458", SectionDescription: "Lurking house-trespass by night with preparation for assault" },
  { ActCode: "IPC", SectionCode: "460", SectionDescription: "All persons jointly concerned in lurking house-trespass" },
  { ActCode: "IPC", SectionCode: "465", SectionDescription: "Punishment for forgery" },
  { ActCode: "IPC", SectionCode: "467", SectionDescription: "Forgery of valuable security" },
  { ActCode: "IPC", SectionCode: "468", SectionDescription: "Forgery for purpose of cheating" },
  { ActCode: "IPC", SectionCode: "469", SectionDescription: "Forgery for purpose of harming reputation" },
  { ActCode: "IPC", SectionCode: "471", SectionDescription: "Using as genuine a forged document" },
  { ActCode: "IPC", SectionCode: "473", SectionDescription: "Making or possessing counterfeit seal" },
  { ActCode: "IPC", SectionCode: "474", SectionDescription: "Having possession of document known to be forged" },
  { ActCode: "IPC", SectionCode: "475", SectionDescription: "Counterfeiting device or mark" },
  { ActCode: "IPC", SectionCode: "476", SectionDescription: "Counterfeiting die or stamp" },
  { ActCode: "IPC", SectionCode: "477", SectionDescription: "Fraudulent cancellation" },
  { ActCode: "IPC", SectionCode: "478", SectionDescription: "Using false trade mark" },
  { ActCode: "IPC", SectionCode: "498A", SectionDescription: "Cruelty by husband or relatives" },
  { ActCode: "IPC", SectionCode: "499", SectionDescription: "Defamation" },
  { ActCode: "IPC", SectionCode: "500", SectionDescription: "Punishment for defamation" },
  { ActCode: "IPC", SectionCode: "504", SectionDescription: "Intentional insult with intent to provoke breach of peace" },
  { ActCode: "IPC", SectionCode: "506", SectionDescription: "Punishment for criminal intimidation" },
  { ActCode: "IPC", SectionCode: "509", SectionDescription: "Word, gesture or act intended to insult modesty of woman" },
  { ActCode: "IPC", SectionCode: "511", SectionDescription: "Punishment for attempting to commit offences" },
  { ActCode: "IPC", SectionCode: "120B", SectionDescription: "Punishment for criminal conspiracy" },
  { ActCode: "IPC", SectionCode: "109", SectionDescription: "Punishment of abetment if the act abetted is committed" },
  { ActCode: "IPC", SectionCode: "114", SectionDescription: "Abettor present when offence is committed" },
  { ActCode: "IPC", SectionCode: "147", SectionDescription: "Punishment for rioting" },
  { ActCode: "IPC", SectionCode: "148", SectionDescription: "Rioting with deadly weapon" },
  { ActCode: "IPC", SectionCode: "149", SectionDescription: "Every member of unlawful assembly guilty of offence" },
  { ActCode: "IPC", SectionCode: "150", SectionDescription: "Hiring or conniving at hiring of persons to join unlawful assembly" },
  { ActCode: "IPC", SectionCode: "151", SectionDescription: "Knowingly joining or continuing in assembly of five or more persons" },
  { ActCode: "IPC", SectionCode: "153A", SectionDescription: "Promoting enmity between different groups" },
  { ActCode: "IPC", SectionCode: "153B", SectionDescription: "Imputations prejudicial to national integration" },
  { ActCode: "IPC", SectionCode: "160", SectionDescription: "Punishment for committing affray" },
  { ActCode: "IPC", SectionCode: "161", SectionDescription: "Public servant taking gratification" },
  { ActCode: "IPC", SectionCode: "166", SectionDescription: "Public servant disobeying law" },
  { ActCode: "IPC", SectionCode: "167", SectionDescription: "Public servant framing incorrect document" },
  { ActCode: "IPC", SectionCode: "168", SectionDescription: "Public servant unlawfully engaging in trade" },
  { ActCode: "IPC", SectionCode: "169", SectionDescription: "Public servant unlawfully buying or bidding for property" },
  { ActCode: "IPC", SectionCode: "170", SectionDescription: "Personating a public servant" },
  { ActCode: "IPC", SectionCode: "171", SectionDescription: "Wearing garb or carrying token used by public servant" },
  { ActCode: "IPC", SectionCode: "172", SectionDescription: "Absconding to avoid service of summons" },
  { ActCode: "IPC", SectionCode: "173", SectionDescription: "Preventing service of summons" },
  { ActCode: "IPC", SectionCode: "174", SectionDescription: "Non-attendance in obedience to order" },
  { ActCode: "IPC", SectionCode: "175", SectionDescription: "Omission to produce document" },
  { ActCode: "IPC", SectionCode: "176", SectionDescription: "Omission to give notice or information" },
  { ActCode: "IPC", SectionCode: "177", SectionDescription: "Furnishing false information" },
  { ActCode: "IPC", SectionCode: "178", SectionDescription: "Refusing oath or affirmation" },
  { ActCode: "IPC", SectionCode: "179", SectionDescription: "Refusing to answer" },
  { ActCode: "IPC", SectionCode: "180", SectionDescription: "Refusing to sign statement" },
  { ActCode: "IPC", SectionCode: "181", SectionDescription: "False statement on oath" },
  { ActCode: "IPC", SectionCode: "182", SectionDescription: "False information to public servant" },
  { ActCode: "IPC", SectionCode: "183", SectionDescription: "Resistance to taking of property" },
  { ActCode: "IPC", SectionCode: "184", SectionDescription: "Obstructing sale of property" },
  { ActCode: "IPC", SectionCode: "185", SectionDescription: "Illegal purchase or bid for property" },
  { ActCode: "IPC", SectionCode: "186", SectionDescription: "Obstructing public servant" },
  { ActCode: "IPC", SectionCode: "187", SectionDescription: "Omission to assist public servant" },
  { ActCode: "IPC", SectionCode: "188", SectionDescription: "Disobedience to order duly promulgated" },
  { ActCode: "IPC", SectionCode: "189", SectionDescription: "Threat of injury to public servant" },
  { ActCode: "IPC", SectionCode: "190", SectionDescription: "Threat of injury to induce person to refrain from applying for protection" },
  { ActCode: "IPC", SectionCode: "191", SectionDescription: "Giving false evidence" },
  { ActCode: "IPC", SectionCode: "192", SectionDescription: "Fabricating false evidence" },
  { ActCode: "IPC", SectionCode: "193", SectionDescription: "Punishment for false evidence" },
  { ActCode: "IPC", SectionCode: "194", SectionDescription: "Giving false evidence with intent to procure conviction" },
  { ActCode: "IPC", SectionCode: "195", SectionDescription: "Giving false evidence with intent to procure conviction for capital offence" },
  { ActCode: "IPC", SectionCode: "196", SectionDescription: "Using evidence known to be false" },
  { ActCode: "IPC", SectionCode: "197", SectionDescription: "Issuing false certificate" },
  { ActCode: "IPC", SectionCode: "198", SectionDescription: "Using false certificate" },
  { ActCode: "IPC", SectionCode: "199", SectionDescription: "False statement made in declaration" },
  { ActCode: "IPC", SectionCode: "200", SectionDescription: "Using false declaration" },
  // NDPS sections
  { ActCode: "NDPS", SectionCode: "20", SectionDescription: "Punishment for cultivation of cannabis" },
  { ActCode: "NDPS", SectionCode: "21", SectionDescription: "Punishment for manufacture, possession, sale, purchase of cannabis" },
  { ActCode: "NDPS", SectionCode: "22", SectionDescription: "Punishment for manufacture, possession, sale, purchase of psychotropic substances" },
  { ActCode: "NDPS", SectionCode: "23", SectionDescription: "Punishment for illegal import/export of narcotics" },
  { ActCode: "NDPS", SectionCode: "27", SectionDescription: "Punishment for consumption of narcotic drugs" },
  { ActCode: "NDPS", SectionCode: "28", SectionDescription: "Attempts, abetment and criminal conspiracy" },
  { ActCode: "NDPS", SectionCode: "29", SectionDescription: "Punishment for abetment" },
  { ActCode: "NDPS", SectionCode: "36", SectionDescription: "Constitution of Special Courts" },
  // Arms Act
  { ActCode: "ARMS", SectionCode: "25", SectionDescription: "Punishment for illegal possession of arms" },
  { ActCode: "ARMS", SectionCode: "26", SectionDescription: "Punishment for manufacturing arms without license" },
  { ActCode: "ARMS", SectionCode: "27", SectionDescription: "Punishment for using arms" },
  { ActCode: "ARMS", SectionCode: "28", SectionDescription: "Punishment for making false declaration" },
  // IT Act
  { ActCode: "IT", SectionCode: "66", SectionDescription: "Computer related offences" },
  { ActCode: "IT", SectionCode: "66B", SectionDescription: "Punishment for dishonestly receiving stolen computer resource" },
  { ActCode: "IT", SectionCode: "66C", SectionDescription: "Punishment for identity theft" },
  { ActCode: "IT", SectionCode: "66D", SectionDescription: "Punishment for cheating by personation by using computer" },
  { ActCode: "IT", SectionCode: "66E", SectionDescription: "Punishment for violation of privacy" },
  { ActCode: "IT", SectionCode: "67", SectionDescription: "Punishment for publishing obscene material in electronic form" },
  { ActCode: "IT", SectionCode: "67A", SectionDescription: "Punishment for publishing sexually explicit material" },
  { ActCode: "IT", SectionCode: "67B", SectionDescription: "Punishment for child pornography" },
  { ActCode: "IT", SectionCode: "72", SectionDescription: "Breach of confidentiality" },
  { ActCode: "IT", SectionCode: "72A", SectionDescription: "Punishment for disclosure of information" },
  { ActCode: "IT", SectionCode: "74", SectionDescription: "Publication of false digital signature" },
  // SC/ST Act
  { ActCode: "SCST", SectionCode: "3", SectionDescription: "Punishment for offences of atrocities" },
  { ActCode: "SCST", SectionCode: "4", SectionDescription: "Punishment for neglect of duties" },
  { ActCode: "SCST", SectionCode: "5", SectionDescription: "Cancellation of arms licenses" },
  // BNS sections (Bharatiya Nyaya Sanhita)
  { ActCode: "BNS", SectionCode: "101", SectionDescription: "Murder" },
  { ActCode: "BNS", SectionCode: "102", SectionDescription: "Attempt to murder" },
  { ActCode: "BNS", SectionCode: "104", SectionDescription: "Dowry death" },
  { ActCode: "BNS", SectionCode: "115", SectionDescription: "Voluntarily causing hurt" },
  { ActCode: "BNS", SectionCode: "118", SectionDescription: "Grievous hurt" },
  { ActCode: "BNS", SectionCode: "127", SectionDescription: "Wrongful restraint" },
  { ActCode: "BNS", SectionCode: "129", SectionDescription: "Wrongful confinement" },
  { ActCode: "BNS", SectionCode: "132", SectionDescription: "Kidnapping" },
  { ActCode: "BNS", SectionCode: "137", SectionDescription: "Rape" },
  { ActCode: "BNS", SectionCode: "142", SectionDescription: "Gang rape" },
  { ActCode: "BNS", SectionCode: "148", SectionDescription: "Theft" },
  { ActCode: "BNS", SectionCode: "149", SectionDescription: "Theft in dwelling house" },
  { ActCode: "BNS", SectionCode: "152", SectionDescription: "Extortion" },
  { ActCode: "BNS", SectionCode: "157", SectionDescription: "Robbery" },
  { ActCode: "BNS", SectionCode: "158", SectionDescription: "Attempt to commit robbery" },
  { ActCode: "BNS", SectionCode: "160", SectionDescription: "Dacoity" },
  { ActCode: "BNS", SectionCode: "163", SectionDescription: "Cheating" },
  { ActCode: "BNS", SectionCode: "164", SectionDescription: "Cheating by personation" },
  { ActCode: "BNS", SectionCode: "167", SectionDescription: "Criminal breach of trust" },
  { ActCode: "BNS", SectionCode: "182", SectionDescription: "Mischief" },
  { ActCode: "BNS", SectionCode: "189", SectionDescription: "Criminal trespass" },
  { ActCode: "BNS", SectionCode: "191", SectionDescription: "House-trespass" },
  { ActCode: "BNS", SectionCode: "199", SectionDescription: "Forgery" },
  { ActCode: "BNS", SectionCode: "201", SectionDescription: "Forgery of valuable security" },
  // KA Police Act
  { ActCode: "KA-PE", SectionCode: "78", SectionDescription: "Penalty for certain offences" },
  { ActCode: "KA-PE", SectionCode: "79", SectionDescription: "Punishment for habitual offenders" },
  { ActCode: "KA-PE", SectionCode: "80", SectionDescription: "Penalty for drunk and disorderly" },
  { ActCode: "KA-PE", SectionCode: "81", SectionDescription: "Penalty for obstruction" },
  { ActCode: "KA-PE", SectionCode: "85", SectionDescription: "Penalty for cruelty to animals" },
  { ActCode: "KA-PE", SectionCode: "87", SectionDescription: "Penalty for gambling" },
  { ActCode: "KA-PE", SectionCode: "92", SectionDescription: "Penalty for public nuisance" },
  { ActCode: "KA-PE", SectionCode: "95", SectionDescription: "Penalty for possession of property" },
  // Explosives Act
  { ActCode: "EXPLO", SectionCode: "3", SectionDescription: "Possession of explosives without license" },
  { ActCode: "EXPLO", SectionCode: "4", SectionDescription: "Manufacturing explosives without license" },
  { ActCode: "EXPLO", SectionCode: "5", SectionDescription: "Punishment for offences" },
  // POCSO
  { ActCode: "POCSO", SectionCode: "3", SectionDescription: "Penetrative sexual assault" },
  { ActCode: "POCSO", SectionCode: "4", SectionDescription: "Punishment for penetrative sexual assault" },
  { ActCode: "POCSO", SectionCode: "5", SectionDescription: "Aggravated penetrative sexual assault" },
  { ActCode: "POCSO", SectionCode: "7", SectionDescription: "Sexual assault" },
  { ActCode: "POCSO", SectionCode: "8", SectionDescription: "Punishment for sexual assault" },
  { ActCode: "POCSO", SectionCode: "9", SectionDescription: "Aggravated sexual assault" },
  { ActCode: "POCSO", SectionCode: "11", SectionDescription: "Sexual harassment" },
  { ActCode: "POCSO", SectionCode: "12", SectionDescription: "Punishment for sexual harassment" },
  { ActCode: "POCSO", SectionCode: "14", SectionDescription: "Punishment for using child for pornographic purposes" },
  // KA Mines Act
  { ActCode: "KAMC", SectionCode: "4", SectionDescription: "Illegal mining" },
  { ActCode: "KAMC", SectionCode: "5", SectionDescription: "Illegal transportation of minerals" },
  { ActCode: "KAMC", SectionCode: "6", SectionDescription: "Violation of license conditions" },
  // Environment Act
  { ActCode: "ENV", SectionCode: "7", SectionDescription: "Environmental violation" },
  { ActCode: "ENV", SectionCode: "8", SectionDescription: "Penalty for environmental damage" },
  { ActCode: "ENV", SectionCode: "9", SectionDescription: "Offences by companies" },
  { ActCode: "ENV", SectionCode: "15", SectionDescription: "Penalty for contravention" },
];

const CRIME_HEADS = [
  { CrimeGroupName: "Murder", Active: true },
  { CrimeGroupName: "Attempt to Murder", Active: true },
  { CrimeGroupName: "Dowry Death", Active: true },
  { CrimeGroupName: "Rape", Active: true },
  { CrimeGroupName: "Kidnapping & Abduction", Active: true },
  { CrimeGroupName: "Robbery", Active: true },
  { CrimeGroupName: "Dacoity", Active: true },
  { CrimeGroupName: "Burglary", Active: true },
  { CrimeGroupName: "Theft", Active: true },
  { CrimeGroupName: "Extortion", Active: true },
  { CrimeGroupName: "Cheating", Active: true },
  { CrimeGroupName: "Criminal Breach of Trust", Active: true },
  { CrimeGroupName: "Hurt/Grievous Hurt", Active: true },
  { CrimeGroupName: "Rioting", Active: true },
  { CrimeGroupName: "Arson", Active: true },
  { CrimeGroupName: "Criminal Trespass", Active: true },
  { CrimeGroupName: "Forgery", Active: true },
  { CrimeGroupName: "Narcotics", Active: true },
  { CrimeGroupName: "Arms Act", Active: true },
  { CrimeGroupName: "Cyber Crime", Active: true },
  { CrimeGroupName: "SC/ST Atrocities", Active: true },
  { CrimeGroupName: "Dowry Prohibition Act", Active: true },
  { CrimeGroupName: "Immoral Traffic", Active: true },
  { CrimeGroupName: "Gambling", Active: true },
  { CrimeGroupName: "Explosives Act", Active: true },
  { CrimeGroupName: "Forest Offences", Active: true },
  { CrimeGroupName: "POCSO", Active: true },
  { CrimeGroupName: "Property Dispute", Active: true },
  { CrimeGroupName: "Motor Vehicle Theft", Active: true },
  { CrimeGroupName: "Mines & Minerals", Active: true },
];

const CRIME_SUB_HEADS: { headIdx: number; name: string }[] = [
  { headIdx: 0, name: "Murder with cruelty" },
  { headIdx: 0, name: "Honour killing" },
  { headIdx: 0, name: "Murder for gain" },
  { headIdx: 1, name: "Attempt to murder by firearm" },
  { headIdx: 1, name: "Attempt to murder by weapon" },
  { headIdx: 2, name: "Dowry death - married woman" },
  { headIdx: 3, name: "Rape of adult woman" },
  { headIdx: 3, name: "Rape of minor" },
  { headIdx: 3, name: "Gang rape" },
  { headIdx: 4, name: "Kidnapping for ransom" },
  { headIdx: 4, name: "Kidnapping for marriage" },
  { headIdx: 4, name: "Kidnapping of minor" },
  { headIdx: 5, name: "Armed robbery" },
  { headIdx: 5, name: "Highway robbery" },
  { headIdx: 5, name: "Bank robbery" },
  { headIdx: 6, name: "Dacoity with murder" },
  { headIdx: 6, name: "Dacoity - armed" },
  { headIdx: 7, name: "House burglary" },
  { headIdx: 7, name: "Shop burglary" },
  { headIdx: 8, name: "Motor vehicle theft" },
  { headIdx: 8, name: "Chain snatching" },
  { headIdx: 8, name: "Petty theft" },
  { headIdx: 8, name: "Bicycle theft" },
  { headIdx: 9, name: "Extortion by threat" },
  { headIdx: 9, name: "Online extortion" },
  { headIdx: 10, name: "Cheating by impersonation" },
  { headIdx: 10, name: "Online fraud" },
  { headIdx: 10, name: "Property fraud" },
  { headIdx: 11, name: "Breach of trust - employee" },
  { headIdx: 11, name: "Breach of trust - agent" },
  { headIdx: 12, name: "Grievous hurt" },
  { headIdx: 12, name: "Simple hurt" },
  { headIdx: 13, name: "Rioting with deadly weapon" },
  { headIdx: 13, name: "Unlawful assembly" },
  { headIdx: 14, name: "Arson of property" },
  { headIdx: 14, name: "Forest fire" },
  { headIdx: 15, name: "House trespass" },
  { headIdx: 15, name: "Criminal trespass" },
  { headIdx: 16, name: "Forgery of documents" },
  { headIdx: 16, name: "Forgery of signatures" },
  { headIdx: 17, name: "Possession of narcotics" },
  { headIdx: 17, name: "Sale of narcotics" },
  { headIdx: 17, name: "Consumption of narcotics" },
  { headIdx: 18, name: "Illegal possession of arms" },
  { headIdx: 18, name: "Use of illegal arms" },
  { headIdx: 19, name: "Cyber fraud" },
  { headIdx: 19, name: "Identity theft" },
  { headIdx: 19, name: "Cyber stalking" },
  { headIdx: 20, name: "Atrocity against SC" },
  { headIdx: 20, name: "Atrocity against ST" },
  { headIdx: 21, name: "Dowry harassment" },
  { headIdx: 22, name: "Prostitution" },
  { headIdx: 22, name: "Trafficking" },
  { headIdx: 23, name: "Gambling" },
  { headIdx: 24, name: "Possession of explosives" },
  { headIdx: 25, name: "Illegal tree felling" },
  { headIdx: 25, name: "Wildlife offence" },
  { headIdx: 26, name: "Sexual assault on minor" },
  { headIdx: 27, name: "Property dispute - violent" },
  { headIdx: 28, name: "Two-wheeler theft" },
  { headIdx: 28, name: "Four-wheeler theft" },
  { headIdx: 29, name: "Illegal mining" },
];

const CASE_CATEGORIES = ["FIR", "UDR", "PAR", "Zero FIR"];
const GRAVITY_OFFENCES = ["Heinous", "Non-Heinous"];
const CASE_STATUSES = [
  "Under Investigation", "Chargesheet Filed", "Final Report Submitted",
  "Pending Court", "Convicted", "Acquitted", "Closed",
];

const RANKS = [
  { RankName: "Director General of Police", Hierarchy: 1, Active: true },
  { RankName: "Additional Director General of Police", Hierarchy: 2, Active: true },
  { RankName: "Inspector General of Police", Hierarchy: 3, Active: true },
  { RankName: "Deputy Inspector General of Police", Hierarchy: 4, Active: true },
  { RankName: "Superintendent of Police", Hierarchy: 5, Active: true },
  { RankName: "Additional Superintendent of Police", Hierarchy: 6, Active: true },
  { RankName: "Deputy Superintendent of Police", Hierarchy: 7, Active: true },
  { RankName: "Assistant Superintendent of Police", Hierarchy: 8, Active: true },
  { RankName: "Police Inspector", Hierarchy: 9, Active: true },
  { RankName: "Sub-Inspector of Police", Hierarchy: 10, Active: true },
  { RankName: "Assistant Sub-Inspector of Police", Hierarchy: 11, Active: true },
  { RankName: "Head Constable", Hierarchy: 12, Active: true },
  { RankName: "Constable", Hierarchy: 13, Active: true },
];

const DESIGNATIONS = [
  { DesignationName: "DGP", Active: true, SortOrder: 1 },
  { DesignationName: "ADGP", Active: true, SortOrder: 2 },
  { DesignationName: "IGP", Active: true, SortOrder: 3 },
  { DesignationName: "DIG", Active: true, SortOrder: 4 },
  { DesignationName: "SP", Active: true, SortOrder: 5 },
  { DesignationName: "Addl. SP", Active: true, SortOrder: 6 },
  { DesignationName: "Dy. SP", Active: true, SortOrder: 7 },
  { DesignationName: "ASP", Active: true, SortOrder: 8 },
  { DesignationName: "Police Inspector", Active: true, SortOrder: 9 },
  { DesignationName: "Sub-Inspector", Active: true, SortOrder: 10 },
  { DesignationName: "ASI", Active: true, SortOrder: 11 },
  { DesignationName: "Head Constable", Active: true, SortOrder: 12 },
  { DesignationName: "Constable", Active: true, SortOrder: 13 },
];

const RELIGIONS = [
  "Hindu", "Muslim", "Christian", "Sikh", "Buddhist",
  "Jain", "Parsi", "Other",
];
const CASTES = [
  "General", "SC", "ST", "OBC", "EBC", "NT", "VJNT", "Other",
];
const OCCUPATIONS = [
  "Farmer", "Daily Wage Labourer", "Government Employee", "Private Employee",
  "Business Person", "Student", "Unemployed", "Retired", "Housewife",
  "Auto Driver", "Teacher", "Doctor", "Lawyer", "Engineer",
  "Shopkeeper", "Driver", "Construction Worker", "Domestic Help",
  "IT Professional", "Security Guard",
];

// Realistic Indian names
const FIRST_NAMES_MALE = [
  "Ramesh", "Suresh", "Mahesh", "Dinesh", "Ganesh", "Rajesh", "Manoj", "Sunil",
  "Anil", "Sanjay", "Vijay", "Ajay", "Ravi", "Kiran", "Arjun", "Vikram",
  "Prakash", "Venkatesh", "Nagesh", "Hari", "Prasad", "Shankar", "Mohan", "Gopal",
  "Lakshman", "Bharat", "Siddharth", "Rahul", "Amit", "Nitin", "Deepak", "Pavan",
  "Sandeep", "Vinay", "Uday", "Anand", "Sachin", "Rohit", "Vishal", "Naveen",
  "Karthik", "Darshan", "Yash", "Puneet", "Harsha", "Chethan", "Manjunath", "Shivakumar",
  "Basavaraj", "Chandru", "Shishir", "Aditya", "Chandan", "Murali", "Nandan",
];

const FIRST_NAMES_FEMALE = [
  "Lakshmi", "Saraswati", "Parvati", "Anita", "Sunita", "Kavita", "Geeta", "Reena",
  "Meena", "Nalini", "Padma", "Shobha", "Asha", "Usha", "Radha", "Seetha",
  "Mamatha", "Rekha", "Sushma", "Nirmala", "Vani", "Shakuntala", "Lalitha", "Savitri",
  "Shwetha", "Pooja", "Neha", "Priya", "Divya", "Anjali", "Deepa", "Rashmi",
  "Bhavya", "Spoorthi", "Aishwarya", "Shruthi", "Bindu", "Vijayalakshmi", "Rukmini",
  "Amba", "Janaki", "Gowri", "Bhagya", "Sownya", "Chandrika", "Jayalakshmi",
];

const LAST_NAMES = [
  "Kumar", "Sharma", "Patel", "Reddy", "Naik", "Shetty", "Rao", "Gowda",
  "Murthy", "Iyer", "Acharya", "Hegde", "Bhat", "Kamath", "Pai", "Joshi",
  "Deshpande", "Deshmukh", "Kulkarni", "Patil", "Jadhav", "Shinde", "Pawar",
  "More", "Kadam", "Gaikwad", "Khan", "Ansari", "Pathan", "Shaikh",
  "Nayak", "Hegde", "Shenoy", "Prasad", "Singh", "Verma", "Saxena",
  "Chauhan", "Pillai", "Nair", "Menon", "Das", "Mukherjee", "Banerjee",
];

const STREET_NAMES = [
  "Main Road", "Temple Street", "Market Road", "Railway Station Road",
  "Bus Stand Road", "Hospital Road", "Post Office Road", "MG Road",
  "Gandhi Nagar", "Indira Nagar", "Shiva Nagar", "Krishna Nagar",
  "Lake View Road", "Church Street", "College Road", "Ring Road",
  "Bypass Road", "NH 4", "NH 75", "State Highway",
];

const BANGALORE_LOCATIONS = [
  "Koramangala", "Indiranagar", "Whitefield", "Jayanagar", "Malleswaram",
  "Rajajinagar", "Basavanagudi", "BTM Layout", "HSR Layout", "Marathahalli",
  "Electronic City", "Yelahanka", "Hebbal", "Banashankari", "Vijayanagar",
  "Peenya", "Kengeri", "Nagarbhavi", "J P Nagar", "Sadashivanagar",
  "Ulsoor", "Shivajinagar", "Richmond Town", "Frazer Town", "Cooke Town",
  "Domlur", "HAL", "Varthur", "Sarjapur", "Kanakapura Road",
  "Mysore Road", "Tumkur Road", "Bellary Road", "Old Airport Road", "Hosur Road",
];

const CRIME_BRIEF_FACTS: { headIdx: number; facts: string[] }[] = [
  { headIdx: 0, facts: [
    "The accused attacked the victim with a machete following a land dispute. Victim succumbed to injuries on the way to hospital.",
    "The deceased was found with stab wounds near the bus stand. Eye witnesses identified the accused.",
    "Husband and in-laws allegedly strangulated the victim for dowry. Medical report confirms asphyxiation.",
    "Two groups clashed over property rights resulting in fatal assault. Five persons booked for murder.",
  ]},
  { headIdx: 1, facts: [
    "Accused fired at the victim with country-made pistol. Victim is undergoing treatment at district hospital.",
    "Attempt was made to push the victim from the moving bus. Driver and conductor saved the victim.",
    "Acid was thrown on the victim by rejected suitor. Victim sustained 40% burns.",
  ]},
  { headIdx: 3, facts: [
    "Victim was raped by neighbour under the pretext of giving employment. Medical examination confirmed assault.",
    "Minor girl was sexually assaulted by tuition teacher repeatedly over six months. Case registered on parents' complaint.",
    "Gang rape of a woman occurred when she was returning from work late at night near the railway tracks.",
  ]},
  { headIdx: 4, facts: [
    "Auto driver kidnapped a 7-year old child from near the school and demanded ransom of Rs. 5 lakhs.",
    "Women was kidnapped by five unknown persons in a white Innova near the temple.",
    "Minor girl kidnapped for marriage by a 25-year old man known to the family.",
  ]},
  { headIdx: 5, facts: [
    "Three masked persons robbed a jewellery shop at gunpoint. Stolen goods worth Rs. 15 lakhs.",
    "Bank customer was waylaid near the ATM and cash of Rs. 2 lakhs snatched by two bike-borne persons.",
    "Chain snatchers on a motorcycle snatched gold chain from an elderly woman near the park.",
  ]},
  { headIdx: 8, facts: [
    "Two-wheeler parked near the railway station stolen. CCTV footage shows two persons tampering with the lock.",
    "Burglary at a locked house during daytime. Cash and jewellery worth Rs. 3 lakhs stolen.",
    "Mobile phone snatched by a pedestrian while the victim was talking on the roadside.",
  ]},
  { headIdx: 10, facts: [
    "Victim was cheated by an unknown person who promised overseas job and took Rs. 4 lakhs.",
    "Online fraud via phishing link. Victim lost Rs. 1.2 lakhs from bank account.",
    "Property registration fraud - forged documents used to sell land without owner's knowledge.",
  ]},
  { headIdx: 12, facts: [
    "Accused assaulted neighbour with iron rod over parking dispute. Victim sustained fracture on left arm.",
    "Family dispute turned violent. Brother attacked sister's husband with a beer bottle.",
  ]},
  { headIdx: 17, facts: [
    "Accused was found in possession of 2 kg of cannabis near the bus stand. NDPS case registered.",
    "Smack valued at Rs. 50,000 seized from a peddler near the college. He was supplying to students.",
  ]},
  { headIdx: 19, facts: [
    "Unknown person hacked the victim's email and sent fraudulent messages to contacts demanding money.",
    "Fake profile created on social media using victim's photos. Defamatory posts uploaded.",
    "Phishing website created mimicking a bank. Several victims lost money through the fake portal.",
  ]},
  { headIdx: 23, facts: [
    "Five persons arrested for gambling at a roadside tea stall. Rs. 25,000 seized from the spot.",
    "Illegal gambling den raided in a rented house. Playing cards and cash seized.",
  ]},
];

const USER_NAMES = [
  { name: "Arun Prakash", email: "admin@karnatakapolice.gov.in", role: Role.SUPER_ADMIN },
  { name: "Mohan Kumar", email: "scrbanalyst@karnatakapolice.gov.in", role: Role.SCRB_ANALYST },
  { name: "Ravi Shetty", email: "sp.bengaluru@karnatakapolice.gov.in", role: Role.DISTRICT_SP },
  { name: "Suresh Patil", email: "cp.btm@karnatakapolice.gov.in", role: Role.CIRCLE_INSPECTOR },
  { name: "Venkatesh Rao", email: "si.indiranagar@karnatakapolice.gov.in", role: Role.PS_OFFICER },
  { name: "Priya Sharma", email: "analyst@karnatakapolice.gov.in", role: Role.ANALYST },
];

const PASSWORD = "$2a$12$LJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5D8xG8yY5xV5f5d5i5j5k5l5"; // "Password@123"

// ─────────────────────────── HELPERS ───────────────────────────

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

function generateCrimeNo(
  categoryCode: string,
  districtCode: number,
  psCode: number,
  year: number,
  serial: number,
): string {
  return `${categoryCode}${districtCode.toString().padStart(4, "0")}${psCode.toString().padStart(4, "0")}${year.toString().padStart(4, "0")}${serial.toString().padStart(5, "0")}`;
}

function generateCaseNo(year: number, psCode: number, serial: number): string {
  return `${year}/${psCode.toString().padStart(4, "0")}/${serial}`;
}

// ─────────────────────────── MAIN SEED ───────────────────────────

async function main() {
  console.log("🌱 Starting seed...\n");

  // ── 1. State ──
  console.log("Creating state...");
  const state = await prisma.state.create({
    data: { StateName: "Karnataka", NationalityID: 1, Active: true },
  });

  // ── 2. Districts ──
  console.log(`Creating ${KARNATAKA_DISTRICTS.length} districts...`);
  const districts: { id: number; name: string }[] = [];
  for (let i = 0; i < KARNATAKA_DISTRICTS.length; i++) {
    const d = await prisma.district.create({
      data: {
        DistrictName: KARNATAKA_DISTRICTS[i],
        StateID: state.StateID,
        Active: true,
      },
    });
    districts.push({ id: d.DistrictID, name: KARNATAKA_DISTRICTS[i] });
  }

  // ── 3. Unit Types ──
  console.log("Creating unit types...");
  const unitTypePS = await prisma.unitType.create({
    data: { UnitTypeName: "Police Station", Hierarchy: 1, Active: true },
  });
  const unitTypeDIST = await prisma.unitType.create({
    data: { UnitTypeName: "District Police Office", CityDistState: "District", Hierarchy: 2, Active: true },
  });
  const unitTypeHQ = await prisma.unitType.create({
    data: { UnitTypeName: "Police Headquarters", CityDistState: "State", Hierarchy: 3, Active: true },
  });

  // ── 4. Rank & Designation ──
  console.log("Creating ranks and designations...");
  for (const r of RANKS) {
    await prisma.rank.create({ data: r });
  }
  for (const d of DESIGNATIONS) {
    await prisma.designation.create({ data: d });
  }

  // ── 5. Police Stations (Units) ──
  console.log("Creating police stations...");
  const units: { id: number; name: string; districtId: number; districtName: string }[] = [];
  let unitIdx = 1;
  for (const dist of districts) {
    const psNames = POLICE_STATIONS_BY_DISTRICT[dist.name] || [];
    if (psNames.length === 0) continue;
    for (const psName of psNames) {
      const unit = await prisma.unit.create({
        data: {
          UnitName: `${psName} Police Station`,
          TypeID: unitTypePS.UnitTypeID,
          StateID: state.StateID,
          DistrictID: dist.id,
          Active: true,
          latitude: 12.9716 + (Math.random() - 0.5) * 0.5,
          longitude: 77.5946 + (Math.random() - 0.5) * 0.5,
        },
      });
      units.push({ id: unit.UnitID, name: psName, districtId: dist.id, districtName: dist.name });
      unitIdx++;
    }
  }

  // ── 6. Acts + Sections ──
  console.log("Creating acts and sections...");
  for (const act of ACTS) {
    await prisma.act.create({ data: act });
  }
  for (const sec of SECTIONS) {
    await prisma.section.upsert({
      where: { ActCode_SectionCode: { ActCode: sec.ActCode, SectionCode: sec.SectionCode } },
      update: {},
      create: { ActCode: sec.ActCode, SectionCode: sec.SectionCode, SectionDescription: sec.SectionDescription, Active: true },
    });
  }

  // ── 7. Crime Heads + Sub-Heads ──
  console.log("Creating crime heads...");
  const crimeHeads: { id: number; idx: number }[] = [];
  for (let i = 0; i < CRIME_HEADS.length; i++) {
    const ch = await prisma.crimeHead.create({ data: CRIME_HEADS[i] });
    crimeHeads.push({ id: ch.CrimeHeadID, idx: i });
  }

  console.log("Creating crime sub-heads...");
  let seqId = 1;
  for (const sh of CRIME_SUB_HEADS) {
    const ch = crimeHeads.find((c) => c.idx === sh.headIdx);
    if (!ch) continue;
    await prisma.crimeSubHead.create({
      data: { CrimeHeadID: ch.id, CrimeHeadName: sh.name, SeqID: seqId++ },
    });
  }

  // CrimeHead-ActSection associations
  const ipcSections = SECTIONS.filter((s) => s.ActCode === "IPC").map((s) => s.SectionCode);
  for (const ch of crimeHeads) {
    const secs = pickN(ipcSections, randomInt(1, 4));
    for (const sc of secs) {
      await prisma.crimeHeadActSection.create({
        data: { CrimeHeadID: ch.id, ActCode: "IPC", SectionCode: sc },
      }).catch(() => {});
    }
  }

  // ── 8. Case Categories, Gravity Offences, Case Statuses ──
  console.log("Creating case categories...");
  const caseCategories: { id: number; value: string }[] = [];
  for (const cc of CASE_CATEGORIES) {
    const c = await prisma.caseCategory.create({ data: { LookupValue: cc } });
    caseCategories.push({ id: c.CaseCategoryID, value: cc });
  }

  console.log("Creating gravity offences...");
  const gravityOffences: { id: number; value: string }[] = [];
  for (const go of GRAVITY_OFFENCES) {
    const g = await prisma.gravityOffence.create({ data: { LookupValue: go } });
    gravityOffences.push({ id: g.GravityOffenceID, value: go });
  }

  console.log("Creating case statuses...");
  const caseStatuses: { id: number; value: string }[] = [];
  for (const cs of CASE_STATUSES) {
    const s = await prisma.caseStatusMaster.create({ data: { CaseStatusName: cs } });
    caseStatuses.push({ id: s.CaseStatusID, value: cs });
  }

  // ── 9. Religion, Caste, Occupation ──
  console.log("Creating religion, caste, occupation masters...");
  for (const r of RELIGIONS) {
    await prisma.religionMaster.create({ data: { ReligionName: r } });
  }
  for (const c of CASTES) {
    await prisma.casteMaster.create({ data: { caste_master_name: c } });
  }
  for (const o of OCCUPATIONS) {
    await prisma.occupationMaster.create({ data: { OccupationName: o } });
  }

  const allReligions = await prisma.religionMaster.findMany();
  const allCastes = await prisma.casteMaster.findMany();
  const allOccupations = await prisma.occupationMaster.findMany();
  const allRanks = await prisma.rank.findMany();
  const allDesignations = await prisma.designation.findMany();

  // ── 10. Courts ──
  console.log("Creating courts...");
  const courts: { id: number }[] = [];
  for (let i = 0; i < Math.min(20, districts.length); i++) {
    const c = await prisma.court.create({
      data: {
        CourtName: `District & Sessions Court, ${districts[i].name}`,
        DistrictID: districts[i].id,
        StateID: state.StateID,
        Active: true,
      },
    });
    courts.push({ id: c.CourtID });
  }

  // ── 11. Employees ──
  console.log("Creating employees...");
  const employees: { id: number; unitId: number; districtId: number }[] = [];
  const usedKGIDs = new Set<string>();
  const usedEmails = new Set<string>();
  const maleNames = [...FIRST_NAMES_MALE];
  const femaleNames = [...FIRST_NAMES_FEMALE];

  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    const numEmployees = randomInt(3, 6);
    for (let j = 0; j < numEmployees; j++) {
      const isMale = Math.random() > 0.3;
      const firstName = isMale ? pick(maleNames) : pick(femaleNames);
      const lastName = pick(LAST_NAMES);
      const fullName = `${firstName} ${lastName}`;
      let kgid = `KG${String(100000 + i * 10 + j).padStart(8, "0")}`;
      while (usedKGIDs.has(kgid)) {
        kgid = `KG${String(100000 + i * 10 + j + Math.floor(Math.random() * 900000)).padStart(8, "0")}`;
      }
      usedKGIDs.add(kgid);
      let email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@ksp.gov.in`;
      while (usedEmails.has(email)) {
        email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}${j}@ksp.gov.in`;
      }
      usedEmails.add(email);

      const rank = pick(allRanks);
      const desig = pick(allDesignations);
      const emp = await prisma.employee.create({
        data: {
          FirstName: fullName,
          KGID: kgid,
          email,
          password: PASSWORD,
          RankID: rank.RankID,
          DesignationID: desig.DesignationID,
          DistrictID: unit.districtId,
          UnitID: unit.id,
          GenderID: isMale ? 1 : 2,
          EmployeeDOB: new Date(1970 + randomInt(20, 40), randomInt(0, 11), randomInt(1, 28)),
          AppointmentDate: new Date(2000 + randomInt(0, 20), randomInt(0, 11), randomInt(1, 28)),
          BloodGroupID: randomInt(1, 8),
          PhysicallyChallenged: false,
        },
      });
      employees.push({ id: emp.EmployeeID, unitId: unit.id, districtId: unit.districtId });
    }
  }
  console.log(`  Created ${employees.length} employees`);

  // ── 12. Users ──
  console.log("Creating users...");
  for (const u of USER_NAMES) {
    let empId: number | undefined;
    if (u.role === Role.SUPER_ADMIN || u.role === Role.SCRB_ANALYST) {
      // assign first employee
      empId = employees[0]?.id;
    } else {
      empId = pick(employees).id;
    }
    await prisma.user.create({
      data: {
        email: u.email,
        password: PASSWORD,
        name: u.name,
        role: u.role,
        employeeID: empId ?? undefined,
      },
    }).catch((e) => console.log(`  User ${u.email} skipped: ${e.message}`));
  }

  // ── 13. Sample FIRs (1000+) ──
  console.log("\nCreating 1000+ sample FIRs...");
  const allCrimeSubHeads = await prisma.crimeSubHead.findMany();

  let firCount = 0;
  const usedCrimeNos = new Set<string>();
  const createdCaseMasters: number[] = [];

  for (let year = 2023; year <= 2026; year++) {
    const firsPerYear = year === 2026 ? 150 : 300;
    for (let i = 0; i < firsPerYear; i++) {
      const catCode = "1"; // FIR
      const distIdx = randomInt(0, districts.length - 1);
      const district = districts[distIdx];
      const districtUnits = units.filter((u) => u.districtId === district.id);
      if (districtUnits.length === 0) continue;
      const unit = pick(districtUnits);
      const unitCode = unit.id % 9999;
      const serial = randomInt(1, 99999);
      const crimeNo = generateCrimeNo(catCode, distIdx + 1, unitCode, year, serial);

      if (usedCrimeNos.has(crimeNo)) continue;
      usedCrimeNos.add(crimeNo);

      const caseNo = generateCaseNo(year, unitCode, serial);
      const crimeHeadIdx = randomInt(0, crimeHeads.length - 1);
      const crimeHead = crimeHeads[crimeHeadIdx];
      const subHeadsForHead = allCrimeSubHeads.filter((s) => s.CrimeHeadID === crimeHead.id);
      const subHead = subHeadsForHead.length > 0 ? pick(subHeadsForHead) : null;

      const isHeinous = crimeHeadIdx <= 3 || crimeHeadIdx === 6 ? 0 : 1; // heinous if murder, attempt, rape, etc
      const gravity = isHeinous === 0 ? gravityOffences[0] : gravityOffences[1]; // 0=Heinous
      const category = pick(caseCategories);
      const status = pick(caseStatuses);

      const court = Math.random() > 0.5 ? pick(courts) : null;

      const regDate = new Date(year, randomInt(0, 11), randomInt(1, 28), randomInt(0, 23), randomInt(0, 59));
      const incidentFrom = new Date(regDate);
      incidentFrom.setDate(incidentFrom.getDate() - randomInt(0, 7));
      const incidentTo = new Date(incidentFrom);
      incidentTo.setHours(incidentTo.getHours() + randomInt(1, 4));
      const infoDate = new Date(incidentFrom);
      infoDate.setHours(infoDate.getHours() - randomInt(0, 3));

      const emp = pick(employees);
      const lat = 12.9716 + (Math.random() - 0.5) * 0.8;
      const lng = 77.5946 + (Math.random() - 0.5) * 0.8;

      // Pick a brief fact
      const factEntry = CRIME_BRIEF_FACTS.find((f) => f.headIdx === crimeHeadIdx);
      const briefFacts = factEntry ? pick(factEntry.facts) : `Case registered under IPC section based on complainant's statement. Investigation in progress.`;

      const cm = await prisma.caseMaster.create({
        data: {
          CrimeNo: crimeNo,
          CaseNo: caseNo,
          CrimeRegisteredDate: regDate,
          PolicePersonID: emp.id,
          PoliceStationID: unit.id,
          CaseCategoryID: category.id,
          GravityOffenceID: gravity.id,
          CrimeMajorHeadID: crimeHead.id,
          CrimeMinorHeadID: subHead?.CrimeSubHeadID ?? undefined,
          CaseStatusID: status.id,
          CourtID: court?.id ?? undefined,
          IncidentFromDate: incidentFrom,
          IncidentToDate: incidentTo,
          InfoReceivedPSDate: infoDate,
          latitude: lat,
          longitude: lng,
          BriefFacts: briefFacts,
        },
      });
      createdCaseMasters.push(cm.CaseMasterID);
      firCount++;

      // Create Act-Section Associations
      const ipcSecs = pickN(ipcSections, randomInt(1, 3));
      let actOrder = 1;
      for (const sec of ipcSecs) {
        await prisma.actSectionAssociation.create({
          data: {
            CaseMasterID: cm.CaseMasterID,
            ActID: "IPC",
            SectionID: sec,
            ActOrderID: actOrder,
            SectionOrderID: actOrder,
          },
        }).catch(() => {});
        actOrder++;
      }

      // Complainant
      const isMale = Math.random() > 0.5;
      const cfName = isMale ? pick(FIRST_NAMES_MALE) : pick(FIRST_NAMES_FEMALE);
      const clName = pick(LAST_NAMES);
      await prisma.complainantDetails.create({
        data: {
          CaseMasterID: cm.CaseMasterID,
          ComplainantName: `${cfName} ${clName}`,
          AgeYear: randomInt(20, 70),
          OccupationID: pick(allOccupations).OccupationID,
          ReligionID: pick(allReligions).ReligionID,
          CasteID: pick(allCastes).caste_master_id,
          GenderID: isMale ? 1 : 2,
        },
      });

      // Victim (if not property crime)
      if (crimeHeadIdx !== 8 && crimeHeadIdx !== 28 && Math.random() > 0.3) {
        const vMale = Math.random() > 0.5;
        const vfName = vMale ? pick(FIRST_NAMES_MALE) : pick(FIRST_NAMES_FEMALE);
        const vlName = pick(LAST_NAMES);
        await prisma.victim.create({
          data: {
            CaseMasterID: cm.CaseMasterID,
            VictimName: `${vfName} ${vlName}`,
            AgeYear: randomInt(5, 80),
            GenderID: vMale ? 1 : 2,
            VictimPolice: Math.random() > 0.9 ? "Yes" : null,
          },
        });
      }

      // Accused (1-3 accused per case)
      const numAccused = randomInt(1, 3);
      const accusedIds: number[] = [];
      for (let a = 0; a < numAccused; a++) {
        const aMale = Math.random() > 0.3;
        const afName = aMale ? pick(FIRST_NAMES_MALE) : pick(FIRST_NAMES_FEMALE);
        const alName = pick(LAST_NAMES);
        const personId = `A${a + 1}`;
        const accused = await prisma.accused.create({
          data: {
            CaseMasterID: cm.CaseMasterID,
            AccusedName: `${afName} ${alName}`,
            AgeYear: randomInt(18, 60),
            GenderID: aMale ? 1 : 2,
            PersonID: personId,
          },
        });
        accusedIds.push(accused.AccusedMasterID);
      }

      // Arrest (for some cases)
      if (Math.random() > 0.4) {
        const arrest = await prisma.arrestSurrender.create({
          data: {
            CaseMasterID: cm.CaseMasterID,
            ArrestSurrenderDate: new Date(year, randomInt(0, 11), randomInt(1, 28)),
            ArrestSurrenderStateId: state.StateID,
            ArrestSurrenderDistrictId: district.id,
            PoliceStationID: unit.id,
            IOID: emp.id,
            CourtID: court?.id ?? undefined,
            IsAccused: true,
            IsComplainantAccused: false,
          },
        });

        // Link first accused to arrest
        if (accusedIds.length > 0) {
          await prisma.accused.update({
            where: { AccusedMasterID: accusedIds[0] },
            data: { ArrestSurrenderID: arrest.ArrestSurrenderID },
          });
        }
      }

      // Chargesheet for some cases
      if (Math.random() > 0.6) {
        const csTypes = ["A", "B", "C"];
        await prisma.chargesheetDetails.create({
          data: {
            CaseMasterID: cm.CaseMasterID,
            csdate: new Date(year, randomInt(0, 11), randomInt(1, 28)),
            cstype: pick(csTypes),
            PolicePersonID: emp.id,
          },
        });
      }

      // Occurrence time
      await prisma.inv_OccuranceTime.create({
        data: {
          CaseMasterID: cm.CaseMasterID,
          OccurrenceFromDateTime: incidentFrom,
          OccurrenceToDateTime: incidentTo,
        },
      });
    }
    console.log(`  ${year}: Created ${firsPerYear} FIRs`);
  }
  console.log(`Total FIRs created: ${firCount}`);

  // ── 14. Crime Embeddings (dummy) ──
  console.log("Creating sample crime embeddings...");
  const embeddingCases = pickN(createdCaseMasters, Math.min(50, createdCaseMasters.length));
  for (const caseId of embeddingCases) {
    await prisma.crimeEmbedding.create({
      data: {
        CaseMasterID: caseId,
        embedding: `[${Array.from({ length: 128 }, () => (Math.random() - 0.5).toFixed(6)).join(",")}]`,
        model_version: "sentence-transformer-v1",
      },
    }).catch(() => {});
  }

  // ── 15. Crime Clusters ──
  console.log("Creating sample crime clusters...");
  const clusterCases = pickN(createdCaseMasters, 100);
  const clusterLabels = ["Armed Robbery Ring", "Cyber Fraud Network", "Narcotics Cell", "Property Crime Group", "Organized Vehicle Theft"];
  for (let i = 0; i < clusterCases.length; i++) {
    await prisma.crimeCluster.create({
      data: {
        cluster_id: i % 5,
        CaseMasterID: clusterCases[i],
        cluster_label: clusterLabels[i % 5],
        confidence: Math.random(),
      },
    }).catch(() => {});
  }

  // ── 16. Criminal Network Edges ──
  console.log("Creating sample criminal network edges...");
  const edgeTypes = ["SAME_FIR", "SAME_LOCATION", "SAME_ACCUSED", "SAME_MO", "SAME_OFFICER"];
  for (let i = 0; i < 200; i++) {
    const srcCase = pick(createdCaseMasters);
    const tgtCase = pick(createdCaseMasters);
    if (srcCase === tgtCase) continue;
    await prisma.criminalNetworkEdge.create({
      data: {
        source_type: "CaseMaster",
        source_id: srcCase,
        target_type: "CaseMaster",
        target_id: tgtCase,
        relationship: pick(edgeTypes),
        weight: Math.random(),
        caseMasterID: srcCase,
      },
    }).catch(() => {});
  }

  // ── 17. Crime Predictions ──
  console.log("Creating sample crime predictions...");
  const predDates = [
    new Date("2026-07-15"),
    new Date("2026-07-16"),
    new Date("2026-07-17"),
    new Date("2026-07-18"),
    new Date("2026-07-19"),
  ];
  const predCrimeTypes = ["Theft", "Robbery", "Assault", "Burglary", "Cyber Crime", "Narcotics"];
  for (let i = 0; i < 50; i++) {
    const dist = pick(districts);
    const dsUnits = units.filter((u) => u.districtId === dist.id);
    const unit = dsUnits.length > 0 ? pick(dsUnits) : null;
    await prisma.crimePrediction.create({
      data: {
        districtID: dist.id,
        policeStationID: unit?.id ?? undefined,
        crimeType: pick(predCrimeTypes),
        predictedDate: pick(predDates),
        probability: Math.random(),
        model_name: "xgboost-crime-predictor-v2",
        features: { hour: randomInt(0, 23), day_of_week: randomInt(0, 6), month: randomInt(1, 12) },
        explanation: `High probability of ${pick(["theft", "robbery", "assault"])} incidents predicted near ${unit?.name || "urban area"} based on historical patterns and seasonal trends.`,
      },
    });
  }

  // ── 18. Audit Logs ──
  console.log("Creating sample audit logs...");
  const actions = ["LOGIN", "LOGOUT", "CREATE_CASE", "UPDATE_CASE", "VIEW_CASE", "QUERY_ANALYTICS", "EXPORT_REPORT", "ASSIGN_INVESTIGATOR"];
  const resources = ["CaseMaster", "Report", "Dashboard", "Analytics", "User", "Settings"];
  const users = await prisma.user.findMany();
  for (let i = 0; i < 200; i++) {
    const u = pick(users);
    await prisma.auditLog.create({
      data: {
        userId: u.id,
        action: pick(actions),
        resource: pick(resources),
        details: { timestamp: new Date().toISOString(), ip: `192.168.${randomInt(1, 255)}.${randomInt(1, 255)}` },
        ipAddress: `192.168.${randomInt(1, 255)}.${randomInt(1, 255)}`,
      },
    });
  }

  console.log("\n✅ Seed completed successfully!");
  console.log(`   Districts: ${KARNATAKA_DISTRICTS.length}`);
  console.log(`   Police Stations: ${units.length}`);
  console.log(`   Employees: ${employees.length}`);
  console.log(`   FIRs: ${firCount}`);
  console.log(`   Courts: ${courts.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
