# Prima — śpiewanie z nut

Lokalna aplikacja React + TypeScript do czytania nut głosem. Bez backendu, kont i przesyłania dźwięku. Zapis nutowy: VexFlow. Mikrofon: Web Audio API + YIN. Interfejs po polsku.

## Publikacja na GitHub Pages

Instrukcja krok po kroku: [GITHUB_PAGES.md](GITHUB_PAGES.md). Automatyczny workflow testuje, buduje i publikuje aplikację po pushu do `main`.

## Uruchomienie

Wymagany Node.js 22.9 lub nowszy kompatybilny z Vite 6.

```sh
npm install
npm run dev
```

Otwórz adres localhost pokazany przez Vite i zezwól na mikrofon. Strona wymaga HTTPS lub localhost; otwieranie index.html przez file:// nie jest obsługiwane.

```sh
npm test
npm run build
npm run preview
```

Katalog `dist` to gotowa statyczna strona do dowolnego hostingu HTTPS (także w podkatalogu). Preview służy do lokalnej weryfikacji wersji produkcyjnej. Wersja deweloperska nie rejestruje service workera.

## Ćwiczenie

Wylosuj melodię, odsłuchaj pierwszy dźwięk, kliknij „Zacznij śpiewać”. Każda nuta wymaga ciągłego, pewnego odczytu przez 300 ms w granicach ±100 centów. Cisza i niepewne odczyty zerują licznik. Kolejne nuty dzieli jeden z zaznaczonych interwałów. Domyślnie ćwiczone są sekundy, tercje, kwarty i kwinty; generator preferuje różne odległości w tym samym takcie i ogranicza natychmiastowe powroty, jeśli istnieje alternatywa. Po zaliczeniu nuty następna wymaga zmiany wysokości o co najmniej 40 centów lub przerwy 120 ms, aby szeroka tolerancja nie zaliczała całej melodii jednym utrzymanym dźwiękiem. Rytm nie jest oceniany. Domyślnie można śpiewać w dowolnej oktawie; opcja dokładnej oktawy wymaga wysokości brzmiącej wynikającej z zapisu. Wybór ćwiczenia oktawy automatycznie włącza tę opcję. Obsługiwany zakres detektora: 65–1100 Hz, próg RMS: 0,008, próg pewności: 0,9. Słabe, zaszumione lub nieperiodyczne sygnały mogą nie zostać ocenione.

Nazewnictwo polskie: H oznacza B naturalne, B oznacza B obniżone. Detektor pokazuje nazwy chromatyczne; np. Cis i Des brzmią tak samo, ale zapis w wybranej tonacji zachowuje właściwą pisownię.

Odsłuch wyłącza mikrofon; trzeba go ponownie uruchomić. Przejście do innej karty zatrzymuje odsłuch i mikrofon. Zmiana tonacji rozpoczyna nowe ćwiczenie. Ustawienia są zapisywane w localStorage; dźwięk nie jest nagrywany ani zapisywany.

## Offline

Po pierwszym pełnym otwarciu **wersji produkcyjnej** pojawi się „Gotowe do pracy offline”. Dopiero wtedy można odłączyć internet i odświeżyć stronę. Service worker przechowuje lokalnie wszystkie pliki aplikacji, w tym zapis nutowy; nie korzysta z CDN. Do pierwszego załadowania potrzebne jest połączenie z hostingiem. Aktualizacje są proponowane przyciskiem, bez przeładowywania w trakcie ćwiczenia.

## Weryfikacja na prawdziwym mikrofonie

Testy automatyczne sprawdzają wysokości syntetyczne, harmoniczne, ciszę, szum, tolerancję i przechodzenie między nutami. Nie potwierdzają jakości rozpoznawania konkretnego głosu. Na swoim komputerze sprawdź: wolne śpiewanie czterech nut, celowe rozstrojenie, inną oktawę w obu trybach, ciszę, odmowę dostępu do mikrofonu oraz odświeżenie offline. Słuchawki i ciche otoczenie ułatwiają wiarygodny pomiar. Wersja docelowa: aktualny Chrome lub Edge na komputerze.

## Struktura

- `src/music.ts`: tonacje, poprawna pisownia nut, generowanie melodii i obliczenia wysokości.
- `src/audio`: niezależny detektor YIN, ewaluacja utrzymanej nuty oraz cykl życia mikrofonu i odsłuchu.
- `src/components/Score.tsx`: zapis VexFlow.
- `src/App.tsx`: pierwszy moduł i interakcje; kolejne moduły mogą korzystać ze wspólnej warstwy audio.

## Stan weryfikacji

Przeszło 194 testy automatycznych oraz build produkcyjny. W przeglądarce sprawdzono zapis nutowy, zmianę tonacji, podpowiedzi, zapis ustawień, stan odsłuchu, aktualizację service workera i odświeżenie z losowaniem melodii przy zatrzymanym serwerze. Rzeczywisty głos i mikrofon użytkownika pozostają do sprawdzenia.

`npm audit --omit=dev`: 0 podatności. Pełny audyt zgłasza 5 problemów w narzędziach budowania offline (2 niskie, 3 umiarkowane; zależności Workbox, glob, minimatch i deepmerge). `npm audit fix` nie usuwa ich w obecnym zestawie wersji. Te pakiety nie są dołączane jako kod aplikacji do przeglądarki. Narzędzie testowe zaktualizowano do wersji 4.1.12.

W ograniczonym środowisku Windows testy mogą wymagać ustawienia katalogu TEMP i TMP na zapisywalny katalog roboczy; podczas weryfikacji użyto `node_modules/.tmp`.


## Głosy, klucze i interwały

Wybór głosu ogranicza wszystkie generowane nuty do orientacyjnego zakresu: sopran C4–A5, alt F3–D5, tenor H2–G4, bas E2–C4. To zakresy referencyjne, a nie ocena możliwości konkretnej osoby. Zwykłe klucze wiolinowy, basowy, altowy i tenorowy zapisują rzeczywistą wysokość; wiolinowy oktawowy zapisuje nuty oktawę wyżej, a odtwarza i ocenia rzeczywistą wysokość (oznaczenie 8 pod kluczem). Tenor i bas domyślnie korzystają z klucza basowego, sopran i alt z wiolinowego. Preferencja klucza jest zapisywana osobno dla każdego głosu. Sama zmiana klucza zachowuje melodię i jej wysokości.

Zestaw ćwiczonych interwałów nie może być pusty. Można wybrać każdą odległość od sekundy małej do oktawy, w tym tryton, lub gotowe zestawy. Melodie pozostają diatoniczne w wybranej tonacji durowej; np. ćwiczenie samych sekund małych będzie korzystać z par mi–fa i si–do tej skali. Nie każdy zaznaczony interwał musi wystąpić w jednym czteronutowym takcie.

Zakładka Interwały pokazuje zapis, odległość w półtonach, odsłuch w górę, w dół lub równocześnie, poradę i skojarzenie z tytułem utworu dla właściwego kierunku. Przycisk „Ćwicz ten interwał w melodii” ustawia pojedynczy interwał w module śpiewania. Odsłuch to synteza pary dźwięków; aplikacja nie zawiera nagrań ani tekstów piosenek. Materiały i odsłuchy są dostępne offline, zewnętrzne źródła wymagają internetu.

Źródła referencyjne:
- Zakresy głosów: https://yalelibrary.atlassian.net/wiki/spaces/YMD/pages/202030334
- Skojarzenia piosenek i kierunków: https://www.earmaster.com/products/free-tools/interval-song-chart-generator.html

Dodatkowe testy obejmują wszystkie 15 tonacji, 4 głosy i 12 pojedynczych interwałów, urozmaicanie skoków, zgodność zakresów, brzmienie biblioteki, migrację starych ustawień, zapamiętywanie klucza, przechodzenie między modułami, wymuszanie dokładnej oktawy i zabezpieczenie przeciw zaliczaniu półtonowych melodii utrzymanym dźwiękiem.


## Tonacja, podpowiedzi i brzmienie

„Posłuchaj tonacji” gra równocześnie trójdźwięk toniczny (I–III–V) aktualnej tonacji, w obrębie zakresu wybranego głosu. Nie zmienia melodii ani postępu i, tak jak pozostałe odsłuchy, zatrzymuje mikrofon. Przycisk „Pokaż interwały” dodaje pod pięciolinią połączenia kolejnych nut z oznaczeniami i kierunkami skoków; można go przełączać bez resetowania ćwiczenia. Widoczność jest zapamiętywana lokalnie.

Brzmienie jest lokalną syntezą zbliżoną do pianina, nie próbką nagranego fortepianu: siedem harmonicznych, szybki atak, szybsze wygaszanie wysokich składowych i kompresor na wyjściu. Dźwięki wybrzmiewają około 1,9 s, akordy 2,3 s; kolejne dźwięki zaczynają się co 1,05 s. Zatrzymanie odsłuchu wyłącza wszystkie składowe.

## Ściągawka

Pozycja „Ściągawka” w menu zawiera interwały od prymy do oktawy: liczbę półtonów i tonów (także połówki), polskie i międzynarodowe oznaczenia, przykłady od C, zasady liczenia nazw literowych i półtonów, pisownię enharmoniczną oraz odwrócenia do oktawy. Przycisk prowadzi do odsłuchów w bibliotece. Materiał jest częścią aplikacji i działa offline.


## Rozpoznawanie interwału z zapisu

Moduł „Rozpoznaj interwał” losuje parę nut w wybranej tonacji, zakresie głosu i kluczu. Można włączyć znaki przygodne: krzyżyki, bemole i kasowniki. Numer interwału wynika z pisowni literowej, a jakość z liczby półtonów, więc kwarta zwiększona i kwinta zmniejszona są odrębnymi odpowiedziami mimo identycznego brzmienia. Każde pytanie ma sześć odpowiedzi; pierwsza próba jest liczona do wyniku. Po niej pojawia się wyjaśnienie. Zakres ćwiczeń: sekunda–oktawa, 1–12 półtonów, bez podwójnych znaków.

Zapis nutowy uwzględnia znaki przy kluczu we wszystkich oktawach oraz zmiany przygodne w obrębie taktu. Kasownik przywraca naturalną wysokość. W module śpiewania opcja „Znaki przy każdej nucie” dodaje jawny znak także przy dźwiękach wynikających już z tonacji (w tym kasownik przy dźwięku naturalnym jako podpowiedź). Nie zmienia melodii ani odtwarzanych wysokości i jest zapamiętywana lokalnie. Melodie śpiewane pozostają diatoniczne w wybranej tonacji.


## Ciągła praktyka i dźwięki chromatyczne

Przycisk „Dalej” ma większy obszar dotyku na telefonie i zachowuje aktywny mikrofon, również po ukończeniu melodii. Mikrofon można zatrzymać jego przyciskiem; nadal wyłącza się przy odsłuchu, zmianie modułu i ukryciu karty. Opcja „Automatycznie dalej” jest domyślnie wyłączona. Po włączeniu nowa melodia pojawia się 1,2 s po ukończeniu; ręczne Dalej, zatrzymanie mikrofonu lub zmiana modułu anulują oczekujące przejście.

Opcję „Znaki przy każdej nucie” zastąpiły „Dźwięki chromatyczne” (domyślnie włączone). Generator dodaje rzeczywiste dźwięki spoza tonacji z poprawnymi krzyżykami, bemolami i kasownikami, nie znaki przypominające przy każdej nucie. Zachowuje zakres głosu i zaznaczone interwały również pod względem pisowni. Wyłączenie tej opcji przywraca melodie diatoniczne. Oba ustawienia są zapisywane lokalnie.

Chromatyka jest losowana w około 30% ćwiczeń. Zwykle jest to jeden dźwięk spoza tonacji, rzadziej dwa. Limit dwóch dotyczy wszystkich wystąpień w czteronutowym ćwiczeniu, także powtórzeń tej samej nuty. Generator szuka kompletnej melodii z zachowaniem wybranych interwałów i zakresu; jeśli jest to niemożliwe, wybiera melodię diatoniczną.
