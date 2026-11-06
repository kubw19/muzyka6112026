# Publikacja Prima na GitHub Pages

Projekt jest przygotowany do automatycznej publikacji przez GitHub Actions. Nie potrzebujesz backendu, własnego serwera ani tokena zapisanego w kodzie. Workflow uruchamia testy, buduje aplikację i publikuje `dist` po każdym pushu do `main` oraz na żądanie. Ścieżkę aplikacji pobiera z konfiguracji Pages — nie musisz wpisywać nazwy repozytorium w Vite.

## Pierwsza publikacja

1. Na https://github.com/new utwórz **puste publiczne repozytorium**, np. `muzyka`. Nie dodawaj README, licencji ani `.gitignore`, ponieważ lokalny projekt ma już swoje pliki i historię.
2. Otwórz na GitHubie repozytorium i wybierz **Settings → Pages → Build and deployment → Source → GitHub Actions**. Nie wybieraj „Deploy from a branch”. Nie musisz tworzyć kolejnego workflow — właściwy plik jest już w `.github/workflows/deploy-pages.yml`.
3. Otwórz PowerShell i wykonaj poniższe polecenia. Zastąp `TWOJ_LOGIN` swoim loginem GitHub i `muzyka` nazwą utworzonego repozytorium, jeśli jest inna:

```powershell
cd C:\repos\muzyka
git remote add origin https://github.com/TWOJ_LOGIN/muzyka.git
git push -u origin main
```

Przy pierwszym pushu Git może otworzyć logowanie GitHub w przeglądarce. Nie wpisuj hasła ani tokena do plików projektu.

4. Wejdź do zakładki **Actions** i otwórz **Deploy Prima to GitHub Pages**. Poczekaj, aż zadania `build` i `deploy` zakończą się na zielono.
5. Otwórz **Settings → Pages → Visit site** albo adres pokazany przy wdrożeniu. Zwykle będzie to `https://TWOJ_LOGIN.github.io/muzyka/`. Dokładny adres podaje GitHub; dla repozytorium `TWOJ_LOGIN.github.io` będzie to domena bez podkatalogu.
6. Zezwól stronie na mikrofon. Po pojawieniu się „Gotowe do pracy offline” aplikacja będzie dostępna również po odłączeniu internetu. Ustawienia zapisane wcześniej na localhost nie przenoszą się automatycznie na domenę GitHub Pages.

## Kolejne aktualizacje

```powershell
cd C:\repos\muzyka
git add .
git commit -m "Opis zmian"
git push
```

Każdy push do `main` uruchamia publikację. Jeżeli aplikacja jest już otwarta, odśwież ją; gdy pojawi się „Dostępna jest nowa wersja”, kliknij **Zaktualizuj**.

## Najczęstsze problemy

- **Configure Pages zgłasza błąd:** sprawdź, czy w Settings → Pages źródłem są GitHub Actions. Po zmianie otwórz Actions → Deploy Prima to GitHub Pages → Run workflow → main.
- **Actions są zablokowane:** w Settings → Actions → General włącz uruchamianie workflow i wymagane oficjalne akcje. W organizacji może być potrzebna zmiana polityki przez administratora.
- **Git odmawia pushu, bo repozytorium nie jest puste:** nie używaj force push. Najprościej załóż nowe puste repozytorium albo połącz historie świadomie.
- **Remote origin already exists:** sprawdź `git remote -v`; jeżeli adres jest błędny, ustaw `git remote set-url origin https://github.com/TWOJ_LOGIN/muzyka.git`.
- **Brak zmian do commita:** pliki są już zapisane w historii; wykonaj samo `git push`.
- **Stara wersja aplikacji:** odśwież stronę i użyj przycisku Zaktualizuj. Pamięć offline może chwilowo wyświetlać poprzednią wersję.

## Lokalne sprawdzenie ścieżki Pages

```powershell
$env:VITE_BASE_PATH = '/muzyka/'
npm run build
Remove-Item Env:VITE_BASE_PATH
```

Zwykły `npm run build` nadal tworzy przenośną wersję z relatywnymi ścieżkami. Na GitHubie workflow ustala właściwą ścieżkę automatycznie, również dla domeny własnej skonfigurowanej w Pages. Własna domena i DNS wymagają oddzielnego skonfigurowania w GitHubie.

Dokumentacja: https://vite.dev/guide/static-deploy#github-pages oraz https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
