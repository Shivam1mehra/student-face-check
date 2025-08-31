import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AttendanceRecord, AttendanceStats } from '@/types/attendance';
import { toast } from '@/hooks/use-toast';

export const useAttendance = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    attendanceRate: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchAttendance = async (date?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('attendance')
        .select(`
          *,
          students (
            id,
            name,
            photo_url
          )
        `)
        .order('created_at', { ascending: false });

      if (date) {
        query = query.eq('date', date);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAttendance((data || []) as AttendanceRecord[]);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast({
        title: "Error",
        description: "Failed to fetch attendance records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if attendance already exists for today
      const { data: existing } = await supabase
        .from('attendance')
        .select('id')
        .eq('student_id', studentId)
        .eq('date', today)
        .single();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('attendance')
          .update({ status, time: new Date().toTimeString().split(' ')[0] })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('attendance')
          .insert([{ 
            student_id: studentId, 
            status,
            date: today,
            time: new Date().toTimeString().split(' ')[0]
          }]);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Attendance marked as ${status}`,
      });

      await fetchAttendance(today);
      await fetchStats();
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast({
        title: "Error",
        description: "Failed to mark attendance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get total students
      const { count: totalStudents } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      // Get today's attendance
      const { data: todayAttendance } = await supabase
        .from('attendance')
        .select('status')
        .eq('date', today);

      const presentToday = todayAttendance?.filter(a => a.status === 'present').length || 0;
      const absentToday = todayAttendance?.filter(a => a.status === 'absent').length || 0;
      const lateToday = todayAttendance?.filter(a => a.status === 'late').length || 0;
      
      const attendanceRate = totalStudents ? (presentToday + lateToday) / totalStudents * 100 : 0;

      setStats({
        totalStudents: totalStudents || 0,
        presentToday,
        absentToday,
        lateToday,
        attendanceRate: Math.round(attendanceRate),
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const exportAttendance = async (startDate: string, endDate: string) => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          date,
          time,
          status,
          students (
            name
          )
        `)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;

      // Convert to CSV
      const headers = ['Date', 'Time', 'Student', 'Status'];
      const csvContent = [
        headers.join(','),
        ...data.map(record => [
          record.date,
          record.time,
          record.students?.name || 'Unknown',
          record.status
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${startDate}_to_${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Attendance report exported successfully",
      });
    } catch (error) {
      console.error('Error exporting attendance:', error);
      toast({
        title: "Error",
        description: "Failed to export attendance report",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    fetchAttendance(today);
    fetchStats();
  }, []);

  return {
    attendance,
    stats,
    loading,
    fetchAttendance,
    markAttendance,
    fetchStats,
    exportAttendance,
  };
};