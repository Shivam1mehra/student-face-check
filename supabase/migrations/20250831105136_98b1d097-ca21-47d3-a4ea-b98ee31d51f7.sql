-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  photo_url TEXT,
  face_encoding JSONB, -- Store face recognition data
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME NOT NULL DEFAULT CURRENT_TIME,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for authentication later)
CREATE POLICY "Students are viewable by everyone" 
ON public.students 
FOR SELECT 
USING (true);

CREATE POLICY "Students can be created by everyone" 
ON public.students 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Students can be updated by everyone" 
ON public.students 
FOR UPDATE 
USING (true);

CREATE POLICY "Attendance is viewable by everyone" 
ON public.attendance 
FOR SELECT 
USING (true);

CREATE POLICY "Attendance can be created by everyone" 
ON public.attendance 
FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for student photos
INSERT INTO storage.buckets (id, name, public) VALUES ('student-photos', 'student-photos', true);

-- Create storage policies for student photos
CREATE POLICY "Student photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'student-photos');

CREATE POLICY "Anyone can upload student photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'student-photos');

CREATE POLICY "Anyone can update student photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'student-photos');

-- Create indexes for better performance
CREATE INDEX idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX idx_attendance_date ON public.attendance(date);
CREATE INDEX idx_students_name ON public.students(name);