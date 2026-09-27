# Movie Backend — Hono

Contre-exemple « même concept, autre stack » du projet de référence [`movie-backend`](../movie-backend) (Spring Boot), pour le cours de Développement FullStack Polytech Nancy.

Même domaine, **mêmes tables** — mais backend **Hono (TypeScript)**, avec **Drizzle** pour l'ORM et les migrations. À lire en miroir du README Spring : le concept (modéliser, migrer) est identique, seul l'outillage change.

## Prérequis

- Node.js 22+
- Une base PostgreSQL (par ex. celle du `sql-playground`, exposée sur le port `15432`) avec une base dédiée, ex. `movie-db-hono`

## Installation

```bash
npm install
```

## Configuration

Copie le modèle puis adapte les valeurs :

```bash
cp .env.example .env
```

| Variable | Obligatoire | Défaut | Rôle |
|---|---|---|---|
| `APP_NAME` | oui | — | Nom de l'application |
| `NODE_ENV` | non | `development` | `development` ou `production` |
| `PORT` | non | `3000` | Port HTTP du serveur |
| `DATABASE_URL` | oui | — | URL PostgreSQL (`postgresql://user:password@host:port/db`) |
| `CORS_ALLOWED_ORIGINS` | oui | — | Origines autorisées, séparées par des virgules (ex. `http://localhost:5173`) |
| `JWT_ISSUER` | oui | — | Émetteur (`iss`) des tokens |
| `JWT_SECRET` | oui | — | Secret de signature HS256 — 32 caractères minimum recommandés (`openssl rand -base64 32`) |
| `JWT_EXPIRATION_TIME` | non | `3600` | Durée de validité d'un token, en secondes |
| `EXTERNAL_MOVIE_API_BASE_URL` | oui | — | URL du catalogue de films externe |
| `EXTERNAL_MOVIE_API_KEY` | oui | — | Clé d'API du catalogue externe (fournie par l'enseignant) |

L'environnement est validé au démarrage par Zod (`src/env.ts`) : une variable absente ou mal formée fait échouer le boot avec la liste des erreurs. `.env.local` est prioritaire sur `.env` — pratique pour tes secrets personnels.

> ⚠️ `.env` et `.env.local` sont dans le `.gitignore` : **aucun secret ne doit être commité**. Seul `.env.example` est versionné.
>
> ℹ️ `drizzle-kit` (commandes `db:*`) ne lit que `.env` (via `dotenv/config` dans `drizzle.config.ts`) : la `DATABASE_URL` doit donc y figurer, même si tu utilises `.env.local` pour le reste.

## Migrations (Drizzle)

Le schéma est décrit en **TypeScript** dans `src/database/tables/*.ts` (agrégés par `src/database/schema.ts`). Workflow miroir de Liquibase/Flyway côté Spring :

