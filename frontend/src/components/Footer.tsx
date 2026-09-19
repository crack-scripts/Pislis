'use client';

import Link from 'next/link';
import { BookOpen, Facebook, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-dark-500 border-t border-primary-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-display font-bold text-white">Pislis</span>
            </Link>
            <p className="text-gray-400 text-sm">
              Master Facebook automation and grow your page organically. 
              Learn proven monetization strategies without spending on ads.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-primary-400 transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/courses/fb-automation-mastery/learn" className="text-gray-400 hover:text-primary-400 transition-colors text-sm">
                  My Course
                </Link>
              </li>
            </ul>
          </div>

          {/* Removed Popular Courses as requested */}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-900/30 mt-8 sm:mt-12 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-xs sm:text-sm text-center md:text-left">
            © 2025 Darwin Education. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center space-x-4 sm:space-x-6">
            <Link href="/privacy" className="text-gray-500 hover:text-primary-400 text-xs sm:text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-500 hover:text-primary-400 text-xs sm:text-sm transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
