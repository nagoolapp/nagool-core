import { z } from "zod";

export const ChatMessageBodySchema = z.object({
  sessionId: z.string().min(8),
  text: z.string().min(1).max(5000),
});

export type ChatMessageBody = z.infer<typeof ChatMessageBodySchema>;

export const ChatMessageReplySchema = z.object({
  replyText: z.string(),
  sessionId: z.string(),
});
