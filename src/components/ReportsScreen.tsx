import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Calendar, TrendingUp, Users } from 'lucide-react';
import { useAttendance } from '@/hooks/useAttendance';
import { format } from 'date-fns';

const ReportsScreen = () => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const { attendance, stats, loading, fetchAttendance, exportAttendance } = useAttendance();

  const handleDateFilter = () => {
    fetchAttendance();
  };

  const handleExport = () => {
    exportAttendance(startDate, endDate);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-success text-success-foreground';
      case 'late': return 'bg-warning text-warning-foreground';
      case 'absent': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return '✓';
      case 'late': return '⏰';
      case 'absent': return '✗';
      default: return '?';
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-24 space-y-6">
      {/* Statistics Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Today's Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{stats.attendanceRate}%</div>
              <div className="text-sm text-muted-foreground">Attendance Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.totalStudents}</div>
              <div className="text-sm text-muted-foreground">Total Students</div>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-semibold text-success">{stats.presentToday}</div>
              <div className="text-xs text-muted-foreground">Present</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-warning">{stats.lateToday}</div>
              <div className="text-xs text-muted-foreground">Late</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-destructive">{stats.absentToday}</div>
              <div className="text-xs text-muted-foreground">Absent</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="startDate" className="text-sm">From</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10"
              />
            </div>
            <div>
              <Label htmlFor="endDate" className="text-sm">To</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleDateFilter}
              variant="outline"
              className="flex-1 h-10"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button
              onClick={handleExport}
              className="flex-1 h-10"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recent Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Loading attendance records...</div>
            </div>
          ) : attendance.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">No attendance records found</div>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {attendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-md border bg-card"
                >
                  <div className="flex items-center gap-3">
                    {record.students?.photo_url ? (
                      <img
                        src={record.students.photo_url}
                        alt={record.students.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="font-bold text-sm">
                          {record.students?.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{record.students?.name || 'Unknown'}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(record.date), 'MMM dd, yyyy')} at {record.time}
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(record.status)}>
                    {getStatusIcon(record.status)} {record.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsScreen;