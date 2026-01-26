import { prisma } from './db';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export interface ConversationWithMessages {
  id: string;
  sessionId: string;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export async function getConversationBySessionId(
  sessionId: string
): Promise<ConversationWithMessages | null> {
  const conversation = await prisma.conversation.findFirst({
    where: { sessionId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  if (!conversation) return null;

  return {
    id: conversation.id,
    sessionId: conversation.sessionId,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    messages: conversation.messages.map((m) => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      createdAt: m.createdAt,
    })),
  };
}

export async function createConversation(
  sessionId: string
): Promise<ConversationWithMessages> {
  const conversation = await prisma.conversation.create({
    data: { sessionId },
    include: { messages: true },
  });

  return {
    id: conversation.id,
    sessionId: conversation.sessionId,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    messages: [],
  };
}

export async function getOrCreateConversation(
  sessionId: string
): Promise<ConversationWithMessages> {
  const existing = await getConversationBySessionId(sessionId);
  if (existing) return existing;
  return createConversation(sessionId);
}

export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<ConversationMessage> {
  const message = await prisma.message.create({
    data: {
      conversationId,
      role,
      content,
    },
  });

  // Update conversation's updatedAt timestamp
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return {
    id: message.id,
    role: message.role as 'user' | 'assistant',
    content: message.content,
    createdAt: message.createdAt,
  };
}

export async function deleteConversationBySessionId(
  sessionId: string
): Promise<boolean> {
  const result = await prisma.conversation.deleteMany({
    where: { sessionId },
  });

  return result.count > 0;
}

export async function deleteOldConversations(daysOld: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.conversation.deleteMany({
    where: {
      updatedAt: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}
