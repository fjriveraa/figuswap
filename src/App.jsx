import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Importer, { ShareModal } from "./Importer.jsx";
import Onboarding from "./Onboarding.jsx";
import Scanner from "./Scanner.jsx";
import WorldCup from "./WorldCup.jsx";import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Importer, { ShareModal } from "./Importer.jsx";
import Onboarding from "./Onboarding.jsx";
import Scanner from "./Scanner.jsx";
import WorldCup from "./WorldCup.jsx";
import { translations, getInitialLang, getTeamName } from "./i18n";

const SUPABASE_URL = "https://fythsgiofvodukjzutat.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dGhzZ2lvZnZvZHVranp1dGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NTIyMDgsImV4cCI6MjA5NzEyODIwOH0.HaG8yQgc2BzEGnlaNXFWaLZ0c_Oa6CvhwcVjHj99-AY";

const getStateLabels = (t) => ({
  missing:  { color:"#ef4444", bg:"#1e0a0a", label:t.missingState || t.missing,  emoji:"❌" },
  have:     { color:"#22c55e", bg:"#0a1e0a", label:t.have,  emoji:"✅" },
  repeated: { color:"#f97316", bg:"#1e0f00", label:t.repeatedState || t.repeated,  emoji:"🔁" },
  sell:     { color:"#fbbf24", bg:"#1e1500", label:t.sell,  emoji:"💰" },
  trade:    { color:"#60a5fa", bg:"#0a0f1e", label:t.trade,    emoji:"🔄" },
  auction:  { color:"#a78bfa", bg:"#0f0a1e", label:t.auction,   emoji:"🔨" },
});
// Estados que representan una figurita disponible para intercambio/venta (no la posesión única "have")
const TRADEABLE_STATES = ["repeated","sell","trade","auction"];

// Orden oficial álbum Panini FIFA WC 2026
const ALBUM_ORDER = [
  // Especiales
  "FWC","CC",
  // Grupo A
  "MEX","RSA","KOR","CZE",
  // Grupo B
  "CAN","BIH","QAT","SUI",
  // Grupo C
  "BRA","MAR","HAI","SCO",
  // Grupo D
  "USA","PAR","AUS","TUR",
  // Grupo E
  "GER","CUW","CIV","ECU",
  // Grupo F
  "NED","JPN","SWE","TUN",
  // Grupo G
  "BEL","EGY","IRN","NZL",
  // Grupo H
  "ESP","CPV","KSA","URU",
  // Grupo I
  "FRA","SEN","IRQ","NOR",
  // Grupo J
  "ARG","ALG","AUT","JOR",
  // Grupo K
  "POR","COD","UZB","COL",
  // Grupo L
  "ENG","CRO","GHA","PAN",
];

// Solo guarda la letra (o "special" para FWC/CC) — el texto "Grupo"/"Especiales" se construye
// al mostrarlo, usando la traducción del idioma activo, no un string fijo en español.
const GROUPS = {
  FWC:"special", CC:"special",
  MEX:"A", RSA:"A", KOR:"A", CZE:"A",
  CAN:"B", BIH:"B", QAT:"B", SUI:"B",
  BRA:"C", MAR:"C", HAI:"C", SCO:"C",
  USA:"D", PAR:"D", AUS:"D", TUR:"D",
  GER:"E", CUW:"E", CIV:"E", ECU:"E",
  NED:"F", JPN:"F", SWE:"F", TUN:"F",
  BEL:"G", EGY:"G", IRN:"G", NZL:"G",
  ESP:"H", CPV:"H", KSA:"H", URU:"H",
  FRA:"I", SEN:"I", IRQ:"I", NOR:"I",
  ARG:"J", ALG:"J", AUT:"J", JOR:"J",
  POR:"K", COD:"K", UZB:"K", COL:"K",
  ENG:"L", CRO:"L", GHA:"L", PAN:"L",
};

// Nombres reales de cada figurita (jugador/escudo/foto de equipo/especial), compilados
// desde el checklist oficial del álbum físico. CC (Coca-Cola) no tiene nombres porque
// son genéricas sin jugador específico. FWC #20 no viene en la fuente original, queda sin nombre.
const STICKER_NAMES = {
  ALG:{1:"Escudo Argelia",2:"Alexis Guendouz",3:"Ramy Bensebaini",4:"Youcef Atal",5:"Rayan Aït-Nouri",6:"Mohamed Amine Tougai",7:"Aïssa Mandi",8:"Ismael Bennacer",9:"Houssem Aquar",10:"Hicham Boudaoui",11:"Ramiz Zerrouki",12:"Nabil Bentalab",13:"Equipo Argelia",14:"Farés Chaibi",15:"Riyad Mahrez",16:"Said Benrhama",17:"Anis Hadj Moussa",18:"Amine Gouiri",19:"Baghdad Bounedjah",20:"Mohammed Amoura"},
  ARG:{1:"Escudo Argentina",2:"Emiliano Martinez",3:"Nahuel Molina",4:"Cristian Romero",5:"Nicolas Otamendi",6:"Nicolas Tagliafico",7:"Leonardo Balerdi",8:"Enzo Fernandez",9:"Alexis Mac Allister",10:"Rodrigo De Paul",11:"Exequiel Palacios",12:"Leandro Paredes",13:"Equipo Argentina",14:"Nico Paz",15:"Franco Mastantuono",16:"Nico Gonzalez",17:"Lionel Messi",18:"Lautaro Martinez",19:"Julian Alvarez",20:"Giuliano Simeone"},
  AUS:{1:"Escudo Australia",2:"Mathew Ryan",3:"Joe Gauci",4:"Harry Souttar",5:"Alessandro Circati",6:"Jordan Bos",7:"Aziz Behich",8:"Cameron Burgess",9:"Lewis Miller",10:"Milos Degenek",11:"Jackson Irvine",12:"Riley McGree",13:"Equipo Australia",14:"Aiden O'Neill",15:"Connor Metcalfe",16:"Patrick Yazbek",17:"Craig Goodwin",18:"Kusini Vengi",19:"Nestory Irankunda",20:"Mohamed Touré"},
  AUT:{1:"Escudo Austria",2:"Alexander Schlager",3:"Patrick Pentz",4:"David Alaba",5:"Kevin Danso",6:"Philipp Lienhart",7:"Stefan Bosch",8:"Phillipp Mwene",9:"Alexander Prass",10:"Xavier Schlager",11:"Marcel Sabitzer",12:"Konrad Laimer",13:"Equipo Austria",14:"Florian Grillitsch",15:"Nicolas Seiwald",16:"Romano Schmid",17:"Patrick Wimmer",18:"Christoph Baumgartner",19:"Michael Gregoritsch",20:"Marko Arnautović"},
  BEL:{1:"Escudo Bélgica",2:"Thibaut Courtois",3:"Arthur Theate",4:"Timothy Castagne",5:"Zeno Debast",6:"Brandon Mechele",7:"Maxim De Cuyper",8:"Thomas Meunier",9:"Youri Tielemans",10:"Amadou Onana",11:"Nicolas Raskin",12:"Alexis Saelemaekers",13:"Equipo Bélgica",14:"Hans Vanaken",15:"Kevin De Bruyne",16:"Jérémy Doku",17:"Charles De Ketelaere",18:"Leandro Trossard",19:"Loïs Openda",20:"Romelu Lukaku"},
  BIH:{1:"Escudo Bosnia y Herzegovina",2:"Nikola Vasilj",3:"Amer Dedic",4:"Sead Kolasinac",5:"Tarik Muharemovic",6:"Nihad Mujakic",7:"Nikola Katic",8:"Amir Hadziahmetovic",9:"Benjamin Tahirovic",10:"Armin Gigovic",11:"Ivan Sunjic",12:"Ivan Basic",13:"Equipo Bosnia y Herzegovina",14:"Dzenis Burnic",15:"Esmir Bajraktarevic",16:"Amar Memic",17:"Ermedin Demirovic",18:"Edin Dzeko",19:"Samed Bazdar",20:"Haris Tabakovic"},
  BRA:{1:"Escudo Brasil",2:"Alisson",3:"Bento",4:"Marquinhos",5:"Éder Militão",6:"Gabriel Magalhães",7:"Danilo",8:"Wesley",9:"Lucas Paquetá",10:"Casemiro",11:"Bruno Guimarães",12:"Luiz Henrique",13:"Equipo Brasil",14:"Vinicius Júnior",15:"Rodrygo",16:"João Pedro",17:"Matheus Cunha",18:"Gabriel Martinelli",19:"Raphinha",20:"Estévão"},
  CAN:{1:"Escudo Canadá",2:"Dayne St.Clair",3:"Alphonso Davies",4:"Alistair Johnston",5:"Samuel Adekugbe",6:"Riche Larvea",7:"Derek Cornelius",8:"Moïse Bombito",9:"Kamal Miller",10:"Stephen Eustáquio",11:"Ismaël Koné",12:"Jonathan Osorio",13:"Equipo Canadá",14:"Jacob Shaffelburg",15:"Mathieu Choinière",16:"Niko Sigur",17:"Tajon Buchanan",18:"Liam Millar",19:"Cyle Larin",20:"Jonathan David"},
  CIV:{1:"Escudo Costa de Marfil",2:"Yahia Fofana",3:"Ghislain Konan",4:"Wilfried Singo",5:"Odilon Kossounou",6:"Evan Ndicka",7:"Willy Boly",8:"Emmanuel Agbadou",9:"Ousmane Diomande",10:"Franck Kessie",11:"Seko Fofana",12:"Ibrahim Sangare",13:"Equipo Costa de Marfil",14:"Jean-Philippe Gbamin",15:"Amad Diallo",16:"Sébastien Haller",17:"Simon Adringa",18:"Yan Diomande",19:"Evann Guessand",20:"Oumar Diakite"},
  COD:{1:"Escudo RD del Congo",2:"Lionel Mpasi",3:"Aaron Wan-Bissaka",4:"Axel Tuanzebe",5:"Arthur Masuaku",6:"Chancel Mbemba",7:"Joris Kayembe",8:"Charles Pickel",9:"Ngal'ayel Mukau",10:"Edo Kayembe",11:"Samuel Moutoussamy",12:"Noah Sadiki",13:"Equipo RD del Congo",14:"Théo Bongonda",15:"Meschak Elia",16:"Yoane Wissa",17:"Brian Cipenga",18:"Fiston Mayele",19:"Cédric Bakambu",20:"Nathanaël Mbuku"},
  COL:{1:"Escudo Colombia",2:"Camilo Vargas",3:"David Ospina",4:"Dávinson Sánchez",5:"Yerry Mina",6:"Daniel Munoz",7:"Johan Mojica",8:"Jhon Lucumí",9:"Santiago Arias",10:"Jefferson Lerma",11:"Kevin Castaño",12:"Richard Rios",13:"Equipo Colombia",14:"James Rodriguez",15:"Juan Fernando Quintero",16:"Jorge Carrascal",17:"Jhon Arias",18:"Jhon Cordova",19:"Luis Suarez",20:"Luis Diaz"},
  CPV:{1:"Escudo Cabo Verde",2:"Vozinha",3:"Logan Costa",4:"Pico",5:"Diney",6:"Steven Moreira",7:"Wagner Pina",8:"Joao Paulo",9:"Yannick Semedo",10:"Kevin Pina",11:"Patrick Andrade",12:"Jamiro Monteiro",13:"Equipo Cabo Verde",14:"Deroy Duarte",15:"Garry Rodrigues",16:"Jovane Cabral",17:"Ryan Mendes",18:"Dailon Livramento",19:"Willy Semedo",20:"Bebe"},
  CRO:{1:"Escudo Croacia",2:"Dominik Livaković",3:"Duje Caleta-Car",4:"Josko Gvardiol",5:"Josip Stanišić",6:"Luka Vušković",7:"Josip Sutalo",8:"Kristijan Jakic",9:"Luka Modrić",10:"Mateo Kovacic",11:"Martin Baturina",12:"Lovro Majer",13:"Equipo Croacia",14:"Mario Pasalic",15:"Petar Sucic",16:"Ivan Perišić",17:"Marco Pasalic",18:"Ante Budimir",19:"Andrej Kramarić",20:"Franjo Ivanovic"},
  CUW:{1:"Escudo Curazao",2:"Eloy Room",3:"Armando Obispo",4:"Sherel Floranus",5:"Jurien Gaari",6:"Joshua Brenet",7:"Roshon Van Eijma",8:"Shurandy Sambo",9:"Livano Comenencia",10:"Godfried Roemeratoe",11:"Juninho Bacuna",12:"Leandro Bacuna",13:"Equipo Curazao",14:"Tahith Chong",15:"Kenji Gorre",16:"Jearl Margaritha",17:"Jurgen Locadia",18:"Jeremy Antonisse",19:"Gervane Kastaneer",20:"Sontje Hansen"},
  CZE:{1:"Escudo Chequia",2:"Matej Kovar",3:"Jindrich Stanek",4:"Ladislav Krejci",5:"Vladimir Coufal",6:"Jaroslav Zeleny",7:"Tomas Holes",8:"David Zima",9:"Michal Sadilek",10:"Lukas Provod",11:"Lukas Cerv",12:"Tomas Soucek",13:"Equipo Chequia",14:"Pavel Sulc",15:"Matej Vydra",16:"Vasil Kusej",17:"Tomas Chory",18:"Vacilav Cerny",19:"Adam Hlozek",20:"Patrik Schick"},
  ECU:{1:"Escudo Ecuador",2:"Hernán Galíndez",3:"Gonzalo Valle",4:"Piero Hincapié",5:"Pervis Estupiñán",6:"Willian Pacho",7:"Ángelo Preciado",8:"Joel Ordóñez",9:"Moises Caicedo",10:"Alan Franco",11:"Kendry Paez",12:"Pedro Vite",13:"Equipo Ecuador",14:"John Veboah",15:"Leonardo Campana",16:"Gonzalo Plata",17:"Nilson Angulo",18:"Alan Minda",19:"Kevin Rodriguez",20:"Enner Valencia"},
  EGY:{1:"Escudo Egipto",2:"Mohamed El Shenawy",3:"Mohamed Hany",4:"Mohamed Hamdy",5:"Yasser Ibrahim",6:"Khaled Sobhi",7:"Ramy Rabia",8:"Hossam Abdelmaguid",9:"Ahmed Fatouh",10:"Marwan Attia",11:"Zizo",12:"Hamdy Fathy",13:"Equipo Egipto",14:"Mohamed Lasheen",15:"Emam Ashour",16:"Osama Faisal",17:"Mohamed Salah",18:"Mostafa Mohamed",19:"Trezeguet",20:"Omar Marsmoush"},
  ENG:{1:"Escudo Inglaterra",2:"Jordan Pickford",3:"John Stones",4:"Maric Guéhi",5:"Ezri Konsa",6:"Trent Alexander-Arnold",7:"Reece James",8:"Dan Burn",9:"Jordan Henderson",10:"Declan Rice",11:"Jude Bellingham",12:"Cole Palmer",13:"Equipo Inglaterra",14:"Morgan Rogers",15:"Anthony Gordon",16:"Phil Foden",17:"Bukayo Saka",18:"Harry Kane",19:"Marcus Rashford",20:"Ollie Watkins"},
  ESP:{1:"Escudo España",2:"Unai Simon",3:"Robin Le Normand",4:"Aymeric Laporte",5:"Dean Huijsen",6:"Pedro Porro",7:"Dani Carvajal",8:"Marc Cucurella",9:"Martín Zubimendi",10:"Rodri",11:"Pedri",12:"Fabian Ruiz",13:"Equipo España",14:"Mikel Merino",15:"Lamine Yamal",16:"Dani Olmo",17:"Nico Williams",18:"Ferran Torres",19:"Álvaro Morata",20:"Mikel Oyarzabal"},
  FRA:{1:"Escudo Francia",2:"Mike Maignan",3:"Theo Hernandez",4:"William Saliba",5:"Jules Kounde",6:"Ibrahima Konate",7:"Dayot Upamecano",8:"Lucas Digne",9:"Aurélien Tchouaméni",10:"Eduardo Camavinga",11:"Manu Kone",12:"Adrien Rabiot",13:"Equipo Francia",14:"Michael Olise",15:"Ousmane Dembele",16:"Bradley Barcola",17:"Désiré Doué",18:"Kingsley Coman",19:"Hugo Ekitike",20:"Kylian Mbappe"},
  FWC:{1:"Official Emblem 1/2",2:"Official Emblem 2/2",3:"Official Mascots",4:"Official Slogan",5:"Official Ball",6:"Host Country Emblem - Canadá",7:"Host Country Emblem - México",8:"Host Country Emblem - USA",9:"Foto de equipo - Italia 1934 (campeón)",10:"Foto de equipo - Uruguay 1950 (campeón)",11:"Foto de equipo - Alemania Occidental 1954 (campeón)",12:"Foto de equipo - Brasil 1962 (campeón)",13:"Foto de equipo - Alemania Occidental 1974 (campeón)",14:"Foto de equipo - Argentina 1986 (campeón)",15:"Foto de equipo - Brasil 1994 (campeón)",16:"Foto de equipo - Brasil 2002 (campeón)",17:"Foto de equipo - Italia 2006 (campeón)",18:"Foto de equipo - Alemania 2014 (campeón)",19:"Foto de equipo - Argentina 2022 (campeón)"},
  GER:{1:"Escudo Alemania",2:"Marc-André ter Stegen",3:"Jonathan Tah",4:"David Raum",5:"Nico Schlotterbeck",6:"Antonio Rüdiger",7:"Waldemar Anton",8:"Ridle Baku",9:"Maximilian Mittelstadt",10:"Joshua Kimmich",11:"Florian Wirtz",12:"Felix Nmecha",13:"Equipo Alemania",14:"Leon Goretzka",15:"Jamal Musiala",16:"Serge Gnabry",17:"Kai Havertz",18:"Leroy Sane",19:"Karim Adeyemi",20:"Nick Woltemade"},
  GHA:{1:"Escudo Ghana",2:"Lawrence Ati Zigi",3:"Tariq Lamptey",4:"Mohammed Salisu",5:"Alidu Seidu",6:"Alexander Djiku",7:"Gideon Mensah",8:"Caleb Yirenkyi",9:"Abdul Issahaku Fatawu",10:"Thomas Partey",11:"Salis Abdul Samed",12:"Kamaldeen Sulemana",13:"Equipo Ghana",14:"Mohammed Kudus",15:"Inaki Williams",16:"Jordan Ayew",17:"Andrew Ayew",18:"Joseph Paintsil",19:"Osman Bukari",20:"Antoine Semenyo"},
  HAI:{1:"Escudo Haití",2:"Johny Placide",3:"Carlens Arcus",4:"Martin Expérience",5:"Jean-Kevin Duverne",6:"Ricardo Adé",7:"Duke Lacroix",8:"Garven Metusala",9:"Hannes Delcroix",10:"Leverton Pierre",11:"Danley Jean Jacques",12:"Jean-Ricner Bellegarde",13:"Equipo Haití",14:"Christopher Attys",15:"Derrick Etienne Jr.",16:"Josue Casimir",17:"Ruben Providence",18:"Duckens Nazon",19:"Louicius Deedson",20:"Frantzdy Pierrot"},
  IRN:{1:"Escudo Irán",2:"Alirez Beiranvand",3:"Morteza Pouraliganji",4:"Ehsan Hajsafi",5:"Milad Mohammadi",6:"Shojae Khalilzadeh",7:"Ramin Rezaeian",8:"Hossein Kanaani",9:"Sadegh Moharrami",10:"Saleh Hardani",11:"Saeed Ezatolahi",12:"Saman Ghoddos",13:"Equipo Irán",14:"Omid Noorafkan",15:"Roozbeh Cheshmi",16:"Mohammad Mohebi",17:"Sardar Azmoun",18:"Mehdi Taremi",19:"Alireza Jahanbakhsh",20:"Ali Gholizadeh"},
  IRQ:{1:"Escudo Irak",2:"Jalal Hassan",3:"Rebin Sulaka",4:"Hussein Ali",5:"Akam Hashem",6:"Merchas Doski",7:"Zaid Tahseen",8:"Manaf Younis",9:"Zidane Iqbal",10:"Amir Al-Ammari",11:"Ibrahim Bavesh",12:"Ali Jasim",13:"Equipo Irak",14:"Youssef Amyn",15:"Aimar Sher",16:"Marko Farji",17:"Osama Rashid",18:"Ali Al-Hamadi",19:"Aymen Hussein",20:"Mohanad Ali"},
  JOR:{1:"Escudo Jordania",2:"Yazeed Abulaila",3:"Ihsan Haddad",4:"Mohammad Abu Hashish",5:"Yazan Al-Arab",6:"Abdallah Nasib",7:"Saleem Obaid",8:"Mohammad Abualnadi",9:"Ibrahim Saadeh",10:"Nizar Al-Rashdan",11:"Noor Al-Rawabdeh",12:"Mohannad Abu Taha",13:"Equipo Jordania",14:"Amer Jamous",15:"Mousa Al-Taamari",16:"Yazan Al-Naimat",17:"Mahmoud Al-Mardi",18:"Ali Olwan",19:"Mohammad Abu Zrayq",20:"Ibrahim Sabra"},
  JPN:{1:"Escudo Japón",2:"Zion Suzuki",3:"Henry Heroki Mochizuki",4:"Ayumu Seko",5:"Junnosuke Suzuki",6:"Shogo Taniguchi",7:"Tsuyoshi Watanabe",8:"Kaishu Sano",9:"Yuki Soma",10:"Ao Tanaka",11:"Daichi Kamada",12:"Takefusa Kubo",13:"Equipo Japón",14:"Ritsu Doan",15:"Keito Nakamura",16:"Takumi Minamino",17:"Shuto Machino",18:"Junya Ito",19:"Koki Ogawa",20:"Ayase Ueda"},
  KOR:{1:"Escudo Corea del Sur",2:"Hyeon-woo Jo",3:"Seung-Gyu Kim",4:"Min-jae Kim",5:"Yu-min Cho",6:"Young-woo Seol",7:"Han-beom Lee",8:"Tae-seok Lee",9:"Myung-jae Lee",10:"Jae-sung Lee",11:"In-beom Hwang",12:"Kang-in Lee",13:"Equipo Corea del Sur",14:"Seung-ho Paik",15:"Jens Castrop",16:"Dongg-yeong Lee",17:"Gue-sung Cho",18:"Heung-min Son",19:"Hee-chan Hwang",20:"Hyeon-Gyu Oh"},
  KSA:{1:"Escudo Arabia Saudí",2:"Nawaf Alaqidi",3:"Abdulrahman Al-Sanbi",4:"Saud Abdulhamid",5:"Nawaf Bouwashl",6:"Jihad Thakri",7:"Moteb Al-Harbi",8:"Hassan Altambakti",9:"Musab Aljuwayr",10:"Ziyad Aljohani",11:"Abdullah Alkhaibari",12:"Nasser Aldawsari",13:"Equipo Arabia Saudí",14:"Saleh Abu Alshamat",15:"Marwan Alsahafi",16:"Salem Aldawsari",17:"Abdulrahman Al-Aboud",18:"Feras Akbrikan",19:"Saleh Alshehri",20:"Abdullah Al-Hamdan"},
  MAR:{1:"Escudo Marruecos",2:"Yassine Bounou",3:"Munir El Kajoui",4:"Achraf Hakimi",5:"Noussair Mazraoui",6:"Nayef Aguerd",7:"Roman Saiss",8:"Jawad El Yamio",9:"Adam Masina",10:"Sofyan Amrabat",11:"Azzedine Ounahi",12:"Eliesse Ben Seghir",13:"Equipo Marruecos",14:"Bilal El Khannouss",15:"Ismael Saibari",16:"Youssef En-Nesyri",17:"Abde Ezzalzouli",18:"Soufiane Rahimi",19:"Brahim Diaz",20:"Ayoub El Kaabi"},
  MEX:{1:"Escudo México",2:"Luis Malagón",3:"Johan Vasquez",4:"Jorge Sánchez",5:"Cesar Montes",6:"Jesus Gallardo",7:"Israel Reyes",8:"Diego Lainez",9:"Carlos Rodriguez",10:"Edson Alvarez",11:"Orbelin Pineda",12:"Marcel Ruiz",13:"Equipo México",14:"Érick Sánchez",15:"Hirving Lozano",16:"Santiago Giménez",17:"Raúl Jiménez",18:"Alexis Vega",19:"Roberto Alvarado",20:"Cesar Huerta"},
  NED:{1:"Escudo Países Bajos",2:"Bart Verbruggen",3:"Virgil van Dijk",4:"Micky van de Ven",5:"Jurien Timber",6:"Denzel Dumfries",7:"Nathan Aké",8:"Jereme Frimpong",9:"Jan Paul van Hecke",10:"Tijjani Reijnders",11:"Ryan Gravenberch",12:"Teun Koopmeiners",13:"Equipo Países Bajos",14:"Frenkie de Jong",15:"Xavi Simons",16:"Justin Kluivert",17:"Memphis Depay",18:"Donyell Malen",19:"Wout Weghorst",20:"Cody Gakpo"},
  NOR:{1:"Escudo Noruega",2:"Orjan Nyland",3:"Julian Ryerson",4:"Leo Ostigård",5:"Kristoffer Vassbakk Ajer",6:"Marcus Holmgren Pedersen",7:"David Møller Wolfe",8:"Torbjørn Heggem",9:"Morten Thorsby",10:"Martin Ødegaard",11:"Sander Berge",12:"Andreas Schjelderup",13:"Equipo Noruega",14:"Patrick Berg",15:"Erling Haaland",16:"Alexander Sørloth",17:"Aron Dønnum",18:"Jorgen Strand Larsen",19:"Antonio Nusa",20:"Oscar Bobb"},
  NZL:{1:"Escudo Nueva Zelanda",2:"Max Crocombe Payne",3:"Alex Paulsen",4:"Michael Boxall",5:"Liberato Cacace",6:"Tim Payne",7:"Tyler Bindon",8:"Francis de Vries",9:"Finn Surman",10:"Joe Bell",11:"Sarpreet Singh",12:"Ryan Thomas",13:"Equipo Nueva Zelanda",14:"Matthew Garbett",15:"Marko Stamenić",16:"Ben Old",17:"Chris Wood",18:"Elijah Just",19:"Callum McCowatt",20:"Kosta Barbarouses"},
  PAN:{1:"Escudo Panamá",2:"Orlando Mosquera",3:"Luis Mejia",4:"Fidel Escobar",5:"Andres Andrade",6:"Michael Amir Murillo",7:"Eric Davis",8:"Jose Cordoba",9:"Cesar Blackman",10:"Cristian Martinez",11:"Aníbal Godoy",12:"Adalberto Carrasquilla",13:"Equipo Panamá",14:"Édgar Bárcenas",15:"Carlos Harvey",16:"Ismael Díaz",17:"Jose Fajardo",18:"Cecilio Waterman",19:"Jose Luiz Rodriguez",20:"Alberto Quintero"},
  PAR:{1:"Escudo Paraguay",2:"Roberto Fernandez",3:"Orlando Gill",4:"Gustavo Gomez",5:"Fabián Balbuena",6:"Juan José Cáceres",7:"Omar Alderete",8:"Junior Alonso",9:"Mathías Villasanti",10:"Diego Gomez",11:"Damián Bobadilla",12:"Andres Cubas",13:"Equipo Paraguay",14:"Matias Galarza Fonda",15:"Julio Enciso",16:"Alejandro Romero Gamarra",17:"Miguel Almirón",18:"Ramon Sosa",19:"Angel Romero",20:"Antonio Sanabria"},
  POR:{1:"Escudo Portugal",2:"Diogo Costa",3:"Jose Sa",4:"Ruben Dias",5:"João Cancelo",6:"Diogo Dalot",7:"Nuno Mendes",8:"Gonçalo Inácio",9:"Bernardo Silva",10:"Bruno Fernandes",11:"Ruben Neves",12:"Vitinha",13:"Equipo Portugal",14:"João Neves",15:"Cristiano Ronaldo",16:"Francisco Trincao",17:"João Felix",18:"Gonçalo Ramos",19:"Pedro Neto",20:"Rafael Leão"},
  QAT:{1:"Escudo Catar",2:"Meshaal Barsham",3:"Sultan Albrake",4:"Lucas Mendes",5:"Homam Ahmed",6:"Boualem Khoukhi",7:"Pedro Miguel",8:"Tarek Salman",9:"Mohamed Al-Mannai",10:"Karim Boudiaf",11:"Assim Madibo",12:"Ahmed Fatehi",13:"Equipo Catar",14:"Mohammed Waad",15:"Abdulaziz Hatem",16:"Hassan Al-Haydos",17:"Edmilson Junior",18:"Akram Hassan Afif",19:"Ahmed Al Ganehi",20:"Almoez Ali"},
  RSA:{1:"Escudo Sudáfrica",2:"Ronwen Williams",3:"Sipho Chaine",4:"Aubrey Modiba",5:"Samukele Kabini",6:"Mbekezeli Mbokazi",7:"Khulumani Ndamane",8:"Siyabonga Ngezana",9:"Khuliso Mudau",10:"Nkosinathi Sibisi",11:"Teboho Mokoena",12:"Thalente Mbatha",13:"Equipo Sudáfrica",14:"Bathasi Aubaas",15:"Yaya Sithole",16:"Sipho Mbule",17:"Lyle Foster",18:"Iqraam Rayners",19:"Mohau Nkota",20:"Oswin Appollis"},
  SCO:{1:"Escudo Escocia",2:"Angus Gunn",3:"Jack Hendry",4:"Kieran Tierney",5:"Aaron Hickey",6:"Andrew Robertson",7:"Scott McKenna",8:"John Souttar",9:"Anthony Ralston",10:"Grant Hanley",11:"Scott McTominay",12:"Billy Gilmour",13:"Equipo Escocia",14:"Lewis Ferguson",15:"Ryan Christie",16:"Kenny McLean",17:"John McGinn",18:"Lyndon Dykes",19:"Che Adams",20:"Ben Gannon-Doak"},
  SEN:{1:"Escudo Senegal",2:"Eduardo Mendy",3:"Yehvann Diouf",4:"Moussa Niakhaté",5:"Abdoulaye Seck",6:"Ismail Jakobs",7:"El Hadji Malick Diouf",8:"Kalidou Koulibaly",9:"Idrissa Gana Gueye",10:"Pape Matar Sarr",11:"Pape Gueye",12:"Habib Diarra",13:"Equipo Senegal",14:"Lamine Camara",15:"Sadio Mane",16:"Ismaïla Sarr",17:"Boulaye Dia",18:"Iliman Ndiaye",19:"Nicolas Jackson",20:"Krepin Diatta"},
  SUI:{1:"Escudo Suiza",2:"Gregor Kobel",3:"Yvon Mvogo",4:"Manuel Akanji",5:"Ricardo Rodriguez",6:"Nico Elvedi",7:"Aurèle Amenda",8:"Silvan Widmer",9:"Granit Xhaka",10:"Denis Zakaria",11:"Remo Freuler",12:"Fabian Rieder",13:"Equipo Suiza",14:"Ardon Jashari",15:"Johan Manzambi",16:"Michel Aebischer",17:"Breel Embolo",18:"Ruben Vargas",19:"Dan Ndoye",20:"Zeki Amdouni"},
  SWE:{1:"Escudo Suecia",2:"Victor Johansson",3:"Isak Hien",4:"Gabriel Gudmundsson",5:"Emil Holm",6:"Victor Nilsson Lindelöf",7:"Gustaf Lagerbielke",8:"Lucas Bergvall",9:"Hugo Larsson",10:"Jesper Karlström",11:"Yasin Ayari",12:"Mattias Svanberg",13:"Equipo Suecia",14:"Daniel Svensson",15:"Ken Sema",16:"Roony Bardghji",17:"Dejan Kulusevski",18:"Anthony Elanga",19:"Alexander Isak",20:"Viktor Gyökeres"},
  TUN:{1:"Escudo Túnez",2:"Bechir Ben Said",3:"Aymen Dahmen",4:"Van Valery",5:"Montassar Talbi",6:"Yassine Meriah",7:"Ali Abdi",8:"Dylan Bronn",9:"Ellyes Skhiri",10:"Aissa Laidouni",11:"Ferjani Sassi",12:"Mohamed Ali Ben Romdhane",13:"Equipo Túnez",14:"Hannibal Mejbri",15:"Elias Achouri",16:"Elias Saad",17:"Hazem Mastouri",18:"Ismael Gharbi",19:"Sayfallah Ltaief",20:"Naim Sliti"},
  TUR:{1:"Escudo Türkiye",2:"Ugurcan Cakir",3:"Mert Muldur",4:"Zeki Celik",5:"Abdulkerim Bardakci",6:"Caglar Soyunku",7:"Merih Demiral",8:"Ferdi Kadioglu",9:"Kaan Ayhan",10:"Ismail Yuksek",11:"Hakan Calhanoglu",12:"Orkun Kokcu",13:"Equipo Türkiye",14:"Arda Guler",15:"Irfan Can Kahvecu",16:"Yunus Akgun",17:"Can Uzun",18:"Baris Alper Yilmaz",19:"Kerem Akturkoglu",20:"Kenan Yildiz"},
  URU:{1:"Escudo Uruguay",2:"Sergio Rochet",3:"Santiago Mele",4:"Ronald Araujo",5:"José María Giménez",6:"Sebastian Caceres",7:"Mathias Olivera",8:"Guillermo Varela",9:"Nahitan Nandez",10:"Federico Valverde",11:"Giorgian De Arrascaeta",12:"Rodrigo Bentancur",13:"Equipo Uruguay",14:"Manuel Ugarte",15:"Nicolás de la Cruz",16:"Maxi Araujo",17:"Darwin Núñez",18:"Federico Viñas",19:"Rodrigo Aguirre",20:"Facundo Pellistri"},
  USA:{1:"Escudo Estados Unidos",2:"Matt Freese",3:"Chris Richards",4:"Tim Ream",5:"Mark McKenzie",6:"Alex Freeman",7:"Antonee Robinson",8:"Tyler Adams",9:"Tanner Tessmann",10:"Weston McKennie",11:"Christian Roldan",12:"Timothy Weah",13:"Equipo Estados Unidos",14:"Diego Luna",15:"Malim Tillman",16:"Christian Pulisic",17:"Brenden Aaronson",18:"Ricardo Pepi",19:"Haji Wright",20:"Folarin Balogun"},
  UZB:{1:"Escudo Uzbekistán",2:"Utkir Yusupov",3:"Farrukh Savfiev",4:"Sherzod Nasrullaev",5:"Umar Eshmurodov",6:"Husniddin Aliqulov",7:"Rustamjon Ashurmatov",8:"Khojiakbar Alijonov",9:"Abdukodir Khusanov",10:"Odiljon Hamrobekov",11:"Otabek Shukurov",12:"Jamshid Iskanderov",13:"Equipo Uzbekistán",14:"Azizbek Turgunboev",15:"Khojimat Erkinov",16:"Eldor Shomurodov",17:"Oston Urunov",18:"Jaloliddin Masharipov",19:"Igor Sergeev",20:"Abbosbek Fayzullaev"},
};

