import React from 'react';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">StudyHub</h3>
            <p className="text-sm">
              Your all-in-one platform for academic resources, course reviews, and student collaboration.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <Github className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <Linkedin className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="/courses" className="text-sm hover:text-white transition-colors">
                  Courses
                </a>
              </li>
              <li>
                <a href="/reviews" className="text-sm hover:text-white transition-colors">
                  Reviews
                </a>
              </li>
              <li>
                <a href="/notes" className="text-sm hover:text-white transition-colors">
                  Study Materials
                </a>
              </li>
              <li>
                <a href="/marketplace" className="text-sm hover:text-white transition-colors">
                  Marketplace
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a href="/help" className="text-sm hover:text-white transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="/guidelines" className="text-sm hover:text-white transition-colors">
                  Community Guidelines
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-sm hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-sm hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Contact Us</h4>
            <div className="space-y-2">
              <p className="text-sm flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>support@studyhub.com</span>
              </p>
              <p className="text-sm">
                Have questions? We're here to help!
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm">
              © {new Date().getFullYear()} StudyHub. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="/privacy" className="text-sm hover:text-white transition-colors">
                Privacy
              </a>
              <a href="/terms" className="text-sm hover:text-white transition-colors">
                Terms
              </a>
              <a href="/cookies" className="text-sm hover:text-white transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 