1. Modifie ou ajoute une table dans `src/database/tables/`.
2. Génère le fichier de migration SQL (diff entre le schéma TS et l'état précédent), écrit dans `drizzle/` :

```bash
npm run db:generate
```

3. Relis le SQL généré — comme un changeset Liquibase, c'est un brouillon à vérifier.
4. Applique à la base :

```bash
npm run db:migrate
```

Autres commandes utiles :

```bash
npm run db:check     # cohérence des migrations
npm run db:studio    # explorateur de schéma dans le navigateur
```

> ℹ️ Drizzle trace ses migrations appliquées dans la table `__drizzle_migrations` (schéma `drizzle`) — l'équivalent du `flyway_schema_history` de Flyway ou du `DATABASECHANGELOG` de Liquibase.

## Lancer le serveur

```bash
npm run dev          # tsx watch, rechargement à chaud
# → http://localhost:3000/health
```

Build de production :

```bash
npm run build && npm start
```

## Endpoints

Même contrat que le backend Spring (`movie-backend/docs/movie-library.openapi.yaml`) : un front peut utiliser l'un ou l'autre sans changement.

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Inscription → `201` |
| `POST` | `/auth/login` | — | Connexion → `{ accessToken, tokenType, expiresIn }` |
| `GET` | `/movies/search?q=&genre=&page=&size=&sort=` | — | Recherche paginée (`sort` ∈ `title, year, rating, runtime, votes`) |
| `GET` | `/movies/genres` | — | Genres distincts (mis en cache) |
| `GET` | `/movies/{movieId}` | — | Détail d'un film |
| `GET` | `/movies/{movieId}/comments?page=&size=` | — | Commentaires, du plus récent au plus ancien (`404` si le film n'existe pas) |
| `POST` | `/movies/{movieId}/comments` | ✅ | Ajouter un commentaire → `201` |
| `GET` | `/me/library?watched=&page=&size=&sort=` | ✅ | Ma bibliothèque (`sort` ∈ `createdAt, rating, watched, movie.title, movie.year`, défaut `createdAt,desc`) |
| `GET` | `/me/library/{movieId}` | ✅ | Une entrée de ma bibliothèque |
| `PUT` | `/me/library/{movieId}` | ✅ | Ajouter / modifier (`{ watched, rating }`) |
| `DELETE` | `/me/library/{movieId}` | ✅ | Retirer → `204` (`404` si absent de la bibliothèque) |
| `GET` | `/external/movies?query=` | — | Recherche dans le catalogue externe |

Routes ✅ : header `Authorization: Bearer <accessToken>`.

Erreurs — même format que Spring :

```json
{ "status": 404, "message": "Movie not found", "timestamp": "…" }
{ "status": 400, "message": "Invalid request", "timestamp": "…",
  "errors": [{ "field": "movieId", "message": "Invalid UUID" }] }
```

## Architecture

```
src/
├── app.ts              # assemblage : middlewares globaux + routes
├── env.ts              # configuration validée par Zod
├── routes/             # ≈ controllers : HTTP, validation, status
├── services/           # logique métier (+ index.ts : createServices)
├── repositories/       # accès aux données (Drizzle)
├── schemas/            # schémas Zod = validation ET types des DTO
├── types/converters/   # mapping entité → DTO
├── clients/            # client HTTP du catalogue externe
├── database/           # tables Drizzle, relations, client
└── core/
    ├── context/        # AppEnv (c.var.*) + CurrentUser
    ├── errors/         # AppError & co + wrapper de validation
    ├── middleware/     # authenticate / requireAuth, requestContainer, errorHandler
    └── utils/          # hash de mot de passe, cache mémoire
```

Hono n'impose aucune structure : ce découpage est **un choix**, calqué sur les couches du projet Spring.

### Le contexte de requête (injection de dépendances « à la main »)

Côté Spring, le conteneur injecte les services et `CurrentUser` donne l'utilisateur connecté. Ici, deux middlewares globaux jouent ce rôle :

1. `authenticate` — si un header `Authorization` est présent, vérifie le JWT (`401` s'il est invalide) et pose `c.var.user`.
2. `requestContainer` — construit les services de la requête avec leurs dépendances, `createServices({ db, currentUser })`, et les pose dans `c.var.services`.

Les routes n'instancient donc rien :

```ts
libraryRoutes.get("/", validate("query", searchLibrarySchema), async (c) => {
  const { watched, page, size } = c.req.valid("query");
  return c.json(await c.var.services.library.getMyLibrary({ page, size }, watched));
});
```

Et les services ne connaissent pas Hono : ils reçoivent un `CurrentUser` dont `id()` lève une `UnauthorizedError` si personne n'est connecté. Les routes privées sont protégées par `requireAuth`.

### Correspondances avec Spring

| Spring (`movie-backend`) | Hono (`movie-backend-hono`) |
|---|---|
| `@RestController` | `routes/*.routes.ts` |
| `@Service` + injection par constructeur | factory `createXxxService(deps)` + `createServices` |
| `JpaRepository` / `@Query` | `repositories/*.repository.ts` (Drizzle) |
| DTO + `@Valid` (Bean Validation) | schéma Zod + `validate(...)` |
| `ApiException` + `@RestControllerAdvice` | `AppError` + `app.onError(errorHandler)` |
| `SecurityFilterChain` + `oauth2ResourceServer` | `authenticate` + `requireAuth` |
| `CurrentUser` / `SecurityCurrentUser` | `CurrentUser` / `createCurrentUser` |
| `@HttpExchange` + `RestClient` | `clients/externalMovie.client.ts` (`fetch`) |
| `@Cacheable` | `createMemoryCache` (`core/utils/memory-cache.ts`) |
| Liquibase / Flyway | Drizzle Kit |

> ℹ️ Pourquoi pas le middleware `hono/cache` ? Il repose sur la Web Cache API (Cloudflare Workers, Deno…), absente de Node : il ne mettait rien en cache ici. Le cache mémoire vit au niveau du module (les services, eux, sont recréés à chaque requête) et expire au bout de 10 minutes.
