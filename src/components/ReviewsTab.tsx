import React, { useState, useEffect } from 'react';
import { Star, Heart, Plus, Search, Filter, MessageCircle, ThumbsUp, Award, User, Sparkles, BookOpen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Loading from '@/components/ui/loading';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface Review {
  id: string;
  type: string;
  subject: string;
  course?: string;
  professor?: string;
  rating: number;
  content: string;
  hearts_count: number;
  created_at: string;
  user_id: string;
  reviewer_name?: string;
  is_anonymous?: boolean;
  is_hearted: boolean;
}

const ReviewsTab = () => {
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const { user } = useAuth();
  const [newReview, setNewReview] = useState({
    course: '',
    professor: '',
    rating: 5,
    content: '',
    type: 'course',
    is_anonymous: false
  });
  const [hearts, setHearts] = useState<Set<string>>(new Set());
  const [animatingHearts, setAnimatingHearts] = useState<Set<string>>(new Set());
  const [animatingCards, setAnimatingCards] = useState<Set<string>>(new Set());
  const [showHeartBurst, setShowHeartBurst] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'course' | 'professor' | 'my-reviews'>('course');

  useEffect(() => {
    initializeData();
  }, [user]);

  useEffect(() => {
    let filtered = reviews;

    // Apply search filter
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase().replace(/\s+/g, '');
      filtered = filtered.filter(review => {
        const courseName = review.course?.toLowerCase().replace(/\s+/g, '') ?? '';
        const professorName = review.professor?.toLowerCase().replace(/\s+/g, '') ?? '';
        const reviewText = review.content.toLowerCase().replace(/\s+/g, '');
        const uploaderName = review.reviewer_name?.toLowerCase().replace(/\s+/g, '') ?? '';

        return courseName.includes(searchLower) ||
               professorName.includes(searchLower) ||
               reviewText.includes(searchLower) ||
               uploaderName.includes(searchLower);
      });
    }

    // Apply type filter
    if (activeTab !== 'my-reviews') {
      filtered = filtered.filter(review => review.type === activeTab);
    }

    setFilteredReviews(filtered);
  }, [searchTerm, reviews, activeTab]);

  const initializeData = async () => {
    setLoading(true);
    try {
      // First fetch user hearts if logged in
      if (user) {
        const { data: heartsData, error: heartsError } = await supabase
          .from('review_hearts')
          .select('review_id')
          .eq('user_id', user.id);

        if (heartsError) throw heartsError;
        
        const heartedReviews = new Set(heartsData.map(h => h.review_id));
        setHearts(heartedReviews);

        // Then fetch reviews
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('*')
          .order('hearts_count', { ascending: false })
          .order('created_at', { ascending: false });

        if (reviewsError) throw reviewsError;

        setReviews(reviewsData);
        setFilteredReviews(reviewsData);
      } else {
        // If not logged in, just fetch reviews without hearted state
        const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
          .order('hearts_count', { ascending: false })
        .order('created_at', { ascending: false });

        if (reviewsError) throw reviewsError;

        setReviews(reviewsData);
        setFilteredReviews(reviewsData);
      }
    } catch (error) {
      console.error('Error initializing data:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error('Please sign in to write a review');
      return;
    }

    // Validate required fields
    if (!newReview.content.trim()) {
      toast.error('Please write your review');
      return;
    }

    if (newReview.type === 'course' && !newReview.course.trim()) {
      toast.error('Please enter the course name');
      return;
    }

    if (newReview.type === 'professor' && !newReview.professor.trim()) {
      toast.error('Please enter the professor name');
      return;
    }

    setSubmitting(true);
    try {
      // Fetch user's profile to get their full name
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw new Error('Failed to fetch user profile');
      }

      const subject = newReview.type === 'course' ? newReview.course : newReview.professor;

      const reviewData = {
        user_id: user.id,
        type: newReview.type,
        subject: subject.trim(),
        course: newReview.course.trim() || null,
        professor: newReview.professor.trim() || null,
        rating: newReview.rating,
        content: newReview.content.trim(),
        reviewer_name: newReview.is_anonymous ? 'Anonymous Student' : (profile?.full_name || 'Anonymous Student'),
        hearts_count: 0,
        is_hearted: false
      };

      console.log('Submitting review:', reviewData);

      const { error: insertError } = await supabase
        .from('reviews')
        .insert(reviewData);

      if (insertError) {
        console.error('Error inserting review:', insertError);
        throw new Error(insertError.message);
      }

      toast.success('Review submitted successfully!');
      setShowWriteReview(false);
      setNewReview({
        course: '',
        professor: '',
        rating: 5,
        content: '',
        type: 'course',
        is_anonymous: false
      });
      initializeData();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (reviewId: string) => {
    if (!user) {
      toast.error('Please sign in to like reviews');
      return;
    }

    if (likedReviews.has(reviewId)) {
      toast.info('You already liked this review');
      return;
    }

    try {
      const review = reviews.find(r => r.id === reviewId);
      if (!review) return;

      const { error } = await supabase
        .from('reviews')
        .update({ hearts_count: review.hearts_count + 1 })
        .eq('id', reviewId);

      if (error) throw error;

      setLikedReviews(prev => new Set([...prev, reviewId]));
      setReviews(prev => prev.map(r => 
        r.id === reviewId ? { ...r, hearts_count: r.hearts_count + 1 } : r
      ).sort((a, b) => b.hearts_count - a.hearts_count || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      
      toast.success('Review liked!');
    } catch (error) {
      console.error('Error liking review:', error);
      toast.error('Failed to like review');
    }
  };

  const handleHeart = async (reviewId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please sign in to heart reviews');
      return;
    }

    try {
      const isHearted = hearts.has(reviewId);
      
      // Add animation state
      setAnimatingCards(prev => new Set([...prev, reviewId]));
      setShowHeartBurst(prev => new Set([...prev, reviewId]));
      
      if (isHearted) {
        // Unheart
        const { error } = await supabase
          .from('review_hearts')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', user.id);

        if (error) throw error;
        
        hearts.delete(reviewId);
        setReviews(prev => prev.map(review => 
          review.id === reviewId 
            ? { ...review, hearts_count: review.hearts_count - 1, is_hearted: false }
            : review
        ));
      } else {
        // Heart
        const { error } = await supabase
          .from('review_hearts')
          .insert({ review_id: reviewId, user_id: user.id });

        if (error) throw error;
        
        hearts.add(reviewId);
        setAnimatingHearts(prev => new Set([...prev, reviewId]));
        setReviews(prev => prev.map(review => 
          review.id === reviewId 
            ? { ...review, hearts_count: review.hearts_count + 1, is_hearted: true }
            : review
        ));
      }

      // Remove animation states after animation completes
      setTimeout(() => {
        setAnimatingCards(prev => {
          const newSet = new Set(prev);
          newSet.delete(reviewId);
          return newSet;
        });
        setAnimatingHearts(prev => {
          const newSet = new Set(prev);
          newSet.delete(reviewId);
          return newSet;
        });
        setShowHeartBurst(prev => {
          const newSet = new Set(prev);
          newSet.delete(reviewId);
          return newSet;
        });
      }, 1000);
    } catch (error) {
      console.error('Error toggling heart:', error);
      toast.error('Failed to update heart status');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!user) {
      toast.error('Please sign in to delete reviews');
      return;
    }

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user.id);

      if (error) throw error;

      setReviews(prev => prev.filter(review => review.id !== reviewId));
      setFilteredReviews(prev => prev.filter(review => review.id !== reviewId));
      toast.success('Review deleted successfully');
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  const myReviews = user ? reviews.filter(review => review.user_id === user.id) : [];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-6 w-6 transition-all duration-300 ${
          i < rating 
            ? 'text-amber-400 fill-current transform hover:scale-125 hover:rotate-12 hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' 
            : 'text-slate-200'
        }`}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-emerald-500';
    if (rating >= 3) return 'text-amber-500';
    return 'text-red-500';
  };

  const getRecommendationLevel = (hearts_count: number) => {
    if (hearts_count >= 10) return 'Highly Recommended';
    if (hearts_count >= 5) return 'Recommended';
    if (hearts_count >= 2) return 'Good';
    return null;
  };

  const getApprovalTag = (hearts_count: number) => {
    if (hearts_count >= 20) return 'Highly Approved by Students';
    if (hearts_count >= 10) return 'Approved by Students';
    if (hearts_count >= 5) return 'Liked by Students';
    return null;
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

  const heartVariants = {
    initial: { scale: 1 },
    animate: { 
      scale: [1, 1.4, 1],
      transition: {
        duration: 0.5,
        ease: "easeInOut"
      }
    }
  };

  const heartBurstVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: [0, 1.2, 1],
      opacity: [0, 1, 0],
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const particleVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: (i: number) => ({
      scale: [0, 1, 0],
      opacity: [0, 1, 0],
      x: [0, Math.cos(i * 45) * 50],
      y: [0, Math.sin(i * 45) * 50],
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    })
  };

  // Remove the duplicate filteredReviews declaration and use the state variable
  const displayedReviews = activeTab === 'my-reviews' ? myReviews : filteredReviews;

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Reviews</h1>
          <p className="text-muted-foreground">Share your experience with courses and professors</p>
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
    <div className="min-h-screen bg-background space-y-6 animate-fade-in p-6">
      <div className="text-center">
        <motion.h1 
          className="text-4xl font-bold text-foreground mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Reviews & Ratings
        </motion.h1>
        <motion.p 
          className="text-muted-foreground text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Share your experiences and help others make informed decisions
        </motion.p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center justify-between max-w-7xl mx-auto">
        <div className="relative group w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 group-hover:text-primary transition-colors" />
          <Input
            type="text"
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 transition-all duration-300 focus:scale-105 focus:ring-2 focus:ring-primary/20"
          />
        </div>
        {user && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
        <Button 
              onClick={() => setShowWriteReview(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 py-2 rounded-md shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-2"
        >
              <Plus className="h-4 w-4" />
          Write Review
        </Button>
          </motion.div>
        )}
      </div>

      <div className="flex flex-col items-center gap-6">
        <Tabs defaultValue="course" className="w-full max-w-4xl" onValueChange={(value) => setActiveTab(value as 'course' | 'professor' | 'my-reviews')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="course" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Course Reviews
            </TabsTrigger>
            <TabsTrigger value="professor" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Professor Reviews
            </TabsTrigger>
            <TabsTrigger value="my-reviews" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              My Reviews
            </TabsTrigger>
          </TabsList>
          <TabsContent value="course" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              <AnimatePresence mode="popLayout">
                {displayedReviews.map((review, index) => (
                  <motion.div
                    key={review.id}
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
                      <Card className="group hover:shadow-xl transition-all duration-300 bg-card border-border/50 hover:border-primary/50 overflow-hidden relative p-6 w-full">
                        <CardHeader className="relative overflow-hidden pb-4">
                          <motion.div 
                            className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent opacity-0 group-hover:opacity-100"
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                          <div className="flex justify-between items-start relative z-10 mb-4">
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
                                    {review.subject}
                                  </CardTitle>
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <Badge 
                                      variant="secondary" 
                                      className="mt-1 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                    >
                                      Course Review
                                    </Badge>
                                  </motion.div>
                                </div>
                              </motion.div>
                            </div>
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => handleHeart(review.id, e)}
                              className="cursor-pointer relative flex items-center space-x-1"
                            >
                              {showHeartBurst.has(review.id) && (
                                <>
                                  <motion.div
                                    className="absolute inset-0 flex items-center justify-center"
                                    variants={heartBurstVariants}
                                    initial="initial"
                                    animate="animate"
                                  >
                                    <Heart className="h-12 w-12 fill-red-500 text-red-500" />
                                  </motion.div>
                                  {[...Array(8)].map((_, i) => (
                                    <motion.div
                                      key={i}
                                      className="absolute inset-0 flex items-center justify-center"
                                      custom={i}
                                      variants={particleVariants}
                                      initial="initial"
                                      animate="animate"
                                    >
                                      <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                                    </motion.div>
                                  ))}
                                </>
                              )}
                              <motion.div
                                variants={heartVariants}
                                initial="initial"
                                animate={hearts.has(review.id) ? "animate" : "initial"}
                              >
                                <Heart 
                                  className={`h-5 w-5 ${
                                    hearts.has(review.id) 
                                      ? 'fill-red-500 text-red-500' 
                                      : 'text-muted-foreground'
                                  } hover:text-red-500 transition-colors`}
                                />
                              </motion.div>
                              <span className="text-sm text-muted-foreground font-medium">
                                {review.hearts_count}
                              </span>
                            </motion.div>
                          </div>
                          <div className="mt-4">
                            <div className="flex items-center gap-2">
                              {renderStars(review.rating)}
                              <span className="text-sm text-muted-foreground">
                                {formatDate(review.created_at)}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                              By {review.reviewer_name}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {getApprovalTag(review.hearts_count) && (
                                <Badge variant="outline" className="bg-green-500/10 text-green-500">
                                  {getApprovalTag(review.hearts_count)}
                                </Badge>
                              )}
                              {getRecommendationLevel(review.hearts_count) && (
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Badge variant="outline" className="bg-green-500/10 text-green-500">
                                    <Award className="h-3 w-3 mr-1" />
                                    {getRecommendationLevel(review.hearts_count)}
                                  </Badge>
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <p className="text-foreground/90">{review.content}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </TabsContent>
          <TabsContent value="professor" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              <AnimatePresence mode="popLayout">
                {displayedReviews.map((review, index) => (
                  <motion.div
                    key={review.id}
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
                      <Card className="group hover:shadow-xl transition-all duration-300 bg-card border-border/50 hover:border-primary/50 overflow-hidden relative p-6 w-full">
                        <CardHeader className="relative overflow-hidden pb-4">
                          <motion.div 
                            className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent opacity-0 group-hover:opacity-100"
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                          <div className="flex justify-between items-start relative z-10 mb-4">
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
                                  <User className="h-5 w-5" />
                                </motion.div>
                                <div>
                                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                                    {review.subject}
                                  </CardTitle>
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <Badge 
                                      variant="secondary" 
                                      className="mt-1 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                    >
                                      Professor Review
                                    </Badge>
                                  </motion.div>
                                </div>
                              </motion.div>
                            </div>
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => handleHeart(review.id, e)}
                              className="cursor-pointer relative flex items-center space-x-1"
                            >
                              {showHeartBurst.has(review.id) && (
                                <>
                                  <motion.div
                                    className="absolute inset-0 flex items-center justify-center"
                                    variants={heartBurstVariants}
                                    initial="initial"
                                    animate="animate"
                                  >
                                    <Heart className="h-12 w-12 fill-red-500 text-red-500" />
                                  </motion.div>
                                  {[...Array(8)].map((_, i) => (
                                    <motion.div
                                      key={i}
                                      className="absolute inset-0 flex items-center justify-center"
                                      custom={i}
                                      variants={particleVariants}
                                      initial="initial"
                                      animate="animate"
                                    >
                                      <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                                    </motion.div>
                                  ))}
                                </>
                              )}
                              <motion.div
                                variants={heartVariants}
                                initial="initial"
                                animate={hearts.has(review.id) ? "animate" : "initial"}
                              >
                                <Heart 
                                  className={`h-5 w-5 ${
                                    hearts.has(review.id) 
                                      ? 'fill-red-500 text-red-500' 
                                      : 'text-muted-foreground'
                                  } hover:text-red-500 transition-colors`}
                                />
                              </motion.div>
                              <span className="text-sm text-muted-foreground font-medium">
                                {review.hearts_count}
                              </span>
                            </motion.div>
                          </div>
                          <div className="mt-4">
                            <div className="flex items-center gap-2">
                              {renderStars(review.rating)}
                              <span className="text-sm text-muted-foreground">
                                {formatDate(review.created_at)}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                              By {review.reviewer_name}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {getApprovalTag(review.hearts_count) && (
                                <Badge variant="outline" className="bg-green-500/10 text-green-500">
                                  {getApprovalTag(review.hearts_count)}
                                </Badge>
                              )}
                              {getRecommendationLevel(review.hearts_count) && (
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Badge variant="outline" className="bg-green-500/10 text-green-500">
                                    <Award className="h-3 w-3 mr-1" />
                                    {getRecommendationLevel(review.hearts_count)}
                                  </Badge>
                                </motion.div>
                              )}
                            </div>
                          </div>
          </CardHeader>
                        <CardContent className="pt-4">
                          <p className="text-foreground/90">{review.content}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </TabsContent>
          <TabsContent value="my-reviews" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              <AnimatePresence mode="popLayout">
                {myReviews.map((review, index) => (
                  <motion.div
                    key={review.id}
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
                      <Card className="group hover:shadow-xl transition-all duration-300 bg-card border-border/50 hover:border-primary/50 overflow-hidden relative p-6 w-full">
                        <CardHeader className="relative overflow-hidden pb-4">
                          <motion.div 
                            className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent opacity-0 group-hover:opacity-100"
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                          <div className="flex justify-between items-start relative z-10 mb-4">
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
                                  {review.type === 'course' ? (
                                    <BookOpen className="h-5 w-5" />
                                  ) : (
                                    <User className="h-5 w-5" />
                                  )}
                                </motion.div>
              <div>
                                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                                    {review.subject}
                                  </CardTitle>
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <Badge 
                                      variant="secondary" 
                                      className="mt-1 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                    >
                                      {review.type === 'course' ? 'Course Review' : 'Professor Review'}
                                    </Badge>
                                  </motion.div>
                                </div>
                              </motion.div>
                            </div>
                            <div className="flex items-center gap-2">
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => handleHeart(review.id, e)}
                                className="cursor-pointer"
                              >
                                {showHeartBurst.has(review.id) && (
                                  <>
                                    <motion.div
                                      className="absolute inset-0 flex items-center justify-center"
                                      variants={heartBurstVariants}
                                      initial="initial"
                                      animate="animate"
                                    >
                                      <Heart className="h-12 w-12 fill-red-500 text-red-500" />
                                    </motion.div>
                                    {[...Array(8)].map((_, i) => (
                                      <motion.div
                                        key={i}
                                        className="absolute inset-0 flex items-center justify-center"
                                        custom={i}
                                        variants={particleVariants}
                                        initial="initial"
                                        animate="animate"
                                      >
                                        <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                                      </motion.div>
                                    ))}
                                  </>
                                )}
                                <motion.div
                                  variants={heartVariants}
                                  initial="initial"
                                  animate={hearts.has(review.id) ? "animate" : "initial"}
                                >
                                  <Heart 
                                    className={`h-5 w-5 ${
                                      hearts.has(review.id) 
                                        ? 'fill-red-500 text-red-500' 
                                        : 'text-muted-foreground'
                                    } hover:text-red-500 transition-colors`}
                                  />
                                </motion.div>
                                <span className="text-sm text-muted-foreground font-medium">
                                  {review.hearts_count}
                                </span>
                              </motion.div>
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDeleteReview(review.id)}
                                className="cursor-pointer"
                              >
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </motion.div>
                            </div>
                          </div>
                          <div className="mt-4">
                            <div className="flex items-center gap-2">
                              {renderStars(review.rating)}
                              <span className="text-sm text-muted-foreground">
                                {formatDate(review.created_at)}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {review.is_anonymous ? 'Posted anonymously' : `By ${review.reviewer_name}`}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {getApprovalTag(review.hearts_count) && (
                                <Badge variant="outline" className="bg-green-500/10 text-green-500">
                                  {getApprovalTag(review.hearts_count)}
                                </Badge>
                              )}
                              {getRecommendationLevel(review.hearts_count) && (
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Badge variant="outline" className="bg-green-500/10 text-green-500">
                                    <Award className="h-3 w-3 mr-1" />
                                    {getRecommendationLevel(review.hearts_count)}
                                  </Badge>
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <p className="text-foreground/90">{review.content}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {myReviews.length === 0 && (
              <motion.div 
                className="text-center py-16 bg-muted/30 rounded-xl border border-border/50 w-full max-w-4xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <MessageCircle className="h-16 w-16 text-primary/60 mx-auto mb-6" />
                </motion.div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No Reviews Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Share your experiences with courses and professors to help other students make informed decisions.
                </p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => setShowWriteReview(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-2 rounded-md shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-2 mx-auto"
                  >
                    <Plus className="h-4 w-4" />
                    Write Your First Review
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>

        {displayedReviews.length === 0 && (
          <motion.div 
            className="text-center py-12 bg-muted/50 rounded-lg w-full max-w-4xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No {activeTab} reviews found matching your criteria.</p>
          </motion.div>
        )}
      </div>

      {/* Write Review Dialog */}
      <Dialog open={showWriteReview} onOpenChange={setShowWriteReview}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Review Type</Label>
              <Select
                value={newReview.type}
                onValueChange={(value) => setNewReview(prev => ({ ...prev, type: value }))}
              >
                  <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="course">Course Review</SelectItem>
                    <SelectItem value="professor">Professor Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            {newReview.type === 'course' ? (
              <div className="space-y-2">
                <Label>Course Name</Label>
                <Input
                  value={newReview.course}
                  onChange={(e) => setNewReview(prev => ({ ...prev, course: e.target.value }))}
                  placeholder="Enter course name"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Professor Name</Label>
                <Input
                  value={newReview.professor}
                  onChange={(e) => setNewReview(prev => ({ ...prev, professor: e.target.value }))}
                  placeholder="Enter professor name"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.button
                    key={star}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= newReview.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Your Review</Label>
              <Textarea
                value={newReview.content}
                onChange={(e) => setNewReview(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Share your experience..."
                className="min-h-[100px]"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="anonymous"
                checked={newReview.is_anonymous}
                onCheckedChange={(checked) => 
                  setNewReview(prev => ({ ...prev, is_anonymous: checked as boolean }))
                }
              />
              <Label htmlFor="anonymous">Post anonymously</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowWriteReview(false);
                  setNewReview({
                    course: '',
                    professor: '',
                    rating: 5,
                    content: '',
                    type: 'course',
                    is_anonymous: false
                  });
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitReview} 
                disabled={submitting}
                className="bg-primary hover:bg-primary/90"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
                      </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

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

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default ReviewsTab;
