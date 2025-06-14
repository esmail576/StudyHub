import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';
import { Folder, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const supabase = createClient(
  import.meta.env.VITE_PUBLIC_SUPABASE_URL,
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY
);

interface FolderItem {
  id: string;
  name: string;
  parent_id: string | null;
  folder_type_id: string;
  folder_type: {
    name: string;
  };
  children?: FolderItem[];
}

interface NoteUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  selectedFolderId: string | null;
}

export function NoteUploadDialog({
  open,
  onOpenChange,
  onSuccess,
  selectedFolderId,
}: NoteUploadDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    course_code: '',
    major: '',
    file: null as File | null,
  });

  useEffect(() => {
    if (open && user) {
      fetchFolders();
    }
  }, [open, user]);

  const fetchFolders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('folders')
        .select(`
          id,
          name,
          parent_id,
          folder_type_id,
          folder_type:folder_types(name)
        `)
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      // Build folder tree
      const folderMap = new Map<string, FolderItem>();
      const rootFolders: FolderItem[] = [];

      data.forEach((folder: any) => {
        folderMap.set(folder.id, { ...folder, children: [] });
      });

      data.forEach((folder: any) => {
        if (folder.parent_id === null) {
          rootFolders.push(folderMap.get(folder.id)!);
        } else {
          const parent = folderMap.get(folder.parent_id);
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(folderMap.get(folder.id)!);
          }
        }
      });

      setFolders(rootFolders);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load folders',
        variant: 'destructive',
      });
    }
  };

  const getFolderOptions = (type: string, parentId: string | null = null) => {
    const findFolders = (folders: FolderItem[]): FolderItem[] => {
      let result: FolderItem[] = [];
      for (const folder of folders) {
        if (folder.folder_type.name === type && 
            (parentId === null || folder.parent_id === parentId)) {
          result.push(folder);
        }
        if (folder.children) {
          result = result.concat(findFolders(folder.children));
        }
      }
      return result;
    };
    return findFolders(folders);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: 'Error',
        description: 'Please sign in to upload notes',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.file) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedCategory) {
      toast({
        title: 'Error',
        description: 'Please select a category for your note',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Debug log to check environment variables
      console.log('Environment variables:', {
        botToken: import.meta.env.TELEGRAM_BOT_TOKEN,
        channelId: import.meta.env.TELEGRAM_CHANNEL_ID
      });

      // Create FormData for Telegram
      const telegramFormData = new FormData();
      telegramFormData.append('chat_id', import.meta.env.TELEGRAM_CHANNEL_ID);
      telegramFormData.append('document', formData.file);
      telegramFormData.append('caption', 
        `Title: ${formData.title}\n` +
        `Description: ${formData.description}\n` +
        `Subject: ${formData.subject}\n` +
        `Course Code: ${formData.course_code}\n` +
        `Major: ${formData.major}\n` +
        `Uploaded by: ${user.user_metadata?.full_name || 'Anonymous'}`
      );

      // Upload to Telegram
      const telegramResponse = await fetch(
        `https://api.telegram.org/bot${import.meta.env.TELEGRAM_BOT_TOKEN}/sendDocument`,
        {
          method: 'POST',
          body: telegramFormData,
        }
      );

      if (!telegramResponse.ok) {
        const errorData = await telegramResponse.json();
        console.error('Telegram API Error:', errorData);
        throw new Error(errorData.description || 'Failed to upload to Telegram');
      }

      const telegramResult = await telegramResponse.json();

      if (!telegramResult.ok || !telegramResult.result.document?.file_id) {
        console.error('Telegram Response:', telegramResult);
        throw new Error('Failed to get file ID from Telegram');
      }

      // Insert into Supabase
      const { error: insertError } = await supabase.from('notes').insert({
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        course_code: formData.course_code,
        major: formData.major,
        uploader_name: user.user_metadata?.full_name || 'Anonymous',
        telegram_message_id: telegramResult.result.message_id,
        telegram_file_id: telegramResult.result.document.file_id,
        user_id: user.id,
        folder_id: selectedCategory,
      });

      if (insertError) throw insertError;

      toast({
        title: 'Success',
        description: 'Note uploaded successfully',
      });

      onSuccess();
      setFormData({
        title: '',
        description: '',
        subject: '',
        course_code: '',
        major: '',
        file: null,
      });
      setSelectedDepartment('');
      setSelectedProgram('');
      setSelectedLevel('');
      setSelectedCourse('');
      setSelectedCategory('');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error uploading note:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload note',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        file,
        title: file.name
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Note</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Folder Selection Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Select Location</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Department</label>
                <Select
                  value={selectedDepartment}
                  onValueChange={setSelectedDepartment}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {getFolderOptions('Department').map(folder => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Program</label>
                <Select
                  value={selectedProgram}
                  onValueChange={setSelectedProgram}
                  disabled={!selectedDepartment}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    {getFolderOptions('Program', selectedDepartment).map(folder => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Level</label>
                <Select
                  value={selectedLevel}
                  onValueChange={setSelectedLevel}
                  disabled={!selectedProgram}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {getFolderOptions('Level', selectedProgram).map(folder => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Course</label>
                <Select
                  value={selectedCourse}
                  onValueChange={setSelectedCourse}
                  disabled={!selectedLevel}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {getFolderOptions('Course', selectedLevel).map(folder => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2">
                <label className="text-sm text-muted-foreground">Category</label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                  disabled={!selectedCourse}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {getFolderOptions('Category', selectedCourse).map(folder => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Note Details</h3>
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm text-muted-foreground">
                Title
              </label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter note title"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm text-muted-foreground">
                Description
              </label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter note description"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="file" className="text-sm text-muted-foreground">
                Note File
              </label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Uploading...' : 'Upload Note'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 