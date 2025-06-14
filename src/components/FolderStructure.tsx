import React, { useState, useEffect } from 'react';
import { Folder, ChevronRight, ChevronDown, Plus, MoreVertical, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_PUBLIC_SUPABASE_URL!,
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY!
);

interface FolderItem {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  user_id: string;
  created_by: string;
  children?: FolderItem[];
}

interface FolderStructureProps {
  onFolderSelect: (folderId: string | null) => void;
  selectedFolderId: string | null;
}

export function FolderStructure({ onFolderSelect, selectedFolderId }: FolderStructureProps) {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchFolders();
    }
  }, [user]);

  const fetchFolders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        console.error('Error fetching folders:', error);
        throw error;
      }

      // Build folder tree
      const folderMap = new Map<string, FolderItem>();
      const rootFolders: FolderItem[] = [];

      // First pass: create folder objects
      data.forEach((folder: any) => {
        folderMap.set(folder.id, { ...folder, children: [] });
      });

      // Second pass: build tree structure
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
      toast.error('Failed to load folders');
    }
  };

  const handleCreateFolder = async () => {
    if (!user) {
      toast.error('Please sign in to create folders');
      return;
    }

    if (!newFolderName.trim()) {
      toast.error('Please enter a folder name');
      return;
    }

    setIsCreating(true);

    try {
      // First, check if a folder with the same name already exists in the same parent
      const { data: existingFolders, error: checkError } = await supabase
        .from('folders')
        .select('id')
        .eq('name', newFolderName.trim())
        .eq('parent_id', parentFolderId)
        .eq('user_id', user.id);

      if (checkError) throw checkError;

      if (existingFolders && existingFolders.length > 0) {
        toast.error('A folder with this name already exists in this location');
        return;
      }

      // Create the new folder
      const { data: newFolder, error: createError } = await supabase
        .from('folders')
        .insert({
          name: newFolderName.trim(),
          parent_id: parentFolderId,
          user_id: user.id,
          created_by: user.email
        })
        .select()
        .single();

      if (createError) throw createError;

      if (!newFolder) {
        throw new Error('Failed to create folder');
      }

      toast.success('Folder created successfully');
      setShowNewFolderDialog(false);
      setNewFolderName('');
      setParentFolderId(null);
      await fetchFolders();
    } catch (error: any) {
      console.error('Error creating folder:', error);
      toast.error(error.message || 'Failed to create folder');
    } finally {
      setIsCreating(false);
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const renderFolder = (folder: FolderItem, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const hasChildren = folder.children && folder.children.length > 0;

    return (
      <div key={folder.id}>
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent",
            selectedFolderId === folder.id && "bg-accent"
          )}
          style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
          onClick={() => onFolderSelect(folder.id)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              toggleFolder(folder.id);
            }}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : (
              <div className="w-4" />
            )}
          </Button>
          <Folder className="h-4 w-4 text-primary" />
          <span className="text-sm">{folder.name}</span>
        </div>
        {isExpanded && hasChildren && (
          <div className="mt-1">
            {folder.children!.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 border-r border-border bg-card">
      <div className="p-4 border-b border-border">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            setParentFolderId(null);
            setShowNewFolderDialog(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Folder
        </Button>
      </div>
      <div className="p-2">
        {folders.map(folder => renderFolder(folder))}
      </div>

      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isCreating) {
                  e.preventDefault();
                  handleCreateFolder();
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowNewFolderDialog(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateFolder}
                disabled={isCreating || !newFolderName.trim()}
              >
                {isCreating ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 