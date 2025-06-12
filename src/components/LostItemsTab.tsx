
import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Plus, AlertCircle, CheckCircle } from 'lucide-react';
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

interface LostItem {
  id: string;
  type: string;
  title: string;
  description: string;
  category: string;
  location: string;
  contact_email: string;
  reward?: number;
  status: string;
  created_at: string;
  user_id: string;
}

const LostItemsTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const [newItem, setNewItem] = useState({
    type: 'lost',
    title: '',
    description: '',
    category: '',
    location: '',
    contactEmail: '',
    reward: ''
  });

  const categories = ['Electronics', 'Jewelry', 'Keys', 'Clothing', 'Documents', 'Other'];

  useEffect(() => {
    fetchLostItems();
  }, []);

  const fetchLostItems = async () => {
    try {
      const { data, error } = await supabase
        .from('lost_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLostItems(data || []);
    } catch (error) {
      console.error('Error fetching lost items:', error);
      toast.error('Failed to load lost items');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitItem = async () => {
    if (!user) {
      toast.error('Please sign in to report an item');
      return;
    }

    if (!newItem.title.trim() || !newItem.description.trim() || !newItem.category || !newItem.location.trim() || !newItem.contactEmail.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('lost_items')
        .insert({
          user_id: user.id,
          type: newItem.type,
          title: newItem.title,
          description: newItem.description,
          category: newItem.category,
          location: newItem.location,
          contact_email: newItem.contactEmail,
          reward: newItem.reward ? parseFloat(newItem.reward) : null
        });

      if (error) throw error;

      toast.success(`${newItem.type === 'lost' ? 'Lost' : 'Found'} item reported successfully!`);
      setNewItem({
        type: 'lost',
        title: '',
        description: '',
        category: '',
        location: '',
        contactEmail: '',
        reward: ''
      });
      fetchLostItems();
    } catch (error) {
      console.error('Error reporting item:', error);
      toast.error('Failed to report item');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = lostItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading lost & found items...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">Lost & Found</h1>
        <p className="text-muted-foreground">Help reunite students with their belongings</p>
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse">Browse Items</TabsTrigger>
          <TabsTrigger value="report">Report Item</TabsTrigger>
        </TabsList>
        
        <TabsContent value="browse" className="space-y-6">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredItems.map((item, index) => (
              <Card key={item.id} className="hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(item.status)}
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </div>
                    <div className="flex space-x-2">
                      <Badge className={getTypeColor(item.type)}>
                        {item.type === 'lost' ? 'Lost' : 'Found'}
                      </Badge>
                      <Badge variant="outline">{item.category}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-muted-foreground">{item.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{item.location}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                    </div>

                    {item.reward && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-yellow-800">
                          Reward Offered: ${item.reward}
                        </p>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button 
                        className="flex-1"
                        disabled={item.status === 'claimed'}
                        onClick={() => window.open(`mailto:${item.contact_email}`, '_blank')}
                      >
                        {item.status === 'claimed' ? 'Claimed' : 'Contact'}
                      </Button>
                      {item.type === 'lost' && item.status === 'active' && (
                        <Button variant="outline">
                          I Found This
                        </Button>
                      )}
                    </div>
                  </div>
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

        <TabsContent value="report" className="space-y-6">
          <Tabs value={newItem.type} onValueChange={(value) => setNewItem({...newItem, type: value})} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="lost">Report Lost Item</TabsTrigger>
              <TabsTrigger value="found">Report Found Item</TabsTrigger>
            </TabsList>
            
            <TabsContent value="lost">
              <Card className="animate-scale-in">
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
                    placeholder="Contact Email" 
                    type="email" 
                    value={newItem.contactEmail}
                    onChange={(e) => setNewItem({...newItem, contactEmail: e.target.value})}
                  />
                  <Input 
                    placeholder="Reward Amount (Optional)" 
                    type="number" 
                    value={newItem.reward}
                    onChange={(e) => setNewItem({...newItem, reward: e.target.value})}
                  />
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
              <Card className="animate-scale-in">
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
                    placeholder="Contact Email" 
                    type="email" 
                    value={newItem.contactEmail}
                    onChange={(e) => setNewItem({...newItem, contactEmail: e.target.value})}
                  />
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
      </Tabs>
    </div>
  );
};

export default LostItemsTab;
