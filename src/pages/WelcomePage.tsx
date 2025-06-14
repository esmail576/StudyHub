import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { ArrowRight, BookOpen, Users, GraduationCap, Sparkles, Github, Twitter, Linkedin, Mail, LogOut, Star, Rocket, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

const CountUp = ({ end, duration = 2 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let startTime: number | null = null;
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
        setCount(Math.floor(progress * end));
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [isInView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
};

const WelcomePage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [userProfile, setUserProfile] = useState<{ full_name: string } | null>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
        } else {
          setUserProfile(data);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleGetStarted = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      navigate('/');
    }, 3000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const features = [
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Study Resources",
      description: "Access comprehensive study materials and notes",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Community",
      description: "Connect with fellow students and tutors",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: <GraduationCap className="h-6 w-6" />,
      title: "Academic Support",
      description: "Get help from experienced tutors and mentors",
      color: "from-green-500 to-green-600"
    }
  ];

  const stats = [
    { number: 1000, label: "Active Students", icon: <Users className="h-6 w-6" />, color: "from-blue-500 to-blue-600" },
    { number: 500, label: "Study Resources", icon: <BookOpen className="h-6 w-6" />, color: "from-purple-500 to-purple-600" },
    { number: 200, label: "Expert Tutors", icon: <GraduationCap className="h-6 w-6" />, color: "from-green-500 to-green-600" },
    { number: 50, label: "Courses", icon: <Target className="h-6 w-6" />, color: "from-orange-500 to-orange-600" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Transition Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ 
              opacity: 0,
              scale: 0.8,
              backgroundColor: '#0ea5e9'
            }}
            animate={{ 
              opacity: 1,
              scale: 1,
              backgroundColor: '#0ea5e9'
            }}
            exit={{ 
              opacity: 0,
              scale: 1.2,
              backgroundColor: '#0ea5e9'
            }}
            transition={{ 
              duration: 2,
              ease: [0.4, 0, 0.2, 1]
            }}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
          >
            {/* Animated waves */}
            <div className="absolute inset-0">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    scale: 0,
                    opacity: 0.3,
                    x: '-50%',
                    y: '-50%'
                  }}
                  animate={{ 
                    scale: 2,
                    opacity: 0,
                    x: '-50%',
                    y: '-50%'
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.3,
                    ease: "easeOut",
                    repeat: Infinity,
                    repeatDelay: 0.5
                  }}
                  className="absolute top-1/2 left-1/2 w-[100vmax] h-[100vmax] rounded-full border-4 border-white/20"
                />
              ))}
            </div>

            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                delay: 0.5,
                duration: 1,
                ease: [0.4, 0, 0.2, 1]
              }}
              className="text-center relative z-10"
            >
              <motion.div
                initial={{ rotate: 0, scale: 0.5 }}
                animate={{ 
                  rotate: 360,
                  scale: 1,
                  transition: {
                    rotate: {
                      duration: 2,
                      ease: "linear",
                      repeat: Infinity
                    },
                    scale: {
                      duration: 1,
                      ease: [0.4, 0, 0.2, 1]
                    }
                  }
                }}
                className="mb-8"
              >
                <Sparkles className="h-24 w-24 text-white mx-auto" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="space-y-4"
              >
                <h2 className="text-6xl font-bold text-white">
                  Welcome to StudyHub!
                </h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="text-white/80 text-2xl"
                >
                  By Student for Students...
                </motion.p>
              </motion.div>

              {/* Loading dots */}
              <motion.div 
                className="flex justify-center space-x-2 mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 bg-white rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">StudyHub</span>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {userProfile?.full_name ? getInitials(userProfile.full_name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground hidden sm:inline">
                    {userProfile?.full_name || 'User'}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
                <Button onClick={handleGetStarted}>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary/20 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: Math.random() * 2 + 1
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      <motion.div
        className="container mx-auto px-4 py-16 relative z-10 mt-16"
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
      >
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-16"
          variants={itemVariants}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-4"
          >
            <Sparkles className="h-12 w-12 text-primary animate-pulse" />
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 mb-4">
            {user ? `Welcome ${userProfile?.full_name || 'User'}` : 'Welcome Student'}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your all-in-one platform for academic success. Connect, learn, and grow with fellow students.
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              size="lg" 
              className="group"
              onClick={handleGetStarted}
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Features Section */}
        <motion.div 
          className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          variants={itemVariants}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all duration-300"
              whileHover={{ 
                y: -5,
                scale: 1.02,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
              }}
              variants={itemVariants}
            >
              <div className={`p-3 rounded-lg bg-gradient-to-r ${feature.color} text-white mb-4 inline-block`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Animated Stats */}
        <motion.div 
          className="mt-16"
          variants={itemVariants}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all duration-300"
                whileHover={{ 
                  y: -5,
                  scale: 1.02,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                }}
              >
                <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color} text-white mb-4 inline-block`}>
                  {stat.icon}
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-3xl font-bold mb-2"
                >
                  <CountUp end={stat.number} />
                  <span className="text-primary">+</span>
                </motion.div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Additional Features Section */}
        <motion.div 
          className="mt-16 text-center"
          variants={itemVariants}
        >
          <h2 className="text-3xl font-bold mb-8">Why Choose StudyHub?</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: <Star className="h-6 w-6" />,
                title: "Quality Content",
                description: "Curated study materials and resources by top students",
                color: "from-yellow-500 to-yellow-600"
              },
              {
                icon: <Rocket className="h-6 w-6" />,
                title: "Fast Learning",
                description: "Accelerate your learning with our efficient tools",
                color: "from-red-500 to-red-600"
              },
              {
                icon: <Target className="h-6 w-6" />,
                title: "Goal Oriented",
                description: "Track your progress and achieve your academic goals",
                color: "from-indigo-500 to-indigo-600"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all duration-300"
                whileHover={{ 
                  y: -5,
                  scale: 1.02,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                }}
              >
                <div className={`p-3 rounded-lg bg-gradient-to-r ${feature.color} text-white mb-4 inline-block`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div 
          className="mt-16 text-center"
          variants={itemVariants}
        >
          <div className="p-8 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of students who are already using StudyHub to achieve their academic goals.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg" 
                className="group"
                onClick={handleGetStarted}
              >
                Get Started Now
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <footer className="relative z-10 bg-card/50 backdrop-blur-sm border-t border-border/50 mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold text-foreground">StudyHub</span>
              </div>
              <p className="text-muted-foreground">
                Your all-in-one platform for academic success. Connect, learn, and grow with fellow students.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Button variant="link" className="p-0 h-auto" onClick={() => navigate('/')}>Home</Button></li>
                <li><Button variant="link" className="p-0 h-auto" onClick={() => navigate('/courses')}>Courses</Button></li>
                <li><Button variant="link" className="p-0 h-auto" onClick={() => navigate('/tutors')}>Tutors</Button></li>
                <li><Button variant="link" className="p-0 h-auto" onClick={() => navigate('/marketplace')}>Marketplace</Button></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><Button variant="link" className="p-0 h-auto" onClick={() => navigate('/notes')}>Study Notes</Button></li>
                <li><Button variant="link" className="p-0 h-auto" onClick={() => navigate('/reviews')}>Reviews</Button></li>
                <li><Button variant="link" className="p-0 h-auto" onClick={() => navigate('/lost-items')}>Lost Items</Button></li>
                <li><Button variant="link" className="p-0 h-auto" onClick={() => navigate('/help')}>Help Center</Button></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Connect With Us</h3>
              <div className="flex space-x-4">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Github className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Twitter className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Linkedin className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Mail className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border/50 text-center text-muted-foreground">
            <p>© 2024 StudyHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage; 