import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Check, X, Clock, Scan } from 'lucide-react';
import { useStudents } from '@/hooks/useStudents';
import { useAttendance } from '@/hooks/useAttendance';
import { useFaceRecognition } from '@/hooks/useFaceRecognition';
import { Student } from '@/types/attendance';
import { toast } from '@/hooks/use-toast';

const MarkAttendanceScreen = () => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { students } = useStudents();
  const { markAttendance, stats, loading } = useAttendance();
  const { detectFaces, extractFaceFeatures, compareFaces, isProcessing } = useFaceRecognition();

  const handleMarkAttendance = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    await markAttendance(studentId, status);
    setSelectedStudent(null);
  };

  const startFaceRecognition = async () => {
    try {
      setIsScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Could not access camera",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  const recognizeFace = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    try {
      // Convert canvas to image
      const img = new Image();
      img.onload = async () => {
        try {
          const faces = await detectFaces(img);
          if (faces.length === 0) {
            toast({
              title: "No Face Detected",
              description: "Please position your face in the camera",
              variant: "destructive",
            });
            return;
          }

          const faceFeatures = await extractFaceFeatures(img, faces[0].box);
          
          // Compare with stored student faces
          for (const student of students) {
            if (student.face_encoding) {
              const isMatch = compareFaces(faceFeatures, student.face_encoding);
              if (isMatch) {
                setSelectedStudent(student);
                stopCamera();
                toast({
                  title: "Student Recognized",
                  description: `Welcome, ${student.name}!`,
                });
                return;
              }
            }
          }

          toast({
            title: "Student Not Recognized",
            description: "Face not found in database",
            variant: "destructive",
          });
        } catch (error) {
          console.error('Error recognizing face:', error);
          toast({
            title: "Recognition Error",
            description: "Failed to recognize face",
            variant: "destructive",
          });
        }
      };
      img.src = canvas.toDataURL();
    } catch (error) {
      console.error('Error processing image:', error);
    }
  };

  const stopCamera = () => {
    const video = videoRef.current;
    if (video?.srcObject) {
      const tracks = (video.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-success text-success-foreground';
      case 'late': return 'bg-warning text-warning-foreground';
      case 'absent': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-24 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success">{stats.presentToday}</div>
            <div className="text-sm text-muted-foreground">Present</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-destructive">{stats.absentToday}</div>
            <div className="text-sm text-muted-foreground">Absent</div>
          </CardContent>
        </Card>
      </div>

      {/* Face Recognition */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Face Recognition
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isScanning ? (
            <Button
              onClick={startFaceRecognition}
              className="w-full h-12"
              disabled={isProcessing}
            >
              <Camera className="h-4 w-4 mr-2" />
              Scan Face for Attendance
            </Button>
          ) : (
            <div className="space-y-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-md border"
              />
              <div className="flex gap-2">
                <Button
                  onClick={recognizeFace}
                  disabled={isProcessing}
                  className="flex-1 h-12"
                >
                  {isProcessing ? 'Recognizing...' : 'Recognize'}
                </Button>
                <Button
                  onClick={stopCamera}
                  variant="outline"
                  className="flex-1 h-12"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </CardContent>
      </Card>

      {/* Selected Student */}
      {selectedStudent && (
        <Card>
          <CardHeader>
            <CardTitle>Mark Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {selectedStudent.photo_url ? (
                <img
                  src={selectedStudent.photo_url}
                  alt={selectedStudent.name}
                  className="w-16 h-16 rounded-full object-cover border"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xl font-bold">
                    {selectedStudent.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h3 className="font-semibold text-lg">{selectedStudent.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => handleMarkAttendance(selectedStudent.id, 'present')}
                disabled={loading}
                className="h-12 bg-success hover:bg-success/90 text-success-foreground"
              >
                <Check className="h-4 w-4 mr-1" />
                Present
              </Button>
              <Button
                onClick={() => handleMarkAttendance(selectedStudent.id, 'late')}
                disabled={loading}
                className="h-12 bg-warning hover:bg-warning/90 text-warning-foreground"
              >
                <Clock className="h-4 w-4 mr-1" />
                Late
              </Button>
              <Button
                onClick={() => handleMarkAttendance(selectedStudent.id, 'absent')}
                disabled={loading}
                variant="destructive"
                className="h-12"
              >
                <X className="h-4 w-4 mr-1" />
                Absent
              </Button>
            </div>

            <Button
              onClick={() => setSelectedStudent(null)}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Manual Student Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Student Manually</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {students.map((student) => (
              <div
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                className="flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-accent"
              >
                {student.photo_url ? (
                  <img
                    src={student.photo_url}
                    alt={student.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <span className="font-bold">
                      {student.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="font-medium">{student.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarkAttendanceScreen;