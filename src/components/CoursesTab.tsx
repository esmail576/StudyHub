import React, { useState, useEffect } from 'react';
import { Search, Users, ExternalLink, Plus, ChevronDown, ChevronUp, BookOpen, GraduationCap, Trash2, BookPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';

interface Course {
  id: string;
  code: string;
  name: string;
  professor: string | null;
  semester: string | null;
  category: string | null;
}

interface CourseSection {
  id: string;
  section_number: string;
  whatsapp_link: string;
  added_by: string | null;
}

const CoursesTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [courseSections, setCourseSections] = useState<Record<string, CourseSection[]>>({});
  const [loading, setLoading] = useState(true);
  const [sectionsLoading, setSectionsLoading] = useState<Record<string, boolean>>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [sectionNumber, setSectionNumber] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [adding, setAdding] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCourse, setNewCourse] = useState({
    code: '',
    name: '',
    category: '',
    semester: ''
  });
  const [creating, setCreating] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('code');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseSections = async (courseId: string) => {
    setSectionsLoading(prev => ({ ...prev, [courseId]: true }));
    try {
      const { data, error } = await supabase
        .from('course_sections')
        .select('*')
        .eq('course_id', courseId)
        .order('section_number');

      if (error) throw error;
      setCourseSections(prev => ({ ...prev, [courseId]: data || [] }));
    } catch (error) {
      console.error('Error fetching course sections:', error);
      toast.error('Failed to load course sections');
    } finally {
      setSectionsLoading(prev => ({ ...prev, [courseId]: false }));
    }
  };

  const handleCourseClick = (course: Course) => {
    if (expandedCourse === course.id) {
      setExpandedCourse(null);
    } else {
      setExpandedCourse(course.id);
      fetchCourseSections(course.id);
    }
  };

  const handleAddSection = async () => {
    if (!selectedCourse || !user) return;
    
    if (!sectionNumber.trim() || !whatsappLink.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    // Check if section number is valid
    const sectionNum = parseInt(sectionNumber);
    if (isNaN(sectionNum)) {
      toast.error('Section number must be a valid number');
      return;
    }

    // Check for duplicate sections
    const existingSection = courseSections[selectedCourse.id]?.find(
      section => section.section_number === sectionNumber
    );
    if (existingSection) {
      toast.error('This section number already exists');
      return;
    }

    if (!whatsappLink.includes('whatsapp.com') && !whatsappLink.includes('chat.whatsapp.com')) {
      toast.error('Please enter a valid WhatsApp link');
      return;
    }

    setAdding(true);
    try {
      const { data, error } = await supabase
        .from('course_sections')
        .insert({
          course_id: selectedCourse.id,
          section_number: sectionNumber,
          whatsapp_link: whatsappLink,
          added_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      setCourseSections(prev => ({
        ...prev,
        [selectedCourse.id]: [...(prev[selectedCourse.id] || []), data]
      }));
      
      toast.success('Section added successfully!');
      setShowAddDialog(false);
      setSectionNumber('');
      setWhatsappLink('');
    } catch (error) {
      console.error('Error adding section:', error);
      toast.error('Failed to add section');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteSection = async (courseId: string, sectionId: string) => {
    if (!user) {
      toast.error('You must be logged in to delete sections');
      return;
    }

    try {
      const { error } = await supabase
        .from('course_sections')
        .delete()
        .eq('id', sectionId)
        .eq('added_by', user.id);

      if (error) {
        if (error.code === '42501') {
          toast.error('You can only delete sections you created');
        } else {
          throw error;
        }
        return;
      }

      // Update local state
      setCourseSections(prev => ({
        ...prev,
        [courseId]: prev[courseId].filter(section => section.id !== sectionId)
      }));

      toast.success('Section deleted successfully');
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error('Failed to delete section');
    }
  };

  const handleCreateCourse = async () => {
    if (!user) return;

    if (!newCourse.code.trim() || !newCourse.name.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check for duplicate course code
    const existingCourse = courses.find(
      course => course.code.toLowerCase() === newCourse.code.toLowerCase()
    );
    if (existingCourse) {
      toast.error('A course with this code already exists');
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert({
          code: newCourse.code.toUpperCase(),
          name: newCourse.name,
          category: newCourse.category || null,
          semester: newCourse.semester || null,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setCourses(prev => [...prev, data]);
      
      toast.success('Course created successfully!');
      setShowCreateDialog(false);
      setNewCourse({ code: '', name: '', category: '', semester: '' });
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Failed to create course');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!user) {
      toast.error('You must be logged in to delete courses');
      return;
    }

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      // Update local state
      setCourses(prev => prev.filter(course => course.id !== courseId));
      // Also remove from courseSections if it exists
      setCourseSections(prev => {
        const newSections = { ...prev };
        delete newSections[courseId];
        return newSections;
      });

      toast.success('Course deleted successfully');
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.professor && course.professor.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95,
      rotateX: -10
    },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      transition: {
        delay: index * 0.1,
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1]
      }
    })
  };

  const contentVariants = {
    hidden: { 
      height: 0, 
      opacity: 0,
      scale: 0.95,
      y: -10
    },
    visible: {
      height: "auto",
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    exit: {
      height: 0,
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  const sectionVariants = {
    hidden: { 
      opacity: 0, 
      x: -20,
      scale: 0.95
    },
    visible: (index: number) => ({
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        delay: index * 0.1,
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }
    }),
    exit: { 
      opacity: 0, 
      x: 20,
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
        <div className="text-muted-foreground">Loading courses...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Course Directory
        </h1>
        <p className="text-muted-foreground text-lg">Find your courses and join study groups</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between max-w-4xl mx-auto">
        <div className="relative group w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 group-hover:text-primary transition-colors" />
          <Input
            type="text"
            placeholder="Search courses or codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 transition-all duration-300 focus:scale-105 focus:ring-2 focus:ring-primary/20"
          />
        </div>
        {user && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  className="bg-primary hover:bg-primary/90 text-white font-medium px-4 py-2 rounded-md shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-2"
                >
                  <BookPlus className="h-4 w-4" />
                  Create Course
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="courseCode">Course Code *</Label>
                  <Input
                    id="courseCode"
                    value={newCourse.code}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g., CS101"
                    className="uppercase"
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter the course code (e.g., CS101, MATH201)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseName">Course Name *</Label>
                  <Input
                    id="courseName"
                    value={newCourse.name}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Introduction to Computer Science"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseCategory">Category</Label>
                  <Input
                    id="courseCategory"
                    value={newCourse.category}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g., Computer Science, Mathematics"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semester">Semester</Label>
                  <Input
                    id="semester"
                    value={newCourse.semester}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, semester: e.target.value }))}
                    placeholder="e.g., Fall 2024"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateDialog(false);
                      setNewCourse({ code: '', name: '', category: '', semester: '' });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateCourse} 
                    disabled={creating || !newCourse.code.trim() || !newCourse.name.trim()}
                  >
                    {creating ? 'Creating...' : 'Create Course'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course, index) => (
          <motion.div
            key={course.id}
            className="h-fit"
            custom={index}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
          >
            <Card 
              className="group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-background to-muted/50 border-border/50 hover:border-primary/50 overflow-hidden"
            >
              <CardHeader className="relative overflow-hidden">
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent opacity-0 group-hover:opacity-100"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex-1">
                    <motion.div 
                      className="flex items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.div 
                        className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20"
                        whileHover={{ 
                          scale: 1.1,
                          rotate: 5,
                          transition: { duration: 0.2 }
                        }}
                      >
                        <BookOpen className="h-5 w-5" />
                      </motion.div>
                      <div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {course.code}
                        </CardTitle>
                        {course.category && (
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Badge 
                              variant="secondary" 
                              className="mt-1 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            >
                              {course.category}
                            </Badge>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user && (
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
                              handleDeleteCourse(course.id);
                            }
                          }}
                          className="h-8 w-8 hover:bg-destructive/90"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    )}
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCourseClick(course);
                        }}
                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        {expandedCourse === course.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </div>
                <motion.h3 
                  className="font-semibold text-foreground mt-3 text-lg group-hover:text-primary/90 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  {course.name}
                </motion.h3>
              </CardHeader>
              <AnimatePresence>
                {expandedCourse === course.id && (
                  <motion.div
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        <motion.div 
                          className="flex justify-between items-center"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <h4 className="font-medium flex items-center gap-2 text-primary/90">
                            <motion.div 
                              className="p-1.5 rounded-lg bg-primary/10"
                              whileHover={{ 
                                scale: 1.1,
                                rotate: 5,
                                transition: { duration: 0.2 }
                              }}
                            >
                              <Users className="h-4 w-4" />
                            </motion.div>
                            Course Sections
                          </h4>
                          {user && (
                            <Dialog open={showAddDialog && selectedCourse?.id === course.id} onOpenChange={(open) => {
                              setShowAddDialog(open);
                              if (open) setSelectedCourse(course);
                              else setSelectedCourse(null);
                            }}>
                              <DialogTrigger asChild>
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="hover:bg-primary/10 hover:text-primary transition-colors"
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Section
                                  </Button>
                                </motion.div>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Add Course Section</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="section">Section Number</Label>
                                    <Input
                                      id="section"
                                      type="number"
                                      min="0"
                                      value={sectionNumber}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        // Remove leading zeros except for single zero
                                        const processedValue = value === "0" ? "0" : value.replace(/^0+/, '');
                                        setSectionNumber(processedValue);
                                      }}
                                      placeholder="Enter section number (0 for All Sections)"
                                    />
                                    <p className="text-sm text-muted-foreground mt-1">
                                      Enter 0 for All Sections, or any other number for specific sections
                                    </p>
                                  </div>
                                  <div>
                                    <Label htmlFor="whatsapp">WhatsApp Group Link</Label>
                                    <Input
                                      id="whatsapp"
                                      value={whatsappLink}
                                      onChange={(e) => setWhatsappLink(e.target.value)}
                                      placeholder="https://chat.whatsapp.com/..."
                                    />
                                  </div>
                                  <Button 
                                    onClick={handleAddSection} 
                                    className="w-full"
                                    disabled={adding}
                                  >
                                    {adding ? 'Adding...' : 'Add Section'}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </motion.div>

                        {sectionsLoading[course.id] ? (
                          <motion.div 
                            className="text-center py-4 text-muted-foreground"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            Loading sections...
                          </motion.div>
                        ) : courseSections[course.id]?.length > 0 ? (
                          <div className="space-y-2">
                            {courseSections[course.id].map((section, index) => (
                              <motion.div
                                key={section.id}
                                custom={index}
                                variants={sectionVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                whileHover={{ 
                                  scale: 1.02,
                                  x: 5,
                                  transition: { duration: 0.2 }
                                }}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all duration-300 hover:shadow-md"
                              >
                                <span className="font-medium">
                                  {section.section_number === "0" || section.section_number === "00" 
                                    ? "All Sections" 
                                    : `Section ${section.section_number}`}
                                </span>
                                <div className="flex items-center gap-2">
                                  <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => window.open(section.whatsapp_link, '_blank')}
                                      className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-md shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-2"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                      Join Group
                                    </Button>
                                  </motion.div>
                                  {user && (
                                    <motion.div
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleDeleteSection(course.id, section.id)}
                                        className="p-2"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </motion.div>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <motion.div 
                            className="text-center py-4 text-muted-foreground"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            No sections available yet.
                            {user && " Be the first to add one!"}
                          </motion.div>
                        )}
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-muted-foreground">No courses found matching your search.</p>
        </motion.div>
      )}
    </div>
  );
};

export default CoursesTab;
