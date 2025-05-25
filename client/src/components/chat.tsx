import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Message, Conversation, User as UserType } from "@/lib/types";
import { format } from "date-fns";

interface ChatProps {
  isAdmin?: boolean;
}

export function Chat({ isAdmin = false }: ChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { lastMessage, sendMessage } = useWebSocket();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // For admin: get all students to chat with
  const { data: students = [] } = useQuery<UserType[]>({
    queryKey: ["/api/students"],
    enabled: isAdmin,
  });

  // For students: get conversations
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    enabled: !isAdmin,
  });

  // Get messages for selected conversation
  const { data: messages = [], refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: ["/api/messages", selectedUserId || "admin"],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedUserId) {
        params.append("with", selectedUserId.toString());
      }
      return fetch(`/api/messages?${params}`, { credentials: "include" }).then(res => res.json());
    },
    enabled: !!selectedUserId || !isAdmin,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; receiverId?: number }) => {
      return apiRequest("POST", "/api/messages", data);
    },
    onSuccess: () => {
      setMessageContent("");
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Mark messages as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (senderId: number) => {
      return apiRequest("PUT", "/api/messages/mark-read", { senderId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === "message") {
        refetchMessages();
        queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      } else if (lastMessage.type === "typing") {
        const { senderId, isTyping } = lastMessage.data;
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (isTyping) {
            newSet.add(senderId);
          } else {
            newSet.delete(senderId);
          }
          return newSet;
        });
        
        // Clear typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(senderId);
            return newSet;
          });
        }, 3000);
      }
    }
  }, [lastMessage, refetchMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-select admin for students or first student for admin
  useEffect(() => {
    if (!isAdmin && !selectedUserId) {
      // For students, chat with admin (user ID 1)
      setSelectedUserId(1);
    } else if (isAdmin && !selectedUserId && students.length > 0) {
      setSelectedUserId(students[0].id);
    }
  }, [isAdmin, selectedUserId, students]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedUserId && messages.length > 0) {
      const unreadMessages = messages.filter(
        msg => msg.senderId === selectedUserId && !msg.isRead
      );
      if (unreadMessages.length > 0) {
        markAsReadMutation.mutate(selectedUserId);
      }
    }
  }, [selectedUserId, messages, markAsReadMutation]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim()) return;

    const messageData = {
      content: messageContent.trim(),
      receiverId: isAdmin ? selectedUserId : 1, // Students send to admin (ID 1)
    };

    // Send via WebSocket for real-time delivery
    sendMessage({
      senderId: user!.id,
      receiverId: messageData.receiverId!,
      content: messageData.content,
      isFromAdmin: user!.role === "admin",
    });

    // Also save to database
    sendMessageMutation.mutate(messageData);
  };

  const selectedUser = isAdmin 
    ? students.find(s => s.id === selectedUserId)
    : { firstName: "SAO", lastName: "Admin", role: "admin" };

  if (isAdmin) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-96">
        <div className="flex h-full">
          {/* Student List */}
          <div className="w-1/3 border-r border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Student Conversations
              </h3>
            </div>
            <ScrollArea className="h-full">
              <div className="p-2">
                {students.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedUserId(student.id)}
                    className={`w-full p-3 rounded-lg text-left hover:bg-gray-50 transition-colors ${
                      selectedUserId === student.id ? "bg-blue-50 border border-blue-200" : "border border-transparent"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm">
                        {student.firstName[0]}{student.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {student.studentId}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedUser ? (
              <>
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center font-semibold">
                      {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {selectedUser.firstName} {selectedUser.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedUser.role === "admin" ? "Administrator" : `Student ID: ${(selectedUser as any).studentId}`}
                      </p>
                    </div>
                  </div>
                </div>
                
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === user!.id ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderId === user!.id
                              ? "bg-primary text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.senderId === user!.id ? "text-blue-200" : "text-gray-500"
                          }`}>
                            {format(new Date(message.createdAt), "h:mm a")}
                          </p>
                        </div>
                      </div>
                    ))}
                    {typingUsers.has(selectedUserId!) && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg px-4 py-2">
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <Input
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1"
                      disabled={sendMessageMutation.isPending}
                    />
                    <Button 
                      type="submit" 
                      disabled={!messageContent.trim() || sendMessageMutation.isPending}
                      className="bg-primary text-white hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500">Select a student to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Student view - direct chat with admin
  return (
    <Card className="h-96">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <User className="w-5 h-5" />
          <span>Chat with SAO Admin</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex flex-col h-80">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === user!.id ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.senderId === user!.id
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.senderId === user!.id ? "text-blue-200" : "text-gray-500"
                  }`}>
                    {format(new Date(message.createdAt), "h:mm a")}
                  </p>
                </div>
              </div>
            ))}
            {typingUsers.has(1) && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <Input
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
              disabled={sendMessageMutation.isPending}
            />
            <Button 
              type="submit" 
              disabled={!messageContent.trim() || sendMessageMutation.isPending}
              className="bg-primary text-white hover:bg-blue-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
