import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Mail, MessageSquare } from 'lucide-react';
import { SendAnnouncementRequest } from 'types';

interface Message {
  id: number;
  sender_name: string;
  subject: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface User {
  user_id: string;
  full_name: string;
}

interface Props {
  receivedMessages: Message[];
  users: User[];
  messagesLoading: boolean;
  onSendAnnouncement: (data: SendAnnouncementRequest) => void;
  onSendPrivateMessage: (data: { recipient_id: string; content: string }) => void;
}

const AdminMessaging: React.FC<Props> = React.memo(({ 
  receivedMessages, 
  users, 
  messagesLoading,
  onSendAnnouncement,
  onSendPrivateMessage
}) => {
  // États locaux pour les formulaires
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [showPrivateMessageForm, setShowPrivateMessageForm] = useState(false);
  const [announcementSubject, setAnnouncementSubject] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [privateMessageContent, setPrivateMessageContent] = useState('');

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  }, []);

  const handleSendAnnouncement = useCallback(() => {
    if (announcementSubject && announcementContent) {
      onSendAnnouncement({
        subject: announcementSubject,
        content: announcementContent
      });
      setAnnouncementSubject('');
      setAnnouncementContent('');
      setShowAnnouncementForm(false);
    }
  }, [announcementSubject, announcementContent, onSendAnnouncement]);

  const handleSendPrivateMessage = useCallback(() => {
    if (selectedUser && privateMessageContent) {
      onSendPrivateMessage({
        recipient_id: selectedUser,
        content: privateMessageContent
      });
      setSelectedUser('');
      setPrivateMessageContent('');
      setShowPrivateMessageForm(false);
    }
  }, [selectedUser, privateMessageContent, onSendPrivateMessage]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-slate-800">Centre de messages</h3>
        <Button 
          onClick={() => setShowAnnouncementForm(true)}
          className="bg-indigo-500 hover:bg-indigo-600 text-white border-indigo-600"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Nouvelle annonce
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages reçus */}
        <Card className="p-6 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-lg">
          <h4 className="text-xl font-bold text-emerald-800 mb-4">Messages reçus</h4>
          <div className="space-y-3">
            <p className="text-emerald-700 text-sm">Messages des apporteurs</p>
            {messagesLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
              </div>
            ) : receivedMessages.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {receivedMessages.map((message) => (
                  <Card key={message.id} className="p-3 border border-emerald-200 hover:bg-emerald-50 cursor-pointer">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm text-emerald-800">{message.sender_name}</span>
                        <span className="text-xs text-emerald-600">
                          {formatDate(message.created_at)}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-700">{message.subject}</p>
                      <p className="text-xs text-slate-600 truncate">
                        {message.content.substring(0, 80)}...
                      </p>
                      {!message.is_read && (
                        <Badge className="bg-emerald-500 text-white text-xs">Non lu</Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-emerald-600 text-sm text-center py-4">Aucun message reçu</p>
            )}
          </div>
        </Card>
        
        {/* Messages privés */}
        <Card className="p-6 border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100 shadow-lg">
          <h4 className="text-xl font-bold text-indigo-800 mb-4">Messages privés</h4>
          <div className="space-y-3">
            <Button 
              onClick={() => setShowPrivateMessageForm(true)}
              variant="outline"
              className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-50"
            >
              <Mail className="h-4 w-4 mr-2" />
              Envoyer un message privé
            </Button>
          </div>
        </Card>
        
        {/* Annonces */}
        <Card className="p-6 border-rose-200 bg-gradient-to-br from-rose-50 to-rose-100 shadow-lg">
          <h4 className="text-xl font-bold text-rose-800 mb-4">Annonces globales</h4>
          <div className="space-y-3">
            <p className="text-rose-700 text-sm">Envoyez des annonces à tous les apporteurs d'affaires</p>
            <Button 
              onClick={() => setShowAnnouncementForm(true)}
              variant="outline"
              className="w-full border-rose-300 text-rose-700 hover:bg-rose-50"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Créer une annonce
            </Button>
          </div>
        </Card>
      </div>

      {/* Modal de création d'annonce */}
      <Dialog open={showAnnouncementForm} onOpenChange={setShowAnnouncementForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une annonce</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Sujet</Label>
              <Input
                value={announcementSubject}
                onChange={(e) => setAnnouncementSubject(e.target.value)}
                placeholder="Sujet de l'annonce"
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                placeholder="Contenu de l'annonce"
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSendAnnouncement}
                disabled={!announcementSubject || !announcementContent}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Envoyer l'annonce
              </Button>
              <Button variant="outline" onClick={() => setShowAnnouncementForm(false)}>
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'envoi de message privé */}
      <Dialog open={showPrivateMessageForm} onOpenChange={setShowPrivateMessageForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer un message privé</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Destinataire</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un utilisateur" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={privateMessageContent}
                onChange={(e) => setPrivateMessageContent(e.target.value)}
                placeholder="Contenu du message privé"
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSendPrivateMessage}
                disabled={!selectedUser || !privateMessageContent}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Envoyer le message
              </Button>
              <Button variant="outline" onClick={() => setShowPrivateMessageForm(false)}>
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

AdminMessaging.displayName = 'AdminMessaging';

export default AdminMessaging;