const ALBUM = {
  // Especiales
  FWC:{name:"FIFA World Cup",emoji:"🏆",total:20,page:1},
  CC:{name:"Coca-Cola",emoji:"🥤",total:14,page:6},
  // Grupo A (pág. 8)
  MEX:{name:"México",emoji:"🇲🇽",total:20,page:8},
  RSA:{name:"South Africa",emoji:"🇿🇦",total:20,page:10},
  KOR:{name:"Korea Republic",emoji:"🇰🇷",total:20,page:12},
  CZE:{name:"Czechia",emoji:"🇨🇿",total:20,page:14},
  // Grupo B (pág. 16)
  CAN:{name:"Canada",emoji:"🇨🇦",total:20,page:16},
  BIH:{name:"Bosnia-Herzegovina",emoji:"🇧🇦",total:20,page:18},
  QAT:{name:"Qatar",emoji:"🇶🇦",total:20,page:20},
  SUI:{name:"Switzerland",emoji:"🇨🇭",total:20,page:22},
  // Grupo C (pág. 24)
  BRA:{name:"Brazil",emoji:"🇧🇷",total:20,page:24},
  MAR:{name:"Morocco",emoji:"🇲🇦",total:20,page:26},
  HAI:{name:"Haiti",emoji:"🇭🇹",total:20,page:28},
  SCO:{name:"Scotland",emoji:"🇬🇧",total:20,page:30},
  // Grupo D (pág. 32)
  USA:{name:"USA",emoji:"🇺🇸",total:20,page:32},
  PAR:{name:"Paraguay",emoji:"🇵🇾",total:20,page:34},
  AUS:{name:"Australia",emoji:"🇦🇺",total:20,page:36},
  TUR:{name:"Türkiye",emoji:"🇹🇷",total:20,page:38},
  // Grupo E (pág. 40)
  GER:{name:"Germany",emoji:"🇩🇪",total:20,page:40},
  CUW:{name:"Curaçao",emoji:"🇨🇼",total:20,page:42},
  CIV:{name:"Côte d'Ivoire",emoji:"🇨🇮",total:20,page:44},
  ECU:{name:"Ecuador",emoji:"🇪🇨",total:20,page:46},
  // Grupo F (pág. 48)
  NED:{name:"Netherlands",emoji:"🇳🇱",total:20,page:48},
  JPN:{name:"Japan",emoji:"🇯🇵",total:20,page:50},
  SWE:{name:"Sweden",emoji:"🇸🇪",total:20,page:52},
  TUN:{name:"Tunisia",emoji:"🇹🇳",total:20,page:54},
  // Grupo G (pág. 58)
  BEL:{name:"Belgium",emoji:"🇧🇪",total:20,page:58},
  EGY:{name:"Egypt",emoji:"🇪🇬",total:20,page:60},
  IRN:{name:"IR Iran",emoji:"🇮🇷",total:20,page:62},
  NZL:{name:"New Zealand",emoji:"🇳🇿",total:20,page:64},
  // Grupo H (pág. 66)
  ESP:{name:"Spain",emoji:"🇪🇸",total:20,page:66},
  CPV:{name:"Cabo Verde",emoji:"🇨🇻",total:20,page:68},
  KSA:{name:"Saudi Arabia",emoji:"🇸🇦",total:20,page:70},
  URU:{name:"Uruguay",emoji:"🇺🇾",total:20,page:72},
  // Grupo I (pág. 74)
  FRA:{name:"France",emoji:"🇫🇷",total:20,page:74},
  SEN:{name:"Senegal",emoji:"🇸🇳",total:20,page:76},
  IRQ:{name:"Iraq",emoji:"🇮🇶",total:20,page:78},
  NOR:{name:"Norway",emoji:"🇳🇴",total:20,page:80},
  // Grupo J (pág. 82)
  ARG:{name:"Argentina",emoji:"🇦🇷",total:20,page:82},
  ALG:{name:"Algeria",emoji:"🇩🇿",total:20,page:84},
  AUT:{name:"Austria",emoji:"🇦🇹",total:20,page:86},
  JOR:{name:"Jordan",emoji:"🇯🇴",total:20,page:88},
  // Grupo K (pág. 90)
  POR:{name:"Portugal",emoji:"🇵🇹",total:20,page:90},
  COD:{name:"Congo DR",emoji:"🇨🇩",total:20,page:92},
  UZB:{name:"Uzbekistan",emoji:"🇺🇿",total:20,page:94},
  COL:{name:"Colombia",emoji:"🇨🇴",total:20,page:96},
  // Grupo L (pág. 98)
  ENG:{name:"England",emoji:"🇬🇧",total:20,page:98},
  CRO:{name:"Croatia",emoji:"🇭🇷",total:20,page:100},
  GHA:{name:"Ghana",emoji:"🇬🇭",total:20,page:102},
  PAN:{name:"Panama",emoji:"🇵🇦",total:20,page:104},
};

const buildEmpty = () => {
  const r = {};
  Object.entries(ALBUM).forEach(([code,team]) => {
    r[code] = {};
    for(let i=1;i<=team.total;i++) r[code][i]={state:"missing",qty:1,price:0};
  });
  return r;
};

// Detecta si un álbum está completamente vacío (todo en "missing").
// Se usa para BLOQUEAR el auto-guardado en ese caso: nunca se debe sobreescribir
// un álbum real en la nube con uno vacío por timing/carga fallida.
const isEmptyAlbum = (stickers) => {
  let total = 0;
  let useful = 0;
  Object.values(stickers || {}).forEach(team => {
    Object.values(team || {}).forEach(s => {
      total++;
      if (s.state !== "missing") useful++;
    });
  });
  return total > 0 && useful === 0;
};

const WORLD_FINAL = new Date("2026-07-19T20:00:00Z");
function useCountdown() {
  const [t,setT]=useState({d:0,h:0,m:0,s:0});
  useEffect(()=>{
    const tick=()=>{const diff=WORLD_FINAL-Date.now();if(diff<=0)return;setT({d:Math.floor(diff/864e5),h:Math.floor((diff%864e5)/36e5),m:Math.floor((diff%36e5)/6e4),s:Math.floor((diff%6e4)/1e3)});};
    tick();const id=setInterval(tick,1000);return()=>clearInterval(id);
  },[]);
  return t;
}

// Normaliza emails en TODOS los puntos de entrada: evita que Test@Email.com y test@email.com se traten como usuarios distintos
function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

// ─── SUPABASE DB ──────────────────────────────────────────────────────────────
const db = {
  // Fix RLS: ya NO hay fallback silencioso a la anon key. Si no hay token de sesión real,
  // h() devuelve null y cada método debe abortar explícitamente en vez de mandar una petición
  // "autenticada" que en realidad viaja como anónima (lo cual rompería las políticas RLS por
  // auth.email(), o peor, fallaría en silencio dando la falsa impresión de que funcionó).
  h(token) {
    if(!token) return null;
    return {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  },

  async saveAlbum(token, email, stickers, username, whatsappNumber) {
    const headers=this.h(token);
    if(!headers) return false;
    try {
      // on_conflict=user_email explícito: la tabla tiene dos restricciones únicas (id, user_email).
      // Sin especificar la columna, PostgREST puede no resolver el merge-duplicates correctamente
      // contra user_email y devolver 409 en vez de hacer upsert. Esto fue la causa real del 409.
      const body={user_email:email, username:username||email.split("@")[0], stickers, updated_at:new Date().toISOString()};
      // whatsapp_number es opcional — solo se manda si se pasó explícitamente, para no pisar
      // con null lo que ya estaba guardado cuando este save viene de un flujo que no lo conoce.
      if(whatsappNumber!==undefined) body.whatsapp_number=whatsappNumber;
      const res = await fetch(`${SUPABASE_URL}/rest/v1/albums?on_conflict=user_email`, {
        method:"POST",
        headers:{...headers, Prefer:"resolution=merge-duplicates,return=minimal"},
        body:JSON.stringify(body)
      });
      return res.ok;
    } catch { return false; }
  },

  async getAlbum(token, email) {
    const headers=this.h(token);
    if(!headers) return null;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/albums?user_email=eq.${encodeURIComponent(email)}&select=*`, {headers});
      const data = await res.json();
      return data?.[0]||null;
    } catch { return null; }
  },

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  async getRelation(token, emailA, emailB) {
    const headers=this.h(token);
    if(!headers) return null;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/contacts?or=(and(user_email.eq.${encodeURIComponent(emailA)},contact_email.eq.${encodeURIComponent(emailB)}),and(user_email.eq.${encodeURIComponent(emailB)},contact_email.eq.${encodeURIComponent(emailA)}))&select=*`, {headers});
      const data = await res.json();
      return data?.[0]||null;
    } catch { return null; }
  },

  async sendRequest(token, fromEmail, toEmail) {
    if(!this.isValidEmail(fromEmail)||!this.isValidEmail(toEmail)) return false;
    if(fromEmail===toEmail) return false;
    const headers=this.h(token);
    if(!headers) return false;
    // No crear una nueva solicitud pendiente si ya existe cualquier relación en cualquier dirección
    const existing = await this.getRelation(token, fromEmail, toEmail);
    if(existing) return existing.status==="accepted";
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/contacts`, {
        method:"POST",
        headers:{...headers, Prefer:"resolution=ignore-duplicates,return=minimal"},
        body:JSON.stringify({user_email:fromEmail, contact_email:toEmail, status:"pending"})
      });
      return res.ok;
    } catch { return false; }
  },

  async acceptRequest(token, myEmail, requesterEmail) {
    const headers=this.h(token);
    if(!headers) return false;
    try {
      // Update their request to accepted
      await fetch(`${SUPABASE_URL}/rest/v1/contacts?user_email=eq.${encodeURIComponent(requesterEmail)}&contact_email=eq.${encodeURIComponent(myEmail)}`, {
        method:"PATCH", headers:{...headers, Prefer:"return=minimal"}, body:JSON.stringify({status:"accepted"})
      });
      // Create my side accepted
      await fetch(`${SUPABASE_URL}/rest/v1/contacts`, {
        method:"POST",
        headers:{...headers, Prefer:"resolution=merge-duplicates,return=minimal"},
        body:JSON.stringify({user_email:myEmail, contact_email:requesterEmail, status:"accepted"})
      });
      return true;
    } catch { return false; }
  },

  async rejectRequest(token, myEmail, requesterEmail) {
    const headers=this.h(token);
    if(!headers) return false;
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/contacts?user_email=eq.${encodeURIComponent(requesterEmail)}&contact_email=eq.${encodeURIComponent(myEmail)}`, {
        method:"PATCH", headers:{...headers, Prefer:"return=minimal"}, body:JSON.stringify({status:"rejected"})
      });
      return true;
    } catch { return false; }
  },

  async getPendingRequests(token, myEmail) {
    const headers=this.h(token);
    if(!headers) return [];
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/contacts?contact_email=eq.${encodeURIComponent(myEmail)}&status=eq.pending&select=user_email,created_at`, {headers});
      return await res.json()||[];
    } catch { return []; }
  },

  async getAcceptedContacts(token, myEmail) {
    const headers=this.h(token);
    if(!headers) return [];
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/contacts?user_email=eq.${encodeURIComponent(myEmail)}&status=eq.accepted&select=contact_email`, {headers});
      const data = await res.json();
      return data?.map(d=>d.contact_email)||[];
    } catch { return []; }
  },

  async getContactAlbums(token, contacts) {
    if(!contacts.length) return [];
    const headers=this.h(token);
    if(!headers) return [];
    try {
      const emails = contacts.map(e=>`"${e}"`).join(",");
      const res = await fetch(`${SUPABASE_URL}/rest/v1/albums?user_email=in.(${emails})&select=user_email,username,stickers,updated_at,whatsapp_number`, {headers});
      return await res.json()||[];
    } catch { return []; }
  },

  async getMyRequests(token, myEmail) {
    const headers=this.h(token);
    if(!headers) return [];
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/contacts?user_email=eq.${encodeURIComponent(myEmail)}&select=contact_email,status`, {headers});
      return await res.json()||[];
    } catch { return []; }
  }
};

// ─── AUTH ─────────────────────────────────────────────────────────────────────
const sbAuth = {
  async signInWithGoogle() {
    window.location.href=`${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(window.location.origin)}`;
  },
  async signInWithApple() {
    window.location.href=`${SUPABASE_URL}/auth/v1/authorize?provider=apple&redirect_to=${encodeURIComponent(window.location.origin)}`;
  },
  async signInWithFacebook() {
    window.location.href=`${SUPABASE_URL}/auth/v1/authorize?provider=facebook&redirect_to=${encodeURIComponent(window.location.origin)}`;
  },
  async signInWithEmail(email,password) {
    const res=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,{method:"POST",headers:{apikey:SUPABASE_KEY,"Content-Type":"application/json"},body:JSON.stringify({email,password})});
    return res.json();
  },
  async signUp(email,password) {
    const res=await fetch(`${SUPABASE_URL}/auth/v1/signup`,{method:"POST",headers:{apikey:SUPABASE_KEY,"Content-Type":"application/json"},body:JSON.stringify({email,password})});
    return res.json();
  },
  async signOut(token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`,{method:"POST",headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${token}`}});
  },
  getTokenFromHash() {
    const hash=window.location.hash;
    if(!hash||!hash.includes("access_token"))return null;
    const p=new URLSearchParams(hash.substring(1));
    const token=p.get("access_token");
    if(token){window.location.hash="";return token;}
    return null;
  },
  async getUserFromToken(token) {
    try{
      const res=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${token}`}});
      const data=await res.json();
      return data?.email||null;
    }catch{return null;}
  },
  getStoredSession() { try{const s=localStorage.getItem("figuswap_session");return s?JSON.parse(s):null;}catch{return null;} },
  storeSession(s) { try{localStorage.setItem("figuswap_session",JSON.stringify(s));}catch{} },
  clearSession() { try{localStorage.removeItem("figuswap_session");}catch{} }
};

