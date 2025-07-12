import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Users, FileText, DollarSign, AlertTriangle, MessageSquare, BarChart3, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminMobileNavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  stats?: {
    total_users: number;
    total_leads: number;
    total_commissions_paid: number;
    pending_commission_requests: number;
    anniversary_alerts: number;
  };
}

const AdminMobileNavigation: React.FC<AdminMobileNavigationProps> = ({
  currentTab,
  onTabChange,
  stats
}) => {
  const navigate = useNavigate();

  const quickActions = [
    {
      id: 'leads',
      label: 'Filleuls',
      icon: FileText,
      badge: stats?.total_leads,
      color: 'bg-blue-500'
    },
    {
      id: 'users', 
      label: 'Apporteurs',
      icon: Users,
      badge: stats?.total_users,
      color: 'bg-green-500'
    },
    {
      id: 'payments',
      label: 'Paiements',
      icon: DollarSign,
      badge: stats?.pending_commission_requests,
      color: 'bg-purple-500'
    },
    {
      id: 'anniversary',
      label: 'Alertes',
      icon: AlertTriangle,
      badge: stats?.anniversary_alerts,
      color: stats?.anniversary_alerts && stats.anniversary_alerts > 0 ? 'bg-red-500' : 'bg-orange-500',
      urgent: stats?.anniversary_alerts && stats.anniversary_alerts > 0
    }
  ];

  const moreActions = [
    {
      id: 'user-management',
      label: 'Gestion Users',
      icon: Users,
      color: 'bg-indigo-500'
    },
    {
      id: 'contracts',
      label: 'Contrats',
      icon: FileText,
      color: 'bg-teal-500'
    },
    {
      id: 'messaging',
      label: 'Messages',
      icon: MessageSquare,
      color: 'bg-pink-500'
    }
  ];

  return (
    <>
      {/* Quick Stats Cards - Mobile optimized */}
      <div className="grid grid-cols-2 gap-3 mb-6 lg:hidden">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Card 
              key={action.id}
              className={`${action.urgent ? 'ring-2 ring-red-300 bg-red-50/50' : 'bg-white/70'} backdrop-blur-sm border hover:shadow-md transition-all cursor-pointer min-h-[80px] touch-manipulation`}
              onClick={() => onTabChange(action.id)}
            >
              <CardContent className="p-4 text-center">
                <div className={`${action.color} w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className={`text-lg font-bold ${action.urgent ? 'text-red-600' : 'text-gray-800'}`}>
                  {action.badge || 0}
                </div>
                <div className="text-xs text-gray-600">{action.label}</div>
                {action.urgent && (
                  <Badge className="mt-1 bg-red-100 text-red-800 text-xs">Urgent</Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 lg:hidden">
        <div className="grid grid-cols-4 h-16">
          {/* Home Button */}
          <Button
            variant="ghost"
            className="h-full flex flex-col items-center justify-center gap-1 rounded-none border-r touch-manipulation min-h-[64px]"
            onClick={() => navigate('/dashboard-page')}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs">Accueil</span>
          </Button>

          {/* Main tabs */}
          {['leads', 'users', 'payments'].map((tab) => {
            const action = quickActions.find(a => a.id === tab);
            if (!action) return null;
            
            const Icon = action.icon;
            const isActive = currentTab === tab;
            
            return (
              <Button
                key={tab}
                variant="ghost"
                className={`h-full flex flex-col items-center justify-center gap-1 rounded-none border-r touch-manipulation min-h-[64px] ${
                  isActive ? 'bg-orange-50 text-orange-600 border-t-2 border-t-orange-500' : ''
                }`}
                onClick={() => onTabChange(tab)}
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 ${isActive ? 'text-orange-600' : 'text-gray-600'}`} />
                  {action.badge && action.badge > 0 && (
                    <Badge className={`absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs ${
                      action.urgent ? 'bg-red-500' : 'bg-blue-500'
                    } text-white`}>
                      {action.badge > 9 ? '9+' : action.badge}
                    </Badge>
                  )}
                </div>
                <span className={`text-xs ${isActive ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>
                  {action.label}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* More Actions Drawer - Mobile */}
      <div className="lg:hidden mb-20">
        <Card className="bg-white/70 backdrop-blur-sm">
          <CardContent className="p-4">
            <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Actions Avancées
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {moreActions.map((action) => {
                const Icon = action.icon;
                const isActive = currentTab === action.id;
                
                return (
                  <Button
                    key={action.id}
                    variant={isActive ? "default" : "outline"}
                    className={`h-auto flex flex-col items-center justify-center gap-2 p-3 touch-manipulation min-h-[64px] ${
                      isActive ? 'bg-orange-500 hover:bg-orange-600' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => onTabChange(action.id)}
                  >
                    <div className={`${isActive ? 'text-white' : action.color} w-8 h-8 rounded-full flex items-center justify-center ${
                      !isActive ? 'bg-current/10' : ''
                    }`}>
                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-current'}`} />
                    </div>
                    <span className={`text-xs ${isActive ? 'text-white' : 'text-gray-700'}`}>
                      {action.label}
                    </span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floating Action Button for Quick Actions */}
      <div className="fixed bottom-20 right-4 z-40 lg:hidden">
        <Button
          className="w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 touch-manipulation"
          onClick={() => onTabChange('anniversary')}
        >
          {stats?.anniversary_alerts && stats.anniversary_alerts > 0 ? (
            <div className="relative">
              <AlertTriangle className="h-6 w-6" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white">
                {stats.anniversary_alerts > 9 ? '9+' : stats.anniversary_alerts}
              </Badge>
            </div>
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </Button>
      </div>
    </>
  );
};

export default AdminMobileNavigation;
