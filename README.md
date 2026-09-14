# PersonalWeb

Osobní portfolio — Tomáš Krůta. Statický web, bez build stepu a bez závislostí.

Implementace návrhu `Portfolio.dc.html` (Claude Design, téma **nocturne**).

## Spuštění

Otevři `index.html` v prohlížeči, nebo přes lokální server (kvůli relativním cestám
k `assets/`):

```bash
python -m http.server 8000
# → http://localhost:8000
```

Nasazení: nahraj obsah repozitáře kamkoliv, kde se servírují statické soubory
(GitHub Pages, Netlify, Vercel). Žádná build fáze není potřeba.

### Náhled na telefonu ve stejné Wi-Fi

Server musí poslouchat na všech rozhraních, ne jen na `localhost`:

```bash
python -m http.server 8000 --bind 0.0.0.0
```

Pak na telefonu otevři `http://<IP počítače>:8000` — IP zjistíš přes `ipconfig`
(řádek *IPv4 Address* u adaptéru **Wi-Fi**, ne u VirtualBox/Hyper-V adaptérů).
Nejde-li to: firewall musí povolit příchozí spojení pro Python/Node a Wi-Fi nesmí
mít zapnutou izolaci klientů (typicky hostovské sítě).

## Struktura

```
index.html          obsah stránky, dvojjazyčně přes data-cs / data-en
css/nocturne.css    design system — tokeny a komponenty (.btn, .tag, .table, .nav)
css/portfolio.css   styly stránky; hodnoty převzaté z návrhu
js/portfolio.js     jazyk, filtry soutěží, scroll reveal, zaměřovač, scroll spy
assets/             portrait.jpg, competitions/ (loga soutěží)
```

## Co je kde potřeba doplnit

- **`assets/portrait.jpg`** — portrét do sekce „O mně". Poměr stran 4:5,
  ideálně na tmavém pozadí. Dokud soubor chybí, zobrazí se placeholder.
- **LinkedIn URL** — v sekci Kontakt je zatím viditelná díra
  `[doplň URL profilu]`. Nad ní je v HTML komentář s hotovou náhradou;
  stačí `<p>` vyměnit za `<a>` a doplnit handle.
- **Discord — volitelně odkaz.** Uživatelské jméno odkazovat nejde, takže je
  tam tlačítko, které ho zkopíruje. Pokud chceš skutečný odkaz na profil:
  Discord → Nastavení → Pokročilé → Vývojářský režim, pak pravý klik na svůj
  avatar → Kopírovat ID uživatele, a použij `https://discord.com/users/<ID>`
  (funguje jen pokud máš profil veřejný). Návod je i v komentáři v HTML.

## Design system

`css/nocturne.css` je **rekonstrukce**. Originál (`_ds/nocturne-f35114d2-.../styles.css`
a `_ds_bundle.js`) nebyl při implementaci k dispozici, takže tokeny a komponentní
třídy jsou odvozené z toho, jak je návrh používá.

Přesně odpovídají návrhu: `--color-bg` (`#161826`) a specifikace `.tag` / filtrovacích
chipů. Zbytek — paleta akcentů, neutrální škála, fonty, radiusy — je dopočítaný.

Až budeš mít originální `styles.css`, stačí `css/nocturne.css` nahradit. Zbytek kódu
závisí jen na **názvech** tokenů a tříd, ne na jejich hodnotách. Používané názvy:

| | |
|---|---|
| Barvy | `--color-bg` `--color-section` `--color-section-glow` `--color-divider` `--color-text` `--color-neutral-300` `--color-neutral-400` `--color-accent` `--color-accent-200` `--color-accent-300` |
| Typografie | `--font-heading` `--font-body` `--font-mono` |
| Radiusy | `--radius-sm` `--radius-md` |
| Třídy | `.nav` `.nav-brand` `.btn` `.btn-primary` `.btn-secondary` `.tag` `.tag-neutral` `.tag-accent` `.table` `.lighten` |

## Obsah

Texty jsou v `index.html` jako dvojice atributů `data-cs` / `data-en` na stejném
elementu — přidání jazyka znamená upravit jeden element, ne duplikovat blok.

Data soutěží a olympiád jsou v `js/portfolio.js` v poli `COMPETITIONS`.
Příznak `best: true` řídí filtr „Nejlepší výsledky".

### Ocenění na dvou místech

Stránka má sekce **Projekty · O mně · Zkušenosti · Úspěchy · Kontakt**. Tech stack je ve
Zkušenostech, hackathony a olympiády v Úspěších.

Aimtec Hackathon (1. místo) je záměrně vidět dvakrát:

- **`.creds` panel v heru** — nad zlomem, vedle headlinu. Sem patří 3–4 nejsilnější
  výsledky; je to první věc, kterou porota uvidí.
- **`.award` blok v sekci Úspěchy** — plný kontext, popis projektu a odkaz.

Obojí je ručně psané v `index.html`, ne generované z `COMPETITIONS` — pořadí a výběr
si řídíš sám podle toho, kam se hlásíš.

## Co jde nad rámec původního návrhu

Bloky označené `BEYOND DESIGN` v `css/portfolio.css`:

- credentials panel v heru a award blok (viz výše),
- atmosféra heru — rýsovací mřížka (jemná 24px + silnější každých 120px)
  a teplý bloom; hero je **full-bleed**, měřítko drží `.hero__inner`,
- hover stavy: projekty, řádky tabulky, odkazy, kontakty,
- obousměrná reveal animace,
- `::selection` v akcentové barvě místo defaultní modré,
- **velké nadpisy** sekcí (`.section-title`) a skupin (`.group-title`) místo malých
  mono štítků s číslováním — číslování působilo šablonovitě, je pryč,
- **mono hlas** (`--font-mono`, IBM Plex Mono) na technických popiscích: stack
  tagy, data, hlavičky a čísla v tabulce, patička,
- **scroll spy + ukazatel průběhu** v navigaci (`setupScrollSpy` v portfolio.js),
- **tech stack** s ikonami v sekci Zkušenosti — viz níž,
- kopírování Discord handle do schránky (`setupCopy`).

### Tech stack a ikony

Skupiny podle **oblasti**, ne podle úrovně. Každá položka má velkou (30 px)
ikonu **v barvě značky**; kontakty mají ikony 22 px.

Ikony jsou jeden SVG sprite na začátku `<body>` (`<symbol id="i-…">`), použitý
přes `<svg class="icon" style="color:#HEX"><use href="#i-python"></use></svg>`.
Značky jsou ze Simple Icons (CC0) a Devicon (MIT, Fusion 360). Nakreslené jsou
`i-mail`, `i-gamepad` (PyGame), `i-sigma` a `i-gear`.

**Barvy:** oficiální hex ze Simple Icons, ale ty, které by na `#161826` zmizely,
jsou zesvětlené na kontrast aspoň 4,5:1 — např. GitHub `#181717 → #E6EDF3`,
ROS `#22314E → #7A8395`, .NET/C# `#512BD4 → #896FE2`, C++ `#00599C → #4787B8`.
Když přidáváš ikonu, zkontroluj kontrast, jinak bude na tmavém webu neviditelná.

Do skupiny „Roboti a hardware" jsem doplnil ROS2, ESP32, Raspberry Pi a
Fusion 360 — jsou doložené přímo v projektech na téže stránce.

Vícebarevné značky (OpenCV z Devicon, Gemini v Google barvách z LobeHub) mají
vlastní výplně v `<symbol>` a nedostávají `style="color"`. CSS je modrá značka CSS3.

### Loga soutěží

Uložená lokálně v `assets/competitions/` (stažená z webů pořadatelů, převedená
na čtverec 96 px). Použitá v tabulce (mapa `COMP_LOGOS` v `portfolio.js`, pole `cls` přidá úpravu pro konkrétní logo),
v credentials panelu, v award bloku a u Campfire GameJamu.

