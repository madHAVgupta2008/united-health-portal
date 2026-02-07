import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, HelpCircle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage } from '@/types';
import { cn } from '@/lib/utils';
import { useDatabase } from '@/contexts/DatabaseContext';
import { generateAIResponse } from '@/services/ai';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MessageFormatter } from '@/components/ui/MessageFormatter';

const AIChat: React.FC = () => {
  const { chatHistory: messages, addChatMessage, clearChat } = useDatabase();
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickQuestions = [
    "What's my deductible?",
    "How do I file a claim?",
    "Explain my coverage",
    "Check claim status",
  ];

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
    // Auto-send the question for better UX
    setTimeout(() => {
      // We need to use the ref or a direct call, but since state update is async, 
      // we'll just manually trigger the send logic with the specific text
      // This is a bit hacky, cleaner way is to separate send logic
      // But for now let's just update state and let user click or 
      // safer: refactor handleSend to accept an optional argument
      handleSend(question);
    }, 0);
  };

  // Refactored handleSend to accept optional message
  const handleSend = async (messageOverride?: string) => {
    const textToSend = messageOverride || inputValue;
    if (!textToSend.trim() || isTyping) return;

    // Add user message
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: textToSend,
      sender: 'user',
      timestamp: new Date(),
    };

    // Use Context function to save AND update state
    addChatMessage(newMessage);

    // Clear input if it was from inputValue
    if (!messageOverride) setInputValue('');
    setIsTyping(true);

    try {
      // Generate formatted history for context
      const historyContext = messages
        .slice(-5) // Last 5 messages for context
        .map(m => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

      const response = await generateAIResponse(textToSend, historyContext);

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'bot',
        timestamp: new Date(),
      };

      addChatMessage(botMessage);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I encountered an error. Please try again.",
        sender: 'bot',
        timestamp: new Date(),
      };
      addChatMessage(errorMessage);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = async () => {
    try {
      await clearChat();
    } catch (error) {
      console.error('Failed to clear chat:', error);
      alert('Failed to clear chat history.');
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">AI Health Assistant</h1>
        <p className="text-muted-foreground mt-1">
          Get instant answers to your healthcare questions
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        {/* Chat Window */}
        <Card className="card-elevated lg:col-span-3 flex flex-col min-h-0">
          <CardHeader className="border-b border-border shrink-0 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-lg font-semibold">Health Assistant</p>
                <p className="text-sm text-muted-foreground font-normal">Powered by AI</p>
              </div>
            </CardTitle>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" title="Clear Chat">
                  <Trash2 className="w-5 h-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear Chat History?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove all your chat messages. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearChat} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Clear Chat
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                  <Bot className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-lg font-medium">No messages yet</p>
                  <p className="text-sm">Start a conversation by asking a question or selecting a quick topic.</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id || message.timestamp.toString()} // Prefer stable ID
                    className={cn(
                      "flex gap-3 max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300",
                      message.sender === 'user' ? "self-end flex-row-reverse" : "self-start"
                    )}
                  >
                    {/* Avatar */}
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shadow-sm shrink-0",
                      message.sender === 'user'
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground border border-border/50"
                    )}>
                      {message.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-5 h-5" />}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={cn(
                        "rounded-2xl px-5 py-3 shadow-sm",
                        message.sender === 'user'
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-card border border-border/50 text-card-foreground rounded-tl-none"
                      )}
                    >
                      {/* Content with formatter */}
                      <MessageFormatter
                        content={message.content}
                        sender={message.sender as 'user' | 'bot'}
                      />

                      {/* Timestamp if available (optional) */}
                      {message.timestamp && (
                        <div className={cn(
                          "text-[10px] mt-1 opacity-60",
                          message.sender === 'user' ? "text-right" : "text-left"
                        )}>
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="bg-secondary rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border p-4 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-3"
              >
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={isTyping ? "Assistant is typing..." : "Type your question..."}
                  className="flex-1 h-12 input-focus"
                  disabled={isTyping}
                />
                <Button type="submit" className="h-12 px-6 btn-primary" disabled={!inputValue.trim() || isTyping}>
                  <Send className="w-5 h-5" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="w-5 h-5 text-primary" />
                Quick Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => handleQuickQuestion(question)}
                  className="w-full text-left p-3 rounded-lg bg-secondary/50 hover:bg-secondary text-sm text-foreground transition-colors"
                >
                  {question}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <HelpCircle className="w-5 h-5 text-primary" />
                About the Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Our AI assistant can help you understand your coverage, check claim statuses, and answer general healthcare questions. For complex issues, we'll connect you with a human representative.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
