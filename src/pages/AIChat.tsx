import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Bot, User, Sparkles, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage } from '@/types';
import { cn } from '@/lib/utils';

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: "Hello! I'm your United Health AI assistant. I can help you with questions about your insurance, bills, claims, and more. How can I assist you today?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
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

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response (replace with actual AI integration)
    setTimeout(() => {
      const botResponses: { [key: string]: string } = {
        deductible: "Your current deductible is $500 for in-network services and $1,000 for out-of-network services. You've met $320 of your in-network deductible so far this year.",
        claim: "To file a claim, you can:\n1. Upload your bill in the Hospital Bills section\n2. Our team will process it within 3-5 business days\n3. You'll receive an Explanation of Benefits (EOB) via email\n\nWould you like me to guide you through the upload process?",
        coverage: "Your Premium Gold plan includes:\n• Preventive care: 100% covered\n• Primary care visits: $25 copay\n• Specialist visits: $50 copay\n• Emergency room: $250 copay\n• Prescription drugs: $10/$30/$60 tiered copays\n\nIs there a specific service you'd like to know about?",
        status: "I can help you check your claim status! Please provide your claim number, or I can look up your recent claims. Your last submitted claim (#CLM-2024-78542) is currently in processing and should be resolved within 2 business days.",
      };

      let response = "I understand you're asking about your healthcare. Could you please provide more details so I can assist you better? You can ask about:\n• Insurance coverage\n• Claims and billing\n• Finding providers\n• Understanding your benefits";

      const lowerInput = inputValue.toLowerCase();
      if (lowerInput.includes('deductible')) {
        response = botResponses.deductible;
      } else if (lowerInput.includes('claim') || lowerInput.includes('file')) {
        response = botResponses.claim;
      } else if (lowerInput.includes('coverage') || lowerInput.includes('explain')) {
        response = botResponses.coverage;
      } else if (lowerInput.includes('status') || lowerInput.includes('check')) {
        response = botResponses.status;
      }

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
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
                  placeholder="Type your question..."
                  className="flex-1 h-12 input-focus"
                />
                <Button type="submit" className="h-12 px-6 btn-primary" disabled={!inputValue.trim()}>
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
