
import React, { useState, useEffect } from 'react';
import { Search, Tag, Clock, MapPin, Plus, Heart, MessageCircle } from 'lucide-react';
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

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  original_price?: number;
  category: string;
  condition: string;
  location: string;
  image_url?: string;
  created_at: string;
  user_id: string;
}

const MarketplaceTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '',
    condition: '',
    location: ''
  });

  const categories = ['Textbooks', 'Electronics', 'Furniture', 'Lab Equipment', 'Clothing', 'Other'];

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('marketplace_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching marketplace items:', error);
      toast.error('Failed to load marketplace items');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitItem = async () => {
    if (!user) {
      toast.error('Please sign in to list an item');
      return;
    }

    if (!newItem.title.trim() || !newItem.description.trim() || !newItem.price || !newItem.category || !newItem.condition || !newItem.location.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('marketplace_items')
        .insert({
          user_id: user.id,
          title: newItem.title,
          description: newItem.description,
          price: parseFloat(newItem.price),
          original_price: newItem.originalPrice ? parseFloat(newItem.originalPrice) : null,
          category: newItem.category,
          condition: newItem.condition,
          location: newItem.location
        });

      if (error) throw error;

      toast.success('Item listed successfully!');
      setNewItem({
        title: '',
        description: '',
        price: '',
        originalPrice: '',
        category: '',
        condition: '',
        location: ''
      });
      fetchItems();
    } catch (error) {
      console.error('Error listing item:', error);
      toast.error('Failed to list item');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">Student Marketplace</h1>
        <p className="text-muted-foreground">Buy and sell items with fellow students</p>
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse">Browse Items</TabsTrigger>
          <TabsTrigger value="sell">Sell an Item</TabsTrigger>
        </TabsList>
        
        <TabsContent value="browse" className="space-y-6">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item, index) => (
              <Card key={item.id} className="hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="relative">
                  <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                    <span className="text-gray-500">No Image</span>
                  </div>
                  <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors">
                    <Heart className="h-4 w-4 text-gray-600" />
                  </button>
                  <Badge 
                    className={`absolute top-2 left-2 ${getConditionColor(item.condition)}`}
                  >
                    {item.condition}
                  </Badge>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg leading-tight">{item.title}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-primary">${item.price}</span>
                    {item.original_price && (
                      <span className="text-sm text-muted-foreground line-through">
                        ${item.original_price}
                      </span>
                    )}
                    <Badge variant="outline">{item.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{item.location}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Posted {formatDate(item.created_at)}</span>
                    </div>
                  </div>

                  <Button className="w-full">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact Seller
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No items found matching your criteria.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="sell" className="space-y-6">
          <Card className="animate-scale-in">
            <CardHeader>
              <CardTitle>Sell an Item</CardTitle>
              <p className="text-muted-foreground">List your item for other students to find</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input 
                placeholder="Item Title" 
                value={newItem.title}
                onChange={(e) => setNewItem({...newItem, title: e.target.value})}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input 
                  placeholder="Price ($)" 
                  type="number" 
                  value={newItem.price}
                  onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                />
                <Input 
                  placeholder="Original Price ($)" 
                  type="number" 
                  value={newItem.originalPrice}
                  onChange={(e) => setNewItem({...newItem, originalPrice: e.target.value})}
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
              <Button 
                className="w-full" 
                onClick={handleSubmitItem}
                disabled={submitting}
              >
                <Plus className="h-4 w-4 mr-2" />
                {submitting ? 'Listing...' : 'List Item'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketplaceTab;
