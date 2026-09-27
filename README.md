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
| `DEV_USER_ID` | oui | — | Id (UUID) de l'utilisateur « connecté » simulé — voir ci-dessous |
| `DEV_USERNAME` | oui | — | Username de cet utilisateur |
| `EXTERNAL_MOVIE_API_BASE_URL` | oui | — | URL du catalogue de films externe |
| `EXTERNAL_MOVIE_API_KEY` | oui | — | Clé d'API du catalogue externe (fournie par l'enseignant) |

L'environnement est validé au démarrage par Zod (`src/env.ts`) : une variable absente ou mal formée fait échouer le boot avec la liste des erreurs. `.env.local` est prioritaire sur `.env` — pratique pour tes secrets personnels.

> ℹ️ **Pas encore d'authentification sur cette étape** : l'utilisateur courant est simulé, comme le `DevCurrentUser` côté Spring. Pour qu'il existe en base : lance le serveur, crée un compte avec `POST /auth/register`, puis reporte l'`id` renvoyé dans `DEV_USER_ID` et redémarre.
>
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
    ├── middleware/     # requestContainer, errorHandler
    └── utils/          # hash de mot de passe, cache mémoire
```

Hono n'impose aucune structure : ce découpage est **un choix**, calqué sur les couches du projet Spring.

### Le contexte de requête (injection de dépendances « à la main »)

Côté Spring, le conteneur injecte les services et `CurrentUser` donne l'utilisateur connecté. Ici, c'est le middleware global `requestContainer` qui joue ce rôle : il construit les services de la requête avec leurs dépendances, `createServices({ db, currentUser })`, et les pose dans `c.var.services`.

Sur cette étape, `currentUser` est l'utilisateur simulé du `.env`. Sur `step-3-auth`, il sera lu dans le JWT — **sans changer une ligne des services**.

Les routes n'instancient donc rien :

```ts
libraryRoutes.get("/", validate("query", searchLibrarySchema), async (c) => {
  const { watched, page, size } = c.req.valid("query");
  return c.json(await c.var.services.library.getMyLibrary({ page, size }, watched));
});
```

Et les services ne connaissent pas Hono : ils reçoivent un `CurrentUser` (`id()`, `username()`) et ne savent pas d'où il vient.

### Correspondances avec Spring

| Spring (`movie-backend`) | Hono (`movie-backend-hono`) |
|---|---|
| `@RestController` | `routes/*.routes.ts` |
| `@Service` + injection par constructeur | factory `createXxxService(deps)` + `createServices` |
| `JpaRepository` / `@Query` | `repositories/*.repository.ts` (Drizzle) |
| DTO + `@Valid` (Bean Validation) | schéma Zod + `validate(...)` |
| `ApiException` + `@RestControllerAdvice` | `AppError` + `app.onError(errorHandler)` |
| `CurrentUser` / `DevCurrentUser` | `CurrentUser` / `createCurrentUser` + `DEV_USER_ID` |
| `@HttpExchange` + `RestClient` | `clients/externalMovie.client.ts` (`fetch`) |
| `@Cacheable` | `createMemoryCache` (`core/utils/memory-cache.ts`) |
| Liquibase / Flyway | Drizzle Kit |
