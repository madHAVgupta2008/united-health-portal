import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  userId: string;
  content: string;
  sender: 'user' | 'bot';
  createdAt: string;
}

/**
 * Fetch chat history for a user
 */
export const getChatHistory = async (userId: string): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }

  return data.map(msg => ({
    id: msg.id,
    userId: msg.user_id,
    content: msg.content,
    sender: msg.sender,
    createdAt: msg.created_at || new Date().toISOString(),
  }));
};

/**
 * Save a chat message
 */
export const saveChatMessage = async (
  userId: string,
  content: string,
  sender: 'user' | 'bot'
): Promise<ChatMessage> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      user_id: userId,
      content,
      sender,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving chat message:', error);
    throw error;
  }

  return {
    id: data.id,
    userId: data.user_id,
    content: data.content,
    sender: data.sender,
    createdAt: data.created_at || new Date().toISOString(),
  };
};

/**
 * Clear chat history for a user
 */
export const clearChatHistory = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('Error clearing chat history:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time chat updates
 */
export const subscribeToChatMessages = (
  userId: string,
  callback: (message: ChatMessage) => void
) => {
  const subscription = supabase
    .channel('chat_messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const msg = payload.new;
        callback({
          id: msg.id,
          userId: msg.user_id,
          content: msg.content,
          sender: msg.sender,
          createdAt: msg.created_at || new Date().toISOString(),
        });
      }
    )
    .subscribe();

  return subscription;
};
