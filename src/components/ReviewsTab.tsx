import React, { useState, useEffect } from 'react';
import { Star, Heart, Plus, Search, Filter, MessageCircle, ThumbsUp, Award, User, Sparkles, BookOpen } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
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

  useEffect(() => {
    initializeData();
  }, [user]);

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

        // Transform reviews with hearted state
        const transformedData = reviewsData.map(review => ({
          ...review,
          is_hearted: heartedReviews.has(review.id)
        }));

        setReviews(transformedData);
      } else {
        // If not logged in, just fetch reviews without hearted state
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('*')
          .order('hearts_count', { ascending: false })
          .order('created_at', { ascending: false });

        if (reviewsError) throw reviewsError;

        const transformedData = reviewsData.map(review => ({
          ...review,
          is_hearted: false
        }));

        setReviews(transformedData);
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
      }, 1000);
    } catch (error) {
      console.error('Error toggling heart:', error);
      toast.error('Failed to update heart status');
    }
  };

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

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || review.type === selectedType;
    const matchesRating = selectedRating === 'all' || review.rating === parseInt(selectedRating);
    return matchesSearch && matchesType && matchesRating;
  });

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
        delay: index * 0.1,
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1]
      }
    }),
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    heart: {
      scale: [1, 1.02, 1],
      transition: {
        duration: 0.5,
        ease: "easeInOut"
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

  const rippleVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: 2,
      opacity: [0.5, 0],
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

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

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between max-w-4xl mx-auto">
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
              className="bg-primary hover:bg-primary/90 text-white font-medium px-4 py-2 rounded-md shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Write Review
            </Button>
          </motion.div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 justify-center">
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Review Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reviews</SelectItem>
            <SelectItem value="course">Course Reviews</SelectItem>
            <SelectItem value="professor">Professor Reviews</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedRating} onValueChange={setSelectedRating}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4+ Stars</SelectItem>
            <SelectItem value="3">3+ Stars</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loading />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredReviews.map((review, index) => (
              <motion.div
                key={review.id}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                animate={animatingCards.has(review.id) ? "heart" : "visible"}
                exit="exit"
                whileHover={{ 
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
              >
                <Card className="group hover:shadow-xl transition-all duration-300 bg-card border-border/50 hover:border-primary/50 overflow-hidden relative">
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
                            {review.type === 'course' ? <BookOpen className="h-5 w-5" /> : <User className="h-5 w-5" />}
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
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => handleHeart(review.id, e)}
                        className="cursor-pointer relative"
                      >
                        {animatingHearts.has(review.id) && (
                          <motion.div
                            className="absolute inset-0 bg-red-500/20 rounded-full"
                            variants={rippleVariants}
                            initial="initial"
                            animate="animate"
                          />
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
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground/90">{review.content}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Badge variant="outline" className="bg-primary/5">
                            <Heart className="h-3 w-3 mr-1" />
                            {review.hearts_count}
                          </Badge>
                        </motion.div>
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
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {filteredReviews.length === 0 && (
        <motion.div 
          className="text-center py-12 bg-muted/50 rounded-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No reviews found matching your criteria.</p>
        </motion.div>
      )}

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
