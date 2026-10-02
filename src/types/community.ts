export interface Comment {
  id: string;
  postId: string;
  author: {
    username: string;
    avatarUrl: string | null;
  };
  body: string;
  isOwnComment: boolean;
  canDelete: boolean; // auteur du commentaire OU auteur du post
  createdAt: string;
}

export interface CommentInput {
  body: string;
}

export interface FollowStatusResponse {
  isFollowing: boolean;
  followerCount: number;
  followingCount: number;
}

export interface ReportInput {
  reason: string;
}