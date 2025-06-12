import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import CoursesTab from '../components/CoursesTab';
import ReviewsTab from '../components/ReviewsTab';
import NotesTab from '../components/NotesTab';
import TutorsTab from '../components/TutorsTab';
import MarketplaceTab from '../components/MarketplaceTab';
import LostItemsTab from '../components/LostItemsTab';
import ProtectedRoute from '../components/ProtectedRoute';
import Footer from '../components/Footer';

const Index = () => {
  const [activeTab, setActiveTab] = useState('courses');

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
      case 'tutors':
        return (
          <ProtectedRoute>
            <TutorsTab />
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
