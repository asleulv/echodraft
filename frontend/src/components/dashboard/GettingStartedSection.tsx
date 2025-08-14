// components/dashboard/GettingStartedSection.tsx
import React, { useState } from "react";
import Link from "next/link";

interface GettingStartedSectionProps {
  onDismiss: () => void;
}

const GettingStartedSection: React.FC<GettingStartedSectionProps> = ({
  onDismiss,
}) => {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-100 dark:to-primary-200 border border-primary-400 p-4 sm:p-6 mb-8">
      {/* Mobile-responsive header with dismiss button */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1 w-full">
          {/* Center-aligned header */}
          <div className="flex flex-col items-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-secondary-600 to-secondary-800 bg-clip-text text-transparent text-center">
              How echodraft works
            </h2>
          </div>

          <p className="text-primary-700 mb-6 text-base sm:text-lg text-center sm:text-left">
            Let's see it in action! Ready to create your first document? We gave you
            <span className="bg-secondary-200 text-secondary-800 font-bold px-2 py-1 rounded-md mx-1 whitespace-nowrap">
              5 free generations
            </span>
            . Follow these steps:
          </p>

          {/* Improved responsive grid */}
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 mb-8">
            {/* Steps section - full width on mobile */}
            <div className="space-y-4 order-2 lg:order-1">
              <h3 className="text-lg font-semibold text-secondary-700 mb-4 text-center sm:text-left">
                Quick Start Guide
              </h3>

              {/* Step 1 */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-secondary-600 dark:bg-secondary-500 rounded-full flex items-center justify-center text-primary-50 text-sm font-bold flex-shrink-0 mt-1">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-extrabold text-secondary-700 text-sm sm:text-base">
                    Add a style source or use a demo document
                  </h4>
                  <p className="text-sm text-primary-600 mt-1">
                    This is the writing style echodraft will learn from. You can
                    paste in text or upload a document.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-secondary-600 rounded-full flex items-center justify-center text-primary-50 text-sm font-bold flex-shrink-0 mt-1">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-extrabold text-secondary-700 text-sm sm:text-base">
                    Let AI create content in your style
                  </h4>
                  <p className="text-sm text-primary-600 mt-1">
                    Type in the concept you want to write about, and select your
                    style source from the dropdown.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-secondary-600 rounded-full flex items-center justify-center text-primary-50 text-sm font-bold flex-shrink-0 mt-1">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-extrabold text-secondary-700 text-sm sm:text-base">
                    Wait while echodraft generates your document
                  </h4>
                  <p className="text-sm text-primary-600 mt-1">
                    Select the paragraphs you like and click "Save to document"
                  </p>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-secondary-700 mb-3 pt-4 text-center sm:text-left">
                That's it!
              </h3>
            </div>

            {/* Video Demo Section - responsive sizing */}
            <div className="bg-primary-100/70 dark:bg-primary-800/50 border border-primary-400 p-4 w-full max-w-md mx-auto lg:max-w-none lg:mx-0 order-1 lg:order-2">
              <h3 className="text-lg font-semibold text-secondary-600 text-center mb-3">
                Watch Demo
              </h3>

              {!showVideo ? (
                <div
                  onClick={() => setShowVideo(true)}
                  className="relative rounded-lg overflow-hidden cursor-pointer group w-full bg-primary-200 dark:bg-primary-800"
                  style={{
                    aspectRatio: "16/9",
                  }}
                >
                  <img 
                    src="/videos/echodraft-poster.jpg"
                    alt="Video thumbnail"
                    className="w-full h-full object-contain bg-primary-200 dark:bg-primary-800"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center group-hover:bg-opacity-50 transition-all">
                    <div className="text-center px-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-secondary-600 dark:bg-secondary-500 bg-opacity-90 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-secondary-700 dark:group-hover:bg-secondary-600 transition-colors backdrop-blur-sm">
                        <svg
                          className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden w-full bg-primary-200 dark:bg-primary-800">
                  <video
                    className="w-full h-auto aspect-video object-contain"
                    controls
                    autoPlay
                    preload="metadata"
                    src="/videos/echodraft.mp4"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              <p className="text-xs text-secondary-600 mt-2 text-center">
                Learn how to create your first document and use AI generation
              </p>
            </div>
          </div>

          {/* Mobile-responsive action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/documents/new"
              className="flex items-center justify-center px-6 py-3 bg-secondary-600 hover:bg-secondary-700 text-primary-50 font-medium transition-colors w-full sm:w-auto"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add style source
            </Link>
            <Link
              href="/documents/generate"
              className="flex items-center justify-center px-6 py-3 bg-primary-200 hover:bg-primary-300 text-primary-800 font-medium border border-primary-300 transition-colors w-full sm:w-auto"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Generate text in that style
            </Link>
          </div>
        </div>

        {/* Mobile-friendly dismiss button - fixed positioning */}
        <button
          onClick={onDismiss}
          className="order-first md:order-last self-end md:self-start text-primary-400 hover:text-primary-600 dark:text-primary-500 dark:hover:text-primary-300 transition-colors p-1"
          aria-label="Dismiss getting started section"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default GettingStartedSection;
