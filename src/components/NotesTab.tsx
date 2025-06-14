import React, { useState, useEffect } from 'react';
import { Link, ExternalLink, User, Calendar, Plus, Search, Image as ImageIcon, FileText, Cloud, Link as LinkIcon, Heart, Book, Download, GraduationCap, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import Loading from '@/components/ui/loading';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@supabase/supabase-js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NoteUploadDialog } from './NoteUploadDialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { FolderStructure } from './FolderStructure';
import { TelegramTest } from './TelegramTest';

const supabaseClient = createClient(
  import.meta.env.VITE_PUBLIC_SUPABASE_URL!,
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY!
);

interface Note {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  course_code: string | null;
  file_type: string;
  telegram_message_id: string;
  telegram_file_id: string;
  created_at: string | null;
  user_id: string;
  major: string;
  uploader_name: string;
  hearts_count: number;
  linktree_url: string | null;
  preview_image: string | null;
  link_type: string | null;
  is_hearted?: boolean;
  original_filename?: string;
}

const getLinkType = (url: string): string => {
  if (url.includes('linktr.ee/')) return 'linktree';
  if (url.includes('drive.google.com/')) return 'drive';
  if (url.includes('dropbox.com/')) return 'dropbox';
  return 'other';
};

const getLinkIcon = (type: string) => {
  switch (type) {
    case 'linktree':
      return <LinkIcon className="h-16 w-16 text-purple-400" />;
    case 'drive':
      return <FileText className="h-20 w-20 text-blue-500" />;
    case 'dropbox':
      return <Cloud className="h-20 w-20 text-blue-600" />;
    default:
      return <LinkIcon className="h-20 w-20 text-gray-500" />;
  }
};

const getLinkColor = (type: string) => {
  switch (type) {
    case 'linktree':
      return 'from-purple-900/20 to-pink-900/20';
    case 'drive':
      return 'from-blue-900/20 to-indigo-900/20';
    case 'dropbox':
      return 'from-blue-900/20 to-cyan-900/20';
    default:
      return 'from-gray-900/20 to-slate-900/20';
  }
};

const getLinkTextColor = (type: string) => {
  switch (type) {
    case 'linktree':
      return 'text-purple-300';
    case 'drive':
      return 'text-blue-300';
    case 'dropbox':
      return 'text-blue-300';
    default:
      return 'text-gray-300';
  }
};

const NotesTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [adding, setAdding] = useState(false);
  const { user } = useAuth();
  const [newNote, setNewNote] = useState({
    title: '',
    major: '',
    linktree_url: ''
  });
  const [hearts, setHearts] = useState<Set<string>>(new Set());
  const [animatingHearts, setAnimatingHearts] = useState<Set<string>>(new Set());
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: index * 0.05,
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }
    }),
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    hover: {
      scale: 1.02,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredNotes(notes);
    } else {
      const searchLower = searchTerm.toLowerCase().replace(/\s+/g, '');
      const filtered = notes.filter(note => {
        const noteTitle = note.title.toLowerCase().replace(/\s+/g, '');
        const noteMajor = note.major?.toLowerCase().replace(/\s+/g, '') ?? '';
        const noteUploader = note.uploader_name?.toLowerCase().replace(/\s+/g, '') ?? '';

        return noteTitle.includes(searchLower) ||
               noteMajor.includes(searchLower) ||
               noteUploader.includes(searchLower);
      });
      setFilteredNotes(filtered);
    }
  }, [searchTerm, notes]);

  const initializeData = async () => {
    setLoading(true);
    try {
      console.log('Starting to fetch data...');
      // First fetch user hearts if logged in
      if (user) {
        console.log('User is logged in, fetching hearts...');
        const { data: heartsData, error: heartsError } = await supabase
          .from('note_hearts')
          .select('note_id')
          .eq('user_id', user.id);

        if (heartsError) {
          console.error('Error fetching hearts:', heartsError);
          throw heartsError;
        }
        
        console.log('Hearts data:', heartsData);
        const heartedNotes = new Set(heartsData.map(h => h.note_id));
        setHearts(heartedNotes);

        // Then fetch notes
        console.log('Fetching notes...');
        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select('*')
          .order('created_at', { ascending: false });

        if (notesError) {
          console.error('Error fetching notes:', notesError);
          throw notesError;
        }

        console.log('Notes data:', notesData);
        console.log('First note details:', notesData?.[0]);
        console.log('Second note details:', notesData?.[1]);

        // Transform notes with hearted state
        const transformedData = (notesData as unknown as Note[]).map(note => {
          const transformed = {
            id: note.id,
            title: note.title,
            description: note.description || '',
            subject: note.subject || '',
            course_code: note.course_code || '',
            file_type: note.file_type || '',
            telegram_message_id: note.telegram_message_id || '',
            created_at: note.created_at,
            user_id: note.user_id,
            major: note.major || '',
            uploader_name: note.uploader_name || '',
            linktree_url: note.linktree_url || '',
            preview_image: note.linktree_url?.includes('linktr.ee/') 
              ? `https://api.microlink.io/?url=${encodeURIComponent(note.linktree_url)}&meta=true&embed=image.url`
              : '',
            link_type: getLinkType(note.linktree_url || ''),
            hearts_count: note.hearts_count || 0,
            is_hearted: heartedNotes.has(note.id),
            telegram_file_id: note.telegram_file_id,
            original_filename: note.original_filename
          };
          console.log('Transformed note:', transformed);
          return transformed;
        });

        console.log('Transformed data:', transformedData);
        setNotes(transformedData);
        setFilteredNotes(transformedData);
      } else {
        // If not logged in, just fetch notes without hearted state
        console.log('User is not logged in, fetching notes only...');
        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select('*')
          .order('created_at', { ascending: false });

        if (notesError) {
          console.error('Error fetching notes:', notesError);
          throw notesError;
        }

        console.log('Notes data:', notesData);

        const transformedData = (notesData as unknown as Note[]).map(note => ({
          id: note.id,
          title: note.title,
          description: note.description || '',
          subject: note.subject || '',
          course_code: note.course_code || '',
          file_type: note.file_type || '',
          telegram_message_id: note.telegram_message_id || '',
          created_at: note.created_at,
          user_id: note.user_id,
          major: note.major || '',
          uploader_name: note.uploader_name || '',
          linktree_url: note.linktree_url || '',
          preview_image: note.linktree_url?.includes('linktr.ee/') 
            ? `https://api.microlink.io/?url=${encodeURIComponent(note.linktree_url)}&meta=true&embed=image.url`
            : '',
          link_type: getLinkType(note.linktree_url || ''),
          hearts_count: note.hearts_count || 0,
          is_hearted: false,
          telegram_file_id: note.telegram_file_id,
          original_filename: note.original_filename
        }));

        console.log('Transformed data:', transformedData);
        setNotes(transformedData);
        setFilteredNotes(transformedData);
      }
    } catch (error) {
      console.error('Error initializing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeData();
  }, [user]);

  const handleAddNote = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Please sign in to add notes',
        variant: 'destructive',
      });
      return;
    }

    setAdding(true);
    try {
      const { error } = await supabase.from('notes').insert({
        title: newNote.title,
        description: '',
        subject: 'Other',
        course_code: '',
        file_type: 'application/pdf',
        telegram_message_id: '',
        telegram_file_id: '',
        user_id: user.id,
        major: newNote.major,
        uploader_name: user.user_metadata?.full_name || 'Anonymous',
        hearts_count: 0,
        linktree_url: newNote.linktree_url,
        preview_image: null,
        link_type: getLinkType(newNote.linktree_url)
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Note added successfully',
      });

      setNewNote({
        title: '',
        major: '',
        linktree_url: ''
      });
      setShowAddDialog(false);
      initializeData();
    } catch (error: any) {
      console.error('Error adding note:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add note',
        variant: 'destructive',
      });
    } finally {
      setAdding(false);
    }
  };

  const handleHeart = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking heart
    
    if (!user) {
      toast({
        title: 'Error',
        description: 'Please sign in to heart notes',
        variant: 'destructive',
      });
      return;
    }

    try {
      const isHearted = hearts.has(noteId);
      
      if (isHearted) {
        // Unheart
        const { error } = await supabase
          .from('note_hearts')
          .delete()
          .eq('note_id', noteId)
          .eq('user_id', user.id);

        if (error) throw error;
        
        hearts.delete(noteId);
        setNotes(prev => prev.map(note => 
          note.id === noteId 
            ? { ...note, hearts_count: note.hearts_count - 1, is_hearted: false }
            : note
        ));
      } else {
        // Heart
        const { error } = await supabase
          .from('note_hearts')
          .insert({ note_id: noteId, user_id: user.id });

        if (error) throw error;
        
        hearts.add(noteId);
        setAnimatingHearts(prev => new Set([...prev, noteId]));
        setNotes(prev => prev.map(note => 
          note.id === noteId 
            ? { ...note, hearts_count: note.hearts_count + 1, is_hearted: true }
            : note
        ));

        // Remove animation class after animation completes
        setTimeout(() => {
          setAnimatingHearts(prev => {
            const newSet = new Set(prev);
            newSet.delete(noteId);
            return newSet;
          });
        }, 1000);
      }
    } catch (error) {
      console.error('Error toggling heart:', error);
      toast({
        title: 'Error',
        description: 'Failed to update heart status',
        variant: 'destructive',
      });
    }
  };

  const handleUpload = async (formData: FormData) => {
    try {
      const file = formData.get('file') as File;
      if (!file) {
        throw new Error('No file selected');
      }

      console.log('Uploading file with metadata:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      const response = await fetch('http://localhost:3001/api/upload-to-telegram', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload note');
      }

      const data = await response.json();
      console.log('Upload response:', data);
      
      // Save to Supabase with complete file metadata
      const { error: supabaseError } = await supabase.from('notes').insert({
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        subject: formData.get('subject') as string,
        course_code: formData.get('course_code') as string,
        major: formData.get('major') as string,
        file_type: file.type,
        original_filename: file.name,
        telegram_message_id: data.telegram_message_id,
        telegram_file_id: data.file_id,
        user_id: formData.get('user_id') as string,
        uploader_name: formData.get('uploader_name') as string,
        hearts_count: 0,
        linktree_url: null,
        preview_image: null,
        link_type: null
      });

      if (supabaseError) throw supabaseError;

      toast({
        title: 'Success',
        description: 'Note uploaded successfully',
      });

      initializeData();
      setShowUploadDialog(false);
    } catch (error: any) {
      console.error('Error uploading note:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload note',
        variant: 'destructive',
      });
    }
  };

  const fetchNotes = async () => {
    try {
      let query = supabaseClient
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      // Add folder filter if a folder is selected
      if (selectedFolderId) {
        query = query.eq('folder_id', selectedFolderId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch notes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [selectedFolderId]);

  const filterNotes = () => {
    let filtered = [...notes];
    
    if (searchTerm) {
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.course_code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSubject && selectedSubject !== 'all') {
      filtered = filtered.filter(note => note.subject === selectedSubject);
    }

    if (activeTab === 'my-notes' && user) {
      filtered = filtered.filter(note => note.user_id === user.id);
    }

    setFilteredNotes(filtered);
  };

  const handleDownload = async (note: Note) => {
    if (!note.telegram_file_id) {
      toast({
        title: "Error",
        description: "This note doesn't have an associated file.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Show loading toast
      toast({
        title: "Downloading...",
        description: "Please wait while we prepare your file.",
      });

      console.log('Downloading file with metadata:', {
        fileId: note.telegram_file_id,
        originalFilename: note.original_filename,
        fileType: note.file_type
      });

      // Fetch the file from our server
      const response = await fetch(`http://localhost:3001/api/download-note/${note.telegram_file_id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download file');
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = note.original_filename || note.title;
      
      // If we have a Content-Disposition header, try to extract the filename
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);
        if (filenameMatch) {
          filename = decodeURIComponent(filenameMatch[1]);
        } else {
          const simpleMatch = contentDisposition.match(/filename="([^"]+)"/);
          if (simpleMatch) {
            filename = simpleMatch[1];
          }
        }
      }

      console.log('Download response headers:', {
        contentDisposition,
        contentType: response.headers.get('Content-Type'),
        filename
      });

      // Create a blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Show success toast
      toast({
        title: "Success",
        description: "File downloaded successfully!",
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download file. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Notes</h1>
          <p className="text-muted-foreground">Share and discover study materials</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <Loading size="sm" className="h-32" />
              </CardHeader>
              <CardContent>
                <Loading size="sm" className="h-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Study Notes</h1>
            <p className="text-muted-foreground mt-1">Access and share study materials with your peers</p>
          </div>
          <div className="flex gap-2">
            <TelegramTest />
            <Button 
              onClick={() => setShowUploadDialog(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Upload Notes
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Folder Structure */}
          <FolderStructure
            onFolderSelect={setSelectedFolderId}
            selectedFolderId={selectedFolderId}
          />

          {/* Notes Content */}
          <div className="flex-1">
            {/* Search and Filter Section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Chemistry">Chemistry</SelectItem>
                  <SelectItem value="Biology">Biology</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes Grid */}
            <ScrollArea className="h-[calc(100vh-300px)]">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                      <CardHeader className="p-6">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2 mt-2" />
                      </CardHeader>
                      <CardContent className="p-6">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3 mt-2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No notes found</h3>
                  <p className="text-muted-foreground mt-1">
                    {searchTerm ? 'Try adjusting your search' : 'Be the first to share your notes!'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {filteredNotes.map((note, index) => (
                      <motion.div
                        key={note.id}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        whileHover="hover"
                        custom={index}
                      >
                        <Card className={cn(
                          "overflow-hidden transition-all duration-200",
                          "hover:shadow-lg hover:shadow-primary/10",
                          "bg-gradient-to-br from-background to-muted/50",
                          "border border-border/50",
                          "backdrop-blur-sm",
                          note.link_type && `bg-gradient-to-br ${getLinkColor(note.link_type)}`
                        )}>
                          <CardHeader className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <CardTitle className="line-clamp-2 text-lg font-semibold text-foreground">
                                  {note.title}
                                </CardTitle>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <User className="h-4 w-4" />
                                  <span>{note.uploader_name}</span>
                                </div>
                              </div>
                              {note.link_type && (
                                <div className="flex-shrink-0">
                                  {getLinkIcon(note.link_type)}
                                </div>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="p-6 pt-0">
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                              {note.description}
                            </p>
                            <div className="flex flex-wrap gap-2 mb-4">
                              <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30">
                                {note.subject}
                              </Badge>
                              {note.major && (
                                <Badge variant="outline" className="border-primary/20 text-primary">
                                  {note.major}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-border/50">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={cn(
                                    "gap-1 hover:bg-red-500/10",
                                    note.is_hearted && "text-red-400 hover:text-red-300"
                                  )}
                                  onClick={(e) => handleHeart(note.id, e)}
                                >
                                  <Heart className={cn(
                                    "h-4 w-4",
                                    note.is_hearted && "fill-current"
                                  )} />
                                  <span>{note.hearts_count}</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-1 hover:bg-primary/10 text-primary hover:text-primary/90"
                                  onClick={() => handleDownload(note)}
                                >
                                  <Download className="h-4 w-4" />
                                  <span>Download</span>
                                </Button>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(note.created_at || '').toLocaleDateString()}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>

      <NoteUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onSuccess={() => {
          initializeData();
          setShowUploadDialog(false);
        }}
        selectedFolderId={selectedFolderId}
      />
    </div>
  );
};

// Update the styles at the top of the file, after the imports
const styles = `
@keyframes heart-burst {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

@keyframes heart-glow {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.8;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

@keyframes ping-slow {
  0% {
    transform: scale(1);
    opacity: 0.75;
  }
  50% {
    transform: scale(1.5);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

${[...Array(24)].map((_, i) => `
@keyframes heart-particle-${i} {
  0% {
    transform: rotate(${i * 15}deg) translateY(0);
    opacity: 1;
  }
  100% {
    transform: rotate(${i * 15}deg) translateY(-40px);
    opacity: 0;
  }
}`).join('\n')}

.animate-heart-burst {
  animation: heart-burst 1s ease-out forwards;
  filter: drop-shadow(0 0 20px rgba(239, 68, 68, 0.8));
}

.animate-heart-particles {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.animate-heart-glow {
  animation: heart-glow 1s ease-out forwards;
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.animate-ping-slow {
  animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}
`;

// Add the styles to the document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default NotesTab;

