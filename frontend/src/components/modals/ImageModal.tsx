import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageAlt: string;
}

export default function ImageModal({ isOpen, onClose, imageSrc, imageAlt }: ImageModalProps) {
  const { theme } = useTheme();
  const [displaySrc, setDisplaySrc] = useState(imageSrc);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(theme);
  const isInitialMount = useRef(true);
  
  // Function to check if dark mode is active by checking the document class
  const isDarkMode = () => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return theme === 'dark';
  };
  
  // Force a re-render on client side to ensure correct theme detection
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Update current theme on initial mount and when theme changes
  useEffect(() => {
    // Check if we're in the browser
    if (typeof window !== 'undefined') {
      const darkModeActive = isDarkMode();
      setCurrentTheme(darkModeActive ? 'dark' : 'light');
      
      // Add a MutationObserver to watch for class changes on the document element
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            const darkModeActive = isDarkMode();
            setCurrentTheme(darkModeActive ? 'dark' : 'light');
          }
        });
      });
      
      observer.observe(document.documentElement, { attributes: true });
      
      // Cleanup
      return () => {
        observer.disconnect();
      };
    }
  }, [theme, isClient]);
  
  // Update image source when theme changes or when the modal opens with a new image
  useEffect(() => {
    if (imageSrc && isClient) {
      // If the image source contains theme information, update it to match the current theme
      if (imageSrc.includes('_light') || imageSrc.includes('_dark')) {
        // Handle both mini and regular images
        const isMini = imageSrc.includes('_mini');
        
        // Remove theme and mini suffix to get base path
        let baseImagePath = imageSrc
          .replace(/_light_mini\./, '_')
          .replace(/_dark_mini\./, '_')
          .replace(/_light\./, '_')
          .replace(/_dark\./, '_');
        
        const themeToUse = isDarkMode() ? 'dark' : 'light';
        const miniSuffix = isMini ? '_mini' : '';
        
        // Construct new path with correct theme
        const newSrc = baseImagePath + themeToUse + miniSuffix + imageSrc.substring(imageSrc.lastIndexOf('.'));
        setDisplaySrc(newSrc);
      } else {
        setDisplaySrc(imageSrc);
      }
    }
  }, [imageSrc, currentTheme, theme, isClient]);
  
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh] w-full">
        {/* Close button */}
        <button 
          className="absolute -top-10 right-0 text-white hover:text-gray-300 focus:outline-none"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Image */}
        <div 
          className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {isClient && (
            <img 
              src={displaySrc} 
              alt={imageAlt} 
              className="w-full h-auto object-contain"
              key={`modal-image-${currentTheme}-${isDarkMode() ? 'dark' : 'light'}`} // Force re-render when theme changes
            />
          )}
        </div>
      </div>
    </div>
  );
}
