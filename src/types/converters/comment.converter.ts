import type { CommentWithUser } from "#database/schema.js";
import type { CommentDto } from "#schemas/movie.schema.js";

export const mapToCommentDto = (comment: CommentWithUser): CommentDto => {
  const author = comment.user.firstName + " " + comment.user.lastName;

  return {
    id: comment.id,
    movieId: comment.movieId,
    author: author,
    title: comment.title,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
  };
};
