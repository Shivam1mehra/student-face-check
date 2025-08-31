export interface Student {
  id: string;
  name: string;
  photo_url?: string;
  face_encoding?: any;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  time: string;
  status: 'present' | 'absent' | 'late';
  created_at: string;
  students?: Student;
}

export interface AttendanceStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  attendanceRate: number;
}

export type Screen = 'add-student' | 'mark-attendance' | 'reports';