CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"username" varchar(255) NOT NULL CONSTRAINT "UX_users_username" UNIQUE,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "movies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"external_id" varchar(20) NOT NULL CONSTRAINT "UX_movies_externalId" UNIQUE,
	"title" varchar(255) NOT NULL,
	"year" integer NOT NULL,
	"genres" text[] DEFAULT '{}'::text[] NOT NULL,
	"plot" text NOT NULL,
	"rating" numeric(3,1),
	"votes" integer,
	"runtime" integer,
	"directors" text[] DEFAULT '{}'::text[] NOT NULL,
	"writers" text[] DEFAULT '{}'::text[] NOT NULL,
	"poster_url" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"movie_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"movie_id" uuid NOT NULL,
	"watched" boolean DEFAULT false NOT NULL,
	"rating" numeric(3,1),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "UX_library_entries_userId_movieId" UNIQUE("user_id","movie_id")
);
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_movie_id_movies_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("id");--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "library_entries" ADD CONSTRAINT "library_entries_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "library_entries" ADD CONSTRAINT "library_entries_movie_id_movies_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("id");