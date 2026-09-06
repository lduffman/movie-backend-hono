# Movie Backend — Hono

Contre-exemple « même concept, autre stack » du projet de référence [`movie-backend`](../movie-backend) (Spring Boot), pour le cours de Développement FullStack Polytech Nancy.

Même domaine, **mêmes tables** — mais backend **Hono (TypeScript)**, avec **Drizzle** pour l'ORM et les migrations. À lire en miroir du README Spring : le concept (modéliser, migrer) est identique, seul l'outillage change.

## Prérequis

- Node.js

## Installation

```bash
npm install
```

## Configuration

Renseigne un `.env` à la racine :

```dotenv
APP_NAME=movie-backend-hono
DATABASE_URL=postgresql://username:password@localhost:5432/movie_hono
```

L'environnement est validé au démarrage par Zod (`src/env.ts`) : une `DATABASE_URL` absente ou mal formée fait échouer le boot avec un message explicite. `.env.local` est prioritaire sur `.env`.

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
# → http://localhost:3000
```
