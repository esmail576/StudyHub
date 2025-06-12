
import React, { useState } from 'react';
import { Star, MapPin, Clock, DollarSign, MessageCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TutorsTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');

  const tutors = [
    {
      id: 1,
      name: 'Alex Johnson',
      subjects: ['Mathematics', 'Physics'],
      rating: 4.8,
      reviewCount: 24,
      hourlyRate: 25,
      location: 'On Campus',
      availability: 'Weekdays 2-6 PM',
      experience: '3 years',
      description: 'Mathematics major with experience in calculus and algebra. Patient and encouraging teaching style.'
    },
    {
      id: 2,
      name: 'Sarah Chen',
      subjects: ['Computer Science', 'Programming'],
      rating: 4.9,
      reviewCount: 18,
      hourlyRate: 30,
      location: 'Online/Campus',
      availability: 'Flexible',
      experience: '2 years',
      description: 'CS senior specializing in Python, Java, and data structures. Helped 50+ students improve their coding skills.'
    },
    {
      id: 3,
      name: 'Mike Rodriguez',
      subjects: ['Chemistry', 'Biology'],
      rating: 4.7,
      reviewCount: 31,
      hourlyRate: 22,
      location: 'Science Building',
      availability: 'Mon-Wed 3-7 PM',
      experience: '4 years',
      description: 'Pre-med student with strong background in organic chemistry and molecular biology.'
    }
  ];

  const subjects = ['Mathematics', 'Physics', 'Computer Science', 'Chemistry', 'Biology', 'English'];

  const filteredTutors = tutors.filter(tutor => {
    const matchesSearch = tutor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutor.subjects.some(subject => subject.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSubject = selectedSubject === 'all' || tutor.subjects.includes(selectedSubject);
    return matchesSearch && matchesSubject;
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">Tutoring Hub</h1>
        <p className="text-muted-foreground">Find a tutor or offer your expertise</p>
      </div>

      <Tabs defaultValue="find" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="find">Find a Tutor</TabsTrigger>
          <TabsTrigger value="teach">Become a Tutor</TabsTrigger>
        </TabsList>
        
        <TabsContent value="find" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              type="text"
              placeholder="Search tutors or subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(subject => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutors.map((tutor, index) => (
              <Card key={tutor.id} className="hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{tutor.name}</CardTitle>
                      <div className="flex items-center space-x-1 mt-1">
                        <div className="flex">{renderStars(tutor.rating)}</div>
                        <span className="text-sm text-muted-foreground">
                          {tutor.rating} ({tutor.reviewCount} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tutor.subjects.map(subject => (
                      <Badge key={subject} variant="secondary" className="text-xs">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">{tutor.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>${tutor.hourlyRate}/hour</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{tutor.location}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{tutor.availability}</span>
                      </div>
                    </div>

                    <Button className="w-full">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact Tutor
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="teach" className="space-y-6">
          <Card className="animate-scale-in">
            <CardHeader>
              <CardTitle>Become a Tutor</CardTitle>
              <p className="text-muted-foreground">Share your knowledge and earn money helping fellow students</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="Your Name" />
                <Input placeholder="Email Address" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Primary Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Hourly Rate ($)" type="number" />
              </div>
              <Input placeholder="Years of Experience" />
              <Input placeholder="Availability (e.g., Weekdays 2-6 PM)" />
              <textarea 
                className="w-full p-3 border border-border rounded-lg resize-none"
                placeholder="Tell us about your teaching experience and approach..."
                rows={4}
              />
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Submit Application
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TutorsTab;
