import type { DbExecutor } from "#database/client.js";
import { comments, type Comment, type CommentWithUser, type NewComment } from "#database/schema.js";
import type { PaginationParams } from "#schemas/common.schema.js";
import type { Page } from "#types/common.types.js";
import { and, eq, sql } from "drizzle-orm";

export const createCommentRepository = (db: DbExecutor) => {
  const findAllByUserIdAndMovieId = async (
    userId: string,
    movieId: string,
    pageable: PaginationParams,
  ): Promise<Page<Comment>> => {
    const [items, count] = await Promise.all([
      db.query.comments.findMany({
        where: {
          userId,
          movieId,
        },
        limit: pageable.size,
        offset: pageable.size * pageable.page,
      }),

      db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(comments)
        .where(and(eq(comments.userId, userId), eq(comments.movieId, movieId))),
    ]);

    return {
      items,
      page: pageable.page,
      size: pageable.size,
      total: Number(count[0]?.count ?? 0),
    };
  };

  const findAllByMovieId = async (
    movieId: string,
    pageable: PaginationParams,
  ): Promise<Page<CommentWithUser>> => {
    const [items, count] = await Promise.all([
      db.query.comments.findMany({
        where: {
          movieId,
        },
        with: {
          user: true,
        },
        orderBy: { createdAt: "desc" },
        limit: pageable.size,
        offset: pageable.size * pageable.page,
      }),

      db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(comments)
        .where(eq(comments.movieId, movieId)),
    ]);

    return {
      items,
      page: pageable.page,
      size: pageable.size,
      total: Number(count[0]?.count ?? 0),
    };
  };

  const createComment = async (comment: NewComment): Promise<Comment> => {
    const [created] = await db.insert(comments).values(comment).returning();
    return created;
  };

  return {
    findAllByUserIdAndMovieId,
    findAllByMovieId,
    createComment,
  };
};
