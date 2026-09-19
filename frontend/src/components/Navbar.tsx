'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, BookOpen, Home, Search } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-500/80 backdrop-blur-md border-b border-primary-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-white">Pislis</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8" />

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="p-2 text-gray-300 hover:text-primary-400 transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <Link
              href="/"
              title="Home"
              className="p-2 text-gray-300 hover:text-primary-400 transition-colors"
            >
              <Home className="w-5 h-5" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-gray-300 hover:text-primary-400"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-primary-900/30">
            <Link
              href="/"
              className="flex items-center gap-2 py-3 px-2 text-gray-300 hover:text-primary-400 transition-colors font-medium"
              onClick={() => setIsOpen(false)}
            >
              <Home className="w-5 h-5" />
              Home
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
