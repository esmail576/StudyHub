import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { downloadTelegramFile } from '@/lib/telegram';

interface NoteCardProps {
  note: {
    id: string;
    title: string;
    description: string;
    subject: string;
    course_code: string;
    major: string;
    uploader_name: string;
    telegram_file_id: string;
    created_at: string;
  };
}

export function NoteCard({ note }: NoteCardProps) {
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  // Debug log when component renders
  console.log('NoteCard rendered with note:', {
    id: note.id,
    title: note.title,
    telegram_file_id: note.telegram_file_id,
    has_telegram_file_id: Boolean(note.telegram_file_id)
  });

  const handleDownload = async () => {
    // Debug log before download attempt
    console.log('Download attempt for note:', {
      id: note.id,
      title: note.title,
      telegram_file_id: note.telegram_file_id,
      has_telegram_file_id: Boolean(note.telegram_file_id)
    });
    
    if (!note.telegram_file_id) {
      console.error('Missing telegram_file_id for note:', {
        id: note.id,
        title: note.title,
        all_note_data: note
      });
      toast({
        title: 'Error',
        description: 'This note does not have an associated file',
        variant: 'destructive',
      });
      return;
    }

    setDownloading(true);
    try {
      console.log('Attempting to download file with ID:', note.telegram_file_id);
      await downloadTelegramFile(note.telegram_file_id);
      toast({
        title: 'Success',
        description: 'File downloaded successfully',
      });
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to download file',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{note.title}</CardTitle>
        <CardDescription>
          {note.subject} - {note.course_code}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{note.description}</p>
        <div className="mt-2 text-sm">
          <p><strong>Major:</strong> {note.major}</p>
          <p><strong>Uploaded by:</strong> {note.uploader_name}</p>
          <p><strong>Date:</strong> {new Date(note.created_at).toLocaleDateString()}</p>
          {note.telegram_file_id && (
            <p className="text-xs text-muted-foreground mt-2">
              File ID: {note.telegram_file_id.substring(0, 8)}...
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleDownload}
          disabled={downloading || !note.telegram_file_id}
          className="w-full"
        >
          {downloading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download Note
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 