import { Button } from '@/components/ui/button';
import { UserPlus, Users, FileText } from 'lucide-react';
import { Screen } from '@/types/attendance';

interface NavigationProps {
  currentScreen: Screen;
  onScreenChange: (screen: Screen) => void;
}

const Navigation = ({ currentScreen, onScreenChange }: NavigationProps) => {
  const navItems = [
    { id: 'add-student' as Screen, label: 'Add Student', icon: UserPlus },
    { id: 'mark-attendance' as Screen, label: 'Attendance', icon: Users },
    { id: 'reports' as Screen, label: 'Reports', icon: FileText },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 safe-area-bottom">
      <div className="flex justify-around max-w-md mx-auto">
        {navItems.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={currentScreen === id ? "default" : "ghost"}
            size="sm"
            onClick={() => onScreenChange(id)}
            className="flex flex-col items-center gap-1 h-auto py-2 px-3"
          >
            <Icon size={20} />
            <span className="text-xs">{label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default Navigation;