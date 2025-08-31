import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Student } from '@/types/attendance';
import { toast } from '@/hooks/use-toast';

export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addStudent = async (name: string, photoFile?: File, faceEncoding?: any) => {
    setLoading(true);
    try {
      let photo_url = null;

      // Upload photo if provided
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('student-photos')
          .upload(fileName, photoFile);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('student-photos')
          .getPublicUrl(fileName);
        
        photo_url = publicUrl;
      }

      const { data, error } = await supabase
        .from('students')
        .insert([{ 
          name, 
          photo_url,
          face_encoding: faceEncoding 
        }])
        .select()
        .single();

      if (error) throw error;

      setStudents(prev => [...prev, data]);
      toast({
        title: "Success",
        description: "Student added successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error adding student:', error);
      toast({
        title: "Error",
        description: "Failed to add student",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return {
    students,
    loading,
    fetchStudents,
    addStudent,
  };
};