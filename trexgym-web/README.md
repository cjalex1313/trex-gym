# trexgym-web

Dashboard web pentru TRexGYM (Vue 3 + Vite + PrimeVue), implementat pentru Phase 2 din planul de dezvoltare.

## Funcționalități Phase 2

- Autentificare admin (`/login`) cu persistență token în `localStorage`
- Client API cu interceptor JWT și redirecționare automată la `401`
- Rute protejate cu guard (`/dashboard`, `/clients`, `/settings`)
- Management clienți:
  - listă paginată + căutare
  - detalii client
  - adăugare client (cu afișare PIN generat)
  - editare client
  - suspendare client
- Toast-uri pentru succes/eroare + skeleton loading states
- Copy UI în limba română (`ro-RO`)

## Configurare

1. Instalează dependențele:

```sh
npm install
```

2. Configurează URL-ul API (opțional):

```sh
VITE_API_BASE_URL=http://localhost:3000/api
```

3. Rulează aplicația:

```sh
npm run dev
```

## Scripturi utile

```sh
npm run build
npm run test:unit
npm run test:e2e
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:ci
npm run lint
```

## Note pentru E2E

- `test:e2e:chromium` este varianta recomandată pentru rulare locală rapidă.
- `test:e2e:firefox` validează compatibilitatea cross-browser.
- `test:e2e:ci` rulează headless (config CI) și este potrivit pentru pipeline.
- Scripturile E2E rulează cu `--workers=1` pentru a evita flakiness cauzat de rate limiting pe endpoint-urile de autentificare.
