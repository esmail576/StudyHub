import React, { useState, useEffect } from 'react';
import { Link, ExternalLink, User, Calendar, Plus, Search, Image as ImageIcon, FileText, Cloud, Link as LinkIcon, Heart } from 'lucide-react';
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

interface Note {
  id: string;
  title: string;
  major: string;
  linktree_url: string;
  created_at: string;
  user_id: string;
  uploader_name?: string;
  preview_image?: string;
  link_type?: 'linktree' | 'drive' | 'dropbox' | 'other';
  hearts_count: number;
  is_hearted?: boolean;
}

interface DatabaseNote {
  id: string;
  title: string;
  major: string;
  linktree_url: string;
  created_at: string;
  user_id: string;
  uploader_name: string | null;
  hearts_count: number;
}

const getLinkType = (url: string): 'linktree' | 'drive' | 'dropbox' | 'other' => {
  if (url.includes('linktr.ee/')) return 'linktree';
  if (url.includes('drive.google.com/')) return 'drive';
  if (url.includes('dropbox.com/')) return 'dropbox';
  return 'other';
};

const getLinkIcon = (type: 'linktree' | 'drive' | 'dropbox' | 'other') => {
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

const getLinkColor = (type: 'linktree' | 'drive' | 'dropbox' | 'other') => {
  switch (type) {
    case 'linktree':
      return 'from-purple-100 to-pink-100';
    case 'drive':
      return 'from-blue-50 to-indigo-50';
    case 'dropbox':
      return 'from-blue-50 to-cyan-50';
    default:
      return 'from-gray-50 to-slate-50';
  }
};

const getLinkTextColor = (type: 'linktree' | 'drive' | 'dropbox' | 'other') => {
  switch (type) {
    case 'linktree':
      return 'text-purple-700';
    case 'drive':
      return 'text-blue-700';
    case 'dropbox':
      return 'text-blue-700';
    default:
      return 'text-gray-700';
  }
};

const NotesTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
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

  const initializeData = async () => {
    setLoading(true);
    try {
      // First fetch user hearts if logged in
      if (user) {
        const { data: heartsData, error: heartsError } = await supabase
          .from('note_hearts')
          .select('note_id')
          .eq('user_id', user.id);

        if (heartsError) throw heartsError;
        
        const heartedNotes = new Set(heartsData.map(h => h.note_id));
        setHearts(heartedNotes);

        // Then fetch notes
        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select('*')
          .order('hearts_count', { ascending: false })
          .order('created_at', { ascending: false });

        if (notesError) throw notesError;

        // Transform notes with hearted state
        const transformedData = (notesData as unknown as DatabaseNote[]).map(note => ({
          id: note.id,
          title: note.title,
          major: note.major,
          linktree_url: note.linktree_url,
          created_at: note.created_at,
          user_id: note.user_id,
          uploader_name: note.uploader_name || undefined,
          preview_image: note.linktree_url.includes('linktr.ee/') 
            ? `https://api.microlink.io/?url=${encodeURIComponent(note.linktree_url)}&meta=true&embed=image.url`
            : undefined,
          link_type: getLinkType(note.linktree_url),
          hearts_count: note.hearts_count,
          is_hearted: heartedNotes.has(note.id)
        }));

        setNotes(transformedData);
      } else {
        // If not logged in, just fetch notes without hearted state
        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select('*')
          .order('hearts_count', { ascending: false })
          .order('created_at', { ascending: false });

        if (notesError) throw notesError;

        const transformedData = (notesData as unknown as DatabaseNote[]).map(note => ({
          id: note.id,
          title: note.title,
          major: note.major,
          linktree_url: note.linktree_url,
          created_at: note.created_at,
          user_id: note.user_id,
          uploader_name: note.uploader_name || undefined,
          preview_image: note.linktree_url.includes('linktr.ee/') 
            ? `https://api.microlink.io/?url=${encodeURIComponent(note.linktree_url)}&meta=true&embed=image.url`
            : undefined,
          link_type: getLinkType(note.linktree_url),
          hearts_count: note.hearts_count,
          is_hearted: false
        }));

        setNotes(transformedData);
      }
    } catch (error) {
      console.error('Error initializing data:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeData();
  }, [user]);

  const handleAddNote = async () => {
    if (!user) {
      toast.error('Please sign in to add notes');
      return;
    }

    if (!newNote.title.trim() || !newNote.major.trim() || !newNote.linktree_url.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const linkType = getLinkType(newNote.linktree_url);
    if (linkType === 'other') {
      toast.error('Please enter a valid Linktree, Google Drive, or Dropbox URL');
      return;
    }

    setAdding(true);
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: newNote.title.trim(),
          major: `${newNote.major.trim()} Student`,
          linktree_url: newNote.linktree_url.trim(),
          uploader_name: user.email || 'Anonymous'
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data returned after insert');
      }

      toast.success('Resource added successfully!');
      setShowAddDialog(false);
      setNewNote({
        title: '',
        major: '',
        linktree_url: ''
      });
      // Refresh the data
      initializeData();
    } catch (error: any) {
      console.error('Error adding note:', error);
      toast.error(error.message || 'Failed to add resource. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleHeart = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking heart
    
    if (!user) {
      toast.error('Please sign in to heart notes');
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
      toast.error('Failed to update heart status');
    }
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.major.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">Study Resources</h1>
        <p className="text-muted-foreground">Share and discover study materials through various platforms</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="hover:scale-105 transition-transform">
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Study Resource</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newNote.title}
                  onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Data Structures Notes"
                />
              </div>
              <div>
                <Label htmlFor="major">Major *</Label>
                <Input
                  id="major"
                  value={newNote.major}
                  onChange={(e) => setNewNote(prev => ({ ...prev, major: e.target.value }))}
                  placeholder="e.g., Computer Science"
                />
              </div>
              <div>
                <Label htmlFor="linktree">Resource URL *</Label>
                <Input
                  id="linktree"
                  value={newNote.linktree_url}
                  onChange={(e) => setNewNote(prev => ({ ...prev, linktree_url: e.target.value }))}
                  placeholder="e.g., https://linktr.ee/username or https://drive.google.com/..."
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Supported platforms: Linktree, Google Drive, Dropbox
                </p>
              </div>
              <Button 
                onClick={handleAddNote} 
                className="w-full"
                disabled={adding}
              >
                {adding ? 'Adding...' : 'Add Resource'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotes.map((note) => (
          <Card key={note.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-2 hover:border-purple-500/50 relative">
            <div 
              className={`relative h-64 w-full overflow-hidden bg-gradient-to-br ${getLinkColor(note.link_type || 'other')} cursor-pointer`}
              onClick={() => window.open(note.linktree_url, '_blank')}
            >
              {note.preview_image ? (
                <img
                  src={note.preview_image}
                  alt={note.title}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://placehold.co/600x400/e2e8f0/64748b?text=Resource';
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                  <div className="relative">
                    {getLinkIcon(note.link_type || 'other')}
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                      <Link className="h-4 w-4 text-gray-500" />
                    </div>
                  </div>
                  <div className="mt-6 space-y-2">
                    <h3 className={`text-xl font-bold ${getLinkTextColor(note.link_type || 'other')} line-clamp-2`}>
                      {note.title}
                    </h3>
                    <p className="text-sm font-medium text-gray-500">
                      {note.link_type === 'drive' ? 'Google Drive Resource' :
                       note.link_type === 'dropbox' ? 'Dropbox Resource' :
                       'Study Resource'}
                    </p>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex flex-col space-y-1">
                  <h3 className="text-lg font-semibold text-white line-clamp-1">
                    {note.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="w-fit bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white transition-colors duration-300">
                      {note.major}
                    </Badge>
                    <button
                      onClick={(e) => handleHeart(note.id, e)}
                      className={`group/heart flex items-center space-x-2 px-3 py-1.5 rounded-full transition-all duration-300 ${
                        note.is_hearted 
                          ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30' 
                          : 'bg-white/90 text-gray-700 hover:bg-white hover:shadow-md'
                      }`}
                    >
                      <div className="relative">
                        <Heart 
                          className={`h-5 w-5 transition-transform duration-300 ${
                            note.is_hearted 
                              ? 'fill-current scale-110' 
                              : 'group-hover/heart:scale-110'
                          }`} 
                        />
                        {note.is_hearted && (
                          <div className="absolute inset-0 animate-ping-slow">
                            <Heart className="h-5 w-5 text-red-500 fill-current opacity-75" />
                          </div>
                        )}
                      </div>
                      <span className={`text-sm font-medium transition-colors duration-300 ${
                        note.is_hearted ? 'text-white' : 'text-gray-700'
                      }`}>
                        {note.hearts_count}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              {animatingHearts.has(note.id) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="animate-heart-burst">
                    <Heart className="h-24 w-24 text-red-500 fill-current drop-shadow-lg" />
                  </div>
                  <div className="absolute inset-0 animate-heart-particles">
                    {[...Array(24)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-3 h-3 bg-red-500 rounded-full"
                        style={{
                          transform: `rotate(${i * 15}deg) translateY(-40px)`,
                          animation: `heart-particle-${i} 1s ease-out forwards`,
                          filter: 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.8))'
                        }}
                      />
                    ))}
                  </div>
                  <div className="absolute inset-0 animate-heart-glow">
                    <div className="absolute inset-0 bg-red-500/20 rounded-full blur-3xl" />
                    <div className="absolute inset-0 bg-red-500/10 rounded-full blur-2xl" />
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {filteredNotes.length === 0 && (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <Link className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No resources found matching your criteria.</p>
        </div>
      )}
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