| Soutěž | Zdroj |
|---|---|
| Aimtec Hackathon | aimtechackathon.cz (`#` značka) |
| Programuj.si | vyříznutá šipka z loga na programuj.si — jejich favicon je výchozí ikona Blazoru |
| AI olympiáda | favicon aiolympiada.cz |
| Náboj Junior | ikona z junior.naboj.org |
| MaSO | favicon maso.mff.cuni.cz |
| Matematická olympiáda | značka z hlavičky matematickaolympiada.cz, na bílé dlaždici (tmavě modrá by na tmavém pozadí zanikla) |
| Fyzikální olympiáda | **galaxie** z loga FO, kruhový výřez s jantarovým prstencem, při najetí na řádek se otáčí (`.complogo--fo`) |
| Technická olympiáda | značka **ZČU** na bílé dlaždici — soutěž nemá vlastní logo, krajské kolo pořádá ZČU |
| Campfire GameJam | Hack Club Campfire (má i plzeňskou edici) |

## Přístupnost a chování

- Kontrast: veškerý text splňuje WCAG AA proti `--color-bg` s rezervou —
  běžný text 10,5:1, malé popisky 7,5:1. Když budeš ladit `--color-neutral-*`,
  drž se nad 4,5:1.
- Zaměřovač (kurzor) a scroll reveal respektují `prefers-reduced-motion`.
- Zaměřovač se aktivuje na první skutečný pohyb myši (`pointermove` s
  `pointerType !== 'touch'`), ne na statický `matchMedia('(pointer: fine)')`.
  Ten se na hybridních noteboocích (dotyková obrazovka + myš/touchpad) umí
  hlásit jako `coarse`, i když myš reálně funguje — takže by zaměřovač
  natvrdo zůstal vypnutý. Reakce na skutečný pohyb je spolehlivá na všech
  zařízeních; čistě dotykový tap/scroll (`pointerType === 'touch'`) ho
  nespustí.
- Zaměřovač míří na: filtrační chipy, „Všechny výsledky", GitHub tlačítka, jednotlivé
  kontakty (`.contact__item`), sloupce tech stacku (`.stackgroup`), řádky, projekty.
  **Nemíří** na celý tech stack, celý kontakt ani celý panel filtrů (`:not()` v `RETICLE_SEL`).
  `closest()` jde od kurzoru ven, takže nový malý cíl přidej na **začátek** seznamu.
- Zaměřovač se překresluje i při scrollu (ne jen při pohybu myši): každý snímek
  znovu čte rámeček zaměřeného prvku a po scrollu přecílí přes `elementFromPoint`.
- Reveal je obousměrný — prvek, který odjede spodkem okna, se znovu „natáhne“,
  takže při dalším scrollu dolů animace proběhne znovu. Odjezd horní hranou se
  ignoruje, aby se obsah za tebou necukal.
- Tabulka soutěží se na úzkých displejích posouvá vodorovně ve vlastním kontejneru;
  stránka samotná nikdy nepřetéká.
- Tisk: reveal animace se vypnou, navigace a zaměřovač se skryjí.
- **Telefon (≤ 680 px):** navigace se při scrollu dolů schová a při scrollu nahoru
  vrátí (`setupNavAutoHide`) — na délku stránky nemá vliv, ale jinak trvale zabírá
  ~12 % výšky displeje. Tech stack je ve dvou sloupcích s ikonami 24 px; nic se
  neschovává, jen zhustí.
- **Telefon — projekty:** popis a tagy jsou sbalené, pod názvem je tlačítko „Detail"
  (`setupProjectToggles`); klepnutí na název projekt rozbalí. GitHub tlačítko zůstává
  vidět i sbalené. Na desktopu se tlačítko nezobrazuje a vše je vždy rozbalené.
