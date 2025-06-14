import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Plus, AlertCircle, CheckCircle, Trash2, Upload, MessageSquare } from 'lucide-react';
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

interface LostItem {
  id: string;
  type: string;
  title: string;
  description: string;
  category: string;
  location: string;
  whatsapp_number: string;
  image_url: string | null;
  status: string;
  created_at: string;
  user_id: string;
}

const LostItemsTab = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'browse' | 'report' | 'my-items'>('browse');
  const [showMyItems, setShowMyItems] = useState(false);
  const [newItem, setNewItem] = useState({
    type: 'lost',
    title: '',
    description: '',
    category: '',
    location: '',
    whatsapp_number: '',
    image: null as File | null
  });

  const categories = ['Electronics', 'Jewelry', 'Keys', 'Clothing', 'Documents', 'Other'];

  useEffect(() => {
    fetchLostItems();
  }, [showMyItems]);

  const fetchLostItems = async () => {
    try {
      let query = supabase
        .from('lost_items')
        .select('id, type, title, description, category, location, whatsapp_number, image_url, status, created_at, user_id')
        .order('created_at', { ascending: false });

      if (showMyItems && user) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLostItems(data || []);
    } catch (error) {
      console.error('Error fetching lost items:', error);
      toast.error('Failed to load lost items');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      setNewItem({ ...newItem, image: file });
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('lost-items')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('lost-items')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    }
  };

  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to report an item');
      return;
    }

    if (!newItem.whatsapp_number.match(/^\+?[1-9]\d{1,14}$/)) {
      toast.error('Please enter a valid WhatsApp number');
      return;
    }

    setSubmitting(true);

    try {
      let imageUrl = null;
      if (newItem.image) {
        imageUrl = await uploadImage(newItem.image);
      }

      const { error } = await supabase.from('lost_items').insert({
        user_id: user.id,
        type: newItem.type,
        title: newItem.title,
        description: newItem.description,
        category: newItem.category,
        location: newItem.location,
        whatsapp_number: newItem.whatsapp_number,
        image_url: imageUrl,
        status: 'open'
      });

      if (error) throw error;

      toast.success(`${newItem.type === 'lost' ? 'Lost' : 'Found'} item reported successfully!`);
      setNewItem({
        type: 'lost',
        title: '',
        description: '',
        category: '',
        location: '',
        whatsapp_number: '',
        image: null
      });
      setActiveTab('browse');
      fetchLostItems();
    } catch (error) {
      console.error('Error submitting item:', error);
      toast.error('Failed to submit item');
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
      const { error } = await supabase
        .from('lost_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Item deleted successfully');
      setLostItems(items => items.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const handleContact = (whatsappNumber: string) => {
    const formattedNumber = whatsappNumber.startsWith('+') ? whatsappNumber : `+${whatsappNumber}`;
    window.open(`https://wa.me/${formattedNumber}`, '_blank');
  };

  const filteredItems = lostItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getStatusIcon = (status: string) => {
    return status === 'claimed' ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <AlertCircle className="h-4 w-4 text-orange-600" />
    );
  };

  const getTypeColor = (type: string) => {
    return type === 'lost' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading lost & found items...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-[2000px] mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">Lost & Found</h1>
        <p className="text-muted-foreground">Help reunite students with their belongings</p>
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">Browse Items</TabsTrigger>
          <TabsTrigger value="report">Report Item</TabsTrigger>
          <TabsTrigger value="my-items">My Items</TabsTrigger>
        </TabsList>
        
        <TabsContent value="browse" className="space-y-6 w-full">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search lost and found items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Tabs defaultValue="lost" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="lost" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Lost Items
                <Badge variant="secondary" className="ml-2">
                  {filteredItems.filter(item => item.type === 'lost').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="found" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Found Items
                <Badge variant="secondary" className="ml-2">
                  {filteredItems.filter(item => item.type === 'found').length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lost" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                <AnimatePresence mode="popLayout">
                  {filteredItems
                    .filter(item => item.type === 'lost')
                    .map((item, index) => (
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
                            className={`hover:shadow-lg transition-all duration-300 w-full ${
                              user && item.user_id === user.id 
                                ? 'border-2 border-primary relative' 
                                : ''
                            }`}
                          >
                            {user && item.user_id === user.id && (
                              <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground">
                                Your Item
                              </Badge>
                            )}
                            <CardHeader className="p-3">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center space-x-2">
                                  {getStatusIcon(item.status)}
                                  <CardTitle className="text-base">{item.title}</CardTitle>
                                </div>
                                <Badge variant="outline">{item.category}</Badge>
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
                                    Contact Owner
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
              {filteredItems.filter(item => item.type === 'lost').length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No lost items found matching your criteria.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="found" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                <AnimatePresence mode="popLayout">
                  {filteredItems
                    .filter(item => item.type === 'found')
                    .map((item, index) => (
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
                            className={`hover:shadow-lg transition-all duration-300 w-full ${
                              user && item.user_id === user.id 
                                ? 'border-2 border-primary relative' 
                                : ''
                            }`}
                          >
                            {user && item.user_id === user.id && (
                              <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground">
                                Your Item
                              </Badge>
                            )}
                            <CardHeader className="p-3">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center space-x-2">
                                  {getStatusIcon(item.status)}
                                  <CardTitle className="text-base">{item.title}</CardTitle>
                                </div>
                                <Badge variant="outline">{item.category}</Badge>
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
                                    Contact Owner
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
              {filteredItems.filter(item => item.type === 'found').length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No found items matching your criteria.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="report" className="space-y-6 w-full">
          <Tabs value={newItem.type} onValueChange={(value) => setNewItem({...newItem, type: value})} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="lost">Report Lost Item</TabsTrigger>
              <TabsTrigger value="found">Report Found Item</TabsTrigger>
            </TabsList>
            
            <TabsContent value="lost">
              <Card className="animate-scale-in w-full">
                <CardHeader>
                  <CardTitle>Report a Lost Item</CardTitle>
                  <p className="text-muted-foreground">Provide details about your lost item</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input 
                    placeholder="Item Title (e.g., Black iPhone with Blue Case)" 
                    value={newItem.title}
                    onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Input 
                      placeholder="Last Seen Location" 
                      value={newItem.location}
                      onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                    />
                  </div>
                  <Input 
                    placeholder="WhatsApp Number (e.g., +97312345678)" 
                    type="tel"
                    value={newItem.whatsapp_number}
                    onChange={(e) => setNewItem({...newItem, whatsapp_number: e.target.value})}
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Item Image (Optional)</label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="flex-1"
                      />
                      {newItem.image && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setNewItem({...newItem, image: null})}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    {newItem.image && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {newItem.image.name}
                      </p>
                    )}
                  </div>
                  <Textarea 
                    placeholder="Detailed description of the item..."
                    value={newItem.description}
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                    rows={4}
                  />
                  <Button 
                    className="w-full" 
                    onClick={handleSubmitItem}
                    disabled={submitting}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {submitting ? 'Reporting...' : 'Report Lost Item'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="found">
              <Card className="animate-scale-in w-full">
                <CardHeader>
                  <CardTitle>Report a Found Item</CardTitle>
                  <p className="text-muted-foreground">Help someone find their lost belongings</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input 
                    placeholder="Item Description (e.g., Red Wallet)" 
                    value={newItem.title}
                    onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Input 
                      placeholder="Found Location" 
                      value={newItem.location}
                      onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                    />
                  </div>
                  <Input 
                    placeholder="WhatsApp Number (e.g., +97312345678)" 
                    type="tel"
                    value={newItem.whatsapp_number}
                    onChange={(e) => setNewItem({...newItem, whatsapp_number: e.target.value})}
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Item Image (Optional)</label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="flex-1"
                      />
                      {newItem.image && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setNewItem({...newItem, image: null})}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    {newItem.image && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {newItem.image.name}
                      </p>
                    )}
                  </div>
                  <Textarea 
                    placeholder="Description of the found item..."
                    value={newItem.description}
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                    rows={4}
                  />
                  <Button 
                    className="w-full" 
                    onClick={handleSubmitItem}
                    disabled={submitting}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {submitting ? 'Reporting...' : 'Report Found Item'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="my-items" className="space-y-6 w-full">
          {!user ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Please sign in to view your reported items.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search your reported items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="lost">Lost Items</SelectItem>
                    <SelectItem value="found">Found Items</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
                <AnimatePresence mode="popLayout">
                  {filteredItems
                    .filter(item => item.user_id === user.id)
                    .map((item, index) => (
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
                            className={`hover:shadow-lg transition-all duration-300 w-full ${
                              user && item.user_id === user.id 
                                ? 'border-2 border-primary relative' 
                                : ''
                            }`}
                          >
                            {user && item.user_id === user.id && (
                              <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground">
                                Your Item
                              </Badge>
                            )}
                            <CardHeader className="p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center space-x-2">
                                  {getStatusIcon(item.status)}
                                  <CardTitle className="text-base">{item.title}</CardTitle>
                                </div>
                                <div className="flex space-x-2">
                                  <Badge className={getTypeColor(item.type)}>
                                    {item.type === 'lost' ? 'Lost' : 'Found'}
                                  </Badge>
                                  <Badge variant="outline">{item.category}</Badge>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <div className="space-y-3">
                                {item.image_url && (
                                  <div className="relative w-full rounded-lg overflow-hidden bg-muted">
                                    <div className="aspect-square w-full">
                                      <img 
                                        src={item.image_url} 
                                        alt={item.title}
                                        className="w-full h-full object-contain"
                                      />
                                    </div>
                                  </div>
                                )}
                                <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                                
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2 text-xs">
                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                    <span>{item.location}</span>
                                  </div>
                                  <div className="flex items-center space-x-2 text-xs">
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
                                    Contact Owner
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
                        </motion.div>
                      </motion.div>
                    ))}
                </AnimatePresence>
              </div>

              {filteredItems.filter(item => item.user_id === user.id).length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">You haven't reported any items yet.</p>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LostItemsTab;
