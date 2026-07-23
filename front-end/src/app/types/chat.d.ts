import type { DummyUserProfile, PublicUserProfileData, USERTYPE } from "./user";

export const WSEvTypeObject = {
  TYPING: "typing",
  MESSAGE: "message",
  INIT: "init",
} as const;

export type WSEvType = (typeof WSEvTypeObject)[keyof typeof WSEvTypeObject];

interface WSOngoingPayload {
  // Dummy must have
  userId?: string;
  userName: string;
  userEmail?: string;
  userAvatarUrl?: string;
  userType: USERTYPE;
}
export interface userIsTyping extends WSOngoingPayload {
  isTyping: boolean;
}
export interface ChatMessage extends WSOngoingPayload {
  id: string;
  message: string;
  timestamp: string | Date;
}
interface WSEvent {
  type: WSEvType;
  payload: WSOngoingPayload | ChatBox;
}

export interface ChatBox {
  chatGroupName: string;
  chatCaption?: string;
  expiresAt?: Date | string;
  avatarUrl?: string;
  messages: ChatMessage[];
  participants: PublicUserProfileData[];
}
export interface DummyChatBox extends Omit<ChatBox, "participants"> {
  participants: DummyUserProfile[];
}
export interface WSTyping {
  evType: "typing";
  payload: userIsTyping;
}
export interface WSNewMessage {
  evType: "message";
  payload: ChatMessage;
}

export type WSEvent = WSTyping | WSNewMessage;
