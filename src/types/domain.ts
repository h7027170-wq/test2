// Contract between screens and the service layer. A real API must return these shapes.

export type Role = "member" | "therapist" | "moderator" | "admin";
export type Tint = "sky" | "sage" | "lilac" | "sand";
export type Sensitivity = "standard" | "sensitive" | "high";
export type Mood = "heavy" | "low" | "okay" | "steady" | "light";
export type StoryKind = "story" | "checkin" | "win";
export type ReactionKind = "relate" | "strength" | "helped" | "thanks";
export type StoryStatus = "published" | "held" | "rejected" | "removed";
export type HoldReason = "pii" | "sensitive-community";
export type AgeRange = "18-24" | "25-34" | "35-44" | "45-54" | "55+";
export type AvatarShape = "leaf" | "moon" | "wave" | "sun" | "cloud" | "star" | "drop" | "hill";

export interface Avatar {
  shape: AvatarShape;
  tint: Tint;
}

export interface Community {
  id: string;
  tint: Tint;
  sensitivity: Sensitivity;
}

export interface PublicMember {
  id: string;
  nickname: string;
  avatar: Avatar;
  role: Role;
}

export interface Account extends PublicMember {
  /** Prototype only: a real API never sends password material to the browser. */
  passwordHash: string;
  recoveryCodeHash: string | null;
  recoveryEmail: string | null;
  emailVerified: boolean;
  ageRange: AgeRange;
  communities: string[];
  suspended: boolean;
  blocked: string[];
  createdAt: string;
}

export interface Story {
  id: string;
  communityId: string;
  authorId: string;
  kind: StoryKind;
  mood: Mood;
  title: string;
  body: string;
  veil: string | null;
  status: StoryStatus;
  holdReasons: HoldReason[];
  reactions: Record<ReactionKind, string[]>;
  createdAt: string;
  rejectReason?: string;
}

export interface Reply {
  id: string;
  storyId: string;
  parentId: string | null;
  authorId: string;
  body: string;
  relates: string[];
  status: "published" | "held" | "removed";
  createdAt: string;
}

export type NotificationKind = "reply" | "reaction" | "approved" | "rejected" | "welcome";

export interface Notification {
  id: string;
  accountId: string;
  kind: NotificationKind;
  storyId?: string;
  actorNickname?: string;
  read: boolean;
  createdAt: string;
}

export type ReportReason = "identifying" | "harmful" | "harassment" | "spam" | "other";

export interface Report {
  id: string;
  targetType: "story" | "reply";
  targetId: string;
  storyId: string;
  reporterId: string;
  reason: ReportReason;
  note: string;
  status: "open" | "dismissed" | "actioned";
  createdAt: string;
}

export interface Room {
  id: string;
  communityId: string;
  tint: Tint;
  live: boolean;
  members: number | null;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  authorNickname: string;
  avatar: Avatar;
  body: string;
  mine?: boolean;
  createdAt: string;
}

export interface StoryView extends Story {
  author: PublicMember;
  replyCount: number;
  saved: boolean;
}

export interface ReplyView extends Reply {
  author: PublicMember;
  children: ReplyView[];
}
