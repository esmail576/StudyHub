import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, BookOpen, Users, GraduationCap, Sparkles, Github, Twitter, Linkedin, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const WelcomePage = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleGetStarted = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      navigate('/');
    }, 3000);
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
      description: "Access comprehensive study materials and notes"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Community",
      description: "Connect with fellow students and tutors"
    },
    {
      icon: <GraduationCap className="h-6 w-6" />,
      title: "Academic Support",
      description: "Get help from experienced tutors and mentors"
    }
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
              backgroundColor: 'hsl(var(--primary))'
            }}
            animate={{ 
              opacity: 1,
              scale: 1,
              backgroundColor: 'hsl(var(--primary))'
            }}
            exit={{ 
              opacity: 0,
              scale: 1.2,
              backgroundColor: 'hsl(var(--primary))'
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
            <Button variant="ghost" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
            <Button onClick={handleGetStarted}>
              Get Started
            </Button>
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
            Welcome to StudyHub
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
              className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-colors"
              whileHover={{ y: -5 }}
              variants={itemVariants}
            >
              <div className="text-primary mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Animated Stats */}
        <motion.div 
          className="mt-16 text-center"
          variants={itemVariants}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { number: "1000+", label: "Active Students" },
              { number: "500+", label: "Study Resources" },
              { number: "200+", label: "Expert Tutors" },
              { number: "50+", label: "Courses" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="p-4"
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-3xl font-bold text-primary mb-2"
                >
                  {stat.number}
                </motion.div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
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