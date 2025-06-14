import React, { useState, useEffect, useRef } from 'react';
import { Search, Tag, Clock, MapPin, Plus, Heart, MessageCircle, Upload, X, Trash2, Calendar, User, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  original_price: number;
  category: string;
  condition: string;
  location: string;
  image_url: string;
  whatsapp_number?: string;
  created_at: string;
  user_id: string;
  uploader_name?: string;
}

const MarketplaceTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    price: '',
    original_price: '',
    category: '',
    condition: '',
    location: '',
    whatsapp_number: ''
  });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showMyItems, setShowMyItems] = useState(false);

  const categories = ['Textbooks', 'Electronics', 'Furniture', 'Lab Equipment', 'Clothing', 'Other'];

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
    }
  };

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredItems(items);
    } else {
      const searchLower = searchTerm.toLowerCase().replace(/\s+/g, '');
      const filtered = items.filter(item => {
        const title = item.title.toLowerCase().replace(/\s+/g, '');
        const description = item.description.toLowerCase().replace(/\s+/g, '');
        const category = item.category.toLowerCase().replace(/\s+/g, '');
        const location = item.location.toLowerCase().replace(/\s+/g, '');
        const uploaderName = item.uploader_name?.toLowerCase().replace(/\s+/g, '') ?? '';

        return title.includes(searchLower) ||
               description.includes(searchLower) ||
               category.includes(searchLower) ||
               location.includes(searchLower) ||
               uploaderName.includes(searchLower);
      });
      setFilteredItems(filtered);
    }
  }, [searchTerm, items]);

  const initializeData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('marketplace_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setItems(data);
      setFilteredItems(data);
    } catch (error) {
      console.error('Error loading items:', error);
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('marketplace-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('marketplace-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    }
  };

  const handleSubmitItem = async () => {
    if (!user) {
      toast.error('Please sign in to list an item');
      return;
    }

    if (!newItem.title.trim() || !newItem.description.trim() || !newItem.price || 
        !newItem.category || !newItem.condition || !newItem.location.trim() || 
        !newItem.whatsapp_number.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = null;
      if (selectedImage) {
        setUploadingImage(true);
        imageUrl = await uploadImage(selectedImage);
        setUploadingImage(false);
      }

      const { error } = await supabase
        .from('marketplace_items')
        .insert({
          user_id: user.id,
          title: newItem.title,
          description: newItem.description,
          price: parseFloat(newItem.price),
          original_price: newItem.original_price ? parseFloat(newItem.original_price) : null,
          category: newItem.category,
          condition: newItem.condition,
          location: newItem.location,
          whatsapp_number: newItem.whatsapp_number,
          image_url: imageUrl
        });

      if (error) throw error;

      toast.success('Item listed successfully!');
      setNewItem({
        title: '',
        description: '',
        price: '',
        original_price: '',
        category: '',
        condition: '',
        location: '',
        whatsapp_number: ''
      });
      setSelectedImage(null);
      setImagePreview(null);
      initializeData();
    } catch (error) {
      console.error('Error listing item:', error);
      toast.error('Failed to list item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!user) {
      toast.error('Please sign in to delete items');
      return;
    }

    try {
      // Delete the item
      const { error: deleteError } = await supabase
        .from('marketplace_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw deleteError;
      }

      // Optimistically update the UI
      setItems(prevItems => prevItems.filter(item => item.id !== itemId));
      toast.success('Item deleted successfully!');

      // Verify deletion by attempting to fetch the item
      const { data: verifyData, error: verifyError } = await supabase
        .from('marketplace_items')
        .select('id')
        .eq('id', itemId)
        .single();

      if (verifyData) {
        // If item still exists, refresh the list
        const { data: freshData } = await supabase
          .from('marketplace_items')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (freshData) {
          setItems(freshData);
        }
      }
    } catch (error) {
      console.error('Delete operation failed:', error);
      toast.error('Failed to delete item');
      
      // Refresh the list to ensure UI is in sync
      const { data: refreshData } = await supabase
        .from('marketplace_items')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (refreshData) {
        setItems(refreshData);
      }
    }
  };

  const myItems = user ? items.filter(item => item.user_id === user.id) : [];

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'Excellent': return 'bg-green-100 text-green-800';
      case 'Good': return 'bg-blue-100 text-blue-800';
      case 'Fair': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading marketplace...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-[2000px] mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">Student Marketplace</h1>
        <p className="text-muted-foreground">Buy and sell items with fellow students</p>
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">Browse Items</TabsTrigger>
          <TabsTrigger value="sell">Sell an Item</TabsTrigger>
          <TabsTrigger value="my-items">My Items</TabsTrigger>
        </TabsList>
        
        <TabsContent value="browse" className="space-y-6 w-full">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  custom={index}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  whileHover={{ 
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                >
                  <motion.div layout>
                    <Card 
                      className={`hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in w-full ${
                        user && item.user_id === user.id 
                          ? 'border-2 border-primary relative' 
                          : ''
                      }`} 
                    >
                      {user && item.user_id === user.id && (
                        <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground">
                          Your Listing
                        </Badge>
                      )}
                      <CardHeader className="p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-2">
                            <CardTitle className="text-base">{item.title}</CardTitle>
                          </div>
                          <div className="flex space-x-2">
                            <Badge variant="outline">{item.category}</Badge>
                            <Badge className={getConditionColor(item.condition)}>
                              {item.condition}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <div className="space-y-2">
                          {item.image_url && (
                            <div className="relative w-full rounded-lg overflow-hidden bg-muted">
                              <div className="aspect-[4/3] w-full">
                                <img 
                                  src={item.image_url} 
                                  alt={item.title}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            </div>
                          )}
                          <div className="flex items-baseline space-x-2">
                            <span className="text-xl font-bold text-primary">{item.price} BD</span>
                            {item.original_price && (
                              <span className="text-sm text-muted-foreground line-through">
                                {item.original_price} BD
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                        
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span>{item.location}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span>{formatDate(item.created_at)}</span>
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button 
                              className="flex-1 text-sm bg-green-600 hover:bg-green-700 text-white"
                              variant="default"
                              onClick={() => window.open(`https://wa.me/${item.whatsapp_number}`, '_blank')}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Contact Seller
                            </Button>
                            {user && item.user_id === user.id && (
                              <Button 
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No items found matching your criteria.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="sell" className="space-y-6 w-full">
          <Card className="animate-scale-in w-full">
            <CardHeader>
              <CardTitle>Sell an Item</CardTitle>
              <p className="text-muted-foreground">List your item for other students to find</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                placeholder="Item Title" 
                value={newItem.title}
                onChange={(e) => setNewItem({...newItem, title: e.target.value})}
              />
                <Input
                  placeholder="WhatsApp Number (with country code, e.g., +1234567890)"
                  value={newItem.whatsapp_number}
                  onChange={(e) => setNewItem({...newItem, whatsapp_number: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input 
                  placeholder="Price (BD)" 
                  type="number" 
                  value={newItem.price}
                  onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                />
                <Input 
                  placeholder="Original Price (BD)" 
                  type="number" 
                  value={newItem.original_price}
                  onChange={(e) => setNewItem({...newItem, original_price: e.target.value})}
                />
                <Select value={newItem.category} onValueChange={(value) => setNewItem({...newItem, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={newItem.condition} onValueChange={(value) => setNewItem({...newItem, condition: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Excellent">Excellent</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                    <SelectItem value="Poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
                <Input 
                  placeholder="Location/Pickup Area" 
                  value={newItem.location}
                  onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                />
              </div>
              <Textarea 
                placeholder="Item description..."
                value={newItem.description}
                onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                rows={4}
              />
              
              {/* Image Upload Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Item Image</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                </div>
                {imagePreview && (
                  <div className="relative w-full aspect-square max-w-md mx-auto rounded-lg overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <Button 
                className="w-full" 
                onClick={handleSubmitItem}
                disabled={submitting || uploadingImage}
              >
                <Plus className="h-4 w-4 mr-2" />
                {submitting ? 'Listing...' : 'List Item'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-items" className="space-y-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
            {myItems.map((item, index) => (
              <Card 
                key={item.id} 
                className={`hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in w-full ${
                  user && item.user_id === user.id 
                    ? 'border-2 border-primary relative' 
                    : ''
                }`} 
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {user && item.user_id === user.id && (
                  <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground">
                    Your Listing
                  </Badge>
                )}
                <CardHeader className="p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-base">{item.title}</CardTitle>
                    </div>
                    <div className="flex space-x-2">
                      <Badge variant="outline">{item.category}</Badge>
                      <Badge className={getConditionColor(item.condition)}>
                        {item.condition}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="space-y-2">
                    {item.image_url && (
                      <div className="relative w-full rounded-lg overflow-hidden bg-muted">
                        <div className="aspect-[4/3] w-full">
                          <img 
                            src={item.image_url} 
                            alt={item.title}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex items-baseline space-x-2">
                      <span className="text-xl font-bold text-primary">{item.price} BD</span>
                      {item.original_price && (
                        <span className="text-sm text-muted-foreground line-through">
                          {item.original_price} BD
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                    
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span>{item.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button 
                        className="flex-1 text-sm bg-green-600 hover:bg-green-700 text-white"
                        variant="default"
                        onClick={() => window.open(`https://wa.me/${item.whatsapp_number}`, '_blank')}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Contact Seller
                      </Button>
                      <Button 
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {myItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">You haven't listed any items yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketplaceTab;
