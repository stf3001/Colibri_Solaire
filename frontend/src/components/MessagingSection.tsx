import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, MessageSquare, User, Calendar, Trash2 } from "lucide-react";
import brain from "brain";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserGuardContext } from "app/auth";
import { toast } from "sonner";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GetMyMessagesData, MarkAsReadRequest, SendPrivateMessageRequest, DeleteMessageRequest } from "types";

interface Message {
  id: number;
  sender_id: string;
  sender_type: 'admin' | 'apporteur';
  recipient_id: string | null;
  message_type: 'announcement' | 'private';
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

interface MessagesResponse {
  announcements: Message[];
  private_messages: Message[];
  unread_count: number;
}

export function MessagingSection() {
  const { user } = useUserGuardContext();
  const queryClient = useQueryClient();
  const [showCompose, setShowCompose] = useState(false);
  const [newMessage, setNewMessage] = useState({ subject: '', content: '' });

  // Récupérer les messages
  const { data: messages, isLoading } = useQuery<GetMyMessagesData>({
    queryKey: ["messages", user.id],
    queryFn: async () => {
      const response = await brain.get_my_messages();
      return response.json();
    },
  });

  // Marquer une annonce comme lue
  const markAnnouncementRead = useMutation({
    mutationFn: (messageId: number) => brain.mark_announcement_read({ message_id: messageId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", user.id] });
    },
  });

  // Marquer un message privé comme lu
  const markPrivateMessageRead = useMutation({
    mutationFn: (messageId: number) => brain.mark_private_message_read({ message_id: messageId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", user.id] });
    },
  });

  // Envoyer un message à l'admin
  const sendMessage = useMutation({
    mutationFn: (data: { subject: string; content: string }) => 
      brain.send_private_message_from_user({
        recipient_id: "admin-id", // TODO: Récupérer l'ID admin réel
        subject: data.subject,
        content: data.content
      }),
    onSuccess: () => {
      toast.success("Message envoyé à l'administrateur !");
      setNewMessage({ subject: '', content: '' });
      setShowCompose(false);
      queryClient.invalidateQueries({ queryKey: ["messages", user.id] });
    },
    onError: () => {
      toast.error("Erreur lors de l'envoi du message");
    },
  });

  // Supprimer un message
  const deleteMessage = useMutation({
    mutationFn: (messageId: number) => brain.delete_message_for_user({ message_id: messageId }),
    onSuccess: () => {
      toast.success("Message supprimé !");
      queryClient.invalidateQueries({ queryKey: ["messages", user.id] });
    },
    onError: () => {
      toast.error("Erreur lors de la suppression du message");
    },
  });

  const handleMarkAsRead = (message: Message) => {
    if (message.message_type === 'announcement' && !message.is_read) {
      markAnnouncementRead.mutate(message.id);
    } else if (message.message_type === 'private' && !message.is_read && message.recipient_id === user.id) {
      markPrivateMessageRead.mutate(message.id);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.subject.trim() && newMessage.content.trim()) {
      sendMessage.mutate(newMessage);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white text-shadow flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Messages
          </CardTitle>
        </CardHeader>
              <div className="text-center py-8">
                <div className="space-y-4">
                  <Skeleton className="h-8 w-32 bg-white/20 mx-auto" />
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="glass-card p-4">
                        <Skeleton className="h-4 w-24 bg-white/20 mb-2" />
                        <Skeleton className="h-8 w-16 bg-white/20" />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-40 bg-white/20" />
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="glass-card p-4">
                        <div className="flex justify-between items-center mb-2">
                          <Skeleton className="h-4 w-32 bg-white/20" />
                          <Skeleton className="h-4 w-20 bg-white/20" />
                        </div>
                        <Skeleton className="h-3 w-full bg-white/20" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-white text-shadow flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Messages
            {messages && messages.unread_count > 0 && (
              <Badge variant="destructive" className="bg-red-500">
                {messages.unread_count}
              </Badge>
            )}
          </CardTitle>
          <Button 
            onClick={() => setShowCompose(!showCompose)}
            variant="outline"
            size="sm"
            className="border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Contacter votre conseiller
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showCompose && (
          <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-yellow-400/30">
            <h4 className="text-white font-medium">Nouveau message à votre conseiller</h4>
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-white/90">Sujet</Label>
              <Input
                id="subject"
                value={newMessage.subject}
                onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                placeholder="Sujet de votre message"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content" className="text-white/90">Message</Label>
              <Textarea
                id="content"
                value={newMessage.content}
                onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 min-h-[100px]"
                placeholder="Votre message..."
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleSendMessage}
                disabled={!newMessage.subject.trim() || !newMessage.content.trim() || sendMessage.isPending}
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900"
              >
                {sendMessage.isPending ? "Envoi..." : "Envoyer"}
              </Button>
              <Button 
                onClick={() => setShowCompose(false)}
                variant="ghost"
                className="text-white/70 hover:bg-white/10"
              >
                Annuler
              </Button>
            </div>
          </div>
        )}

        {/* Annonces générales */}
        {messages?.announcements && messages.announcements.length > 0 && (
          <div>
            <h4 className="text-white/90 font-medium mb-3 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Annonces générales
            </h4>
            <div className="space-y-2">
              {messages.announcements.slice(0, 3).map((message) => (
                <div 
                  key={message.id} 
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    message.is_read 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-yellow-400/10 border-yellow-400/30'
                  }`}
                  onClick={() => handleMarkAsRead(message)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h5 className="text-white font-medium text-sm">{message.subject}</h5>
                    <div className="flex items-center gap-2">
                      {!message.is_read && (
                        <Badge variant="secondary" className="bg-yellow-400 text-gray-900 text-xs">
                          Nouveau
                        </Badge>
                      )}
                      <span className="text-white/60 text-xs flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(message.created_at)}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMessage.mutate(message.id);
                        }}
                        disabled={deleteMessage.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-white/80 text-sm line-clamp-2">{message.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages privés */}
        {messages?.private_messages && messages.private_messages.length > 0 && (
          <>
            <Separator className="bg-white/20" />
            <div>
              <h4 className="text-white/90 font-medium mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Messages privés
              </h4>
              <div className="space-y-2">
                {messages.private_messages.slice(0, 3).map((message) => (
                  <div 
                    key={message.id} 
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      message.is_read || message.sender_id === user.id
                        ? 'bg-white/5 border-white/10' 
                        : 'bg-blue-400/10 border-blue-400/30'
                    }`}
                    onClick={() => handleMarkAsRead(message)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h5 className="text-white font-medium text-sm">{message.subject}</h5>
                      <div className="flex items-center gap-2">
                        <span className="text-white/60 text-xs flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {message.sender_id === user.id ? 'Vous' : 'Admin'}
                        </span>
                        {!message.is_read && message.recipient_id === user.id && (
                          <Badge variant="secondary" className="bg-blue-400 text-white text-xs">
                            Nouveau
                          </Badge>
                        )}
                        <span className="text-white/60 text-xs flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(message.created_at)}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMessage.mutate(message.id);
                          }}
                          disabled={deleteMessage.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-white/80 text-sm line-clamp-2">{message.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Aucun message */}
        {(!messages?.announcements?.length && !messages?.private_messages?.length) && (
          <div className="text-center py-8">
            <Mail className="h-12 w-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/70">Aucun message pour le moment</p>
            <p className="text-white/50 text-sm mt-1">Les annonces et messages apparaîtront ici</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}