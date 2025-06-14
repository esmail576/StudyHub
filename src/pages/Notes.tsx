import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { NoteCard } from '@/components/NoteCard';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_PUBLIC_SUPABASE_URL,
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY
);

interface Note {
  id: string;
  title: string;
  description: string;
  subject: string;
  course_code: string;
  major: string;
  uploader_name: string;
  telegram_file_id: string;
  created_at: string;
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      console.log('Fetching notes from Supabase...');
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
      
      // Debug log to check note data
      console.log('Raw notes data from Supabase:', data);
      
      // Filter out notes without telegram_file_id
      const validNotes = data?.filter(note => {
        const hasFileId = Boolean(note.telegram_file_id);
        if (!hasFileId) {
          console.log('Note without telegram_file_id:', {
            id: note.id,
            title: note.title,
            all_data: note
          });
        }
        return hasFileId;
      }) || [];
      
      console.log('Filtered notes with telegram_file_id:', validNotes);
      console.log('Number of valid notes:', validNotes.length);
      
      setNotes(validNotes);
    } catch (error: any) {
      console.error('Error fetching notes:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch notes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Study Notes</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>
      {notes.length === 0 && (
        <div className="text-center text-muted-foreground">
          No notes available yet.
        </div>
      )}
    </div>
  );
} 