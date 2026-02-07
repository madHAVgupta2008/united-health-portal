import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage } from '@/types';
import { cn } from '@/lib/utils';
import { useDatabase } from '@/contexts/DatabaseContext';
import { generateAIResponse } from '@/services/ai';

const AIChat: React.FC = () => {
  const { chatHistory: messages, addChatMessage } = useDatabase();
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

    if (!messageOverride) setInputValue(''); // Clear input if typed manually
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: textToSend,
      sender: 'user',
      timestamp: new Date(),
    };

    try {
      // Add user message
      await addChatMessage(userMessage);
      setIsTyping(true);

      // Prepare context from recent messages (last 5)
      const context = messages.slice(-5).map(m => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');

      try {
        const response = await generateAIResponse(textToSend, context);

        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: response,
          sender: 'bot',
          timestamp: new Date(),
        };

        await addChatMessage(botMessage);
      } catch (aiError) {
        console.error('AI Response Error:', aiError);
        // Still show an error message to the user
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
          sender: 'bot',
          timestamp: new Date(),
        };
        await addChatMessage(errorMessage);
      }
    } catch (error) {
      console.error('Chat error:', error);
      // If we couldn't save the user message, show an error
      alert('Failed to send message. Please check your connection and try again.');
      // Restore the input if it was typed
      if (!messageOverride) setInputValue(textToSend);
    } finally {
      setIsTyping(false);
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
          <CardHeader className="border-b border-border shrink-0">
            <CardTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-lg font-semibold">Health Assistant</p>
                <p className="text-sm text-muted-foreground font-normal">Powered by AI</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3 animate-slide-up',
                    message.sender === 'user' ? 'flex-row-reverse' : ''
                  )}
                >
                  <div
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                      message.sender === 'user'
                        ? 'bg-primary'
                        : 'gradient-primary'
                    )}
                  >
                    {message.sender === 'user' ? (
                      <User className="w-5 h-5 text-primary-foreground" />
                    ) : (
                      <Bot className="w-5 h-5 text-primary-foreground" />
                    )}
                  </div>
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-3',
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground'
                    )}
                  >
                    <p className="whitespace-pre-line">{message.content}</p>
                    <p
                      className={cn(
                        'text-xs mt-2',
                        message.sender === 'user'
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      )}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}

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
