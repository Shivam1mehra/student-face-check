import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Upload, User } from 'lucide-react';
import { useStudents } from '@/hooks/useStudents';
import { useFaceRecognition } from '@/hooks/useFaceRecognition';
import { toast } from '@/hooks/use-toast';

const AddStudentScreen = () => {
  const [name, setName] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { addStudent, loading } = useStudents();
  const { extractFaceFeatures, isProcessing } = useFaceRecognition();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const startCamera = async () => {
    try {
      setIsCapturing(true);
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
      setIsCapturing(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
        setPhotoFile(file);
        setPreviewUrl(canvas.toDataURL());
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  const stopCamera = () => {
    const video = videoRef.current;
    if (video?.srcObject) {
      const tracks = (video.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsCapturing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter student name",
        variant: "destructive",
      });
      return;
    }

    try {
      let faceEncoding = null;
      
      if (photoFile) {
        // Extract face features for recognition
        const img = new Image();
        img.onload = async () => {
          try {
            faceEncoding = await extractFaceFeatures(img);
            await addStudent(name.trim(), photoFile, faceEncoding);
            setName('');
            setPhotoFile(null);
            setPreviewUrl('');
          } catch (error) {
            console.error('Error processing face:', error);
            await addStudent(name.trim(), photoFile);
            setName('');
            setPhotoFile(null);
            setPreviewUrl('');
          }
        };
        img.src = previewUrl;
      } else {
        await addStudent(name.trim());
        setName('');
      }
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-24">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Add New Student
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Student Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter student name"
                className="h-12 text-lg"
              />
            </div>

            <div className="space-y-4">
              <Label>Student Photo (Optional)</Label>
              
              {!isCapturing && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 h-12"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={startCamera}
                    className="flex-1 h-12"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                  </Button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {isCapturing && (
                <div className="space-y-2">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-md border"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={capturePhoto}
                      className="flex-1 h-12"
                    >
                      Capture
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={stopCamera}
                      className="flex-1 h-12"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {previewUrl && !isCapturing && (
                <div className="space-y-2">
                  <img
                    src={previewUrl}
                    alt="Student preview"
                    className="w-full max-w-xs mx-auto rounded-md border"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setPhotoFile(null);
                      setPreviewUrl('');
                    }}
                    className="w-full"
                  >
                    Remove Photo
                  </Button>
                </div>
              )}

              <canvas
                ref={canvasRef}
                className="hidden"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || isProcessing}
              className="w-full h-12 text-lg"
            >
              {loading || isProcessing ? 'Adding Student...' : 'Add Student'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddStudentScreen;