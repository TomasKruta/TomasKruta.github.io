Fotky do galerie
================

1. Fotky (JPG/PNG/WebP) dej do teto slozky, napr. gallery/tym.jpg.
   Idealne zmensene na max. ~1600 px na delsi strane, at se stranka nacita rychle.

2. V ../index.html v sekci "Galerie" (div.gallery) jsou zakomentovane sablony
   <figure>. Odkomentuj nebo zkopiruj jednu a uprav:
     - href a src  -> cesta k souboru (napr. gallery/tym.jpg)
     - width/height -> skutecne rozmery fotky (kvuli rozlozeni pri nacitani)
     - alt          -> kratky popis fotky
     - figcaption   -> data-cs a data-en, text uvnitr musi byt stejny jako data-cs

   <figure class="gallery__item">
     <a href="gallery/tym.jpg">
       <img src="gallery/tym.jpg" loading="lazy" width="1600" height="1067" alt="Tym na vyhlaseni">
     </a>
     <figcaption data-cs="Tym na vyhlaseni" data-en="The team at the award ceremony">Tym na vyhlaseni</figcaption>
   </figure>

Lightbox (zvetseni po kliknuti, sipky, Esc) funguje automaticky pro kazdou
<figure class="gallery__item"> v galerii. Kdyz chces mit jako prvni vlastni fotku,
klidne nahled z YouTube smaz nebo posun na konec.