// ─── AUTH PAGE ────────────────────────────────────────────────────────────────
function AuthPage({onAuth,onClose,inviterWhatsapp,t=translations.es}) {
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const inp={width:"100%",boxSizing:"border-box",padding:"12px 14px",borderRadius:10,border:"1px solid #1e2a3a",background:"#0a0f1e",color:"#e8eaf6",fontSize:14,outline:"none",marginBottom:10};
  const handleEmail=async()=>{
    setLoading(true);setError("");
    const normEmail=normalizeEmail(email);
    try{
      if(mode==="login"){
        const r=await sbAuth.signInWithEmail(normEmail,pass);
        if(r.access_token){const s={token:r.access_token,email:normalizeEmail(r.user?.email||normEmail)};sbAuth.storeSession(s);onAuth(s);}
        else setError(r.error_description||t.emailOrPasswordError);
      }else{
        const r=await sbAuth.signUp(normEmail,pass);
        if(r.id||r.user?.id){setMode("login");setError(t.accountCreated);}
        else setError(r.error_description||t.registerError);
      }
    }catch{setError(t.connectionError);}
    setLoading(false);
  };
  return (
    <div style={{minHeight:"100vh",background:"#0a0f1e",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,position:"relative"}}>
      {onClose&&(
        <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"none",border:"none",color:"#6b7280",fontSize:24,cursor:"pointer",padding:8}}>✕</button>
      )}
      <img src="/icon-512.png" alt="FiguSwap" style={{width:64,height:64,borderRadius:14,marginBottom:8}}/>
      <div style={{fontWeight:900,fontSize:28,background:"linear-gradient(90deg,#ffd700,#f59e0b)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4}}>FiguSwap</div>
      <div style={{color:"#6b7280",fontSize:13,marginBottom:inviterWhatsapp?16:28,textAlign:"center"}}>{t.appSubtitle}</div>
      {/* Si la persona entró desde el QR de alguien (escaneado en persona), le damos la opción
          de escribirle de inmediato por WhatsApp, sin esperar a terminar de registrarse. */}
      {inviterWhatsapp&&(
        <button
          onClick={()=>window.open(`https://wa.me/${inviterWhatsapp}?text=${encodeURIComponent(t.qrWhatsappMessage)}`,"_blank")}
          style={{width:"100%",maxWidth:380,padding:"12px",background:"#14532d",border:"1px solid #22c55e",borderRadius:10,color:"#86efac",fontWeight:700,fontSize:13,cursor:"pointer",marginBottom:20}}
        >
          {t.whatsappNow}
        </button>
      )}
      <div style={{background:"#111827",border:"1px solid #1e2a3a",borderRadius:16,padding:24,width:"100%",maxWidth:380}}>
        <button onClick={sbAuth.signInWithGoogle} style={{width:"100%",padding:"14px",background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,color:"#1f2937",fontWeight:700,fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:16}}>
          <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          {t.continueWithGoogle}
        </button>
        <button onClick={sbAuth.signInWithFacebook} style={{width:"100%",padding:"14px",background:"#1877F2",border:"none",borderRadius:10,color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:16}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.95h-1.5c-1.5 0-1.96.93-1.96 1.89v2.28h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z"/></svg>
          {t.continueWithFacebook}
        </button>
        {/* Botón de Apple con la marca oficial (fondo negro, logo blanco) — Apple exige esta
            apariencia específica para "Sign in with Apple" si quieres pasar revisión. Borde
            sutil para que se distinga de la tarjeta oscura en vez de fundirse invisible. */}
        <button onClick={sbAuth.signInWithApple} style={{width:"100%",padding:"14px",background:"#000",border:"1px solid #2a2a2a",borderRadius:10,color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:16}}>
          <svg width="17" height="20" viewBox="0 0 17 20" fill="#fff"><path d="M14.94 10.6c-.03-2.16 1.76-3.2 1.84-3.25-1-1.46-2.56-1.66-3.11-1.68-1.42-.14-2.69.82-3.39.82-.71 0-1.8-.8-2.95-.78-1.51.02-2.91.88-3.68 2.23-1.57 2.72-.4 6.98 1.13 9.27.75 1.12 1.65 2.37 2.83 2.33 1.13-.04 1.56-.74 2.93-.74 1.37 0 1.75.74 2.95.72 1.22-.02 1.99-1.12 2.74-2.24.86-1.29 1.22-2.54 1.24-2.62-.03-.01-2.38-.91-2.41-3.62l-.06-.04zM12.32 3.6c.65-.79 1.09-1.88.97-2.97-.94.04-2.07.63-2.74 1.42-.6.7-1.13 1.82-.99 2.89 1.05.08 2.1-.53 2.76-1.34z"/></svg>
          {t.continueWithApple}
        </button>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <div style={{flex:1,height:1,background:"#1e2a3a"}}/><span style={{fontSize:12,color:"#4a5568"}}>{t.withEmail}</span><div style={{flex:1,height:1,background:"#1e2a3a"}}/>
        </div>
        <div style={{display:"flex",gap:4,marginBottom:20,borderBottom:"1px solid #1e2a3a"}}>
          {["login","register"].map(m=>(
            <button key={m} onClick={()=>setMode(m)} style={{flex:1,padding:"10px",border:"none",borderBottom:mode===m?"2px solid #ffd700":"2px solid transparent",background:"transparent",color:mode===m?"#ffd700":"#6b7280",fontWeight:700,fontSize:13,cursor:"pointer",marginBottom:-1}}>
              {m==="login"?t.login:t.register}
            </button>
          ))}
        </div>
        <input style={inp} type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
        <input style={inp} type="password" placeholder={t.password} value={pass} onChange={e=>setPass(e.target.value)}/>
        {error&&<div style={{fontSize:12,marginBottom:10,padding:"8px 12px",background:error.startsWith("✅")?"#052e16":"#1e0a0a",borderRadius:8,color:error.startsWith("✅")?"#86efac":"#ef4444"}}>{error}</div>}
        <button onClick={handleEmail} disabled={loading} style={{width:"100%",padding:"14px",background:"linear-gradient(135deg,#ffd700,#f59e0b)",border:"none",borderRadius:10,color:"#0a0f1e",fontWeight:800,fontSize:15,cursor:"pointer",opacity:loading?0.7:1}}>
          {loading?"⏳ ...":(mode==="login"?`${t.login} →`:`${t.createAccount} →`)}
        </button>
      </div>
    </div>
  );
}

// ─── STICKER CELL — TAP TO CYCLE ─────────────────────────────────────────────
function StickerCell({code,num,data,onAction,t,stateMap,lang}) {
  const pressTimer = useRef(null);
  const longPressed = useRef(false);
  const [pressing,setPressing]=useState(false);
  const [open,setOpen]=useState(false);

  const handleTap = () => {
    if(longPressed.current) { longPressed.current = false; return; }
    // Cycle: missing → have → repeated(+1) → repeated(+1)...
    if(data.state === "missing") {
      onAction(code, num, "have", 1, 0);
    } else if(data.state === "have") {
      onAction(code, num, "repeated", 1, 0);
    } else if(data.state === "repeated") {
      onAction(code, num, "repeated", data.qty + 1, 0);
    } else {
      // sell/trade/auction — open modal instead
      setOpen(true);
    }
  };

  const handleLongPress = () => {
    // Long press = subtract 1
    if(data.state === "repeated") {
      const newQty = data.qty - 1;
      // Fix: si la repetida llega a 0, sigues teniendo la unidad base en tu álbum —
      // debe quedar en "have", no en "missing". Antes esto borraba de golpe la que
      // sí tienes, no solo la de sobra que acabas de dar/restar.
      if(newQty <= 0) onAction(code, num, "have", 1, 0);
      else onAction(code, num, "repeated", newQty, 0);
    } else if(data.state === "have") {
      onAction(code, num, "missing", 1, 0);
    }
  };

  const onPressStart = () => {
    longPressed.current = false;
    pressTimer.current = setTimeout(() => {
      longPressed.current = true;
      setPressing(true);
      handleLongPress();
      setTimeout(() => setPressing(false), 300);
    }, 500);
  };

  const onPressEnd = () => {
    if(pressTimer.current) clearTimeout(pressTimer.current);
  };

  const st=stateMap[data.state];

  return (
    <div>
      <button
        onClick={handleTap}
        onMouseDown={onPressStart}
        onMouseUp={onPressEnd}
        onTouchStart={onPressStart}
        onTouchEnd={onPressEnd}
        onContextMenu={e=>{e.preventDefault();setOpen(true);}}
        style={{width:"100%",aspectRatio:"1",borderRadius:10,border:`2px solid ${st.color}`,background:pressing?"#333":st.bg,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,position:"relative",transition:"background 0.1s"}}
      >
        <span style={{fontSize:16,lineHeight:1}}>{st.emoji}</span>
        <span style={{fontSize:12,fontWeight:900,color:st.color}}>{num}</span>
        {data.state==="repeated"&&<span style={{position:"absolute",top:2,right:3,fontSize:9,fontWeight:800,color:"#f97316",background:"#1e0f00",borderRadius:4,padding:"0 2px"}}>×{data.qty}</span>}
        {data.state==="sell"&&data.price>0&&<span style={{position:"absolute",bottom:2,fontSize:8,color:"#fbbf24",fontWeight:700}}>${data.price}</span>}
      </button>

      {/* Long press hint */}
      {(data.state==="repeated"||data.state==="have")&&(
        <div style={{fontSize:8,color:"#374151",textAlign:"center",marginTop:1}}>{t.holdToSubtract}</div>
      )}

      {/* Full modal for sell/trade/auction */}
      {open&&(
        <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center",background:"#000a"}} onClick={()=>setOpen(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#111827",borderRadius:"20px 20px 0 0",padding:24,width:"100%",maxWidth:480,border:"1px solid #1e2a3a",borderBottom:"none"}}>
            <div style={{textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:26}}>{ALBUM[code]?.emoji}</div>
              <div style={{fontWeight:900,fontSize:17,color:"#fff"}}>{getTeamName(code,lang)} <span style={{color:"#ffd700"}}>#{num}</span></div>
              {STICKER_NAMES[code]?.[num]&&(
                <div style={{fontSize:13,color:"#9ca3af",marginTop:2}}>{STICKER_NAMES[code][num]}</div>
              )}
              <div style={{fontSize:12,color:"#6b7280",marginTop:4}}>{t.tapToChangeState}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
              {Object.entries(stateMap).map(([key,val])=>(
                <button key={key} onClick={()=>{onAction(code,num,key);setOpen(false);}} style={{padding:"10px 6px",borderRadius:10,border:`1px solid ${data.state===key?val.color:"#1e2a3a"}`,background:data.state===key?val.bg:"#0a0f1e",color:data.state===key?val.color:"#6b7280",fontWeight:700,fontSize:11,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <span style={{fontSize:18}}>{val.emoji}</span><span>{val.label}</span>
                </button>
              ))}
            </div>
            {(data.state==="sell"||data.state==="auction")&&(
              <div style={{background:"#0a0f1e",borderRadius:10,padding:12,marginBottom:12}}>
                <div style={{fontSize:12,color:"#6b7280",marginBottom:8}}>{t.priceUsd}</div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{color:"#6b7280"}}>$</span>
                  <input type="number" defaultValue={data.price||1} min={0.5} step={0.5} onChange={e=>onAction(code,num,data.state,data.qty,parseFloat(e.target.value))} style={{flex:1,background:"#111827",border:"1px solid #1e2a3a",borderRadius:8,color:"#ffd700",fontSize:20,fontWeight:700,padding:"8px 12px",outline:"none"}}/>
                </div>
              </div>
            )}
            <button onClick={()=>setOpen(false)} style={{width:"100%",padding:12,background:"transparent",border:"1px solid #1e2a3a",borderRadius:10,color:"#6b7280",fontWeight:700,cursor:"pointer"}}>{t.close}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TEAM SECTION ─────────────────────────────────────────────────────────────
function TeamSection({code,stickers,tab,onAction,t,stateMap,lang}) {
  const [expanded,setExpanded]=useState(false);
  const team=ALBUM[code];
  const allNums=Object.keys(stickers).map(Number);
  const visibleNums=tab==="missing"?allNums.filter(n=>stickers[n].state==="missing"):tab==="repeated"?allNums.filter(n=>TRADEABLE_STATES.includes(stickers[n].state)):allNums;
  if(visibleNums.length===0)return null;
  const have=allNums.filter(n=>stickers[n].state!=="missing").length;
  const pct=Math.round(have/team.total*100);
  const complete=pct===100;
  return (
    <div style={{background:complete?"#052e16":"#0d1117",border:`1px solid ${complete?"#22c55e":"#1e2a3a"}`,borderRadius:16,overflow:"hidden",marginBottom:10}}>
      <button onClick={()=>setExpanded(!expanded)} style={{width:"100%",padding:"14px 16px",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:26}}>{team.emoji}</span>
        <div style={{flex:1,textAlign:"left"}}>
          <div style={{fontWeight:800,fontSize:15,color:complete?"#86efac":"#e8eaf6"}}>{getTeamName(code,lang)}</div>
          <div style={{fontSize:11,color:"#4a5568",marginTop:1}}>{GROUPS[code]==="special"?(t.specialsLabel||"Especiales"):GROUPS[code]?`${t.group||"Grupo"} ${GROUPS[code]}`:""}{team.page?` · ${t.pageAbbr} ${team.page}`:""}</div>
          <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>
            {tab==="missing"&&`❌ ${visibleNums.length} ${t.scopeMissing}`}
            {tab==="repeated"&&`🔁 ${visibleNums.length} ${t.scopeRepeated}`}
            {tab==="all"&&`${have}/${team.total} · ❌${allNums.filter(n=>stickers[n].state==="missing").length} 🔁${allNums.filter(n=>TRADEABLE_STATES.includes(stickers[n].state)).length}`}
            {complete&&` ✅ ${t.completed || "Completo"}`}
          </div>
        </div>
        <div style={{fontWeight:800,fontSize:15,color:complete?"#22c55e":pct>=75?"#84cc16":pct>=50?"#eab308":"#ef4444"}}>{pct}%</div>
        <span style={{color:"#4a5568",fontSize:12}}>{expanded?"▲":"▼"}</span>
      </button>
      <div style={{height:3,background:"#1e2a3a",margin:"0 16px"}}>
        <div style={{height:"100%",width:`${pct}%`,background:complete?"#22c55e":"#ffd700",borderRadius:2}}/>
      </div>
      {expanded&&(
        <div style={{padding:16}}>
          {(tab==="missing"||tab==="repeated")&&(
            <div style={{fontSize:11,color:"#4a5568",marginBottom:10}}>
              {tab==="missing"?t.tapToMarkOwned:t.tapToEditHoldSubtract}
            </div>
          )}
          {tab==="all"&&<div style={{fontSize:11,color:"#4a5568",marginBottom:10}}>{t.tapToCycleHoldSubtract}</div>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:14}}>
            {visibleNums.map(n=>(<StickerCell key={n} code={code} num={n} data={stickers[n]} onAction={onAction} t={t} stateMap={stateMap} lang={lang}/>))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CONTACTS PAGE ────────────────────────────────────────────────────────────
function ContactsPage({myEmail,myToken,myStickers,onClose,t,lang}) {
  const [pending,setPending]=useState([]);
  const [contacts,setContacts]=useState([]);
  const [contactAlbums,setContactAlbums]=useState([]);
  const [myRequests,setMyRequests]=useState([]);
  const [loading,setLoading]=useState(true);
  const [addEmail,setAddEmail]=useState("");
  const [adding,setAdding]=useState(false);
  const [selected,setSelected]=useState(null);
  const [copied,setCopied]=useState(false);
  const [actionMsg,setActionMsg]=useState("");

  const myLink=`${window.location.origin}?invite=${encodeURIComponent(myEmail)}`;

  const load=useCallback(async()=>{
    setLoading(true);
    const [pend,accepted,myReqs]=await Promise.all([
      db.getPendingRequests(myToken,myEmail),
      db.getAcceptedContacts(myToken,myEmail),
      db.getMyRequests(myToken,myEmail),
    ]);
    setPending(pend);
    setContacts(accepted);
    setMyRequests(myReqs);
    if(accepted.length>0||pend.length>0){
      const allEmails=[...accepted,...pend.map(p=>p.user_email)];
      const albums=await db.getContactAlbums(myToken,allEmails);
      setContactAlbums(albums);
    }
    setLoading(false);
  },[myEmail,myToken]);

  useEffect(()=>{load();},[load]);

  const showMsg=(msg)=>{setActionMsg(msg);setTimeout(()=>setActionMsg(""),2500);};

  const copyLink=()=>{navigator.clipboard.writeText(myLink).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});};
  const shareWhatsApp=()=>{
    const text=`${t.appSubtitle}\n\n${myLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,"_blank");
  };

  const sendRequest=async()=>{
    const email=normalizeEmail(addEmail);
    if(!email)return;
    if(!db.isValidEmail(email)){showMsg(t.invalidEmail);return;}
    if(email===myEmail){showMsg(t.cannotAddYourself);return;}
    setAdding(true);
    const ok=await db.sendRequest(myToken,myEmail,email);
    if(ok)showMsg(`${t.requestSentTo} ${email.split("@")[0]}`);
    else showMsg(t.alreadyConnected);
    setAddEmail("");
    await load();
    setAdding(false);
  };

  const acceptReq=async(requesterEmail)=>{
    await db.acceptRequest(myToken,myEmail,requesterEmail);
    showMsg(`${t.connectedWith} ${requesterEmail.split("@")[0]}!`);
    await load();
  };

  const rejectReq=async(requesterEmail)=>{
    await db.rejectRequest(myToken,myEmail,requesterEmail);
    showMsg(t.requestRejected);
    await load();
  };

  const getMatches=(friendStickers)=>{
    if(!friendStickers||!myStickers)return{iHave:[],theyHave:[]};
    const iHave=[],theyHave=[];
    Object.entries(myStickers).forEach(([code,nums])=>{
      Object.entries(nums||{}).forEach(([num,s])=>{
        const n=parseInt(num);
        if(TRADEABLE_STATES.includes(s.state)&&friendStickers[code]?.[n]?.state==="missing") iHave.push({code,num:n,myState:s.state});
        if(s.state==="missing"&&TRADEABLE_STATES.includes(friendStickers[code]?.[n]?.state)) theyHave.push({code,num:n,theirState:friendStickers[code][n].state});
      });
    });
    // Fix: Object.entries recorría myStickers en orden alfabético por código (ALG, ARG, AUT...),
    // no en el orden real de páginas del álbum. Esto re-ordena ambas listas según ALBUM_ORDER
    // (FWC/CC primero, luego grupo A-L en orden), y dentro de cada selección por número ascendente.
    const byAlbumOrder=(a,b)=>(ALBUM_ORDER.indexOf(a.code)-ALBUM_ORDER.indexOf(b.code))||(a.num-b.num);
    iHave.sort(byAlbumOrder);
    theyHave.sort(byAlbumOrder);
    return{iHave,theyHave};
  };

  const getRepeatedCount=(st)=>{
    if(!st)return 0;
    return Object.values(st).reduce((s,team)=>s+Object.values(team||{}).filter(x=>TRADEABLE_STATES.includes(x.state)).length,0);
  };

  return (
    <div>
      <div style={{background:"#111827",border:"1px solid #1e2a3a",borderRadius:12,marginBottom:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:10}}>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#6b7280",fontSize:20,cursor:"pointer"}}>←</button>
        <span style={{fontWeight:900,fontSize:16,color:"#ffd700"}}>{t.myNetworkTitle}</span>
        {pending.length>0&&<span style={{background:"#ef4444",color:"#fff",fontSize:11,fontWeight:800,borderRadius:20,padding:"2px 8px"}}>{pending.length} {pending.length>1?t.newPlural:t.newSingular}</span>}
        <span style={{marginLeft:"auto",fontSize:12,color:"#6b7280"}}>{contacts.length} {t.friendsCount}</span>
      </div>

      {actionMsg&&<div style={{background:"#052e16",border:"1px solid #22c55e",borderRadius:10,padding:"10px 16px",fontSize:13,color:"#86efac",fontWeight:700,marginBottom:16}}>{actionMsg}</div>}

      <div>

        {/* SOLICITUDES PENDIENTES */}
        {pending.length>0&&(
          <div style={{marginBottom:20}}>
            <div style={{fontWeight:800,color:"#ffd700",fontSize:15,marginBottom:12}}>{t.pendingRequests} ({pending.length})</div>
            {pending.map((req,i)=>{
              const requesterAlbum=contactAlbums.find(a=>a.user_email===req.user_email);
              const matches=requesterAlbum?getMatches(requesterAlbum.stickers):{iHave:[],theyHave:[]};
              const repeatedCount=getRepeatedCount(requesterAlbum?.stickers);
              return (
                <div key={i} style={{background:"#111827",border:"2px solid #ffd700",borderRadius:14,padding:16,marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                    <div style={{width:48,height:48,borderRadius:"50%",background:"linear-gradient(135deg,#ffd700,#f59e0b)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#0a0f1e",fontSize:22,flexShrink:0}}>
                      {req.user_email[0].toUpperCase()}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:900,color:"#ffd700",fontSize:16}}>{req.user_email.split("@")[0]}</div>
                      <div style={{fontSize:12,color:"#6b7280"}}>{req.user_email}</div>
                      <div style={{fontSize:12,color:"#f97316",marginTop:3}}>
                        🔁 {repeatedCount} {t.availableForTrade}
                        {matches.theyHave.length>0&&<span style={{color:"#22c55e"}}> · {matches.theyHave.length} {t.neededByYou} ⭐</span>}
                      </div>
                    </div>
                  </div>

                  {matches.theyHave.length>0&&(
                    <div style={{background:"#0a1a0a",border:"1px solid #22c55e",borderRadius:10,padding:"10px 12px",marginBottom:12}}>
                      <div style={{fontSize:12,color:"#4ade80",fontWeight:700,marginBottom:6}}>{t.hasTheseYouNeed}</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                        {matches.theyHave.slice(0,10).map((s,j)=>(
                          <span key={j} style={{fontSize:11,padding:"3px 8px",borderRadius:12,background:"#052e16",color:"#22c55e",border:"1px solid #22c55e"}}>{s.code} #{s.num}</span>
                        ))}
                        {matches.theyHave.length>10&&<span style={{fontSize:11,color:"#6b7280"}}>+{matches.theyHave.length-10} {t.more}</span>}
                      </div>
                    </div>
                  )}

                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <button onClick={()=>rejectReq(req.user_email)} style={{padding:"13px",background:"transparent",border:"1px solid #ef4444",borderRadius:10,color:"#ef4444",fontWeight:700,fontSize:14,cursor:"pointer"}}>
                      {t.reject}
                    </button>
                    <button onClick={()=>acceptReq(req.user_email)} style={{padding:"13px",background:"linear-gradient(135deg,#22c55e,#16a34a)",border:"none",borderRadius:10,color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer"}}>
                      {t.accept}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MI LINK */}
        <div style={{background:"#111827",border:"1px solid #1e3a5f",borderRadius:14,padding:16,marginBottom:16}}>
          <div style={{fontWeight:800,color:"#60a5fa",marginBottom:4}}>{t.inviteFriends}</div>
          <div style={{fontSize:12,color:"#6b7280",marginBottom:10}}>{t.inviteHelp}</div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={copyLink} style={{flex:1,padding:"11px",background:copied?"#22c55e":"#1e2a3a",border:"1px solid",borderColor:copied?"#22c55e":"#374151",borderRadius:8,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>
              {copied?t.copied:t.copyLink}
            </button>
            <button onClick={shareWhatsApp} style={{flex:1,padding:"11px",background:"#14532d",border:"1px solid #22c55e",borderRadius:8,color:"#86efac",fontWeight:700,fontSize:13,cursor:"pointer"}}>
              💬 WhatsApp
            </button>
          </div>
        </div>

        {/* AGREGAR POR EMAIL */}
        <div style={{background:"#111827",border:"1px solid #1e2a3a",borderRadius:14,padding:16,marginBottom:16}}>
          <div style={{fontWeight:700,color:"#e8eaf6",marginBottom:8}}>{t.sendEmailRequest}</div>
          <div style={{display:"flex",gap:8}}>
            <input value={addEmail} onChange={e=>setAddEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendRequest()} placeholder="email@ejemplo.com" inputMode="email" style={{flex:1,padding:"10px 14px",borderRadius:8,border:"1px solid #1e2a3a",background:"#0a0f1e",color:"#e8eaf6",fontSize:13,outline:"none"}}/>
            <button onClick={sendRequest} disabled={adding||!addEmail.trim()} style={{padding:"10px 18px",background:"linear-gradient(135deg,#ffd700,#f59e0b)",border:"none",borderRadius:8,color:"#0a0f1e",fontWeight:800,cursor:"pointer",fontSize:16,opacity:(adding||!addEmail.trim())?0.5:1}}>
              {adding?"⏳":"→"}
            </button>
          </div>
          {myRequests.filter(r=>r.status==="pending").length>0&&(
            <div style={{marginTop:10,fontSize:12,color:"#6b7280"}}>
              {t.sentTo} {myRequests.filter(r=>r.status==="pending").map(r=>r.contact_email.split("@")[0]).join(", ")}
            </div>
          )}
        </div>

        {/* AMIGOS */}
        {loading&&<div style={{textAlign:"center",padding:32,color:"#6b7280"}}>{t.networkLoading}</div>}

        {!loading&&contacts.length>0&&(
          <>
            <div style={{fontWeight:800,color:"#e8eaf6",fontSize:15,marginBottom:12}}>{t.myFriends} ({contacts.length})</div>
            {contacts.map((email,i)=>{
              const album=contactAlbums.find(a=>a.user_email===email);
              const matches=album?getMatches(album.stickers):{iHave:[],theyHave:[]};
              const totalMatches=matches.iHave.length+matches.theyHave.length;
              const repeatedCount=getRepeatedCount(album?.stickers);
              return (
                <div key={i} style={{background:"#111827",border:`1px solid ${totalMatches>0?"#22c55e":"#1e2a3a"}`,borderRadius:14,padding:16,marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <div style={{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,#22c55e,#16a34a)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#fff",fontSize:20,flexShrink:0}}>
                      {email[0].toUpperCase()}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:800,color:"#e8eaf6",fontSize:15}}>{album?.username||email.split("@")[0]}</div>
                      <div style={{fontSize:11,color:"#4a5568"}}>{email}</div>
                      {album&&<div style={{fontSize:11,color:"#6b7280",marginTop:2}}>🔁 {repeatedCount} {t.availableForTrade} · {t.updated} {new Date(album.updated_at).toLocaleTimeString(lang,{hour:"2-digit",minute:"2-digit"})}</div>}
                    </div>
                    {totalMatches>0&&<span style={{fontSize:12,color:"#ffd700",background:"#1e1500",padding:"4px 10px",borderRadius:20,fontWeight:800}}>🎯 {totalMatches}</span>}
                  </div>

                  {album&&(
                    <>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                        <div style={{background:"#052e16",borderRadius:10,padding:"12px",textAlign:"center"}}>
                          <div style={{fontSize:11,color:"#4ade80",marginBottom:2}}>{t.iHaveForThem}</div>
                          <div style={{fontWeight:900,color:"#22c55e",fontSize:24}}>{matches.iHave.length}</div>
                          <div style={{fontSize:10,color:"#6b7280"}}>{t.ofTheirMissing}</div>
                        </div>
                        <div style={{background:"#1e0f00",borderRadius:10,padding:"12px",textAlign:"center"}}>
                          <div style={{fontSize:11,color:"#fb923c",marginBottom:2}}>{t.theyHaveForMe}</div>
                          <div style={{fontWeight:900,color:"#f97316",fontSize:24}}>{matches.theyHave.length}</div>
                          <div style={{fontSize:10,color:"#6b7280"}}>{t.ofMyMissing}</div>
                        </div>
                      </div>

                      {totalMatches>0&&(
                        <button onClick={()=>setSelected(selected===email?null:email)} style={{width:"100%",padding:"10px",background:"linear-gradient(135deg,#ffd700,#f59e0b)",border:"none",borderRadius:10,color:"#0a0f1e",fontWeight:800,fontSize:13,cursor:"pointer",marginBottom:8}}>
                          🎯 {selected===email?t.hide:t.view} {t.fullMatchList}
                        </button>
                      )}

                      {selected===email&&(
                        <div style={{background:"#0a0f1e",borderRadius:12,padding:14}}>
                          {matches.theyHave.length>0&&(
                            <div style={{marginBottom:14}}>
                              <div style={{fontSize:13,color:"#f97316",fontWeight:800,marginBottom:8}}>🔁 {album?.username||email.split("@")[0]} {t.hasWhatYouNeed}</div>
                              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                                {matches.theyHave.map((s,j)=>(
                                  <span key={j} style={{fontSize:12,padding:"4px 10px",borderRadius:12,background:"#1e0f00",color:"#f97316",border:"1px solid #f97316",fontWeight:700}}>{s.code} #{s.num}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {matches.iHave.length>0&&(
                            <div style={{marginBottom:14}}>
                              <div style={{fontSize:13,color:"#22c55e",fontWeight:800,marginBottom:8}}>✅ {t.youHaveWhatTheyNeed}</div>
                              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                                {matches.iHave.map((s,j)=>(
                                  <span key={j} style={{fontSize:12,padding:"4px 10px",borderRadius:12,background:"#052e16",color:"#22c55e",border:"1px solid #22c55e",fontWeight:700}}>{s.code} #{s.num}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          <button onClick={()=>{
                            const name=album?.username||email.split("@")[0];
                            const text=`Hola ${name}! 👋\n\nVi en FiguSwap que podemos intercambiar:\n✅ Yo tengo ${matches.iHave.length} que tú necesitas:\n${matches.iHave.slice(0,5).map(s=>`${s.code} #${s.num}`).join(", ")}${matches.iHave.length>5?`... y ${matches.iHave.length-5} más`:""}\n\n🔁 Tú tienes ${matches.theyHave.length} que yo necesito:\n${matches.theyHave.slice(0,5).map(s=>`${s.code} #${s.num}`).join(", ")}${matches.theyHave.length>5?`... y ${matches.theyHave.length-5} más`:""}\n\n¿Coordinamos? ⚽🎴`;
                            // Si el contacto compartió su WhatsApp en su Perfil, abrimos su chat directo;
                            // si no, igual funciona con el selector genérico de contactos como antes.
                            const phoneDigits=(album?.whatsapp_number||"").replace(/[^\d]/g,"");
                            const waUrl=phoneDigits?`https://wa.me/${phoneDigits}?text=${encodeURIComponent(text)}`:`https://wa.me/?text=${encodeURIComponent(text)}`;
                            window.open(waUrl,"_blank");
                          }} style={{width:"100%",padding:"12px",background:"#14532d",border:"1px solid #22c55e",borderRadius:10,color:"#86efac",fontWeight:700,fontSize:14,cursor:"pointer"}}>
                            {t.coordinateTradeWhatsapp}{album?.whatsapp_number?` (${t.direct})`:""}
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {!album&&<div style={{fontSize:12,color:"#6b7280",textAlign:"center",padding:"8px 0"}}>{email.split("@")[0]} {t.noAlbumYet}</div>}
                </div>
              );
            })}
          </>
        )}

        {!loading&&contacts.length===0&&pending.length===0&&(
          <div style={{textAlign:"center",padding:40,color:"#4a5568"}}>
            <div style={{fontSize:48,marginBottom:12}}>👥</div>
            <div style={{fontWeight:700,marginBottom:6,color:"#6b7280"}}>{t.noConnections}</div>
            <div style={{fontSize:13}}>{t.noConnectionsHelp}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
// Fix: ErrorBoundary para capturar crashes no previstos (token expirado, estado en transición,
// etc.) y mostrar un mensaje de recuperación en vez de dejar la pantalla completamente en blanco.
// React requiere que esto sea una clase, no se puede hacer con hooks.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("FiguSwap crash capturado:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{minHeight:"100vh",background:"#0a0f1e",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:16}}>⚠️</div>
          <div style={{fontWeight:800,fontSize:18,color:"#e8eaf6",marginBottom:8}}>Something went wrong</div>
          <div style={{fontSize:13,color:"#6b7280",marginBottom:24}}>The app ran into an unexpected error. Your data is safe in the cloud.</div>
          <button onClick={()=>window.location.reload()} style={{padding:"14px 28px",background:"linear-gradient(135deg,#ffd700,#f59e0b)",border:"none",borderRadius:12,color:"#0a0f1e",fontWeight:800,fontSize:15,cursor:"pointer"}}>
            🔄 Reload app
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function FiguSwapInner() {
  const [lang,setLang]=useState(getInitialLang);
  const t=translations[lang];
  const stateMap = useMemo(()=>getStateLabels(t),[t]);
  const changeLang=(nextLang) =>{setLang(nextLang);localStorage.setItem("figuswap_lang",nextLang);};
  // El árabe se lee de derecha a izquierda — esto ajusta automáticamente la dirección del
  // documento completo (no solo de un contenedor) cada vez que cambia el idioma.
  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);
  const [session,setSession]=useState(null);
  const [checkingSession,setCheckingSession]=useState(true);
  // Modo invitado: por defecto, cualquier visitante sin sesión entra directo a la app — sin
  // pedir nada al inicio. Solo cuando intenta algo que de verdad requiere identidad (Red,
  // guardar para siempre) se le muestra el login, mediante showAuthOverlay.
  const [isGuest,setIsGuest]=useState(false);
  // "Agregar a pantalla de inicio": Android/Chrome sí permite activar el instalador nativo
  // por código (capturando beforeinstallprompt); iOS/Safari NUNCA lo permite — Apple no expone
  // esa API — así que ahí solo podemos mostrar instrucciones paso a paso, no un botón mágico.
  const [installPrompt,setInstallPrompt]=useState(null);
  const [showIosInstallHelp,setShowIosInstallHelp]=useState(false);
  const isIos=useMemo(()=>/iPhone|iPad|iPod/.test(navigator.userAgent),[]);
  const isStandalone=useMemo(()=>window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true,[]);
  useEffect(()=>{
    const handler=(e)=>{e.preventDefault();setInstallPrompt(e);};
    window.addEventListener("beforeinstallprompt",handler);
    return ()=>window.removeEventListener("beforeinstallprompt",handler);
  },[]);
  const [showAuthOverlay,setShowAuthOverlay]=useState(false);
  const [guestScanCount,setGuestScanCount]=useState(()=>Number(localStorage.getItem("figuswap_guest_scans")||0));
  const GUEST_SCAN_LIMIT=10;
  const [page,setPage]=useState("album");
  const [albumTab,setAlbumTab]=useState("all");
  const [stickers,setStickers]=useState(buildEmpty);
  const [search,setSearch]=useState("");
  const [toast,setToast]=useState(null);
  const [showOnboarding,setShowOnboarding]=useState(false);
  const [showImporter,setShowImporter]=useState(false);
  const [showShare,setShowShare]=useState(false);
  const [showQR,setShowQR]=useState(false);
  const [whatsappNumber,setWhatsappNumber]=useState("");
  const [savingWhatsapp,setSavingWhatsapp]=useState(false);
  const [inviterWhatsapp,setInviterWhatsapp]=useState("");
  const [pendingCount,setPendingCount]=useState(0);
  const [saving,setSaving]=useState(false);
  const [loadedAlbum,setLoadedAlbum]=useState(false);
  const countdown=useCountdown();

  const showToastMsg=msg=>{setToast(msg);setTimeout(()=>setToast(null),2500);};
  const [showResetConfirm,setShowResetConfirm]=useState(false);
  const [resetBackup,setResetBackup]=useState(null); // {snapshot, label}
  const [importBackup,setImportBackup]=useState(null);
  const [showFullResetConfirm,setShowFullResetConfirm]=useState(false);

  // Reinicia TODAS las figuritas en estado tradeable (repetida/venta/cambio/subasta) a "have".
  // Guarda un respaldo completo antes de tocar nada, y manda directo al Scanner para que el
  // re-escaneo sea el siguiente paso natural — así no queda la ventana de "reinicié pero se me
  // olvidó volver a escanear", que dejaría el contador de disponibles en 0 sin razón real.
  const resetRepeatedStock=()=>{
    const backup=JSON.parse(JSON.stringify(stickers));
    const next={...stickers};
    Object.keys(next).forEach(code=>{
      next[code]={...next[code]};
      Object.keys(next[code]).forEach(num=>{
        const s=next[code][num];
        if(TRADEABLE_STATES.includes(s.state)){
          next[code][num]={state:"have",qty:1,price:0};
        }
      });
    });
    setResetBackup({snapshot:backup,label:t.resetRepeatedConfirm});
    setStickers(next);
    setShowResetConfirm(false);
    showToastMsg(t.resetRepeatedConfirm);
    setPage("scanner");
  };

  // Empezar de cero por completo — pensado para cuando algo salió mal y la persona prefiere
  // borrar todo en vez de tratar de corregirlo a mano. Mismo respaldo/deshacer que arriba,
  // solo que cubre TODO el álbum (vuelve todo a "me falta"), no solo las repetidas.
  const resetFullAlbum=()=>{
    const backup=JSON.parse(JSON.stringify(stickers));
    setResetBackup({snapshot:backup,label:t.startFromZero});
    setStickers(buildEmpty());
    setShowFullResetConfirm(false);
    showToastMsg(t.blankAlbumDone);
  };

  const undoReset=()=>{
    if(!resetBackup)return;
    setStickers(resetBackup.snapshot);
    setResetBackup(null);
    showToastMsg(t.undoResetDone);
  };

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const inviter=params.get("invite");
    if(inviter)localStorage.setItem("figuswap_pending_invite",normalizeEmail(inviter));
    // wa= viene del código QR de alguien que ya mostró su QR en persona — por eso es aceptable
    // ofrecer un botón directo de WhatsApp aquí mismo, antes incluso de registrarse.
    const waParam=params.get("wa");
    if(waParam)setInviterWhatsapp(waParam.replace(/[^\d]/g,""));

    const token=sbAuth.getTokenFromHash();
    if(token){
      sbAuth.getUserFromToken(token).then(email=>{
        if(email){
          const s={token,email:normalizeEmail(email)};
          sbAuth.storeSession(s);
          setSession(s);
        } else {
          setIsGuest(true);
        }
        setCheckingSession(false);
      });
      return;
    }
    const stored=sbAuth.getStoredSession();
    if(stored){
      // No confiar ciegamente en la sesión guardada — verificar que el token siga vivo en Supabase
      sbAuth.getUserFromToken(stored.token).then(email=>{
        if(email){
          // Fix: usar el email recién confirmado por Supabase, NUNCA el stored.email tal cual.
          // Si localStorage quedó con un email vacío/viejo/corrupto, esto lo corrige en cada carga
          // en vez de propagar el dato corrupto hacia adelante.
          const s={token:stored.token, email:normalizeEmail(email)};
          sbAuth.storeSession(s);
          setSession(s);
        } else {
          // Token expirado o rechazado — limpiar localStorage para no quedar "logueado" sin estarlo
          sbAuth.clearSession();
          setSession(null);
          setIsGuest(true);
        }
        setCheckingSession(false);
      });
    } else {
      // Sin sesión guardada y sin token en la URL: entra directo como invitado, sin pedir nada.
      setIsGuest(true);
      setCheckingSession(false);
    }
  },[]);


  useEffect(()=>{
    // Fix: nunca proceder con un email vacío o inválido — ni cargar ni dejar que se dispare auto-save después
    if(!session?.email || !db.isValidEmail(session.email))return;
    setLoadedAlbum(false);
    const pending=localStorage.getItem("figuswap_pending_invite");
    if(pending&&pending!==session.email){
      // El visitante (session.email) envía la solicitud al dueño del link (pending)
      db.sendRequest(session.token,session.email,pending).then(()=>{
        localStorage.removeItem("figuswap_pending_invite");
        showToastMsg(`${t.requestSentTo} ${pending.split("@")[0]}`);
      });
    }
    // Load from Supabase (cloud first)
    db.getAlbum(session.token,session.email).then(data=>{
      if(data?.whatsapp_number!==undefined) setWhatsappNumber(data.whatsapp_number||"");
      if(data?.stickers&&Object.keys(data.stickers).length>0){
        setStickers(data.stickers);
      } else {
        try{
          const local=localStorage.getItem(`figuswap_stickers_${session.email}`);
          if(local){
            const parsed=JSON.parse(local);
            setStickers(parsed);
            // Fix: el mismo riesgo de sobreescribir la nube con un álbum vacío aplica aquí.
            // Si el localStorage de este dispositivo está vacío/corrupto, no lo subimos a Supabase.
            if(!isEmptyAlbum(parsed)){
              db.saveAlbum(session.token,session.email,parsed,session.email.split("@")[0]);
            }
          } else {
            setShowOnboarding(true);
          }
        }catch{setShowOnboarding(true);}
      }
    }).finally(()=>setLoadedAlbum(true));
    db.getPendingRequests(session.token,session.email).then(r=>setPendingCount(r.length));
  },[session]);

  // Carga del álbum de invitado — vive solo en este dispositivo (localStorage), no en la nube.
  // Por eso el banner de invitado advierte que se puede perder si cambia de teléfono o borra datos.
  useEffect(()=>{
    if(!isGuest)return;
    setLoadedAlbum(false);
    try{
      const local=localStorage.getItem("figuswap_guest_stickers");
      if(local){
        setStickers(JSON.parse(local));
      } else {
        setShowOnboarding(true);
      }
    }catch{setShowOnboarding(true);}
    setLoadedAlbum(true);
  },[isGuest]);

  // Auto-guardado del álbum de invitado en localStorage (sin red, sin Supabase).
  useEffect(()=>{
    if(!isGuest || !loadedAlbum)return;
    const timer=setTimeout(()=>{
      if(!isEmptyAlbum(stickers)){
        localStorage.setItem("figuswap_guest_stickers",JSON.stringify(stickers));
      }
    },500);
    return ()=>clearTimeout(timer);
  },[stickers,isGuest,loadedAlbum]);

  // Auto-save to Supabase
  useEffect(()=>{
    // Fix 1: nunca guardar con email vacío/inválido. Fix 2: nunca guardar antes de que termine la carga inicial.
    if(!session?.email || !db.isValidEmail(session.email) || !loadedAlbum)return;
    const timer=setTimeout(async()=>{
      // Fix 3: nunca guardar un álbum completamente vacío — eso solo puede pasar por timing/carga
      // fallida, nunca debería sobreescribir un álbum real existente en la nube.
      if(isEmptyAlbum(stickers)){
        showToastMsg(t.saveBlockedEmptyAlbum);
        return;
      }
      setSaving(true);
      const ok=await db.saveAlbum(session.token,session.email,stickers,session.email.split("@")[0]);
      setSaving(false);
      if(!ok)showToastMsg(t.saveFailedConnection);
    },1500);
    return()=>clearTimeout(timer);
  },[stickers,session,loadedAlbum]);


  // Guarda solo el número de WhatsApp, sin tocar el resto del álbum — campo opcional, pensado
  // únicamente para que tus contactos de Red puedan coordinar contigo directo (no para marketing).
  const saveWhatsappNumber=async()=>{
    setSavingWhatsapp(true);
    const ok=await db.saveAlbum(session.token,session.email,stickers,session.email.split("@")[0],whatsappNumber.trim());
    setSavingWhatsapp(false);
    showToastMsg(ok?"✅ WhatsApp guardado":"⚠️ No se pudo guardar");
  };

  const handleAction=(code,num,state,qty,price,customToast)=>{
    if(!ALBUM[code]||!stateMap[state]){
      showToastMsg(t.unknownTeamOrState);
      return;
    }
    setStickers(prev=>{
      if(!prev[code]?.[num])return prev;
      return {
        ...prev,
        [code]:{
          ...prev[code],
          [num]:{
            state,
            qty:qty!==undefined?qty:prev[code][num].qty,
            price:price!==undefined?price:prev[code][num].price
          }
        }
      };
    });
    showToastMsg(customToast || `${stateMap[state].emoji} ${getTeamName(code,lang)} #${num} → ${stateMap[state].label}${state==="repeated"&&qty>1?` ×${qty}`:""}`);
  };

  // Fix: filter considers tab when checking if team has visible stickers
  const filtered=useMemo(()=>ALBUM_ORDER.filter(code=>{
    const ts=stickers[code];
    if(!ts)return false;
    const team=ALBUM[code];
    if(!team)return false;
    const q=search.toLowerCase();
    // Ahora también busca por nombre de jugador/escudo/foto de equipo (ej. "Messi"
    // encuentra Argentina), no solo por nombre de selección o código de 3 letras.
    const matchesPlayerName=q!==""&&Object.values(STICKER_NAMES[code]||{}).some(n=>n.toLowerCase().includes(q));
    const matchSearch=search===""||team.name.toLowerCase().includes(q)||getTeamName(code,lang).toLowerCase().includes(q)||code.toLowerCase().includes(q)||matchesPlayerName;
    if(!matchSearch)return false;
    if(albumTab==="missing")return Object.values(ts).some(s=>s.state==="missing");
    if(albumTab==="repeated")return Object.values(ts).some(s=>TRADEABLE_STATES.includes(s.state));
    return true;
  }).map(code=>[code,stickers[code]]),[stickers,search,albumTab]);

  const albumStats=useMemo(()=>{
    const counts={missing:0,have:0,repeated:0,sell:0,trade:0,auction:0};
    let repeatedUnits=0;
    let tradeableCount=0;
    Object.values(stickers).forEach(team=>{Object.values(team).forEach(s=>{
      counts[s.state]=(counts[s.state]||0)+1;
      if(TRADEABLE_STATES.includes(s.state)){repeatedUnits+=(s.qty||1);tradeableCount++;}
    });});
    const total=Object.values(ALBUM).reduce((s,t)=>s+t.total,0);
    const pct=Math.round((counts.have+counts.repeated+counts.sell+counts.trade+counts.auction)/total*100);
    return{...counts,repeatedUnits,tradeableCount,total,pct};
  },[stickers]);

  const userNeeded=useMemo(()=>{
    const r={};
    Object.entries(stickers).forEach(([code,nums])=>{
      const missing=Object.entries(nums).filter(([,s])=>s.state==="missing").map(([n])=>parseInt(n));
      if(missing.length>0)r[code]=missing;
    });
    return r;
  },[stickers]);

  if(checkingSession)return (
    <div style={{minHeight:"100vh",background:"#0a0f1e",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <img src="/icon-512.png" alt="FiguSwap" style={{width:48,height:48,borderRadius:10}}/>
    </div>
  );
  if(showAuthOverlay)return (
    <AuthPage t={t} inviterWhatsapp={inviterWhatsapp} onClose={isGuest?()=>setShowAuthOverlay(false):undefined} onAuth={s=>{
      // Migración: si venía como invitado y ya armó algo de álbum en este dispositivo, lo
      // copiamos a la llave local específica de su cuenta nueva — el efecto de carga normal
      // (más abajo) ya sabe leer esa llave como respaldo si la nube todavía está vacía, así
      // que no pierde lo que escaneó/importó antes de crear cuenta.
      const guestData=localStorage.getItem("figuswap_guest_stickers");
      if(guestData){
        try{
          if(!isEmptyAlbum(JSON.parse(guestData))){
            localStorage.setItem(`figuswap_stickers_${s.email}`,guestData);
          }
        }catch{}
        localStorage.removeItem("figuswap_guest_stickers");
      }
      setIsGuest(false);
      setShowAuthOverlay(false);
      setSession(s);
      sbAuth.storeSession(s);
    }}/>
  );

  // Fix condición de carrera (pérdida de datos al importar): antes de este fix, getAlbum() corría
  // en paralelo a la primera interacción del usuario. Si alguien importaba una lista o tocaba una
  // figurita ANTES de que getAlbum() resolviera, la respuesta tardía de la nube podía sobreescribir
  // silenciosamente lo recién hecho. Bloqueamos toda la UI (incluyendo abrir Importador/Scanner)
  // hasta que loadedAlbum sea true. La carga real toma ~200-500ms, así que esto es casi imperceptible.
  if(!loadedAlbum)return (
    <div style={{minHeight:"100vh",background:"#0a0f1e",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10}}>
      <img src="/icon-512.png" alt="FiguSwap" style={{width:48,height:48,borderRadius:10}}/>
      <div style={{fontSize:13,color:"#6b7280"}}>{t.loadingAlbum}</div>
    </div>
  );

  const NAV=[["album","📋",t.album],["scanner","📸",t.scan],["worldcup","📅",t.worldcup],["contacts","👥",t.network],["profile","👤",t.profile]];

  return (
    <div style={{minHeight:"100vh",background:"#0a0f1e",color:"#e8eaf6",fontFamily:"'Segoe UI',system-ui,sans-serif",paddingBottom:72}}>
      <div style={{background:"linear-gradient(135deg,#0a0f1e,#111827)",borderBottom:"1px solid #1e2a3a",padding:"12px 16px",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:720,margin:"0 auto",display:"flex",alignItems:"center",gap:10}}>
          <img src="/icon-512.png" alt="FiguSwap" style={{width:28,height:28,borderRadius:6}}/>
          <span style={{fontWeight:900,fontSize:18,background:"linear-gradient(90deg,#ffd700,#f59e0b)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>FiguSwap</span>
          {saving&&<span style={{fontSize:10,color:"#4a5568",marginLeft:2}}>💾</span>}
          <select value={lang} onChange={e=>changeLang(e.target.value)} style={{marginLeft:8,border:"1px solid #1e2a3a",borderRadius:8,background:"#111827",color:"#e8eaf6",fontWeight:800,fontSize:11,padding:"6px 8px"}}>
            <option value="es">ES</option>
            <option value="en">EN</option>
            <option value="pt">PT</option>
            <option value="fr">FR</option>
            <option value="it">IT</option>
            <option value="de">DE</option>
            <option value="ar">AR</option>
          </select>
          <div style={{marginLeft:"auto",display:"flex",gap:12}}>
            {[["d",t.countdownDays],["h","h"],["m","m"]].map(([k,l])=>(
              <div key={k} style={{textAlign:"center"}}>
                <div style={{fontSize:14,fontWeight:900,color:"#ffd700",fontVariantNumeric:"tabular-nums"}}>{String(countdown[k]||0).padStart(2,"0")}</div>
                <div style={{fontSize:8,color:"#4a5568"}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isGuest&&(
        <div style={{maxWidth:720,margin:"0 auto",padding:"10px 16px 0"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,background:"#1a1500",border:"1px solid #92400e",borderRadius:10,padding:"10px 12px"}}>
            <span style={{fontSize:12,color:"#fbbf24",flex:1}}>{t.guestBannerText}</span>
            <button onClick={()=>setShowAuthOverlay(true)} style={{padding:"6px 12px",background:"#ffd700",border:"none",borderRadius:8,color:"#0a0f1e",fontWeight:800,fontSize:12,cursor:"pointer",whiteSpace:"nowrap"}}>{t.guestBannerCta}</button>
          </div>
        </div>
      )}

      <div style={{maxWidth:720,margin:"0 auto",padding:16}}>
        {page==="album"&&(
          <>
            <div style={{background:"#0d1117",border:"1px solid #1e2a3a",borderRadius:14,padding:14,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontWeight:800,color:"#e8eaf6",fontSize:14}}>{t.myAlbum}</span>
                <span style={{fontWeight:900,color:"#ffd700",fontSize:16}}>{albumStats.pct}%</span>
              </div>
              <div style={{height:6,background:"#1e2a3a",borderRadius:3,overflow:"hidden",marginBottom:10}}>
                <div style={{height:"100%",width:`${albumStats.pct}%`,background:"linear-gradient(90deg,#ffd700,#f59e0b)",borderRadius:3}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#6b7280",marginBottom:12}}>
                <span>❌ {albumStats.missing} {t.missingCount}</span>
                <span>✅ {albumStats.have} {t.haveCount}</span>
                <span>🔁 {albumStats.tradeableCount} {t.availableCount} ({albumStats.repeatedUnits} {t.units})</span>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>isGuest?setShowAuthOverlay(true):setShowShare(true)} style={{flex:1,padding:"8px",background:"#14532d",border:"1px solid #22c55e",borderRadius:8,color:"#86efac",fontWeight:700,fontSize:12,cursor:"pointer"}}>{t.share}</button>
                <button onClick={()=>setShowImporter(true)} style={{flex:1,padding:"8px",background:"#1e2a3a",border:"1px solid #374151",borderRadius:8,color:"#9ca3af",fontWeight:700,fontSize:12,cursor:"pointer"}}>{t.import}</button>
              </div>
            </div>

            <div style={{display:"flex",background:"#111827",borderRadius:12,padding:4,marginBottom:12,border:"1px solid #1e2a3a"}}>
              {[["all",t.all],["missing",t.missing],["repeated",t.repeated]].map(([v,l])=>(
                <button key={v} onClick={()=>{setAlbumTab(v);setSearch("");}} style={{flex:1,padding:"10px 4px",borderRadius:9,border:"none",background:albumTab===v?"#ffd700":"transparent",color:albumTab===v?"#0a0f1e":"#6b7280",fontWeight:albumTab===v?800:600,fontSize:13,cursor:"pointer"}}>
                  {l}
                  {v==="missing"&&albumStats.missing>0&&<span style={{fontSize:9,marginLeft:3,background:"#ef4444",color:"#fff",borderRadius:10,padding:"1px 4px"}}>{albumStats.missing}</span>}
                  {v==="repeated"&&albumStats.tradeableCount>0&&<span style={{fontSize:9,marginLeft:3,background:"#f97316",color:"#fff",borderRadius:10,padding:"1px 4px"}}>{albumStats.tradeableCount}</span>}
                </button>
              ))}
            </div>

            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={albumTab==="missing"?`🔍 ${t.searchMissing}`:albumTab==="repeated"?`🔍 ${t.searchRepeated}`:`🔍 ${t.searchTeam}`} style={{width:"100%",boxSizing:"border-box",padding:"10px 14px",borderRadius:10,border:"1px solid #1e2a3a",background:"#111827",color:"#e8eaf6",fontSize:14,outline:"none",marginBottom:12}}/>

            {filtered.length===0&&(
              <div style={{textAlign:"center",padding:40,color:"#4a5568"}}>
                <div style={{fontSize:40,marginBottom:12}}>{albumTab==="missing"?"🎉":albumTab==="repeated"?"🔁":"🔍"}</div>
                <div style={{fontWeight:700,color:"#6b7280"}}>
                  {search?t.noSearchFound(search, albumTab==="missing"?t.scopeMissing:albumTab==="repeated"?t.scopeRepeated:t.scopeAlbum):albumTab==="missing"?t.noMissing:albumTab==="repeated"?t.noRepeated:t.noResults}
                </div>
              </div>
            )}

            {filtered.map(([code,ts])=>(<TeamSection key={code} code={code} stickers={ts} tab={albumTab} onAction={handleAction} t={t} stateMap={stateMap} lang={lang}/>))}
          </>
        )}

        {page==="scanner"&&(isGuest&&guestScanCount>=GUEST_SCAN_LIMIT?(
          <div style={{padding:"60px 24px",textAlign:"center"}}>
            <div style={{fontSize:44,marginBottom:12}}>📸</div>
            <div style={{fontWeight:800,fontSize:17,color:"#e8eaf6",marginBottom:8}}>{t.scannerTitle}</div>
            <div style={{fontSize:13,color:"#6b7280",marginBottom:20,maxWidth:320,marginLeft:"auto",marginRight:"auto"}}>{t.guestScanLimitReached}</div>
            <button onClick={()=>setShowAuthOverlay(true)} style={{padding:"12px 24px",background:"linear-gradient(90deg,#ffd700,#f59e0b)",border:"none",borderRadius:10,color:"#0a0f1e",fontWeight:800,cursor:"pointer"}}>{t.createAccount}</button>
          </div>
        ):(
          <Scanner lang={lang} t={t} userNeeded={userNeeded} myStickers={stickers} onUpdateAlbum={(code,num,state,qty,price,customToast)=>{
            // Cada figurita confirmada por el Escáner cuenta hacia el límite de invitado — no
            // cuenta fotos, cuenta resultados aplicados, que es lo que realmente cuesta (la
            // llamada a la IA ya se hizo antes de esto, pero este es el momento estable para contar).
            if(isGuest){
              const next=guestScanCount+1;
              setGuestScanCount(next);
              localStorage.setItem("figuswap_guest_scans",String(next));
            }
            handleAction(code,num,state,qty,price,customToast);
          }}/>
        ))}

        {page==="worldcup"&&<WorldCup lang={lang} t={t}/>}

        {page==="contacts"&&(isGuest?(
          <div style={{padding:"60px 24px",textAlign:"center"}}>
            <div style={{fontSize:44,marginBottom:12}}>👥</div>
            <div style={{fontWeight:800,fontSize:17,color:"#e8eaf6",marginBottom:8}}>{t.myContactNetwork}</div>
            <div style={{fontSize:13,color:"#6b7280",marginBottom:20,maxWidth:320,marginLeft:"auto",marginRight:"auto"}}>{t.guestNetworkLocked}</div>
            <button onClick={()=>setShowAuthOverlay(true)} style={{padding:"12px 24px",background:"linear-gradient(90deg,#ffd700,#f59e0b)",border:"none",borderRadius:10,color:"#0a0f1e",fontWeight:800,cursor:"pointer"}}>{t.createAccount}</button>
          </div>
        ):(
          <ContactsPage myEmail={session.email} myToken={session.token} myStickers={stickers} t={t} lang={lang} onClose={()=>{setPage("album");db.getPendingRequests(session.token,session.email).then(r=>setPendingCount(r.length));}}/>
        ))}

        {page==="profile"&&(
          <div>
            <div style={{background:"linear-gradient(135deg,#1a1040,#0a1a2e)",border:"1px solid #1e2a3a",borderRadius:16,padding:24,textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:48,marginBottom:8}}>👤</div>
              {isGuest?(
                <>
                  <div style={{fontWeight:900,fontSize:20,color:"#fff"}}>{t.continueAsGuest}</div>
                  <div style={{color:"#6b7280",fontSize:13,marginBottom:16}}>—</div>
                </>
              ):(
                <>
                  <div style={{fontWeight:900,fontSize:20,color:"#fff"}}>{session.email?.split("@")[0]}</div>
                  <div style={{color:"#6b7280",fontSize:13,marginBottom:16}}>{session.email}</div>
                </>
              )}
              <div style={{display:"flex",gap:12,justifyContent:"center"}}>
                <div style={{textAlign:"center"}}><div style={{fontWeight:900,fontSize:22,color:"#ffd700"}}>{albumStats.pct}%</div><div style={{fontSize:11,color:"#6b7280"}}>{t.albumLower}</div></div>
                <div style={{textAlign:"center"}}><div style={{fontWeight:900,fontSize:22,color:"#ef4444"}}>{albumStats.missing}</div><div style={{fontSize:11,color:"#6b7280"}}>{t.missingLower}</div></div>
                <div style={{textAlign:"center"}}><div style={{fontWeight:900,fontSize:22,color:"#22c55e"}}>{albumStats.have}</div><div style={{fontSize:11,color:"#6b7280"}}>{t.haveLower}</div></div>
                <div style={{textAlign:"center"}}><div style={{fontWeight:900,fontSize:22,color:"#f97316"}}>{albumStats.tradeableCount}</div><div style={{fontSize:11,color:"#6b7280"}}>{t.availableLower}</div></div>
              </div>
            </div>

            {/* Botón de instalar — no necesita cuenta ni identidad, visible para todos.
                Se oculta solo si ya está instalada (display-mode standalone) o si el
                navegador no soporta ninguno de los dos caminos (Android nativo / iOS manual). */}
            {!isStandalone&&(installPrompt||isIos)&&(
              <button onClick={async()=>{
                if(installPrompt){
                  installPrompt.prompt();
                  await installPrompt.userChoice;
                  setInstallPrompt(null);
                }
                else setShowIosInstallHelp(true);
              }} style={{width:"100%",padding:"13px",background:"#0a1a2e",border:"1px solid #3b82f6",borderRadius:12,color:"#60a5fa",fontWeight:700,cursor:"pointer",marginBottom:12}}>
                {t.installApp}
              </button>
            )}

            {/* Importar sí funciona como invitado — solo llena el álbum local, no necesita identidad. */}
            <div style={{display:"flex",gap:10,marginBottom:12}}>
              {!isGuest&&<button onClick={()=>setShowShare(true)} style={{flex:1,padding:"13px",background:"#14532d",border:"1px solid #22c55e",borderRadius:12,color:"#86efac",fontWeight:700,cursor:"pointer"}}>{t.shareListButton}</button>}
              <button onClick={()=>setShowImporter(true)} style={{flex:1,padding:"13px",background:"#1e2a3a",border:"1px solid #374151",borderRadius:12,color:"#9ca3af",fontWeight:700,cursor:"pointer"}}>{t.importListButton}</button>
            </div>

            {isGuest?(
              /* Compartir, QR, WhatsApp y Red necesitan una identidad estable (correo) para
                 funcionar de verdad — en vez de mostrarlos rotos, se agrupan en una sola
                 invitación clara a crear cuenta. */
              <div style={{background:"linear-gradient(135deg,#1a1040,#0a1a2e)",border:"1px solid #a78bfa",borderRadius:12,padding:20,textAlign:"center",marginBottom:12}}>
                <div style={{fontSize:13,color:"#c4b5fd",marginBottom:14}}>{t.guestNetworkLocked}</div>
                <button onClick={()=>setShowAuthOverlay(true)} style={{padding:"12px 24px",background:"linear-gradient(90deg,#ffd700,#f59e0b)",border:"none",borderRadius:10,color:"#0a0f1e",fontWeight:800,cursor:"pointer"}}>{t.createAccount}</button>
              </div>
            ):(
              <>
                <button onClick={()=>setShowQR(true)} style={{width:"100%",padding:"13px",background:"#1a1040",border:"1px solid #a78bfa",borderRadius:12,color:"#c4b5fd",fontWeight:700,cursor:"pointer",marginBottom:12}}>
                  {t.myQrCode}
                </button>

                <div style={{background:"#111827",border:"1px solid #1e2a3a",borderRadius:12,padding:16,marginBottom:12}}>
                  <div style={{fontWeight:700,fontSize:13,color:"#e8eaf6",marginBottom:4}}>{t.whatsappOptional}</div>
                  <div style={{fontSize:11,color:"#6b7280",marginBottom:10}}>
                    {t.whatsappHelp}
                  </div>
                  <div style={{display:"flex",gap:8,marginBottom:6}}>
                    <input
                      type="tel"
                      placeholder="+504 9999-9999"
                      value={whatsappNumber}
                      onChange={e=>setWhatsappNumber(e.target.value)}
                      style={{flex:1,padding:"10px 12px",background:"#0a0f1e",border:"1px solid #374151",borderRadius:8,color:"#e8eaf6",fontSize:14}}
                    />
                    <button onClick={saveWhatsappNumber} disabled={savingWhatsapp} style={{padding:"10px 16px",background:savingWhatsapp?"#1e2a3a":"#14532d",border:"1px solid #22c55e",borderRadius:8,color:"#86efac",fontWeight:700,cursor:savingWhatsapp?"not-allowed":"pointer"}}>
                      {savingWhatsapp?"...":t.save}
                    </button>
                  </div>
                  {whatsappNumber&&whatsappNumber.replace(/[^\d]/g,"").length>0&&whatsappNumber.replace(/[^\d]/g,"").length<8&&(
                    <div style={{fontSize:11,color:"#fb923c"}}>⚠️ {t.phoneTooShort.replace("⚠️ ","")}</div>
                  )}
                </div>
                <button onClick={()=>setPage("contacts")} style={{width:"100%",padding:"14px",background:"#0a1a2e",border:"1px solid #3b82f6",borderRadius:12,color:"#60a5fa",fontWeight:700,cursor:"pointer",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  {t.myContactNetwork}
                  {pendingCount>0&&<span style={{background:"#ef4444",color:"#fff",fontSize:11,fontWeight:800,borderRadius:20,padding:"2px 8px"}}>{pendingCount} {t.newBadge(pendingCount)}</span>}
                </button>
              </>
            )}

            {isGuest?(
              <button onClick={()=>setShowAuthOverlay(true)} style={{width:"100%",padding:"12px",background:"transparent",border:"1px solid #374151",borderRadius:10,color:"#9ca3af",fontWeight:700,cursor:"pointer",marginBottom:12}}>
                {t.login}
              </button>
            ):(
              <button onClick={async()=>{await sbAuth.signOut(session.token);sbAuth.clearSession();setSession(null);setIsGuest(true);setStickers(buildEmpty());}} style={{width:"100%",padding:"12px",background:"transparent",border:"1px solid #ef4444",borderRadius:10,color:"#ef4444",fontWeight:700,cursor:"pointer",marginBottom:12}}>
                {t.logout}
              </button>
            )}

            {!showResetConfirm ? (
              <button onClick={()=>setShowResetConfirm(true)} style={{width:"100%",padding:"12px",background:"transparent",border:"1px solid #374151",borderRadius:10,color:"#6b7280",fontWeight:700,cursor:"pointer",fontSize:13}}>
                {t.resetRepeatedConfirm.replace(t.yes + ", ", "🔄 ")}
              </button>
            ) : (
              <div style={{background:"#1e1500",border:"1px solid #f97316",borderRadius:12,padding:14}}>
                <div style={{color:"#fbbf24",fontWeight:700,fontSize:13,marginBottom:8}}>
                  {t.resetRepeatedWarning} ({albumStats.tradeableCount})
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setShowResetConfirm(false)} style={{flex:1,padding:"10px",background:"transparent",border:"1px solid #374151",borderRadius:8,color:"#9ca3af",fontWeight:700,fontSize:13,cursor:"pointer"}}>{t.cancel}</button>
                  <button onClick={resetRepeatedStock} style={{flex:1,padding:"10px",background:"#ef4444",border:"none",borderRadius:8,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>{t.resetRepeatedConfirm}</button>
                </div>
              </div>
            )}

            {!showFullResetConfirm ? (
              <button onClick={()=>setShowFullResetConfirm(true)} style={{width:"100%",padding:"12px",background:"transparent",border:"1px solid #374151",borderRadius:10,color:"#6b7280",fontWeight:700,cursor:"pointer",fontSize:13,marginTop:8}}>
                {t.startFromZero}
              </button>
            ) : (
              <div style={{background:"#1e0a0a",border:"1px solid #ef4444",borderRadius:12,padding:14,marginTop:8}}>
                <div style={{color:"#fca5a5",fontWeight:700,fontSize:13,marginBottom:8}}>
                  {t.fullResetWarning}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setShowFullResetConfirm(false)} style={{flex:1,padding:"10px",background:"transparent",border:"1px solid #374151",borderRadius:8,color:"#9ca3af",fontWeight:700,fontSize:13,cursor:"pointer"}}>{t.cancel}</button>
                  <button onClick={resetFullAlbum} style={{flex:1,padding:"10px",background:"#ef4444",border:"none",borderRadius:8,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>{t.fullResetConfirm}</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Deshacer importación — cercano y sin asustar, justo para el caso de "pegué la lista
          equivocada". Se queda visible hasta que la cierres, sin importar a qué pantalla vayas. */}
      {importBackup&&(
        <div style={{position:"fixed",bottom:62,left:0,right:0,background:"#0a1a2e",borderTop:"1px solid #3b82f6",padding:"10px 16px",display:"flex",alignItems:"center",gap:10,zIndex:101}}>
          <span style={{fontSize:12,color:"#93c5fd",flex:1}}>{t.wrongListQuestion}</span>
          <button onClick={()=>{
            setStickers(importBackup);
            setImportBackup(null);
            showToastMsg(t.undoImportDone);
          }} style={{padding:"6px 12px",background:"#3b82f6",border:"none",borderRadius:8,color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",whiteSpace:"nowrap"}}>{t.undo}</button>
          <button onClick={()=>setImportBackup(null)} style={{background:"none",border:"none",color:"#6b7280",fontSize:16,cursor:"pointer",padding:"0 4px"}}>✕</button>
        </div>
      )}

      {resetBackup&&(
        <div style={{position:"fixed",bottom:62+(importBackup?50:0),left:0,right:0,background:"#1e1500",borderTop:"1px solid #f97316",padding:"10px 16px",display:"flex",alignItems:"center",gap:10,zIndex:101}}>
          <span style={{fontSize:12,color:"#fbbf24",flex:1}}>{resetBackup?.label}</span>
          <button onClick={undoReset} style={{padding:"6px 12px",background:"#f97316",border:"none",borderRadius:8,color:"#1e0a00",fontWeight:700,fontSize:12,cursor:"pointer",whiteSpace:"nowrap"}}>{t.undo}</button>
          <button onClick={()=>setResetBackup(null)} style={{background:"none",border:"none",color:"#6b7280",fontSize:16,cursor:"pointer",padding:"0 4px"}}>✕</button>
        </div>
      )}

      {/* Puente directo a WhatsApp cuando escaneas el QR de alguien que acabas de conocer.
          No depende de Red ni de que acepten una solicitud — funciona aunque ya estés logueado,
          que es justo el caso que el banner de AuthPage no cubre (ese solo aplica a quien todavía
          no tiene cuenta). Aparece una sola vez por escaneo y se puede cerrar. */}
      {inviterWhatsapp&&(
        <div style={{position:"fixed",bottom:62+(importBackup?50:0)+(resetBackup?50:0),left:0,right:0,background:"#052e16",borderTop:"1px solid #22c55e",padding:"10px 16px",display:"flex",alignItems:"center",gap:10,zIndex:101}}>
          <span style={{fontSize:12,color:"#86efac",flex:1}}>{t.connectedByQr}</span>
          <button onClick={()=>{
            window.open(`https://wa.me/${inviterWhatsapp}?text=${encodeURIComponent(t.qrWhatsappMessage)}`,"_blank");
          }} style={{padding:"6px 12px",background:"#22c55e",border:"none",borderRadius:8,color:"#052e16",fontWeight:700,fontSize:12,cursor:"pointer",whiteSpace:"nowrap"}}>{t.writeNow}</button>
          <button onClick={()=>setInviterWhatsapp("")} style={{background:"none",border:"none",color:"#6b7280",fontSize:16,cursor:"pointer",padding:"0 4px"}}>✕</button>
        </div>
      )}

      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#0a0f1e",borderTop:"1px solid #1e2a3a",display:"flex",zIndex:100}}>
        {NAV.map(([p,ic,l])=>(
          <button key={p} onClick={()=>setPage(p)} style={{flex:1,padding:"10px 0",background:"none",border:"none",color:page===p?"#ffd700":"#4a5568",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,position:"relative"}}>
            <span style={{fontSize:20}}>{ic}</span>
            <span style={{fontSize:9,fontWeight:700,textTransform:"uppercase"}}>{l}</span>
            {p==="contacts"&&pendingCount>0&&<span style={{position:"absolute",top:4,right:"18%",background:"#ef4444",color:"#fff",fontSize:9,fontWeight:800,borderRadius:10,padding:"1px 5px"}}>{pendingCount}</span>}
          </button>
        ))}
      </div>

      {showOnboarding&&<Onboarding lang={lang} t={t} onChoice={choice=>{setShowOnboarding(false);if(choice==="import")setShowImporter(true);else if(choice==="scan")setPage("scanner");}}/>}
      {showImporter&&<Importer lang={lang} t={t} currentAlbum={stickers} onImport={s=>{
        // Respaldo justo antes de importar — si era la lista de la persona equivocada,
        // un toque y queda todo como estaba, sin importar si tu álbum estaba vacío o lleno.
        setImportBackup(stickers);
        setStickers(s);
        showToastMsg(t.importSuccess);
      }} onClose={()=>setShowImporter(false)}/>}
      {showShare&&<ShareModal t={t} stickers={stickers} username={session.email?.split("@")[0]} inviteEmail={session.email} onClose={()=>setShowShare(false)}/>}
      {showQR&&(()=>{
        // Reusa el mismo link de invitación que ya funciona en Red — el QR es solo otra forma
        // de compartir ese mismo link, ideal para cuando estás en persona con alguien.
        // Si guardaste tu WhatsApp en Perfil, se agrega como parámetro extra: como el QR solo
        // lo comparte quien lo muestra (ya hubo contacto presencial), es un contexto válido
        // para incluirlo, distinto a "recolectar" números de gente que no dio ese paso.
        const phoneDigits=whatsappNumber.replace(/[^\d]/g,"");
        let inviteLink=`${window.location.origin}?invite=${encodeURIComponent(session.email)}`;
        if(phoneDigits) inviteLink+=`&wa=${phoneDigits}`;
        const qrImgUrl=`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(inviteLink)}`;
        return (
          <div style={{position:"fixed",inset:0,background:"#000c",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
            <div style={{background:"#111827",border:"1px solid #1e2a3a",borderRadius:20,padding:24,maxWidth:360,width:"100%",textAlign:"center"}}>
              <div style={{fontWeight:900,fontSize:18,color:"#c4b5fd",marginBottom:4}}>{t.myQrCode}</div>
              <div style={{fontSize:12,color:"#6b7280",marginBottom:16}}>
                {t.qrDescription}
                {phoneDigits?` ${t.qrWhatsappWith}`:` ${t.qrWhatsappWithout}`}
              </div>
              <div style={{background:"#fff",borderRadius:12,padding:12,display:"inline-block",marginBottom:16}}>
                <img src={qrImgUrl} alt="FiguSwap QR" width={220} height={220}/>
              </div>
              <button onClick={()=>setShowQR(false)} style={{width:"100%",padding:"12px",background:"#1e2a3a",border:"1px solid #374151",borderRadius:10,color:"#e8eaf6",fontWeight:700,cursor:"pointer"}}>
                {t.close}
              </button>
            </div>
          </div>
        );
      })()}
      {showIosInstallHelp&&(
        <div style={{position:"fixed",inset:0,background:"#000c",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"#111827",border:"1px solid #1e2a3a",borderRadius:20,padding:24,maxWidth:360,width:"100%",textAlign:"center"}}>
            <div style={{fontWeight:900,fontSize:18,color:"#60a5fa",marginBottom:12}}>{t.installApp}</div>
            <div style={{textAlign:"left",fontSize:14,color:"#e8eaf6",lineHeight:1.7,marginBottom:16}}>
              <div style={{marginBottom:8}}>1️⃣ {t.iosInstallStep1}</div>
              <div style={{marginBottom:8}}>2️⃣ {t.iosInstallStep2}</div>
              <div>3️⃣ {t.iosInstallStep3}</div>
            </div>
            <button onClick={()=>setShowIosInstallHelp(false)} style={{width:"100%",padding:"12px",background:"#1e2a3a",border:"1px solid #374151",borderRadius:10,color:"#e8eaf6",fontWeight:700,cursor:"pointer"}}>
              {t.close}
            </button>
          </div>
        </div>
      )}
      {toast&&<div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",background:"#111827",border:"1px solid #1e2a3a",color:"#e8eaf6",padding:"10px 20px",borderRadius:24,fontWeight:700,fontSize:13,zIndex:9999,whiteSpace:"nowrap",boxShadow:"0 4px 20px #0008"}}>{toast}</div>}
    </div>
  );
}

// Fix: el export default ahora envuelve toda la app en ErrorBoundary. Cualquier crash de React
// (token expirado, estado en transición, lo que sea) muestra un mensaje de recuperación con
// botón de recargar, en vez de dejar la pantalla completamente en blanco sin pista de qué pasó.
export default function FiguSwap() {
  return (
    <ErrorBoundary>
      <FiguSwapInner />
    </ErrorBoundary>
  );
}
import { translations, getInitialLang, getTeamName } from "./i18n";

const SUPABASE_URL = "https://fythsgiofvodukjzutat.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dGhzZ2lvZnZvZHVranp1dGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NTIyMDgsImV4cCI6MjA5NzEyODIwOH0.HaG8yQgc2BzEGnlaNXFWaLZ0c_Oa6CvhwcVjHj99-AY";

const getStateLabels = (t) => ({
  missing:  { color:"#ef4444", bg:"#1e0a0a", label:t.missingState || t.missing,  emoji:"❌" },
  have:     { color:"#22c55e", bg:"#0a1e0a", label:t.have,  emoji:"✅" },
  repeated: { color:"#f97316", bg:"#1e0f00", label:t.repeatedState || t.repeated,  emoji:"🔁" },
  sell:     { color:"#fbbf24", bg:"#1e1500", label:t.sell,  emoji:"💰" },
  trade:    { color:"#60a5fa", bg:"#0a0f1e", label:t.trade,    emoji:"🔄" },
  auction:  { color:"#a78bfa", bg:"#0f0a1e", label:t.auction,   emoji:"🔨" },
});
// Estados que representan una figurita disponible para intercambio/venta (no la posesión única "have")
const TRADEABLE_STATES = ["repeated","sell","trade","auction"];

// Orden oficial álbum Panini FIFA WC 2026
const ALBUM_ORDER = [
  // Especiales
  "FWC","CC",
  // Grupo A
  "MEX","RSA","KOR","CZE",
  // Grupo B
  "CAN","BIH","QAT","SUI",
  // Grupo C
  "BRA","MAR","HAI","SCO",
  // Grupo D
  "USA","PAR","AUS","TUR",
  // Grupo E
  "GER","CUW","CIV","ECU",
  // Grupo F
  "NED","JPN","SWE","TUN",
  // Grupo G
  "BEL","EGY","IRN","NZL",
  // Grupo H
  "ESP","CPV","KSA","URU",
  // Grupo I
  "FRA","SEN","IRQ","NOR",
  // Grupo J
  "ARG","ALG","AUT","JOR",
  // Grupo K
  "POR","COD","UZB","COL",
  // Grupo L
  "ENG","CRO","GHA","PAN",
];

// Solo guarda la letra (o "special" para FWC/CC) — el texto "Grupo"/"Especiales" se construye
// al mostrarlo, usando la traducción del idioma activo, no un string fijo en español.
const GROUPS = {
  FWC:"special", CC:"special",
  MEX:"A", RSA:"A", KOR:"A", CZE:"A",
  CAN:"B", BIH:"B", QAT:"B", SUI:"B",
  BRA:"C", MAR:"C", HAI:"C", SCO:"C",
  USA:"D", PAR:"D", AUS:"D", TUR:"D",
  GER:"E", CUW:"E", CIV:"E", ECU:"E",
  NED:"F", JPN:"F", SWE:"F", TUN:"F",
  BEL:"G", EGY:"G", IRN:"G", NZL:"G",
  ESP:"H", CPV:"H", KSA:"H", URU:"H",
  FRA:"I", SEN:"I", IRQ:"I", NOR:"I",
  ARG:"J", ALG:"J", AUT:"J", JOR:"J",
  POR:"K", COD:"K", UZB:"K", COL:"K",
  ENG:"L", CRO:"L", GHA:"L", PAN:"L",
};

// Nombres reales de cada figurita (jugador/escudo/foto de equipo/especial), compilados
// desde el checklist oficial del álbum físico. CC (Coca-Cola) no tiene nombres porque
// son genéricas sin jugador específico. FWC #20 no viene en la fuente original, queda sin nombre.
const STICKER_NAMES = {
  ALG:{1:"Escudo Argelia",2:"Alexis Guendouz",3:"Ramy Bensebaini",4:"Youcef Atal",5:"Rayan Aït-Nouri",6:"Mohamed Amine Tougai",7:"Aïssa Mandi",8:"Ismael Bennacer",9:"Houssem Aquar",10:"Hicham Boudaoui",11:"Ramiz Zerrouki",12:"Nabil Bentalab",13:"Equipo Argelia",14:"Farés Chaibi",15:"Riyad Mahrez",16:"Said Benrhama",17:"Anis Hadj Moussa",18:"Amine Gouiri",19:"Baghdad Bounedjah",20:"Mohammed Amoura"},
  ARG:{1:"Escudo Argentina",2:"Emiliano Martinez",3:"Nahuel Molina",4:"Cristian Romero",5:"Nicolas Otamendi",6:"Nicolas Tagliafico",7:"Leonardo Balerdi",8:"Enzo Fernandez",9:"Alexis Mac Allister",10:"Rodrigo De Paul",11:"Exequiel Palacios",12:"Leandro Paredes",13:"Equipo Argentina",14:"Nico Paz",15:"Franco Mastantuono",16:"Nico Gonzalez",17:"Lionel Messi",18:"Lautaro Martinez",19:"Julian Alvarez",20:"Giuliano Simeone"},
  AUS:{1:"Escudo Australia",2:"Mathew Ryan",3:"Joe Gauci",4:"Harry Souttar",5:"Alessandro Circati",6:"Jordan Bos",7:"Aziz Behich",8:"Cameron Burgess",9:"Lewis Miller",10:"Milos Degenek",11:"Jackson Irvine",12:"Riley McGree",13:"Equipo Australia",14:"Aiden O'Neill",15:"Connor Metcalfe",16:"Patrick Yazbek",17:"Craig Goodwin",18:"Kusini Vengi",19:"Nestory Irankunda",20:"Mohamed Touré"},
  AUT:{1:"Escudo Austria",2:"Alexander Schlager",3:"Patrick Pentz",4:"David Alaba",5:"Kevin Danso",6:"Philipp Lienhart",7:"Stefan Bosch",8:"Phillipp Mwene",9:"Alexander Prass",10:"Xavier Schlager",11:"Marcel Sabitzer",12:"Konrad Laimer",13:"Equipo Austria",14:"Florian Grillitsch",15:"Nicolas Seiwald",16:"Romano Schmid",17:"Patrick Wimmer",18:"Christoph Baumgartner",19:"Michael Gregoritsch",20:"Marko Arnautović"},
  BEL:{1:"Escudo Bélgica",2:"Thibaut Courtois",3:"Arthur Theate",4:"Timothy Castagne",5:"Zeno Debast",6:"Brandon Mechele",7:"Maxim De Cuyper",8:"Thomas Meunier",9:"Youri Tielemans",10:"Amadou Onana",11:"Nicolas Raskin",12:"Alexis Saelemaekers",13:"Equipo Bélgica",14:"Hans Vanaken",15:"Kevin De Bruyne",16:"Jérémy Doku",17:"Charles De Ketelaere",18:"Leandro Trossard",19:"Loïs Openda",20:"Romelu Lukaku"},
  BIH:{1:"Escudo Bosnia y Herzegovina",2:"Nikola Vasilj",3:"Amer Dedic",4:"Sead Kolasinac",5:"Tarik Muharemovic",6:"Nihad Mujakic",7:"Nikola Katic",8:"Amir Hadziahmetovic",9:"Benjamin Tahirovic",10:"Armin Gigovic",11:"Ivan Sunjic",12:"Ivan Basic",13:"Equipo Bosnia y Herzegovina",14:"Dzenis Burnic",15:"Esmir Bajraktarevic",16:"Amar Memic",17:"Ermedin Demirovic",18:"Edin Dzeko",19:"Samed Bazdar",20:"Haris Tabakovic"},
  BRA:{1:"Escudo Brasil",2:"Alisson",3:"Bento",4:"Marquinhos",5:"Éder Militão",6:"Gabriel Magalhães",7:"Danilo",8:"Wesley",9:"Lucas Paquetá",10:"Casemiro",11:"Bruno Guimarães",12:"Luiz Henrique",13:"Equipo Brasil",14:"Vinicius Júnior",15:"Rodrygo",16:"João Pedro",17:"Matheus Cunha",18:"Gabriel Martinelli",19:"Raphinha",20:"Estévão"},
  CAN:{1:"Escudo Canadá",2:"Dayne St.Clair",3:"Alphonso Davies",4:"Alistair Johnston",5:"Samuel Adekugbe",6:"Riche Larvea",7:"Derek Cornelius",8:"Moïse Bombito",9:"Kamal Miller",10:"Stephen Eustáquio",11:"Ismaël Koné",12:"Jonathan Osorio",13:"Equipo Canadá",14:"Jacob Shaffelburg",15:"Mathieu Choinière",16:"Niko Sigur",17:"Tajon Buchanan",18:"Liam Millar",19:"Cyle Larin",20:"Jonathan David"},
  CIV:{1:"Escudo Costa de Marfil",2:"Yahia Fofana",3:"Ghislain Konan",4:"Wilfried Singo",5:"Odilon Kossounou",6:"Evan Ndicka",7:"Willy Boly",8:"Emmanuel Agbadou",9:"Ousmane Diomande",10:"Franck Kessie",11:"Seko Fofana",12:"Ibrahim Sangare",13:"Equipo Costa de Marfil",14:"Jean-Philippe Gbamin",15:"Amad Diallo",16:"Sébastien Haller",17:"Simon Adringa",18:"Yan Diomande",19:"Evann Guessand",20:"Oumar Diakite"},
  COD:{1:"Escudo RD del Congo",2:"Lionel Mpasi",3:"Aaron Wan-Bissaka",4:"Axel Tuanzebe",5:"Arthur Masuaku",6:"Chancel Mbemba",7:"Joris Kayembe",8:"Charles Pickel",9:"Ngal'ayel Mukau",10:"Edo Kayembe",11:"Samuel Moutoussamy",12:"Noah Sadiki",13:"Equipo RD del Congo",14:"Théo Bongonda",15:"Meschak Elia",16:"Yoane Wissa",17:"Brian Cipenga",18:"Fiston Mayele",19:"Cédric Bakambu",20:"Nathanaël Mbuku"},
  COL:{1:"Escudo Colombia",2:"Camilo Vargas",3:"David Ospina",4:"Dávinson Sánchez",5:"Yerry Mina",6:"Daniel Munoz",7:"Johan Mojica",8:"Jhon Lucumí",9:"Santiago Arias",10:"Jefferson Lerma",11:"Kevin Castaño",12:"Richard Rios",13:"Equipo Colombia",14:"James Rodriguez",15:"Juan Fernando Quintero",16:"Jorge Carrascal",17:"Jhon Arias",18:"Jhon Cordova",19:"Luis Suarez",20:"Luis Diaz"},
  CPV:{1:"Escudo Cabo Verde",2:"Vozinha",3:"Logan Costa",4:"Pico",5:"Diney",6:"Steven Moreira",7:"Wagner Pina",8:"Joao Paulo",9:"Yannick Semedo",10:"Kevin Pina",11:"Patrick Andrade",12:"Jamiro Monteiro",13:"Equipo Cabo Verde",14:"Deroy Duarte",15:"Garry Rodrigues",16:"Jovane Cabral",17:"Ryan Mendes",18:"Dailon Livramento",19:"Willy Semedo",20:"Bebe"},
  CRO:{1:"Escudo Croacia",2:"Dominik Livaković",3:"Duje Caleta-Car",4:"Josko Gvardiol",5:"Josip Stanišić",6:"Luka Vušković",7:"Josip Sutalo",8:"Kristijan Jakic",9:"Luka Modrić",10:"Mateo Kovacic",11:"Martin Baturina",12:"Lovro Majer",13:"Equipo Croacia",14:"Mario Pasalic",15:"Petar Sucic",16:"Ivan Perišić",17:"Marco Pasalic",18:"Ante Budimir",19:"Andrej Kramarić",20:"Franjo Ivanovic"},
  CUW:{1:"Escudo Curazao",2:"Eloy Room",3:"Armando Obispo",4:"Sherel Floranus",5:"Jurien Gaari",6:"Joshua Brenet",7:"Roshon Van Eijma",8:"Shurandy Sambo",9:"Livano Comenencia",10:"Godfried Roemeratoe",11:"Juninho Bacuna",12:"Leandro Bacuna",13:"Equipo Curazao",14:"Tahith Chong",15:"Kenji Gorre",16:"Jearl Margaritha",17:"Jurgen Locadia",18:"Jeremy Antonisse",19:"Gervane Kastaneer",20:"Sontje Hansen"},
  CZE:{1:"Escudo Chequia",2:"Matej Kovar",3:"Jindrich Stanek",4:"Ladislav Krejci",5:"Vladimir Coufal",6:"Jaroslav Zeleny",7:"Tomas Holes",8:"David Zima",9:"Michal Sadilek",10:"Lukas Provod",11:"Lukas Cerv",12:"Tomas Soucek",13:"Equipo Chequia",14:"Pavel Sulc",15:"Matej Vydra",16:"Vasil Kusej",17:"Tomas Chory",18:"Vacilav Cerny",19:"Adam Hlozek",20:"Patrik Schick"},
  ECU:{1:"Escudo Ecuador",2:"Hernán Galíndez",3:"Gonzalo Valle",4:"Piero Hincapié",5:"Pervis Estupiñán",6:"Willian Pacho",7:"Ángelo Preciado",8:"Joel Ordóñez",9:"Moises Caicedo",10:"Alan Franco",11:"Kendry Paez",12:"Pedro Vite",13:"Equipo Ecuador",14:"John Veboah",15:"Leonardo Campana",16:"Gonzalo Plata",17:"Nilson Angulo",18:"Alan Minda",19:"Kevin Rodriguez",20:"Enner Valencia"},
  EGY:{1:"Escudo Egipto",2:"Mohamed El Shenawy",3:"Mohamed Hany",4:"Mohamed Hamdy",5:"Yasser Ibrahim",6:"Khaled Sobhi",7:"Ramy Rabia",8:"Hossam Abdelmaguid",9:"Ahmed Fatouh",10:"Marwan Attia",11:"Zizo",12:"Hamdy Fathy",13:"Equipo Egipto",14:"Mohamed Lasheen",15:"Emam Ashour",16:"Osama Faisal",17:"Mohamed Salah",18:"Mostafa Mohamed",19:"Trezeguet",20:"Omar Marsmoush"},
  ENG:{1:"Escudo Inglaterra",2:"Jordan Pickford",3:"John Stones",4:"Maric Guéhi",5:"Ezri Konsa",6:"Trent Alexander-Arnold",7:"Reece James",8:"Dan Burn",9:"Jordan Henderson",10:"Declan Rice",11:"Jude Bellingham",12:"Cole Palmer",13:"Equipo Inglaterra",14:"Morgan Rogers",15:"Anthony Gordon",16:"Phil Foden",17:"Bukayo Saka",18:"Harry Kane",19:"Marcus Rashford",20:"Ollie Watkins"},
  ESP:{1:"Escudo España",2:"Unai Simon",3:"Robin Le Normand",4:"Aymeric Laporte",5:"Dean Huijsen",6:"Pedro Porro",7:"Dani Carvajal",8:"Marc Cucurella",9:"Martín Zubimendi",10:"Rodri",11:"Pedri",12:"Fabian Ruiz",13:"Equipo España",14:"Mikel Merino",15:"Lamine Yamal",16:"Dani Olmo",17:"Nico Williams",18:"Ferran Torres",19:"Álvaro Morata",20:"Mikel Oyarzabal"},
  FRA:{1:"Escudo Francia",2:"Mike Maignan",3:"Theo Hernandez",4:"William Saliba",5:"Jules Kounde",6:"Ibrahima Konate",7:"Dayot Upamecano",8:"Lucas Digne",9:"Aurélien Tchouaméni",10:"Eduardo Camavinga",11:"Manu Kone",12:"Adrien Rabiot",13:"Equipo Francia",14:"Michael Olise",15:"Ousmane Dembele",16:"Bradley Barcola",17:"Désiré Doué",18:"Kingsley Coman",19:"Hugo Ekitike",20:"Kylian Mbappe"},
  FWC:{1:"Official Emblem 1/2",2:"Official Emblem 2/2",3:"Official Mascots",4:"Official Slogan",5:"Official Ball",6:"Host Country Emblem - Canadá",7:"Host Country Emblem - México",8:"Host Country Emblem - USA",9:"Foto de equipo - Italia 1934 (campeón)",10:"Foto de equipo - Uruguay 1950 (campeón)",11:"Foto de equipo - Alemania Occidental 1954 (campeón)",12:"Foto de equipo - Brasil 1962 (campeón)",13:"Foto de equipo - Alemania Occidental 1974 (campeón)",14:"Foto de equipo - Argentina 1986 (campeón)",15:"Foto de equipo - Brasil 1994 (campeón)",16:"Foto de equipo - Brasil 2002 (campeón)",17:"Foto de equipo - Italia 2006 (campeón)",18:"Foto de equipo - Alemania 2014 (campeón)",19:"Foto de equipo - Argentina 2022 (campeón)"},
  GER:{1:"Escudo Alemania",2:"Marc-André ter Stegen",3:"Jonathan Tah",4:"David Raum",5:"Nico Schlotterbeck",6:"Antonio Rüdiger",7:"Waldemar Anton",8:"Ridle Baku",9:"Maximilian Mittelstadt",10:"Joshua Kimmich",11:"Florian Wirtz",12:"Felix Nmecha",13:"Equipo Alemania",14:"Leon Goretzka",15:"Jamal Musiala",16:"Serge Gnabry",17:"Kai Havertz",18:"Leroy Sane",19:"Karim Adeyemi",20:"Nick Woltemade"},
  GHA:{1:"Escudo Ghana",2:"Lawrence Ati Zigi",3:"Tariq Lamptey",4:"Mohammed Salisu",5:"Alidu Seidu",6:"Alexander Djiku",7:"Gideon Mensah",8:"Caleb Yirenkyi",9:"Abdul Issahaku Fatawu",10:"Thomas Partey",11:"Salis Abdul Samed",12:"Kamaldeen Sulemana",13:"Equipo Ghana",14:"Mohammed Kudus",15:"Inaki Williams",16:"Jordan Ayew",17:"Andrew Ayew",18:"Joseph Paintsil",19:"Osman Bukari",20:"Antoine Semenyo"},
  HAI:{1:"Escudo Haití",2:"Johny Placide",3:"Carlens Arcus",4:"Martin Expérience",5:"Jean-Kevin Duverne",6:"Ricardo Adé",7:"Duke Lacroix",8:"Garven Metusala",9:"Hannes Delcroix",10:"Leverton Pierre",11:"Danley Jean Jacques",12:"Jean-Ricner Bellegarde",13:"Equipo Haití",14:"Christopher Attys",15:"Derrick Etienne Jr.",16:"Josue Casimir",17:"Ruben Providence",18:"Duckens Nazon",19:"Louicius Deedson",20:"Frantzdy Pierrot"},
  IRN:{1:"Escudo Irán",2:"Alirez Beiranvand",3:"Morteza Pouraliganji",4:"Ehsan Hajsafi",5:"Milad Mohammadi",6:"Shojae Khalilzadeh",7:"Ramin Rezaeian",8:"Hossein Kanaani",9:"Sadegh Moharrami",10:"Saleh Hardani",11:"Saeed Ezatolahi",12:"Saman Ghoddos",13:"Equipo Irán",14:"Omid Noorafkan",15:"Roozbeh Cheshmi",16:"Mohammad Mohebi",17:"Sardar Azmoun",18:"Mehdi Taremi",19:"Alireza Jahanbakhsh",20:"Ali Gholizadeh"},
  IRQ:{1:"Escudo Irak",2:"Jalal Hassan",3:"Rebin Sulaka",4:"Hussein Ali",5:"Akam Hashem",6:"Merchas Doski",7:"Zaid Tahseen",8:"Manaf Younis",9:"Zidane Iqbal",10:"Amir Al-Ammari",11:"Ibrahim Bavesh",12:"Ali Jasim",13:"Equipo Irak",14:"Youssef Amyn",15:"Aimar Sher",16:"Marko Farji",17:"Osama Rashid",18:"Ali Al-Hamadi",19:"Aymen Hussein",20:"Mohanad Ali"},
  JOR:{1:"Escudo Jordania",2:"Yazeed Abulaila",3:"Ihsan Haddad",4:"Mohammad Abu Hashish",5:"Yazan Al-Arab",6:"Abdallah Nasib",7:"Saleem Obaid",8:"Mohammad Abualnadi",9:"Ibrahim Saadeh",10:"Nizar Al-Rashdan",11:"Noor Al-Rawabdeh",12:"Mohannad Abu Taha",13:"Equipo Jordania",14:"Amer Jamous",15:"Mousa Al-Taamari",16:"Yazan Al-Naimat",17:"Mahmoud Al-Mardi",18:"Ali Olwan",19:"Mohammad Abu Zrayq",20:"Ibrahim Sabra"},
  JPN:{1:"Escudo Japón",2:"Zion Suzuki",3:"Henry Heroki Mochizuki",4:"Ayumu Seko",5:"Junnosuke Suzuki",6:"Shogo Taniguchi",7:"Tsuyoshi Watanabe",8:"Kaishu Sano",9:"Yuki Soma",10:"Ao Tanaka",11:"Daichi Kamada",12:"Takefusa Kubo",13:"Equipo Japón",14:"Ritsu Doan",15:"Keito Nakamura",16:"Takumi Minamino",17:"Shuto Machino",18:"Junya Ito",19:"Koki Ogawa",20:"Ayase Ueda"},
  KOR:{1:"Escudo Corea del Sur",2:"Hyeon-woo Jo",3:"Seung-Gyu Kim",4:"Min-jae Kim",5:"Yu-min Cho",6:"Young-woo Seol",7:"Han-beom Lee",8:"Tae-seok Lee",9:"Myung-jae Lee",10:"Jae-sung Lee",11:"In-beom Hwang",12:"Kang-in Lee",13:"Equipo Corea del Sur",14:"Seung-ho Paik",15:"Jens Castrop",16:"Dongg-yeong Lee",17:"Gue-sung Cho",18:"Heung-min Son",19:"Hee-chan Hwang",20:"Hyeon-Gyu Oh"},
  KSA:{1:"Escudo Arabia Saudí",2:"Nawaf Alaqidi",3:"Abdulrahman Al-Sanbi",4:"Saud Abdulhamid",5:"Nawaf Bouwashl",6:"Jihad Thakri",7:"Moteb Al-Harbi",8:"Hassan Altambakti",9:"Musab Aljuwayr",10:"Ziyad Aljohani",11:"Abdullah Alkhaibari",12:"Nasser Aldawsari",13:"Equipo Arabia Saudí",14:"Saleh Abu Alshamat",15:"Marwan Alsahafi",16:"Salem Aldawsari",17:"Abdulrahman Al-Aboud",18:"Feras Akbrikan",19:"Saleh Alshehri",20:"Abdullah Al-Hamdan"},
  MAR:{1:"Escudo Marruecos",2:"Yassine Bounou",3:"Munir El Kajoui",4:"Achraf Hakimi",5:"Noussair Mazraoui",6:"Nayef Aguerd",7:"Roman Saiss",8:"Jawad El Yamio",9:"Adam Masina",10:"Sofyan Amrabat",11:"Azzedine Ounahi",12:"Eliesse Ben Seghir",13:"Equipo Marruecos",14:"Bilal El Khannouss",15:"Ismael Saibari",16:"Youssef En-Nesyri",17:"Abde Ezzalzouli",18:"Soufiane Rahimi",19:"Brahim Diaz",20:"Ayoub El Kaabi"},
  MEX:{1:"Escudo México",2:"Luis Malagón",3:"Johan Vasquez",4:"Jorge Sánchez",5:"Cesar Montes",6:"Jesus Gallardo",7:"Israel Reyes",8:"Diego Lainez",9:"Carlos Rodriguez",10:"Edson Alvarez",11:"Orbelin Pineda",12:"Marcel Ruiz",13:"Equipo México",14:"Érick Sánchez",15:"Hirving Lozano",16:"Santiago Giménez",17:"Raúl Jiménez",18:"Alexis Vega",19:"Roberto Alvarado",20:"Cesar Huerta"},
  NED:{1:"Escudo Países Bajos",2:"Bart Verbruggen",3:"Virgil van Dijk",4:"Micky van de Ven",5:"Jurien Timber",6:"Denzel Dumfries",7:"Nathan Aké",8:"Jereme Frimpong",9:"Jan Paul van Hecke",10:"Tijjani Reijnders",11:"Ryan Gravenberch",12:"Teun Koopmeiners",13:"Equipo Países Bajos",14:"Frenkie de Jong",15:"Xavi Simons",16:"Justin Kluivert",17:"Memphis Depay",18:"Donyell Malen",19:"Wout Weghorst",20:"Cody Gakpo"},
  NOR:{1:"Escudo Noruega",2:"Orjan Nyland",3:"Julian Ryerson",4:"Leo Ostigård",5:"Kristoffer Vassbakk Ajer",6:"Marcus Holmgren Pedersen",7:"David Møller Wolfe",8:"Torbjørn Heggem",9:"Morten Thorsby",10:"Martin Ødegaard",11:"Sander Berge",12:"Andreas Schjelderup",13:"Equipo Noruega",14:"Patrick Berg",15:"Erling Haaland",16:"Alexander Sørloth",17:"Aron Dønnum",18:"Jorgen Strand Larsen",19:"Antonio Nusa",20:"Oscar Bobb"},
  NZL:{1:"Escudo Nueva Zelanda",2:"Max Crocombe Payne",3:"Alex Paulsen",4:"Michael Boxall",5:"Liberato Cacace",6:"Tim Payne",7:"Tyler Bindon",8:"Francis de Vries",9:"Finn Surman",10:"Joe Bell",11:"Sarpreet Singh",12:"Ryan Thomas",13:"Equipo Nueva Zelanda",14:"Matthew Garbett",15:"Marko Stamenić",16:"Ben Old",17:"Chris Wood",18:"Elijah Just",19:"Callum McCowatt",20:"Kosta Barbarouses"},
  PAN:{1:"Escudo Panamá",2:"Orlando Mosquera",3:"Luis Mejia",4:"Fidel Escobar",5:"Andres Andrade",6:"Michael Amir Murillo",7:"Eric Davis",8:"Jose Cordoba",9:"Cesar Blackman",10:"Cristian Martinez",11:"Aníbal Godoy",12:"Adalberto Carrasquilla",13:"Equipo Panamá",14:"Édgar Bárcenas",15:"Carlos Harvey",16:"Ismael Díaz",17:"Jose Fajardo",18:"Cecilio Waterman",19:"Jose Luiz Rodriguez",20:"Alberto Quintero"},
  PAR:{1:"Escudo Paraguay",2:"Roberto Fernandez",3:"Orlando Gill",4:"Gustavo Gomez",5:"Fabián Balbuena",6:"Juan José Cáceres",7:"Omar Alderete",8:"Junior Alonso",9:"Mathías Villasanti",10:"Diego Gomez",11:"Damián Bobadilla",12:"Andres Cubas",13:"Equipo Paraguay",14:"Matias Galarza Fonda",15:"Julio Enciso",16:"Alejandro Romero Gamarra",17:"Miguel Almirón",18:"Ramon Sosa",19:"Angel Romero",20:"Antonio Sanabria"},
  POR:{1:"Escudo Portugal",2:"Diogo Costa",3:"Jose Sa",4:"Ruben Dias",5:"João Cancelo",6:"Diogo Dalot",7:"Nuno Mendes",8:"Gonçalo Inácio",9:"Bernardo Silva",10:"Bruno Fernandes",11:"Ruben Neves",12:"Vitinha",13:"Equipo Portugal",14:"João Neves",15:"Cristiano Ronaldo",16:"Francisco Trincao",17:"João Felix",18:"Gonçalo Ramos",19:"Pedro Neto",20:"Rafael Leão"},
  QAT:{1:"Escudo Catar",2:"Meshaal Barsham",3:"Sultan Albrake",4:"Lucas Mendes",5:"Homam Ahmed",6:"Boualem Khoukhi",7:"Pedro Miguel",8:"Tarek Salman",9:"Mohamed Al-Mannai",10:"Karim Boudiaf",11:"Assim Madibo",12:"Ahmed Fatehi",13:"Equipo Catar",14:"Mohammed Waad",15:"Abdulaziz Hatem",16:"Hassan Al-Haydos",17:"Edmilson Junior",18:"Akram Hassan Afif",19:"Ahmed Al Ganehi",20:"Almoez Ali"},
  RSA:{1:"Escudo Sudáfrica",2:"Ronwen Williams",3:"Sipho Chaine",4:"Aubrey Modiba",5:"Samukele Kabini",6:"Mbekezeli Mbokazi",7:"Khulumani Ndamane",8:"Siyabonga Ngezana",9:"Khuliso Mudau",10:"Nkosinathi Sibisi",11:"Teboho Mokoena",12:"Thalente Mbatha",13:"Equipo Sudáfrica",14:"Bathasi Aubaas",15:"Yaya Sithole",16:"Sipho Mbule",17:"Lyle Foster",18:"Iqraam Rayners",19:"Mohau Nkota",20:"Oswin Appollis"},
  SCO:{1:"Escudo Escocia",2:"Angus Gunn",3:"Jack Hendry",4:"Kieran Tierney",5:"Aaron Hickey",6:"Andrew Robertson",7:"Scott McKenna",8:"John Souttar",9:"Anthony Ralston",10:"Grant Hanley",11:"Scott McTominay",12:"Billy Gilmour",13:"Equipo Escocia",14:"Lewis Ferguson",15:"Ryan Christie",16:"Kenny McLean",17:"John McGinn",18:"Lyndon Dykes",19:"Che Adams",20:"Ben Gannon-Doak"},
  SEN:{1:"Escudo Senegal",2:"Eduardo Mendy",3:"Yehvann Diouf",4:"Moussa Niakhaté",5:"Abdoulaye Seck",6:"Ismail Jakobs",7:"El Hadji Malick Diouf",8:"Kalidou Koulibaly",9:"Idrissa Gana Gueye",10:"Pape Matar Sarr",11:"Pape Gueye",12:"Habib Diarra",13:"Equipo Senegal",14:"Lamine Camara",15:"Sadio Mane",16:"Ismaïla Sarr",17:"Boulaye Dia",18:"Iliman Ndiaye",19:"Nicolas Jackson",20:"Krepin Diatta"},
  SUI:{1:"Escudo Suiza",2:"Gregor Kobel",3:"Yvon Mvogo",4:"Manuel Akanji",5:"Ricardo Rodriguez",6:"Nico Elvedi",7:"Aurèle Amenda",8:"Silvan Widmer",9:"Granit Xhaka",10:"Denis Zakaria",11:"Remo Freuler",12:"Fabian Rieder",13:"Equipo Suiza",14:"Ardon Jashari",15:"Johan Manzambi",16:"Michel Aebischer",17:"Breel Embolo",18:"Ruben Vargas",19:"Dan Ndoye",20:"Zeki Amdouni"},
  SWE:{1:"Escudo Suecia",2:"Victor Johansson",3:"Isak Hien",4:"Gabriel Gudmundsson",5:"Emil Holm",6:"Victor Nilsson Lindelöf",7:"Gustaf Lagerbielke",8:"Lucas Bergvall",9:"Hugo Larsson",10:"Jesper Karlström",11:"Yasin Ayari",12:"Mattias Svanberg",13:"Equipo Suecia",14:"Daniel Svensson",15:"Ken Sema",16:"Roony Bardghji",17:"Dejan Kulusevski",18:"Anthony Elanga",19:"Alexander Isak",20:"Viktor Gyökeres"},
  TUN:{1:"Escudo Túnez",2:"Bechir Ben Said",3:"Aymen Dahmen",4:"Van Valery",5:"Montassar Talbi",6:"Yassine Meriah",7:"Ali Abdi",8:"Dylan Bronn",9:"Ellyes Skhiri",10:"Aissa Laidouni",11:"Ferjani Sassi",12:"Mohamed Ali Ben Romdhane",13:"Equipo Túnez",14:"Hannibal Mejbri",15:"Elias Achouri",16:"Elias Saad",17:"Hazem Mastouri",18:"Ismael Gharbi",19:"Sayfallah Ltaief",20:"Naim Sliti"},
  TUR:{1:"Escudo Türkiye",2:"Ugurcan Cakir",3:"Mert Muldur",4:"Zeki Celik",5:"Abdulkerim Bardakci",6:"Caglar Soyunku",7:"Merih Demiral",8:"Ferdi Kadioglu",9:"Kaan Ayhan",10:"Ismail Yuksek",11:"Hakan Calhanoglu",12:"Orkun Kokcu",13:"Equipo Türkiye",14:"Arda Guler",15:"Irfan Can Kahvecu",16:"Yunus Akgun",17:"Can Uzun",18:"Baris Alper Yilmaz",19:"Kerem Akturkoglu",20:"Kenan Yildiz"},
  URU:{1:"Escudo Uruguay",2:"Sergio Rochet",3:"Santiago Mele",4:"Ronald Araujo",5:"José María Giménez",6:"Sebastian Caceres",7:"Mathias Olivera",8:"Guillermo Varela",9:"Nahitan Nandez",10:"Federico Valverde",11:"Giorgian De Arrascaeta",12:"Rodrigo Bentancur",13:"Equipo Uruguay",14:"Manuel Ugarte",15:"Nicolás de la Cruz",16:"Maxi Araujo",17:"Darwin Núñez",18:"Federico Viñas",19:"Rodrigo Aguirre",20:"Facundo Pellistri"},
  USA:{1:"Escudo Estados Unidos",2:"Matt Freese",3:"Chris Richards",4:"Tim Ream",5:"Mark McKenzie",6:"Alex Freeman",7:"Antonee Robinson",8:"Tyler Adams",9:"Tanner Tessmann",10:"Weston McKennie",11:"Christian Roldan",12:"Timothy Weah",13:"Equipo Estados Unidos",14:"Diego Luna",15:"Malim Tillman",16:"Christian Pulisic",17:"Brenden Aaronson",18:"Ricardo Pepi",19:"Haji Wright",20:"Folarin Balogun"},
  UZB:{1:"Escudo Uzbekistán",2:"Utkir Yusupov",3:"Farrukh Savfiev",4:"Sherzod Nasrullaev",5:"Umar Eshmurodov",6:"Husniddin Aliqulov",7:"Rustamjon Ashurmatov",8:"Khojiakbar Alijonov",9:"Abdukodir Khusanov",10:"Odiljon Hamrobekov",11:"Otabek Shukurov",12:"Jamshid Iskanderov",13:"Equipo Uzbekistán",14:"Azizbek Turgunboev",15:"Khojimat Erkinov",16:"Eldor Shomurodov",17:"Oston Urunov",18:"Jaloliddin Masharipov",19:"Igor Sergeev",20:"Abbosbek Fayzullaev"},
};

const ALBUM = {
  // Especiales
  FWC:{name:"FIFA World Cup",emoji:"🏆",total:20,page:1},
  CC:{name:"Coca-Cola",emoji:"🥤",total:14,page:6},
  // Grupo A (pág. 8)
  MEX:{name:"México",emoji:"🇲🇽",total:20,page:8},
  RSA:{name:"South Africa",emoji:"🇿🇦",total:20,page:10},
  KOR:{name:"Korea Republic",emoji:"🇰🇷",total:20,page:12},
  CZE:{name:"Czechia",emoji:"🇨🇿",total:20,page:14},
  // Grupo B (pág. 16)
  CAN:{name:"Canada",emoji:"🇨🇦",total:20,page:16},
  BIH:{name:"Bosnia-Herzegovina",emoji:"🇧🇦",total:20,page:18},
  QAT:{name:"Qatar",emoji:"🇶🇦",total:20,page:20},
  SUI:{name:"Switzerland",emoji:"🇨🇭",total:20,page:22},
  // Grupo C (pág. 24)
  BRA:{name:"Brazil",emoji:"🇧🇷",total:20,page:24},
  MAR:{name:"Morocco",emoji:"🇲🇦",total:20,page:26},
  HAI:{name:"Haiti",emoji:"🇭🇹",total:20,page:28},
  SCO:{name:"Scotland",emoji:"🇬🇧",total:20,page:30},
  // Grupo D (pág. 32)
  USA:{name:"USA",emoji:"🇺🇸",total:20,page:32},
  PAR:{name:"Paraguay",emoji:"🇵🇾",total:20,page:34},
  AUS:{name:"Australia",emoji:"🇦🇺",total:20,page:36},
  TUR:{name:"Türkiye",emoji:"🇹🇷",total:20,page:38},
  // Grupo E (pág. 40)
  GER:{name:"Germany",emoji:"🇩🇪",total:20,page:40},
  CUW:{name:"Curaçao",emoji:"🇨🇼",total:20,page:42},
  CIV:{name:"Côte d'Ivoire",emoji:"🇨🇮",total:20,page:44},
  ECU:{name:"Ecuador",emoji:"🇪🇨",total:20,page:46},
  // Grupo F (pág. 48)
  NED:{name:"Netherlands",emoji:"🇳🇱",total:20,page:48},
  JPN:{name:"Japan",emoji:"🇯🇵",total:20,page:50},
  SWE:{name:"Sweden",emoji:"🇸🇪",total:20,page:52},
  TUN:{name:"Tunisia",emoji:"🇹🇳",total:20,page:54},
  // Grupo G (pág. 58)
  BEL:{name:"Belgium",emoji:"🇧🇪",total:20,page:58},
  EGY:{name:"Egypt",emoji:"🇪🇬",total:20,page:60},
  IRN:{name:"IR Iran",emoji:"🇮🇷",total:20,page:62},
  NZL:{name:"New Zealand",emoji:"🇳🇿",total:20,page:64},
  // Grupo H (pág. 66)
  ESP:{name:"Spain",emoji:"🇪🇸",total:20,page:66},
  CPV:{name:"Cabo Verde",emoji:"🇨🇻",total:20,page:68},
  KSA:{name:"Saudi Arabia",emoji:"🇸🇦",total:20,page:70},
  URU:{name:"Uruguay",emoji:"🇺🇾",total:20,page:72},
  // Grupo I (pág. 74)
  FRA:{name:"France",emoji:"🇫🇷",total:20,page:74},
  SEN:{name:"Senegal",emoji:"🇸🇳",total:20,page:76},
  IRQ:{name:"Iraq",emoji:"🇮🇶",total:20,page:78},
  NOR:{name:"Norway",emoji:"🇳🇴",total:20,page:80},
  // Grupo J (pág. 82)
  ARG:{name:"Argentina",emoji:"🇦🇷",total:20,page:82},
  ALG:{name:"Algeria",emoji:"🇩🇿",total:20,page:84},
  AUT:{name:"Austria",emoji:"🇦🇹",total:20,page:86},
  JOR:{name:"Jordan",emoji:"🇯🇴",total:20,page:88},
  // Grupo K (pág. 90)
  POR:{name:"Portugal",emoji:"🇵🇹",total:20,page:90},
  COD:{name:"Congo DR",emoji:"🇨🇩",total:20,page:92},
  UZB:{name:"Uzbekistan",emoji:"🇺🇿",total:20,page:94},
  COL:{name:"Colombia",emoji:"🇨🇴",total:20,page:96},
  // Grupo L (pág. 98)
  ENG:{name:"England",emoji:"🇬🇧",total:20,page:98},
  CRO:{name:"Croatia",emoji:"🇭🇷",total:20,page:100},
  GHA:{name:"Ghana",emoji:"🇬🇭",total:20,page:102},
  PAN:{name:"Panama",emoji:"🇵🇦",total:20,page:104},
};

const buildEmpty = () => {
  const r = {};
  Object.entries(ALBUM).forEach(([code,team]) => {
    r[code] = {};
    for(let i=1;i<=team.total;i++) r[code][i]={state:"missing",qty:1,price:0};
  });
  return r;
};

// Detecta si un álbum está completamente vacío (todo en "missing").
// Se usa para BLOQUEAR el auto-guardado en ese caso: nunca se debe sobreescribir
// un álbum real en la nube con uno vacío por timing/carga fallida.
const isEmptyAlbum = (stickers) => {
  let total = 0;
  let useful = 0;
  Object.values(stickers || {}).forEach(team => {
    Object.values(team || {}).forEach(s => {
      total++;
      if (s.state !== "missing") useful++;
    });
  });
  return total > 0 && useful === 0;
};

const WORLD_FINAL = new Date("2026-07-19T20:00:00Z");
function useCountdown() {
  const [t,setT]=useState({d:0,h:0,m:0,s:0});
  useEffect(()=>{
    const tick=()=>{const diff=WORLD_FINAL-Date.now();if(diff<=0)return;setT({d:Math.floor(diff/864e5),h:Math.floor((diff%864e5)/36e5),m:Math.floor((diff%36e5)/6e4),s:Math.floor((diff%6e4)/1e3)});};
    tick();const id=setInterval(tick,1000);return()=>clearInterval(id);
  },[]);
  return t;
}

// Normaliza emails en TODOS los puntos de entrada: evita que Test@Email.com y test@email.com se traten como usuarios distintos
function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

// ─── SUPABASE DB ──────────────────────────────────────────────────────────────
const db = {
  // Fix RLS: ya NO hay fallback silencioso a la anon key. Si no hay token de sesión real,
  // h() devuelve null y cada método debe abortar explícitamente en vez de mandar una petición
  // "autenticada" que en realidad viaja como anónima (lo cual rompería las políticas RLS por
  // auth.email(), o peor, fallaría en silencio dando la falsa impresión de que funcionó).
  h(token) {
    if(!token) return null;
    return {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  },

  async saveAlbum(token, email, stickers, username, whatsappNumber) {
    const headers=this.h(token);
    if(!headers) return false;
    try {
      // on_conflict=user_email explícito: la tabla tiene dos restricciones únicas (id, user_email).
      // Sin especificar la columna, PostgREST puede no resolver el merge-duplicates correctamente
      // contra user_email y devolver 409 en vez de hacer upsert. Esto fue la causa real del 409.
      const body={user_email:email, username:username||email.split("@")[0], stickers, updated_at:new Date().toISOString()};
      // whatsapp_number es opcional — solo se manda si se pasó explícitamente, para no pisar
      // con null lo que ya estaba guardado cuando este save viene de un flujo que no lo conoce.
      if(whatsappNumber!==undefined) body.whatsapp_number=whatsappNumber;
      const res = await fetch(`${SUPABASE_URL}/rest/v1/albums?on_conflict=user_email`, {
        method:"POST",
        headers:{...headers, Prefer:"resolution=merge-duplicates,return=minimal"},
        body:JSON.stringify(body)
      });
      return res.ok;
    } catch { return false; }
  },

  async getAlbum(token, email) {
    const headers=this.h(token);
    if(!headers) return null;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/albums?user_email=eq.${encodeURIComponent(email)}&select=*`, {headers});
      const data = await res.json();
      return data?.[0]||null;
    } catch { return null; }
  },

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  async getRelation(token, emailA, emailB) {
    const headers=this.h(token);
    if(!headers) return null;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/contacts?or=(and(user_email.eq.${encodeURIComponent(emailA)},contact_email.eq.${encodeURIComponent(emailB)}),and(user_email.eq.${encodeURIComponent(emailB)},contact_email.eq.${encodeURIComponent(emailA)}))&select=*`, {headers});
      const data = await res.json();
      return data?.[0]||null;
    } catch { return null; }
  },

  async sendRequest(token, fromEmail, toEmail) {
    if(!this.isValidEmail(fromEmail)||!this.isValidEmail(toEmail)) return false;
    if(fromEmail===toEmail) return false;
    const headers=this.h(token);
    if(!headers) return false;
    // No crear una nueva solicitud pendiente si ya existe cualquier relación en cualquier dirección
    const existing = await this.getRelation(token, fromEmail, toEmail);
    if(existing) return existing.status==="accepted";
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/contacts`, {
        method:"POST",
        headers:{...headers, Prefer:"resolution=ignore-duplicates,return=minimal"},
        body:JSON.stringify({user_email:fromEmail, contact_email:toEmail, status:"pending"})
      });
      return res.ok;
    } catch { return false; }
  },

  async acceptRequest(token, myEmail, requesterEmail) {
    const headers=this.h(token);
    if(!headers) return false;
    try {
      // Update their request to accepted
      await fetch(`${SUPABASE_URL}/rest/v1/contacts?user_email=eq.${encodeURIComponent(requesterEmail)}&contact_email=eq.${encodeURIComponent(myEmail)}`, {
        method:"PATCH", headers:{...headers, Prefer:"return=minimal"}, body:JSON.stringify({status:"accepted"})
      });
      // Create my side accepted
      await fetch(`${SUPABASE_URL}/rest/v1/contacts`, {
        method:"POST",
        headers:{...headers, Prefer:"resolution=merge-duplicates,return=minimal"},
        body:JSON.stringify({user_email:myEmail, contact_email:requesterEmail, status:"accepted"})
      });
      return true;
    } catch { return false; }
  },

  async rejectRequest(token, myEmail, requesterEmail) {
    const headers=this.h(token);
    if(!headers) return false;
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/contacts?user_email=eq.${encodeURIComponent(requesterEmail)}&contact_email=eq.${encodeURIComponent(myEmail)}`, {
        method:"PATCH", headers:{...headers, Prefer:"return=minimal"}, body:JSON.stringify({status:"rejected"})
      });
      return true;
    } catch { return false; }
  },

  async getPendingRequests(token, myEmail) {
    const headers=this.h(token);
    if(!headers) return [];
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/contacts?contact_email=eq.${encodeURIComponent(myEmail)}&status=eq.pending&select=user_email,created_at`, {headers});
      return await res.json()||[];
    } catch { return []; }
  },

  async getAcceptedContacts(token, myEmail) {
    const headers=this.h(token);
    if(!headers) return [];
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/contacts?user_email=eq.${encodeURIComponent(myEmail)}&status=eq.accepted&select=contact_email`, {headers});
      const data = await res.json();
      return data?.map(d=>d.contact_email)||[];
    } catch { return []; }
  },

  async getContactAlbums(token, contacts) {
    if(!contacts.length) return [];
    const headers=this.h(token);
    if(!headers) return [];
    try {
      const emails = contacts.map(e=>`"${e}"`).join(",");
      const res = await fetch(`${SUPABASE_URL}/rest/v1/albums?user_email=in.(${emails})&select=user_email,username,stickers,updated_at,whatsapp_number`, {headers});
      return await res.json()||[];
    } catch { return []; }
  },

  async getMyRequests(token, myEmail) {
    const headers=this.h(token);
    if(!headers) return [];
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/contacts?user_email=eq.${encodeURIComponent(myEmail)}&select=contact_email,status`, {headers});
      return await res.json()||[];
    } catch { return []; }
  }
};

// ─── AUTH ─────────────────────────────────────────────────────────────────────
const sbAuth = {
  async signInWithGoogle() {
    window.location.href=`${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(window.location.origin)}`;
  },
  async signInWithApple() {
    window.location.href=`${SUPABASE_URL}/auth/v1/authorize?provider=apple&redirect_to=${encodeURIComponent(window.location.origin)}`;
  },
  async signInWithFacebook() {
    window.location.href=`${SUPABASE_URL}/auth/v1/authorize?provider=facebook&redirect_to=${encodeURIComponent(window.location.origin)}`;
  },
  async signInWithEmail(email,password) {
    const res=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,{method:"POST",headers:{apikey:SUPABASE_KEY,"Content-Type":"application/json"},body:JSON.stringify({email,password})});
    return res.json();
  },
  async signUp(email,password) {
    const res=await fetch(`${SUPABASE_URL}/auth/v1/signup`,{method:"POST",headers:{apikey:SUPABASE_KEY,"Content-Type":"application/json"},body:JSON.stringify({email,password})});
    return res.json();
  },
  async signOut(token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`,{method:"POST",headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${token}`}});
  },
  getTokenFromHash() {
    const hash=window.location.hash;
    if(!hash||!hash.includes("access_token"))return null;
    const p=new URLSearchParams(hash.substring(1));
    const token=p.get("access_token");
    if(token){window.location.hash="";return token;}
    return null;
  },
  async getUserFromToken(token) {
    try{
      const res=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${token}`}});
      const data=await res.json();
      return data?.email||null;
    }catch{return null;}
  },
  getStoredSession() { try{const s=localStorage.getItem("figuswap_session");return s?JSON.parse(s):null;}catch{return null;} },
  storeSession(s) { try{localStorage.setItem("figuswap_session",JSON.stringify(s));}catch{} },
  clearSession() { try{localStorage.removeItem("figuswap_session");}catch{} }
};

// ─── AUTH PAGE ────────────────────────────────────────────────────────────────
function AuthPage({onAuth,onClose,inviterWhatsapp,t=translations.es}) {
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const inp={width:"100%",boxSizing:"border-box",padding:"12px 14px",borderRadius:10,border:"1px solid #1e2a3a",background:"#0a0f1e",color:"#e8eaf6",fontSize:14,outline:"none",marginBottom:10};
  const handleEmail=async()=>{
    setLoading(true);setError("");
    const normEmail=normalizeEmail(email);
    try{
      if(mode==="login"){
        const r=await sbAuth.signInWithEmail(normEmail,pass);
        if(r.access_token){const s={token:r.access_token,email:normalizeEmail(r.user?.email||normEmail)};sbAuth.storeSession(s);onAuth(s);}
        else setError(r.error_description||t.emailOrPasswordError);
      }else{
        const r=await sbAuth.signUp(normEmail,pass);
        if(r.id||r.user?.id){setMode("login");setError(t.accountCreated);}
        else setError(r.error_description||t.registerError);
      }
    }catch{setError(t.connectionError);}
    setLoading(false);
  };
  return (
    <div style={{minHeight:"100vh",background:"#0a0f1e",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,position:"relative"}}>
      {onClose&&(
        <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"none",border:"none",color:"#6b7280",fontSize:24,cursor:"pointer",padding:8}}>✕</button>
      )}
      <img src="/icon-512.png" alt="FiguSwap" style={{width:64,height:64,borderRadius:14,marginBottom:8}}/>
      <div style={{fontWeight:900,fontSize:28,background:"linear-gradient(90deg,#ffd700,#f59e0b)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4}}>FiguSwap</div>
      <div style={{color:"#6b7280",fontSize:13,marginBottom:inviterWhatsapp?16:28,textAlign:"center"}}>{t.appSubtitle}</div>
      {/* Si la persona entró desde el QR de alguien (escaneado en persona), le damos la opción
          de escribirle de inmediato por WhatsApp, sin esperar a terminar de registrarse. */}
      {inviterWhatsapp&&(
        <button
          onClick={()=>window.open(`https://wa.me/${inviterWhatsapp}?text=${encodeURIComponent(t.qrWhatsappMessage)}`,"_blank")}
          style={{width:"100%",maxWidth:380,padding:"12px",background:"#14532d",border:"1px solid #22c55e",borderRadius:10,color:"#86efac",fontWeight:700,fontSize:13,cursor:"pointer",marginBottom:20}}
        >
          {t.whatsappNow}
        </button>
      )}
      <div style={{background:"#111827",border:"1px solid #1e2a3a",borderRadius:16,padding:24,width:"100%",maxWidth:380}}>
        <button onClick={sbAuth.signInWithGoogle} style={{width:"100%",padding:"14px",background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,color:"#1f2937",fontWeight:700,fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:16}}>
          <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          {t.continueWithGoogle}
        </button>
        {/* Botón de Apple con la marca oficial (fondo negro, logo blanco) — Apple exige esta
            apariencia específica para "Sign in with Apple" si quieres pasar revisión. Borde
            sutil para que se distinga de la tarjeta oscura en vez de fundirse invisible. */}
        <button onClick={sbAuth.signInWithApple} style={{width:"100%",padding:"14px",background:"#000",border:"1px solid #2a2a2a",borderRadius:10,color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:16}}>
          <svg width="17" height="20" viewBox="0 0 17 20" fill="#fff"><path d="M14.94 10.6c-.03-2.16 1.76-3.2 1.84-3.25-1-1.46-2.56-1.66-3.11-1.68-1.42-.14-2.69.82-3.39.82-.71 0-1.8-.8-2.95-.78-1.51.02-2.91.88-3.68 2.23-1.57 2.72-.4 6.98 1.13 9.27.75 1.12 1.65 2.37 2.83 2.33 1.13-.04 1.56-.74 2.93-.74 1.37 0 1.75.74 2.95.72 1.22-.02 1.99-1.12 2.74-2.24.86-1.29 1.22-2.54 1.24-2.62-.03-.01-2.38-.91-2.41-3.62l-.06-.04zM12.32 3.6c.65-.79 1.09-1.88.97-2.97-.94.04-2.07.63-2.74 1.42-.6.7-1.13 1.82-.99 2.89 1.05.08 2.1-.53 2.76-1.34z"/></svg>
          {t.continueWithApple}
        </button>
        <button onClick={sbAuth.signInWithFacebook} style={{width:"100%",padding:"14px",background:"#1877F2",border:"none",borderRadius:10,color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:16}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.95h-1.5c-1.5 0-1.96.93-1.96 1.89v2.28h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z"/></svg>
          {t.continueWithFacebook}
        </button>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <div style={{flex:1,height:1,background:"#1e2a3a"}}/><span style={{fontSize:12,color:"#4a5568"}}>{t.withEmail}</span><div style={{flex:1,height:1,background:"#1e2a3a"}}/>
        </div>
        <div style={{display:"flex",gap:4,marginBottom:20,borderBottom:"1px solid #1e2a3a"}}>
          {["login","register"].map(m=>(
            <button key={m} onClick={()=>setMode(m)} style={{flex:1,padding:"10px",border:"none",borderBottom:mode===m?"2px solid #ffd700":"2px solid transparent",background:"transparent",color:mode===m?"#ffd700":"#6b7280",fontWeight:700,fontSize:13,cursor:"pointer",marginBottom:-1}}>
              {m==="login"?t.login:t.register}
            </button>
          ))}
        </div>
        <input style={inp} type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
        <input style={inp} type="password" placeholder={t.password} value={pass} onChange={e=>setPass(e.target.value)}/>
        {error&&<div style={{fontSize:12,marginBottom:10,padding:"8px 12px",background:error.startsWith("✅")?"#052e16":"#1e0a0a",borderRadius:8,color:error.startsWith("✅")?"#86efac":"#ef4444"}}>{error}</div>}
        <button onClick={handleEmail} disabled={loading} style={{width:"100%",padding:"14px",background:"linear-gradient(135deg,#ffd700,#f59e0b)",border:"none",borderRadius:10,color:"#0a0f1e",fontWeight:800,fontSize:15,cursor:"pointer",opacity:loading?0.7:1}}>
          {loading?"⏳ ...":(mode==="login"?`${t.login} →`:`${t.createAccount} →`)}
        </button>
      </div>
    </div>
  );
}

// ─── STICKER CELL — TAP TO CYCLE ─────────────────────────────────────────────
function StickerCell({code,num,data,onAction,t,stateMap,lang}) {
  const pressTimer = useRef(null);
  const longPressed = useRef(false);
  const [pressing,setPressing]=useState(false);
  const [open,setOpen]=useState(false);

  const handleTap = () => {
    if(longPressed.current) { longPressed.current = false; return; }
    // Cycle: missing → have → repeated(+1) → repeated(+1)...
    if(data.state === "missing") {
      onAction(code, num, "have", 1, 0);
    } else if(data.state === "have") {
      onAction(code, num, "repeated", 1, 0);
    } else if(data.state === "repeated") {
      onAction(code, num, "repeated", data.qty + 1, 0);
    } else {
      // sell/trade/auction — open modal instead
      setOpen(true);
    }
  };

  const handleLongPress = () => {
    // Long press = subtract 1
    if(data.state === "repeated") {
      const newQty = data.qty - 1;
      // Fix: si la repetida llega a 0, sigues teniendo la unidad base en tu álbum —
      // debe quedar en "have", no en "missing". Antes esto borraba de golpe la que
      // sí tienes, no solo la de sobra que acabas de dar/restar.
      if(newQty <= 0) onAction(code, num, "have", 1, 0);
      else onAction(code, num, "repeated", newQty, 0);
    } else if(data.state === "have") {
      onAction(code, num, "missing", 1, 0);
    }
  };

  const onPressStart = () => {
    longPressed.current = false;
    pressTimer.current = setTimeout(() => {
      longPressed.current = true;
      setPressing(true);
      handleLongPress();
      setTimeout(() => setPressing(false), 300);
    }, 500);
  };

  const onPressEnd = () => {
    if(pressTimer.current) clearTimeout(pressTimer.current);
  };

  const st=stateMap[data.state];

  return (
    <div>
      <button
        onClick={handleTap}
        onMouseDown={onPressStart}
        onMouseUp={onPressEnd}
        onTouchStart={onPressStart}
        onTouchEnd={onPressEnd}
        onContextMenu={e=>{e.preventDefault();setOpen(true);}}
        style={{width:"100%",aspectRatio:"1",borderRadius:10,border:`2px solid ${st.color}`,background:pressing?"#333":st.bg,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,position:"relative",transition:"background 0.1s"}}
      >
        <span style={{fontSize:16,lineHeight:1}}>{st.emoji}</span>
        <span style={{fontSize:12,fontWeight:900,color:st.color}}>{num}</span>
        {data.state==="repeated"&&<span style={{position:"absolute",top:2,right:3,fontSize:9,fontWeight:800,color:"#f97316",background:"#1e0f00",borderRadius:4,padding:"0 2px"}}>×{data.qty}</span>}
        {data.state==="sell"&&data.price>0&&<span style={{position:"absolute",bottom:2,fontSize:8,color:"#fbbf24",fontWeight:700}}>${data.price}</span>}
      </button>

      {/* Long press hint */}
      {(data.state==="repeated"||data.state==="have")&&(
        <div style={{fontSize:8,color:"#374151",textAlign:"center",marginTop:1}}>{t.holdToSubtract}</div>
      )}

      {/* Full modal for sell/trade/auction */}
      {open&&(
        <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center",background:"#000a"}} onClick={()=>setOpen(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#111827",borderRadius:"20px 20px 0 0",padding:24,width:"100%",maxWidth:480,border:"1px solid #1e2a3a",borderBottom:"none"}}>
            <div style={{textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:26}}>{ALBUM[code]?.emoji}</div>
              <div style={{fontWeight:900,fontSize:17,color:"#fff"}}>{getTeamName(code,lang)} <span style={{color:"#ffd700"}}>#{num}</span></div>
              {STICKER_NAMES[code]?.[num]&&(
                <div style={{fontSize:13,color:"#9ca3af",marginTop:2}}>{STICKER_NAMES[code][num]}</div>
              )}
              <div style={{fontSize:12,color:"#6b7280",marginTop:4}}>{t.tapToChangeState}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
              {Object.entries(stateMap).map(([key,val])=>(
                <button key={key} onClick={()=>{onAction(code,num,key);setOpen(false);}} style={{padding:"10px 6px",borderRadius:10,border:`1px solid ${data.state===key?val.color:"#1e2a3a"}`,background:data.state===key?val.bg:"#0a0f1e",color:data.state===key?val.color:"#6b7280",fontWeight:700,fontSize:11,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <span style={{fontSize:18}}>{val.emoji}</span><span>{val.label}</span>
                </button>
              ))}
            </div>
            {(data.state==="sell"||data.state==="auction")&&(
              <div style={{background:"#0a0f1e",borderRadius:10,padding:12,marginBottom:12}}>
                <div style={{fontSize:12,color:"#6b7280",marginBottom:8}}>{t.priceUsd}</div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{color:"#6b7280"}}>$</span>
                  <input type="number" defaultValue={data.price||1} min={0.5} step={0.5} onChange={e=>onAction(code,num,data.state,data.qty,parseFloat(e.target.value))} style={{flex:1,background:"#111827",border:"1px solid #1e2a3a",borderRadius:8,color:"#ffd700",fontSize:20,fontWeight:700,padding:"8px 12px",outline:"none"}}/>
                </div>
              </div>
            )}
            <button onClick={()=>setOpen(false)} style={{width:"100%",padding:12,background:"transparent",border:"1px solid #1e2a3a",borderRadius:10,color:"#6b7280",fontWeight:700,cursor:"pointer"}}>{t.close}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TEAM SECTION ─────────────────────────────────────────────────────────────
function TeamSection({code,stickers,tab,onAction,t,stateMap,lang}) {
  const [expanded,setExpanded]=useState(false);
  const team=ALBUM[code];
  const allNums=Object.keys(stickers).map(Number);
  const visibleNums=tab==="missing"?allNums.filter(n=>stickers[n].state==="missing"):tab==="repeated"?allNums.filter(n=>TRADEABLE_STATES.includes(stickers[n].state)):allNums;
  if(visibleNums.length===0)return null;
  const have=allNums.filter(n=>stickers[n].state!=="missing").length;
  const pct=Math.round(have/team.total*100);
  const complete=pct===100;
  return (
    <div style={{background:complete?"#052e16":"#0d1117",border:`1px solid ${complete?"#22c55e":"#1e2a3a"}`,borderRadius:16,overflow:"hidden",marginBottom:10}}>
      <button onClick={()=>setExpanded(!expanded)} style={{width:"100%",padding:"14px 16px",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:26}}>{team.emoji}</span>
        <div style={{flex:1,textAlign:"left"}}>
          <div style={{fontWeight:800,fontSize:15,color:complete?"#86efac":"#e8eaf6"}}>{getTeamName(code,lang)}</div>
          <div style={{fontSize:11,color:"#4a5568",marginTop:1}}>{GROUPS[code]==="special"?(t.specialsLabel||"Especiales"):GROUPS[code]?`${t.group||"Grupo"} ${GROUPS[code]}`:""}{team.page?` · ${t.pageAbbr} ${team.page}`:""}</div>
          <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>
            {tab==="missing"&&`❌ ${visibleNums.length} ${t.scopeMissing}`}
            {tab==="repeated"&&`🔁 ${visibleNums.length} ${t.scopeRepeated}`}
            {tab==="all"&&`${have}/${team.total} · ❌${allNums.filter(n=>stickers[n].state==="missing").length} 🔁${allNums.filter(n=>TRADEABLE_STATES.includes(stickers[n].state)).length}`}
            {complete&&` ✅ ${t.completed || "Completo"}`}
          </div>
        </div>
        <div style={{fontWeight:800,fontSize:15,color:complete?"#22c55e":pct>=75?"#84cc16":pct>=50?"#eab308":"#ef4444"}}>{pct}%</div>
        <span style={{color:"#4a5568",fontSize:12}}>{expanded?"▲":"▼"}</span>
      </button>
      <div style={{height:3,background:"#1e2a3a",margin:"0 16px"}}>
        <div style={{height:"100%",width:`${pct}%`,background:complete?"#22c55e":"#ffd700",borderRadius:2}}/>
      </div>
      {expanded&&(
        <div style={{padding:16}}>
          {(tab==="missing"||tab==="repeated")&&(
            <div style={{fontSize:11,color:"#4a5568",marginBottom:10}}>
              {tab==="missing"?t.tapToMarkOwned:t.tapToEditHoldSubtract}
            </div>
          )}
          {tab==="all"&&<div style={{fontSize:11,color:"#4a5568",marginBottom:10}}>{t.tapToCycleHoldSubtract}</div>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:14}}>
            {visibleNums.map(n=>(<StickerCell key={n} code={code} num={n} data={stickers[n]} onAction={onAction} t={t} stateMap={stateMap} lang={lang}/>))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CONTACTS PAGE ────────────────────────────────────────────────────────────
function ContactsPage({myEmail,myToken,myStickers,onClose,t,lang}) {
  const [pending,setPending]=useState([]);
  const [contacts,setContacts]=useState([]);
  const [contactAlbums,setContactAlbums]=useState([]);
  const [myRequests,setMyRequests]=useState([]);
  const [loading,setLoading]=useState(true);
  const [addEmail,setAddEmail]=useState("");
  const [adding,setAdding]=useState(false);
  const [selected,setSelected]=useState(null);
  const [copied,setCopied]=useState(false);
  const [actionMsg,setActionMsg]=useState("");

  const myLink=`${window.location.origin}?invite=${encodeURIComponent(myEmail)}`;

  const load=useCallback(async()=>{
    setLoading(true);
    const [pend,accepted,myReqs]=await Promise.all([
      db.getPendingRequests(myToken,myEmail),
      db.getAcceptedContacts(myToken,myEmail),
      db.getMyRequests(myToken,myEmail),
    ]);
    setPending(pend);
    setContacts(accepted);
    setMyRequests(myReqs);
    if(accepted.length>0||pend.length>0){
      const allEmails=[...accepted,...pend.map(p=>p.user_email)];
      const albums=await db.getContactAlbums(myToken,allEmails);
      setContactAlbums(albums);
    }
    setLoading(false);
  },[myEmail,myToken]);

  useEffect(()=>{load();},[load]);

  const showMsg=(msg)=>{setActionMsg(msg);setTimeout(()=>setActionMsg(""),2500);};

  const copyLink=()=>{navigator.clipboard.writeText(myLink).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});};
  const shareWhatsApp=()=>{
    const text=`${t.appSubtitle}\n\n${myLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,"_blank");
  };

  const sendRequest=async()=>{
    const email=normalizeEmail(addEmail);
    if(!email)return;
    if(!db.isValidEmail(email)){showMsg(t.invalidEmail);return;}
    if(email===myEmail){showMsg(t.cannotAddYourself);return;}
    setAdding(true);
    const ok=await db.sendRequest(myToken,myEmail,email);
    if(ok)showMsg(`${t.requestSentTo} ${email.split("@")[0]}`);
    else showMsg(t.alreadyConnected);
    setAddEmail("");
    await load();
    setAdding(false);
  };

  const acceptReq=async(requesterEmail)=>{
    await db.acceptRequest(myToken,myEmail,requesterEmail);
    showMsg(`${t.connectedWith} ${requesterEmail.split("@")[0]}!`);
    await load();
  };

  const rejectReq=async(requesterEmail)=>{
    await db.rejectRequest(myToken,myEmail,requesterEmail);
    showMsg(t.requestRejected);
    await load();
  };

  const getMatches=(friendStickers)=>{
    if(!friendStickers||!myStickers)return{iHave:[],theyHave:[]};
    const iHave=[],theyHave=[];
    Object.entries(myStickers).forEach(([code,nums])=>{
      Object.entries(nums||{}).forEach(([num,s])=>{
        const n=parseInt(num);
        if(TRADEABLE_STATES.includes(s.state)&&friendStickers[code]?.[n]?.state==="missing") iHave.push({code,num:n,myState:s.state});
        if(s.state==="missing"&&TRADEABLE_STATES.includes(friendStickers[code]?.[n]?.state)) theyHave.push({code,num:n,theirState:friendStickers[code][n].state});
      });
    });
    // Fix: Object.entries recorría myStickers en orden alfabético por código (ALG, ARG, AUT...),
    // no en el orden real de páginas del álbum. Esto re-ordena ambas listas según ALBUM_ORDER
    // (FWC/CC primero, luego grupo A-L en orden), y dentro de cada selección por número ascendente.
    const byAlbumOrder=(a,b)=>(ALBUM_ORDER.indexOf(a.code)-ALBUM_ORDER.indexOf(b.code))||(a.num-b.num);
    iHave.sort(byAlbumOrder);
    theyHave.sort(byAlbumOrder);
    return{iHave,theyHave};
  };

  const getRepeatedCount=(st)=>{
    if(!st)return 0;
    return Object.values(st).reduce((s,team)=>s+Object.values(team||{}).filter(x=>TRADEABLE_STATES.includes(x.state)).length,0);
  };

  return (
    <div>
      <div style={{background:"#111827",border:"1px solid #1e2a3a",borderRadius:12,marginBottom:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:10}}>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#6b7280",fontSize:20,cursor:"pointer"}}>←</button>
        <span style={{fontWeight:900,fontSize:16,color:"#ffd700"}}>{t.myNetworkTitle}</span>
        {pending.length>0&&<span style={{background:"#ef4444",color:"#fff",fontSize:11,fontWeight:800,borderRadius:20,padding:"2px 8px"}}>{pending.length} {pending.length>1?t.newPlural:t.newSingular}</span>}
        <span style={{marginLeft:"auto",fontSize:12,color:"#6b7280"}}>{contacts.length} {t.friendsCount}</span>
      </div>

      {actionMsg&&<div style={{background:"#052e16",border:"1px solid #22c55e",borderRadius:10,padding:"10px 16px",fontSize:13,color:"#86efac",fontWeight:700,marginBottom:16}}>{actionMsg}</div>}

      <div>

        {/* SOLICITUDES PENDIENTES */}
        {pending.length>0&&(
          <div style={{marginBottom:20}}>
            <div style={{fontWeight:800,color:"#ffd700",fontSize:15,marginBottom:12}}>{t.pendingRequests} ({pending.length})</div>
            {pending.map((req,i)=>{
              const requesterAlbum=contactAlbums.find(a=>a.user_email===req.user_email);
              const matches=requesterAlbum?getMatches(requesterAlbum.stickers):{iHave:[],theyHave:[]};
              const repeatedCount=getRepeatedCount(requesterAlbum?.stickers);
              return (
                <div key={i} style={{background:"#111827",border:"2px solid #ffd700",borderRadius:14,padding:16,marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                    <div style={{width:48,height:48,borderRadius:"50%",background:"linear-gradient(135deg,#ffd700,#f59e0b)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#0a0f1e",fontSize:22,flexShrink:0}}>
                      {req.user_email[0].toUpperCase()}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:900,color:"#ffd700",fontSize:16}}>{req.user_email.split("@")[0]}</div>
                      <div style={{fontSize:12,color:"#6b7280"}}>{req.user_email}</div>
                      <div style={{fontSize:12,color:"#f97316",marginTop:3}}>
                        🔁 {repeatedCount} {t.availableForTrade}
                        {matches.theyHave.length>0&&<span style={{color:"#22c55e"}}> · {matches.theyHave.length} {t.neededByYou} ⭐</span>}
                      </div>
                    </div>
                  </div>

                  {matches.theyHave.length>0&&(
                    <div style={{background:"#0a1a0a",border:"1px solid #22c55e",borderRadius:10,padding:"10px 12px",marginBottom:12}}>
                      <div style={{fontSize:12,color:"#4ade80",fontWeight:700,marginBottom:6}}>{t.hasTheseYouNeed}</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                        {matches.theyHave.slice(0,10).map((s,j)=>(
                          <span key={j} style={{fontSize:11,padding:"3px 8px",borderRadius:12,background:"#052e16",color:"#22c55e",border:"1px solid #22c55e"}}>{s.code} #{s.num}</span>
                        ))}
                        {matches.theyHave.length>10&&<span style={{fontSize:11,color:"#6b7280"}}>+{matches.theyHave.length-10} {t.more}</span>}
                      </div>
                    </div>
                  )}

                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <button onClick={()=>rejectReq(req.user_email)} style={{padding:"13px",background:"transparent",border:"1px solid #ef4444",borderRadius:10,color:"#ef4444",fontWeight:700,fontSize:14,cursor:"pointer"}}>
                      {t.reject}
                    </button>
                    <button onClick={()=>acceptReq(req.user_email)} style={{padding:"13px",background:"linear-gradient(135deg,#22c55e,#16a34a)",border:"none",borderRadius:10,color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer"}}>
                      {t.accept}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MI LINK */}
        <div style={{background:"#111827",border:"1px solid #1e3a5f",borderRadius:14,padding:16,marginBottom:16}}>
          <div style={{fontWeight:800,color:"#60a5fa",marginBottom:4}}>{t.inviteFriends}</div>
          <div style={{fontSize:12,color:"#6b7280",marginBottom:10}}>{t.inviteHelp}</div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={copyLink} style={{flex:1,padding:"11px",background:copied?"#22c55e":"#1e2a3a",border:"1px solid",borderColor:copied?"#22c55e":"#374151",borderRadius:8,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>
              {copied?t.copied:t.copyLink}
            </button>
            <button onClick={shareWhatsApp} style={{flex:1,padding:"11px",background:"#14532d",border:"1px solid #22c55e",borderRadius:8,color:"#86efac",fontWeight:700,fontSize:13,cursor:"pointer"}}>
              💬 WhatsApp
            </button>
          </div>
        </div>

        {/* AGREGAR POR EMAIL */}
        <div style={{background:"#111827",border:"1px solid #1e2a3a",borderRadius:14,padding:16,marginBottom:16}}>
          <div style={{fontWeight:700,color:"#e8eaf6",marginBottom:8}}>{t.sendEmailRequest}</div>
          <div style={{display:"flex",gap:8}}>
            <input value={addEmail} onChange={e=>setAddEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendRequest()} placeholder="email@ejemplo.com" inputMode="email" style={{flex:1,padding:"10px 14px",borderRadius:8,border:"1px solid #1e2a3a",background:"#0a0f1e",color:"#e8eaf6",fontSize:13,outline:"none"}}/>
            <button onClick={sendRequest} disabled={adding||!addEmail.trim()} style={{padding:"10px 18px",background:"linear-gradient(135deg,#ffd700,#f59e0b)",border:"none",borderRadius:8,color:"#0a0f1e",fontWeight:800,cursor:"pointer",fontSize:16,opacity:(adding||!addEmail.trim())?0.5:1}}>
              {adding?"⏳":"→"}
            </button>
          </div>
          {myRequests.filter(r=>r.status==="pending").length>0&&(
            <div style={{marginTop:10,fontSize:12,color:"#6b7280"}}>
              {t.sentTo} {myRequests.filter(r=>r.status==="pending").map(r=>r.contact_email.split("@")[0]).join(", ")}
            </div>
          )}
        </div>

        {/* AMIGOS */}
        {loading&&<div style={{textAlign:"center",padding:32,color:"#6b7280"}}>{t.networkLoading}</div>}

        {!loading&&contacts.length>0&&(
          <>
            <div style={{fontWeight:800,color:"#e8eaf6",fontSize:15,marginBottom:12}}>{t.myFriends} ({contacts.length})</div>
            {contacts.map((email,i)=>{
              const album=contactAlbums.find(a=>a.user_email===email);
              const matches=album?getMatches(album.stickers):{iHave:[],theyHave:[]};
              const totalMatches=matches.iHave.length+matches.theyHave.length;
              const repeatedCount=getRepeatedCount(album?.stickers);
              return (
                <div key={i} style={{background:"#111827",border:`1px solid ${totalMatches>0?"#22c55e":"#1e2a3a"}`,borderRadius:14,padding:16,marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <div style={{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,#22c55e,#16a34a)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#fff",fontSize:20,flexShrink:0}}>
                      {email[0].toUpperCase()}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:800,color:"#e8eaf6",fontSize:15}}>{album?.username||email.split("@")[0]}</div>
                      <div style={{fontSize:11,color:"#4a5568"}}>{email}</div>
                      {album&&<div style={{fontSize:11,color:"#6b7280",marginTop:2}}>🔁 {repeatedCount} {t.availableForTrade} · {t.updated} {new Date(album.updated_at).toLocaleTimeString(lang,{hour:"2-digit",minute:"2-digit"})}</div>}
                    </div>
                    {totalMatches>0&&<span style={{fontSize:12,color:"#ffd700",background:"#1e1500",padding:"4px 10px",borderRadius:20,fontWeight:800}}>🎯 {totalMatches}</span>}
                  </div>

                  {album&&(
                    <>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                        <div style={{background:"#052e16",borderRadius:10,padding:"12px",textAlign:"center"}}>
                          <div style={{fontSize:11,color:"#4ade80",marginBottom:2}}>{t.iHaveForThem}</div>
                          <div style={{fontWeight:900,color:"#22c55e",fontSize:24}}>{matches.iHave.length}</div>
                          <div style={{fontSize:10,color:"#6b7280"}}>{t.ofTheirMissing}</div>
                        </div>
                        <div style={{background:"#1e0f00",borderRadius:10,padding:"12px",textAlign:"center"}}>
                          <div style={{fontSize:11,color:"#fb923c",marginBottom:2}}>{t.theyHaveForMe}</div>
                          <div style={{fontWeight:900,color:"#f97316",fontSize:24}}>{matches.theyHave.length}</div>
                          <div style={{fontSize:10,color:"#6b7280"}}>{t.ofMyMissing}</div>
                        </div>
                      </div>

                      {totalMatches>0&&(
                        <button onClick={()=>setSelected(selected===email?null:email)} style={{width:"100%",padding:"10px",background:"linear-gradient(135deg,#ffd700,#f59e0b)",border:"none",borderRadius:10,color:"#0a0f1e",fontWeight:800,fontSize:13,cursor:"pointer",marginBottom:8}}>
                          🎯 {selected===email?t.hide:t.view} {t.fullMatchList}
                        </button>
                      )}

                      {selected===email&&(
                        <div style={{background:"#0a0f1e",borderRadius:12,padding:14}}>
                          {matches.theyHave.length>0&&(
                            <div style={{marginBottom:14}}>
                              <div style={{fontSize:13,color:"#f97316",fontWeight:800,marginBottom:8}}>🔁 {album?.username||email.split("@")[0]} {t.hasWhatYouNeed}</div>
                              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                                {matches.theyHave.map((s,j)=>(
                                  <span key={j} style={{fontSize:12,padding:"4px 10px",borderRadius:12,background:"#1e0f00",color:"#f97316",border:"1px solid #f97316",fontWeight:700}}>{s.code} #{s.num}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {matches.iHave.length>0&&(
                            <div style={{marginBottom:14}}>
                              <div style={{fontSize:13,color:"#22c55e",fontWeight:800,marginBottom:8}}>✅ {t.youHaveWhatTheyNeed}</div>
                              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                                {matches.iHave.map((s,j)=>(
                                  <span key={j} style={{fontSize:12,padding:"4px 10px",borderRadius:12,background:"#052e16",color:"#22c55e",border:"1px solid #22c55e",fontWeight:700}}>{s.code} #{s.num}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          <button onClick={()=>{
                            const name=album?.username||email.split("@")[0];
                            const text=`Hola ${name}! 👋\n\nVi en FiguSwap que podemos intercambiar:\n✅ Yo tengo ${matches.iHave.length} que tú necesitas:\n${matches.iHave.slice(0,5).map(s=>`${s.code} #${s.num}`).join(", ")}${matches.iHave.length>5?`... y ${matches.iHave.length-5} más`:""}\n\n🔁 Tú tienes ${matches.theyHave.length} que yo necesito:\n${matches.theyHave.slice(0,5).map(s=>`${s.code} #${s.num}`).join(", ")}${matches.theyHave.length>5?`... y ${matches.theyHave.length-5} más`:""}\n\n¿Coordinamos? ⚽🎴`;
                            // Si el contacto compartió su WhatsApp en su Perfil, abrimos su chat directo;
                            // si no, igual funciona con el selector genérico de contactos como antes.
                            const phoneDigits=(album?.whatsapp_number||"").replace(/[^\d]/g,"");
                            const waUrl=phoneDigits?`https://wa.me/${phoneDigits}?text=${encodeURIComponent(text)}`:`https://wa.me/?text=${encodeURIComponent(text)}`;
                            window.open(waUrl,"_blank");
                          }} style={{width:"100%",padding:"12px",background:"#14532d",border:"1px solid #22c55e",borderRadius:10,color:"#86efac",fontWeight:700,fontSize:14,cursor:"pointer"}}>
                            {t.coordinateTradeWhatsapp}{album?.whatsapp_number?` (${t.direct})`:""}
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {!album&&<div style={{fontSize:12,color:"#6b7280",textAlign:"center",padding:"8px 0"}}>{email.split("@")[0]} {t.noAlbumYet}</div>}
                </div>
              );
            })}
          </>
        )}

        {!loading&&contacts.length===0&&pending.length===0&&(
          <div style={{textAlign:"center",padding:40,color:"#4a5568"}}>
            <div style={{fontSize:48,marginBottom:12}}>👥</div>
            <div style={{fontWeight:700,marginBottom:6,color:"#6b7280"}}>{t.noConnections}</div>
            <div style={{fontSize:13}}>{t.noConnectionsHelp}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
// Fix: ErrorBoundary para capturar crashes no previstos (token expirado, estado en transición,
// etc.) y mostrar un mensaje de recuperación en vez de dejar la pantalla completamente en blanco.
// React requiere que esto sea una clase, no se puede hacer con hooks.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("FiguSwap crash capturado:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{minHeight:"100vh",background:"#0a0f1e",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:16}}>⚠️</div>
          <div style={{fontWeight:800,fontSize:18,color:"#e8eaf6",marginBottom:8}}>Something went wrong</div>
          <div style={{fontSize:13,color:"#6b7280",marginBottom:24}}>The app ran into an unexpected error. Your data is safe in the cloud.</div>
          <button onClick={()=>window.location.reload()} style={{padding:"14px 28px",background:"linear-gradient(135deg,#ffd700,#f59e0b)",border:"none",borderRadius:12,color:"#0a0f1e",fontWeight:800,fontSize:15,cursor:"pointer"}}>
            🔄 Reload app
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function FiguSwapInner() {
  const [lang,setLang]=useState(getInitialLang);
  const t=translations[lang];
  const stateMap = useMemo(()=>getStateLabels(t),[t]);
  const changeLang=(nextLang) =>{setLang(nextLang);localStorage.setItem("figuswap_lang",nextLang);};
  // El árabe se lee de derecha a izquierda — esto ajusta automáticamente la dirección del
  // documento completo (no solo de un contenedor) cada vez que cambia el idioma.
  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);
  const [session,setSession]=useState(null);
  const [checkingSession,setCheckingSession]=useState(true);
  // Modo invitado: por defecto, cualquier visitante sin sesión entra directo a la app — sin
  // pedir nada al inicio. Solo cuando intenta algo que de verdad requiere identidad (Red,
  // guardar para siempre) se le muestra el login, mediante showAuthOverlay.
  const [isGuest,setIsGuest]=useState(false);
  // "Agregar a pantalla de inicio": Android/Chrome sí permite activar el instalador nativo
  // por código (capturando beforeinstallprompt); iOS/Safari NUNCA lo permite — Apple no expone
  // esa API — así que ahí solo podemos mostrar instrucciones paso a paso, no un botón mágico.
  const [installPrompt,setInstallPrompt]=useState(null);
  const [showIosInstallHelp,setShowIosInstallHelp]=useState(false);
  const isIos=useMemo(()=>/iPhone|iPad|iPod/.test(navigator.userAgent),[]);
  const isStandalone=useMemo(()=>window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true,[]);
  useEffect(()=>{
    const handler=(e)=>{e.preventDefault();setInstallPrompt(e);};
    window.addEventListener("beforeinstallprompt",handler);
    return ()=>window.removeEventListener("beforeinstallprompt",handler);
  },[]);
  const [showAuthOverlay,setShowAuthOverlay]=useState(false);
  const [guestScanCount,setGuestScanCount]=useState(()=>Number(localStorage.getItem("figuswap_guest_scans")||0));
  const GUEST_SCAN_LIMIT=10;
  const [page,setPage]=useState("album");
  const [albumTab,setAlbumTab]=useState("all");
  const [stickers,setStickers]=useState(buildEmpty);
  const [search,setSearch]=useState("");
  const [toast,setToast]=useState(null);
  const [showOnboarding,setShowOnboarding]=useState(false);
  const [showImporter,setShowImporter]=useState(false);
  const [showShare,setShowShare]=useState(false);
  const [showQR,setShowQR]=useState(false);
  const [whatsappNumber,setWhatsappNumber]=useState("");
  const [savingWhatsapp,setSavingWhatsapp]=useState(false);
  const [inviterWhatsapp,setInviterWhatsapp]=useState("");
  const [pendingCount,setPendingCount]=useState(0);
  const [saving,setSaving]=useState(false);
  const [loadedAlbum,setLoadedAlbum]=useState(false);
  const countdown=useCountdown();

  const showToastMsg=msg=>{setToast(msg);setTimeout(()=>setToast(null),2500);};
  const [showResetConfirm,setShowResetConfirm]=useState(false);
  const [resetBackup,setResetBackup]=useState(null); // {snapshot, label}
  const [importBackup,setImportBackup]=useState(null);
  const [showFullResetConfirm,setShowFullResetConfirm]=useState(false);

  // Reinicia TODAS las figuritas en estado tradeable (repetida/venta/cambio/subasta) a "have".
  // Guarda un respaldo completo antes de tocar nada, y manda directo al Scanner para que el
  // re-escaneo sea el siguiente paso natural — así no queda la ventana de "reinicié pero se me
  // olvidó volver a escanear", que dejaría el contador de disponibles en 0 sin razón real.
  const resetRepeatedStock=()=>{
    const backup=JSON.parse(JSON.stringify(stickers));
    const next={...stickers};
    Object.keys(next).forEach(code=>{
      next[code]={...next[code]};
      Object.keys(next[code]).forEach(num=>{
        const s=next[code][num];
        if(TRADEABLE_STATES.includes(s.state)){
          next[code][num]={state:"have",qty:1,price:0};
        }
      });
    });
    setResetBackup({snapshot:backup,label:t.resetRepeatedConfirm});
    setStickers(next);
    setShowResetConfirm(false);
    showToastMsg(t.resetRepeatedConfirm);
    setPage("scanner");
  };

  // Empezar de cero por completo — pensado para cuando algo salió mal y la persona prefiere
  // borrar todo en vez de tratar de corregirlo a mano. Mismo respaldo/deshacer que arriba,
  // solo que cubre TODO el álbum (vuelve todo a "me falta"), no solo las repetidas.
  const resetFullAlbum=()=>{
    const backup=JSON.parse(JSON.stringify(stickers));
    setResetBackup({snapshot:backup,label:t.startFromZero});
    setStickers(buildEmpty());
    setShowFullResetConfirm(false);
    showToastMsg(t.blankAlbumDone);
  };

  const undoReset=()=>{
    if(!resetBackup)return;
    setStickers(resetBackup.snapshot);
    setResetBackup(null);
    showToastMsg(t.undoResetDone);
  };

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const inviter=params.get("invite");
    if(inviter)localStorage.setItem("figuswap_pending_invite",normalizeEmail(inviter));
    // wa= viene del código QR de alguien que ya mostró su QR en persona — por eso es aceptable
    // ofrecer un botón directo de WhatsApp aquí mismo, antes incluso de registrarse.
    const waParam=params.get("wa");
    if(waParam)setInviterWhatsapp(waParam.replace(/[^\d]/g,""));

    const token=sbAuth.getTokenFromHash();
    if(token){
      sbAuth.getUserFromToken(token).then(email=>{
        if(email){
          const s={token,email:normalizeEmail(email)};
          sbAuth.storeSession(s);
          setSession(s);
        } else {
          setIsGuest(true);
        }
        setCheckingSession(false);
      });
      return;
    }
    const stored=sbAuth.getStoredSession();
    if(stored){
      // No confiar ciegamente en la sesión guardada — verificar que el token siga vivo en Supabase
      sbAuth.getUserFromToken(stored.token).then(email=>{
        if(email){
          // Fix: usar el email recién confirmado por Supabase, NUNCA el stored.email tal cual.
          // Si localStorage quedó con un email vacío/viejo/corrupto, esto lo corrige en cada carga
          // en vez de propagar el dato corrupto hacia adelante.
          const s={token:stored.token, email:normalizeEmail(email)};
          sbAuth.storeSession(s);
          setSession(s);
        } else {
          // Token expirado o rechazado — limpiar localStorage para no quedar "logueado" sin estarlo
          sbAuth.clearSession();
          setSession(null);
          setIsGuest(true);
        }
        setCheckingSession(false);
      });
    } else {
      // Sin sesión guardada y sin token en la URL: entra directo como invitado, sin pedir nada.
      setIsGuest(true);
      setCheckingSession(false);
    }
  },[]);


  useEffect(()=>{
    // Fix: nunca proceder con un email vacío o inválido — ni cargar ni dejar que se dispare auto-save después
    if(!session?.email || !db.isValidEmail(session.email))return;
    setLoadedAlbum(false);
    const pending=localStorage.getItem("figuswap_pending_invite");
    if(pending&&pending!==session.email){
      // El visitante (session.email) envía la solicitud al dueño del link (pending)
      db.sendRequest(session.token,session.email,pending).then(()=>{
        localStorage.removeItem("figuswap_pending_invite");
        showToastMsg(`${t.requestSentTo} ${pending.split("@")[0]}`);
      });
    }
    // Load from Supabase (cloud first)
    db.getAlbum(session.token,session.email).then(data=>{
      if(data?.whatsapp_number!==undefined) setWhatsappNumber(data.whatsapp_number||"");
      if(data?.stickers&&Object.keys(data.stickers).length>0){
        setStickers(data.stickers);
      } else {
        try{
          const local=localStorage.getItem(`figuswap_stickers_${session.email}`);
          if(local){
            const parsed=JSON.parse(local);
            setStickers(parsed);
            // Fix: el mismo riesgo de sobreescribir la nube con un álbum vacío aplica aquí.
            // Si el localStorage de este dispositivo está vacío/corrupto, no lo subimos a Supabase.
            if(!isEmptyAlbum(parsed)){
              db.saveAlbum(session.token,session.email,parsed,session.email.split("@")[0]);
            }
          } else {
            setShowOnboarding(true);
          }
        }catch{setShowOnboarding(true);}
      }
    }).finally(()=>setLoadedAlbum(true));
    db.getPendingRequests(session.token,session.email).then(r=>setPendingCount(r.length));
  },[session]);

  // Carga del álbum de invitado — vive solo en este dispositivo (localStorage), no en la nube.
  // Por eso el banner de invitado advierte que se puede perder si cambia de teléfono o borra datos.
  useEffect(()=>{
    if(!isGuest)return;
    setLoadedAlbum(false);
    try{
      const local=localStorage.getItem("figuswap_guest_stickers");
      if(local){
        setStickers(JSON.parse(local));
      } else {
        setShowOnboarding(true);
      }
    }catch{setShowOnboarding(true);}
    setLoadedAlbum(true);
  },[isGuest]);

  // Auto-guardado del álbum de invitado en localStorage (sin red, sin Supabase).
  useEffect(()=>{
    if(!isGuest || !loadedAlbum)return;
    const timer=setTimeout(()=>{
      if(!isEmptyAlbum(stickers)){
        localStorage.setItem("figuswap_guest_stickers",JSON.stringify(stickers));
      }
    },500);
    return ()=>clearTimeout(timer);
  },[stickers,isGuest,loadedAlbum]);

  // Auto-save to Supabase
  useEffect(()=>{
    // Fix 1: nunca guardar con email vacío/inválido. Fix 2: nunca guardar antes de que termine la carga inicial.
    if(!session?.email || !db.isValidEmail(session.email) || !loadedAlbum)return;
    const timer=setTimeout(async()=>{
      // Fix 3: nunca guardar un álbum completamente vacío — eso solo puede pasar por timing/carga
      // fallida, nunca debería sobreescribir un álbum real existente en la nube.
      if(isEmptyAlbum(stickers)){
        showToastMsg(t.saveBlockedEmptyAlbum);
        return;
      }
      setSaving(true);
      const ok=await db.saveAlbum(session.token,session.email,stickers,session.email.split("@")[0]);
      setSaving(false);
      if(!ok)showToastMsg(t.saveFailedConnection);
    },1500);
    return()=>clearTimeout(timer);
  },[stickers,session,loadedAlbum]);


  // Guarda solo el número de WhatsApp, sin tocar el resto del álbum — campo opcional, pensado
  // únicamente para que tus contactos de Red puedan coordinar contigo directo (no para marketing).
  const saveWhatsappNumber=async()=>{
    setSavingWhatsapp(true);
    const ok=await db.saveAlbum(session.token,session.email,stickers,session.email.split("@")[0],whatsappNumber.trim());
    setSavingWhatsapp(false);
    showToastMsg(ok?"✅ WhatsApp guardado":"⚠️ No se pudo guardar");
  };

  const handleAction=(code,num,state,qty,price,customToast)=>{
    if(!ALBUM[code]||!stateMap[state]){
      showToastMsg(t.unknownTeamOrState);
      return;
    }
    setStickers(prev=>{
      if(!prev[code]?.[num])return prev;
      return {
        ...prev,
        [code]:{
          ...prev[code],
          [num]:{
            state,
            qty:qty!==undefined?qty:prev[code][num].qty,
            price:price!==undefined?price:prev[code][num].price
          }
        }
      };
    });
    showToastMsg(customToast || `${stateMap[state].emoji} ${getTeamName(code,lang)} #${num} → ${stateMap[state].label}${state==="repeated"&&qty>1?` ×${qty}`:""}`);
  };

  // Fix: filter considers tab when checking if team has visible stickers
  const filtered=useMemo(()=>ALBUM_ORDER.filter(code=>{
    const ts=stickers[code];
    if(!ts)return false;
    const team=ALBUM[code];
    if(!team)return false;
    const q=search.toLowerCase();
    // Ahora también busca por nombre de jugador/escudo/foto de equipo (ej. "Messi"
    // encuentra Argentina), no solo por nombre de selección o código de 3 letras.
    const matchesPlayerName=q!==""&&Object.values(STICKER_NAMES[code]||{}).some(n=>n.toLowerCase().includes(q));
    const matchSearch=search===""||team.name.toLowerCase().includes(q)||getTeamName(code,lang).toLowerCase().includes(q)||code.toLowerCase().includes(q)||matchesPlayerName;
    if(!matchSearch)return false;
    if(albumTab==="missing")return Object.values(ts).some(s=>s.state==="missing");
    if(albumTab==="repeated")return Object.values(ts).some(s=>TRADEABLE_STATES.includes(s.state));
    return true;
  }).map(code=>[code,stickers[code]]),[stickers,search,albumTab]);

  const albumStats=useMemo(()=>{
    const counts={missing:0,have:0,repeated:0,sell:0,trade:0,auction:0};
    let repeatedUnits=0;
    let tradeableCount=0;
    Object.values(stickers).forEach(team=>{Object.values(team).forEach(s=>{
      counts[s.state]=(counts[s.state]||0)+1;
      if(TRADEABLE_STATES.includes(s.state)){repeatedUnits+=(s.qty||1);tradeableCount++;}
    });});
    const total=Object.values(ALBUM).reduce((s,t)=>s+t.total,0);
    const pct=Math.round((counts.have+counts.repeated+counts.sell+counts.trade+counts.auction)/total*100);
    return{...counts,repeatedUnits,tradeableCount,total,pct};
  },[stickers]);

  const userNeeded=useMemo(()=>{
    const r={};
    Object.entries(stickers).forEach(([code,nums])=>{
      const missing=Object.entries(nums).filter(([,s])=>s.state==="missing").map(([n])=>parseInt(n));
      if(missing.length>0)r[code]=missing;
    });
    return r;
  },[stickers]);

  if(checkingSession)return (
    <div style={{minHeight:"100vh",background:"#0a0f1e",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <img src="/icon-512.png" alt="FiguSwap" style={{width:48,height:48,borderRadius:10}}/>
    </div>
  );
  if(showAuthOverlay)return (
    <AuthPage t={t} inviterWhatsapp={inviterWhatsapp} onClose={isGuest?()=>setShowAuthOverlay(false):undefined} onAuth={s=>{
      // Migración: si venía como invitado y ya armó algo de álbum en este dispositivo, lo
      // copiamos a la llave local específica de su cuenta nueva — el efecto de carga normal
      // (más abajo) ya sabe leer esa llave como respaldo si la nube todavía está vacía, así
      // que no pierde lo que escaneó/importó antes de crear cuenta.
      const guestData=localStorage.getItem("figuswap_guest_stickers");
      if(guestData){
        try{
          if(!isEmptyAlbum(JSON.parse(guestData))){
            localStorage.setItem(`figuswap_stickers_${s.email}`,guestData);
          }
        }catch{}
        localStorage.removeItem("figuswap_guest_stickers");
      }
      setIsGuest(false);
      setShowAuthOverlay(false);
      setSession(s);
      sbAuth.storeSession(s);
    }}/>
  );

  // Fix condición de carrera (pérdida de datos al importar): antes de este fix, getAlbum() corría
  // en paralelo a la primera interacción del usuario. Si alguien importaba una lista o tocaba una
  // figurita ANTES de que getAlbum() resolviera, la respuesta tardía de la nube podía sobreescribir
  // silenciosamente lo recién hecho. Bloqueamos toda la UI (incluyendo abrir Importador/Scanner)
  // hasta que loadedAlbum sea true. La carga real toma ~200-500ms, así que esto es casi imperceptible.
  if(!loadedAlbum)return (
    <div style={{minHeight:"100vh",background:"#0a0f1e",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10}}>
      <img src="/icon-512.png" alt="FiguSwap" style={{width:48,height:48,borderRadius:10}}/>
      <div style={{fontSize:13,color:"#6b7280"}}>{t.loadingAlbum}</div>
    </div>
  );

  const NAV=[["album","📋",t.album],["scanner","📸",t.scan],["worldcup","📅",t.worldcup],["contacts","👥",t.network],["profile","👤",t.profile]];

  return (
    <div style={{minHeight:"100vh",background:"#0a0f1e",color:"#e8eaf6",fontFamily:"'Segoe UI',system-ui,sans-serif",paddingBottom:72}}>
      <div style={{background:"linear-gradient(135deg,#0a0f1e,#111827)",borderBottom:"1px solid #1e2a3a",padding:"12px 16px",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:720,margin:"0 auto",display:"flex",alignItems:"center",gap:10}}>
          <img src="/icon-512.png" alt="FiguSwap" style={{width:28,height:28,borderRadius:6}}/>
          <span style={{fontWeight:900,fontSize:18,background:"linear-gradient(90deg,#ffd700,#f59e0b)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>FiguSwap</span>
          {saving&&<span style={{fontSize:10,color:"#4a5568",marginLeft:2}}>💾</span>}
          <select value={lang} onChange={e=>changeLang(e.target.value)} style={{marginLeft:8,border:"1px solid #1e2a3a",borderRadius:8,background:"#111827",color:"#e8eaf6",fontWeight:800,fontSize:11,padding:"6px 8px"}}>
            <option value="es">ES</option>
            <option value="en">EN</option>
            <option value="pt">PT</option>
            <option value="fr">FR</option>
            <option value="it">IT</option>
            <option value="de">DE</option>
            <option value="ar">AR</option>
          </select>
          <div style={{marginLeft:"auto",display:"flex",gap:12}}>
            {[["d",t.countdownDays],["h","h"],["m","m"]].map(([k,l])=>(
              <div key={k} style={{textAlign:"center"}}>
                <div style={{fontSize:14,fontWeight:900,color:"#ffd700",fontVariantNumeric:"tabular-nums"}}>{String(countdown[k]||0).padStart(2,"0")}</div>
                <div style={{fontSize:8,color:"#4a5568"}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isGuest&&(
        <div style={{maxWidth:720,margin:"0 auto",padding:"10px 16px 0"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,background:"#1a1500",border:"1px solid #92400e",borderRadius:10,padding:"10px 12px"}}>
            <span style={{fontSize:12,color:"#fbbf24",flex:1}}>{t.guestBannerText}</span>
            <button onClick={()=>setShowAuthOverlay(true)} style={{padding:"6px 12px",background:"#ffd700",border:"none",borderRadius:8,color:"#0a0f1e",fontWeight:800,fontSize:12,cursor:"pointer",whiteSpace:"nowrap"}}>{t.guestBannerCta}</button>
          </div>
        </div>
      )}

      <div style={{maxWidth:720,margin:"0 auto",padding:16}}>
        {page==="album"&&(
          <>
            <div style={{background:"#0d1117",border:"1px solid #1e2a3a",borderRadius:14,padding:14,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontWeight:800,color:"#e8eaf6",fontSize:14}}>{t.myAlbum}</span>
                <span style={{fontWeight:900,color:"#ffd700",fontSize:16}}>{albumStats.pct}%</span>
              </div>
              <div style={{height:6,background:"#1e2a3a",borderRadius:3,overflow:"hidden",marginBottom:10}}>
                <div style={{height:"100%",width:`${albumStats.pct}%`,background:"linear-gradient(90deg,#ffd700,#f59e0b)",borderRadius:3}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#6b7280",marginBottom:12}}>
                <span>❌ {albumStats.missing} {t.missingCount}</span>
                <span>✅ {albumStats.have} {t.haveCount}</span>
                <span>🔁 {albumStats.tradeableCount} {t.availableCount} ({albumStats.repeatedUnits} {t.units})</span>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>isGuest?setShowAuthOverlay(true):setShowShare(true)} style={{flex:1,padding:"8px",background:"#14532d",border:"1px solid #22c55e",borderRadius:8,color:"#86efac",fontWeight:700,fontSize:12,cursor:"pointer"}}>{t.share}</button>
                <button onClick={()=>setShowImporter(true)} style={{flex:1,padding:"8px",background:"#1e2a3a",border:"1px solid #374151",borderRadius:8,color:"#9ca3af",fontWeight:700,fontSize:12,cursor:"pointer"}}>{t.import}</button>
              </div>
            </div>

            <div style={{display:"flex",background:"#111827",borderRadius:12,padding:4,marginBottom:12,border:"1px solid #1e2a3a"}}>
              {[["all",t.all],["missing",t.missing],["repeated",t.repeated]].map(([v,l])=>(
                <button key={v} onClick={()=>{setAlbumTab(v);setSearch("");}} style={{flex:1,padding:"10px 4px",borderRadius:9,border:"none",background:albumTab===v?"#ffd700":"transparent",color:albumTab===v?"#0a0f1e":"#6b7280",fontWeight:albumTab===v?800:600,fontSize:13,cursor:"pointer"}}>
                  {l}
                  {v==="missing"&&albumStats.missing>0&&<span style={{fontSize:9,marginLeft:3,background:"#ef4444",color:"#fff",borderRadius:10,padding:"1px 4px"}}>{albumStats.missing}</span>}
                  {v==="repeated"&&albumStats.tradeableCount>0&&<span style={{fontSize:9,marginLeft:3,background:"#f97316",color:"#fff",borderRadius:10,padding:"1px 4px"}}>{albumStats.tradeableCount}</span>}
                </button>
              ))}
            </div>

            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={albumTab==="missing"?`🔍 ${t.searchMissing}`:albumTab==="repeated"?`🔍 ${t.searchRepeated}`:`🔍 ${t.searchTeam}`} style={{width:"100%",boxSizing:"border-box",padding:"10px 14px",borderRadius:10,border:"1px solid #1e2a3a",background:"#111827",color:"#e8eaf6",fontSize:14,outline:"none",marginBottom:12}}/>

            {filtered.length===0&&(
              <div style={{textAlign:"center",padding:40,color:"#4a5568"}}>
                <div style={{fontSize:40,marginBottom:12}}>{albumTab==="missing"?"🎉":albumTab==="repeated"?"🔁":"🔍"}</div>
                <div style={{fontWeight:700,color:"#6b7280"}}>
                  {search?t.noSearchFound(search, albumTab==="missing"?t.scopeMissing:albumTab==="repeated"?t.scopeRepeated:t.scopeAlbum):albumTab==="missing"?t.noMissing:albumTab==="repeated"?t.noRepeated:t.noResults}
                </div>
              </div>
            )}

            {filtered.map(([code,ts])=>(<TeamSection key={code} code={code} stickers={ts} tab={albumTab} onAction={handleAction} t={t} stateMap={stateMap} lang={lang}/>))}
          </>
        )}

        {page==="scanner"&&(isGuest&&guestScanCount>=GUEST_SCAN_LIMIT?(
          <div style={{padding:"60px 24px",textAlign:"center"}}>
            <div style={{fontSize:44,marginBottom:12}}>📸</div>
            <div style={{fontWeight:800,fontSize:17,color:"#e8eaf6",marginBottom:8}}>{t.scannerTitle}</div>
            <div style={{fontSize:13,color:"#6b7280",marginBottom:20,maxWidth:320,marginLeft:"auto",marginRight:"auto"}}>{t.guestScanLimitReached}</div>
            <button onClick={()=>setShowAuthOverlay(true)} style={{padding:"12px 24px",background:"linear-gradient(90deg,#ffd700,#f59e0b)",border:"none",borderRadius:10,color:"#0a0f1e",fontWeight:800,cursor:"pointer"}}>{t.createAccount}</button>
          </div>
        ):(
          <Scanner lang={lang} t={t} userNeeded={userNeeded} myStickers={stickers} onUpdateAlbum={(code,num,state,qty,price,customToast)=>{
            // Cada figurita confirmada por el Escáner cuenta hacia el límite de invitado — no
            // cuenta fotos, cuenta resultados aplicados, que es lo que realmente cuesta (la
            // llamada a la IA ya se hizo antes de esto, pero este es el momento estable para contar).
            if(isGuest){
              const next=guestScanCount+1;
              setGuestScanCount(next);
              localStorage.setItem("figuswap_guest_scans",String(next));
            }
            handleAction(code,num,state,qty,price,customToast);
          }}/>
        ))}

        {page==="worldcup"&&<WorldCup lang={lang} t={t}/>}

        {page==="contacts"&&(isGuest?(
          <div style={{padding:"60px 24px",textAlign:"center"}}>
            <div style={{fontSize:44,marginBottom:12}}>👥</div>
            <div style={{fontWeight:800,fontSize:17,color:"#e8eaf6",marginBottom:8}}>{t.myContactNetwork}</div>
            <div style={{fontSize:13,color:"#6b7280",marginBottom:20,maxWidth:320,marginLeft:"auto",marginRight:"auto"}}>{t.guestNetworkLocked}</div>
            <button onClick={()=>setShowAuthOverlay(true)} style={{padding:"12px 24px",background:"linear-gradient(90deg,#ffd700,#f59e0b)",border:"none",borderRadius:10,color:"#0a0f1e",fontWeight:800,cursor:"pointer"}}>{t.createAccount}</button>
          </div>
        ):(
          <ContactsPage myEmail={session.email} myToken={session.token} myStickers={stickers} t={t} lang={lang} onClose={()=>{setPage("album");db.getPendingRequests(session.token,session.email).then(r=>setPendingCount(r.length));}}/>
        ))}

        {page==="profile"&&(
          <div>
            <div style={{background:"linear-gradient(135deg,#1a1040,#0a1a2e)",border:"1px solid #1e2a3a",borderRadius:16,padding:24,textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:48,marginBottom:8}}>👤</div>
              {isGuest?(
                <>
                  <div style={{fontWeight:900,fontSize:20,color:"#fff"}}>{t.continueAsGuest}</div>
                  <div style={{color:"#6b7280",fontSize:13,marginBottom:16}}>—</div>
                </>
              ):(
                <>
                  <div style={{fontWeight:900,fontSize:20,color:"#fff"}}>{session.email?.split("@")[0]}</div>
                  <div style={{color:"#6b7280",fontSize:13,marginBottom:16}}>{session.email}</div>
                </>
              )}
              <div style={{display:"flex",gap:12,justifyContent:"center"}}>
                <div style={{textAlign:"center"}}><div style={{fontWeight:900,fontSize:22,color:"#ffd700"}}>{albumStats.pct}%</div><div style={{fontSize:11,color:"#6b7280"}}>{t.albumLower}</div></div>
                <div style={{textAlign:"center"}}><div style={{fontWeight:900,fontSize:22,color:"#ef4444"}}>{albumStats.missing}</div><div style={{fontSize:11,color:"#6b7280"}}>{t.missingLower}</div></div>
                <div style={{textAlign:"center"}}><div style={{fontWeight:900,fontSize:22,color:"#22c55e"}}>{albumStats.have}</div><div style={{fontSize:11,color:"#6b7280"}}>{t.haveLower}</div></div>
                <div style={{textAlign:"center"}}><div style={{fontWeight:900,fontSize:22,color:"#f97316"}}>{albumStats.tradeableCount}</div><div style={{fontSize:11,color:"#6b7280"}}>{t.availableLower}</div></div>
              </div>
            </div>

            {/* Botón de instalar — no necesita cuenta ni identidad, visible para todos.
                Se oculta solo si ya está instalada (display-mode standalone) o si el
                navegador no soporta ninguno de los dos caminos (Android nativo / iOS manual). */}
            {!isStandalone&&(installPrompt||isIos)&&(
              <button onClick={async()=>{
                if(installPrompt){
                  installPrompt.prompt();
                  await installPrompt.userChoice;
                  setInstallPrompt(null);
                }
                else setShowIosInstallHelp(true);
              }} style={{width:"100%",padding:"13px",background:"#0a1a2e",border:"1px solid #3b82f6",borderRadius:12,color:"#60a5fa",fontWeight:700,cursor:"pointer",marginBottom:12}}>
                {t.installApp}
              </button>
            )}

            {/* Importar sí funciona como invitado — solo llena el álbum local, no necesita identidad. */}
            <div style={{display:"flex",gap:10,marginBottom:12}}>
              {!isGuest&&<button onClick={()=>setShowShare(true)} style={{flex:1,padding:"13px",background:"#14532d",border:"1px solid #22c55e",borderRadius:12,color:"#86efac",fontWeight:700,cursor:"pointer"}}>{t.shareListButton}</button>}
              <button onClick={()=>setShowImporter(true)} style={{flex:1,padding:"13px",background:"#1e2a3a",border:"1px solid #374151",borderRadius:12,color:"#9ca3af",fontWeight:700,cursor:"pointer"}}>{t.importListButton}</button>
            </div>

            {isGuest?(
              /* Compartir, QR, WhatsApp y Red necesitan una identidad estable (correo) para
                 funcionar de verdad — en vez de mostrarlos rotos, se agrupan en una sola
                 invitación clara a crear cuenta. */
              <div style={{background:"linear-gradient(135deg,#1a1040,#0a1a2e)",border:"1px solid #a78bfa",borderRadius:12,padding:20,textAlign:"center",marginBottom:12}}>
                <div style={{fontSize:13,color:"#c4b5fd",marginBottom:14}}>{t.guestNetworkLocked}</div>
                <button onClick={()=>setShowAuthOverlay(true)} style={{padding:"12px 24px",background:"linear-gradient(90deg,#ffd700,#f59e0b)",border:"none",borderRadius:10,color:"#0a0f1e",fontWeight:800,cursor:"pointer"}}>{t.createAccount}</button>
              </div>
            ):(
              <>
                <button onClick={()=>setShowQR(true)} style={{width:"100%",padding:"13px",background:"#1a1040",border:"1px solid #a78bfa",borderRadius:12,color:"#c4b5fd",fontWeight:700,cursor:"pointer",marginBottom:12}}>
                  {t.myQrCode}
                </button>

                <div style={{background:"#111827",border:"1px solid #1e2a3a",borderRadius:12,padding:16,marginBottom:12}}>
                  <div style={{fontWeight:700,fontSize:13,color:"#e8eaf6",marginBottom:4}}>{t.whatsappOptional}</div>
                  <div style={{fontSize:11,color:"#6b7280",marginBottom:10}}>
                    {t.whatsappHelp}
                  </div>
                  <div style={{display:"flex",gap:8,marginBottom:6}}>
                    <input
                      type="tel"
                      placeholder="+504 9999-9999"
                      value={whatsappNumber}
                      onChange={e=>setWhatsappNumber(e.target.value)}
                      style={{flex:1,padding:"10px 12px",background:"#0a0f1e",border:"1px solid #374151",borderRadius:8,color:"#e8eaf6",fontSize:14}}
                    />
                    <button onClick={saveWhatsappNumber} disabled={savingWhatsapp} style={{padding:"10px 16px",background:savingWhatsapp?"#1e2a3a":"#14532d",border:"1px solid #22c55e",borderRadius:8,color:"#86efac",fontWeight:700,cursor:savingWhatsapp?"not-allowed":"pointer"}}>
                      {savingWhatsapp?"...":t.save}
                    </button>
                  </div>
                  {whatsappNumber&&whatsappNumber.replace(/[^\d]/g,"").length>0&&whatsappNumber.replace(/[^\d]/g,"").length<8&&(
                    <div style={{fontSize:11,color:"#fb923c"}}>⚠️ {t.phoneTooShort.replace("⚠️ ","")}</div>
                  )}
                </div>
                <button onClick={()=>setPage("contacts")} style={{width:"100%",padding:"14px",background:"#0a1a2e",border:"1px solid #3b82f6",borderRadius:12,color:"#60a5fa",fontWeight:700,cursor:"pointer",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  {t.myContactNetwork}
                  {pendingCount>0&&<span style={{background:"#ef4444",color:"#fff",fontSize:11,fontWeight:800,borderRadius:20,padding:"2px 8px"}}>{pendingCount} {t.newBadge(pendingCount)}</span>}
                </button>
              </>
            )}

            {isGuest?(
              <button onClick={()=>setShowAuthOverlay(true)} style={{width:"100%",padding:"12px",background:"transparent",border:"1px solid #374151",borderRadius:10,color:"#9ca3af",fontWeight:700,cursor:"pointer",marginBottom:12}}>
                {t.login}
              </button>
            ):(
              <button onClick={async()=>{await sbAuth.signOut(session.token);sbAuth.clearSession();setSession(null);setIsGuest(true);setStickers(buildEmpty());}} style={{width:"100%",padding:"12px",background:"transparent",border:"1px solid #ef4444",borderRadius:10,color:"#ef4444",fontWeight:700,cursor:"pointer",marginBottom:12}}>
                {t.logout}
              </button>
            )}

            {!showResetConfirm ? (
              <button onClick={()=>setShowResetConfirm(true)} style={{width:"100%",padding:"12px",background:"transparent",border:"1px solid #374151",borderRadius:10,color:"#6b7280",fontWeight:700,cursor:"pointer",fontSize:13}}>
                {t.resetRepeatedConfirm.replace(t.yes + ", ", "🔄 ")}
              </button>
            ) : (
              <div style={{background:"#1e1500",border:"1px solid #f97316",borderRadius:12,padding:14}}>
                <div style={{color:"#fbbf24",fontWeight:700,fontSize:13,marginBottom:8}}>
                  {t.resetRepeatedWarning} ({albumStats.tradeableCount})
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setShowResetConfirm(false)} style={{flex:1,padding:"10px",background:"transparent",border:"1px solid #374151",borderRadius:8,color:"#9ca3af",fontWeight:700,fontSize:13,cursor:"pointer"}}>{t.cancel}</button>
                  <button onClick={resetRepeatedStock} style={{flex:1,padding:"10px",background:"#ef4444",border:"none",borderRadius:8,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>{t.resetRepeatedConfirm}</button>
                </div>
              </div>
            )}

            {!showFullResetConfirm ? (
              <button onClick={()=>setShowFullResetConfirm(true)} style={{width:"100%",padding:"12px",background:"transparent",border:"1px solid #374151",borderRadius:10,color:"#6b7280",fontWeight:700,cursor:"pointer",fontSize:13,marginTop:8}}>
                {t.startFromZero}
              </button>
            ) : (
              <div style={{background:"#1e0a0a",border:"1px solid #ef4444",borderRadius:12,padding:14,marginTop:8}}>
                <div style={{color:"#fca5a5",fontWeight:700,fontSize:13,marginBottom:8}}>
                  {t.fullResetWarning}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setShowFullResetConfirm(false)} style={{flex:1,padding:"10px",background:"transparent",border:"1px solid #374151",borderRadius:8,color:"#9ca3af",fontWeight:700,fontSize:13,cursor:"pointer"}}>{t.cancel}</button>
                  <button onClick={resetFullAlbum} style={{flex:1,padding:"10px",background:"#ef4444",border:"none",borderRadius:8,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>{t.fullResetConfirm}</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Deshacer importación — cercano y sin asustar, justo para el caso de "pegué la lista
          equivocada". Se queda visible hasta que la cierres, sin importar a qué pantalla vayas. */}
      {importBackup&&(
        <div style={{position:"fixed",bottom:62,left:0,right:0,background:"#0a1a2e",borderTop:"1px solid #3b82f6",padding:"10px 16px",display:"flex",alignItems:"center",gap:10,zIndex:101}}>
          <span style={{fontSize:12,color:"#93c5fd",flex:1}}>{t.wrongListQuestion}</span>
          <button onClick={()=>{
            setStickers(importBackup);
            setImportBackup(null);
            showToastMsg(t.undoImportDone);
          }} style={{padding:"6px 12px",background:"#3b82f6",border:"none",borderRadius:8,color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",whiteSpace:"nowrap"}}>{t.undo}</button>
          <button onClick={()=>setImportBackup(null)} style={{background:"none",border:"none",color:"#6b7280",fontSize:16,cursor:"pointer",padding:"0 4px"}}>✕</button>
        </div>
      )}

      {resetBackup&&(
        <div style={{position:"fixed",bottom:62+(importBackup?50:0),left:0,right:0,background:"#1e1500",borderTop:"1px solid #f97316",padding:"10px 16px",display:"flex",alignItems:"center",gap:10,zIndex:101}}>
          <span style={{fontSize:12,color:"#fbbf24",flex:1}}>{resetBackup?.label}</span>
          <button onClick={undoReset} style={{padding:"6px 12px",background:"#f97316",border:"none",borderRadius:8,color:"#1e0a00",fontWeight:700,fontSize:12,cursor:"pointer",whiteSpace:"nowrap"}}>{t.undo}</button>
          <button onClick={()=>setResetBackup(null)} style={{background:"none",border:"none",color:"#6b7280",fontSize:16,cursor:"pointer",padding:"0 4px"}}>✕</button>
        </div>
      )}

      {/* Puente directo a WhatsApp cuando escaneas el QR de alguien que acabas de conocer.
          No depende de Red ni de que acepten una solicitud — funciona aunque ya estés logueado,
          que es justo el caso que el banner de AuthPage no cubre (ese solo aplica a quien todavía
          no tiene cuenta). Aparece una sola vez por escaneo y se puede cerrar. */}
      {inviterWhatsapp&&(
        <div style={{position:"fixed",bottom:62+(importBackup?50:0)+(resetBackup?50:0),left:0,right:0,background:"#052e16",borderTop:"1px solid #22c55e",padding:"10px 16px",display:"flex",alignItems:"center",gap:10,zIndex:101}}>
          <span style={{fontSize:12,color:"#86efac",flex:1}}>{t.connectedByQr}</span>
          <button onClick={()=>{
            window.open(`https://wa.me/${inviterWhatsapp}?text=${encodeURIComponent(t.qrWhatsappMessage)}`,"_blank");
          }} style={{padding:"6px 12px",background:"#22c55e",border:"none",borderRadius:8,color:"#052e16",fontWeight:700,fontSize:12,cursor:"pointer",whiteSpace:"nowrap"}}>{t.writeNow}</button>
          <button onClick={()=>setInviterWhatsapp("")} style={{background:"none",border:"none",color:"#6b7280",fontSize:16,cursor:"pointer",padding:"0 4px"}}>✕</button>
        </div>
      )}

      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#0a0f1e",borderTop:"1px solid #1e2a3a",display:"flex",zIndex:100}}>
        {NAV.map(([p,ic,l])=>(
          <button key={p} onClick={()=>setPage(p)} style={{flex:1,padding:"10px 0",background:"none",border:"none",color:page===p?"#ffd700":"#4a5568",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,position:"relative"}}>
            <span style={{fontSize:20}}>{ic}</span>
            <span style={{fontSize:9,fontWeight:700,textTransform:"uppercase"}}>{l}</span>
            {p==="contacts"&&pendingCount>0&&<span style={{position:"absolute",top:4,right:"18%",background:"#ef4444",color:"#fff",fontSize:9,fontWeight:800,borderRadius:10,padding:"1px 5px"}}>{pendingCount}</span>}
          </button>
        ))}
      </div>

      {showOnboarding&&<Onboarding lang={lang} t={t} onChoice={choice=>{setShowOnboarding(false);if(choice==="import")setShowImporter(true);else if(choice==="scan")setPage("scanner");}}/>}
      {showImporter&&<Importer lang={lang} t={t} currentAlbum={stickers} onImport={s=>{
        // Respaldo justo antes de importar — si era la lista de la persona equivocada,
        // un toque y queda todo como estaba, sin importar si tu álbum estaba vacío o lleno.
        setImportBackup(stickers);
        setStickers(s);
        showToastMsg(t.importSuccess);
      }} onClose={()=>setShowImporter(false)}/>}
      {showShare&&<ShareModal t={t} stickers={stickers} username={session.email?.split("@")[0]} inviteEmail={session.email} onClose={()=>setShowShare(false)}/>}
      {showQR&&(()=>{
        // Reusa el mismo link de invitación que ya funciona en Red — el QR es solo otra forma
        // de compartir ese mismo link, ideal para cuando estás en persona con alguien.
        // Si guardaste tu WhatsApp en Perfil, se agrega como parámetro extra: como el QR solo
        // lo comparte quien lo muestra (ya hubo contacto presencial), es un contexto válido
        // para incluirlo, distinto a "recolectar" números de gente que no dio ese paso.
        const phoneDigits=whatsappNumber.replace(/[^\d]/g,"");
        let inviteLink=`${window.location.origin}?invite=${encodeURIComponent(session.email)}`;
        if(phoneDigits) inviteLink+=`&wa=${phoneDigits}`;
        const qrImgUrl=`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(inviteLink)}`;
        return (
          <div style={{position:"fixed",inset:0,background:"#000c",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
            <div style={{background:"#111827",border:"1px solid #1e2a3a",borderRadius:20,padding:24,maxWidth:360,width:"100%",textAlign:"center"}}>
              <div style={{fontWeight:900,fontSize:18,color:"#c4b5fd",marginBottom:4}}>{t.myQrCode}</div>
              <div style={{fontSize:12,color:"#6b7280",marginBottom:16}}>
                {t.qrDescription}
                {phoneDigits?` ${t.qrWhatsappWith}`:` ${t.qrWhatsappWithout}`}
              </div>
              <div style={{background:"#fff",borderRadius:12,padding:12,display:"inline-block",marginBottom:16}}>
                <img src={qrImgUrl} alt="FiguSwap QR" width={220} height={220}/>
              </div>
              <button onClick={()=>setShowQR(false)} style={{width:"100%",padding:"12px",background:"#1e2a3a",border:"1px solid #374151",borderRadius:10,color:"#e8eaf6",fontWeight:700,cursor:"pointer"}}>
                {t.close}
              </button>
            </div>
          </div>
        );
      })()}
      {showIosInstallHelp&&(
        <div style={{position:"fixed",inset:0,background:"#000c",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"#111827",border:"1px solid #1e2a3a",borderRadius:20,padding:24,maxWidth:360,width:"100%",textAlign:"center"}}>
            <div style={{fontWeight:900,fontSize:18,color:"#60a5fa",marginBottom:12}}>{t.installApp}</div>
            <div style={{textAlign:"left",fontSize:14,color:"#e8eaf6",lineHeight:1.7,marginBottom:16}}>
              <div style={{marginBottom:8}}>1️⃣ {t.iosInstallStep1}</div>
              <div style={{marginBottom:8}}>2️⃣ {t.iosInstallStep2}</div>
              <div>3️⃣ {t.iosInstallStep3}</div>
            </div>
            <button onClick={()=>setShowIosInstallHelp(false)} style={{width:"100%",padding:"12px",background:"#1e2a3a",border:"1px solid #374151",borderRadius:10,color:"#e8eaf6",fontWeight:700,cursor:"pointer"}}>
              {t.close}
            </button>
          </div>
        </div>
      )}
      {toast&&<div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",background:"#111827",border:"1px solid #1e2a3a",color:"#e8eaf6",padding:"10px 20px",borderRadius:24,fontWeight:700,fontSize:13,zIndex:9999,whiteSpace:"nowrap",boxShadow:"0 4px 20px #0008"}}>{toast}</div>}
    </div>
  );
}

// Fix: el export default ahora envuelve toda la app en ErrorBoundary. Cualquier crash de React
// (token expirado, estado en transición, lo que sea) muestra un mensaje de recuperación con
// botón de recargar, en vez de dejar la pantalla completamente en blanco sin pista de qué pasó.
export default function FiguSwap() {
  return (
    <ErrorBoundary>
      <FiguSwapInner />
    </ErrorBoundary>
  );
}
