import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import CoursesTab from '../components/CoursesTab';
import ReviewsTab from '../components/ReviewsTab';
import NotesTab from '../components/NotesTab';
import MarketplaceTab from '../components/MarketplaceTab';
import LostItemsTab from '../components/LostItemsTab';
import ProtectedRoute from '../components/ProtectedRoute';
import Footer from '../components/Footer';

const Index = () => {
  const [activeTab, setActiveTab] = useState(() => {
    // Get the initial tab from URL hash or default to 'courses'
    const hash = window.location.hash.slice(1); // Remove the # symbol
    return hash || 'courses';
  });

  // Update URL hash when activeTab changes
  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        setActiveTab(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'courses':
        return (
          <ProtectedRoute>
            <CoursesTab />
          </ProtectedRoute>
        );
      case 'reviews':
        return (
          <ProtectedRoute>
            <ReviewsTab />
          </ProtectedRoute>
        );
      case 'notes':
        return (
          <ProtectedRoute>
            <NotesTab />
          </ProtectedRoute>
        );
      case 'marketplace':
        return (
          <ProtectedRoute>
            <MarketplaceTab />
          </ProtectedRoute>
        );
      case 'lost-items':
        return (
          <ProtectedRoute>
            <LostItemsTab />
          </ProtectedRoute>
        );
      default:
        return (
          <ProtectedRoute>
            <CoursesTab />
          </ProtectedRoute>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderActiveTab()}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
