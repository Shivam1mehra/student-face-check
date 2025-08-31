import { useState } from 'react';
import { Screen } from '@/types/attendance';
import Navigation from '@/components/Navigation';
import AddStudentScreen from '@/components/AddStudentScreen';
import MarkAttendanceScreen from '@/components/MarkAttendanceScreen';
import ReportsScreen from '@/components/ReportsScreen';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('mark-attendance');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'add-student':
        return <AddStudentScreen />;
      case 'mark-attendance':
        return <MarkAttendanceScreen />;
      case 'reports':
        return <ReportsScreen />;
      default:
        return <MarkAttendanceScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-4 shadow-md">
        <h1 className="text-xl font-bold text-center">📚 Attendance Tracker</h1>
      </header>
      
      <main className="min-h-[calc(100vh-80px)]">
        {renderScreen()}
      </main>

      <Navigation
        currentScreen={currentScreen}
        onScreenChange={setCurrentScreen}
      />
    </div>
  );
};

export default Index;
