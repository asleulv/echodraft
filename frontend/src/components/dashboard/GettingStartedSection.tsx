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
    <div className="bg-gradient-to-r from-secondary-50 to-secondary-100 dark:from-primary-50 dark:to-primary-100 border border-secondary-200 rounded-lg p-6 mb-8">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex flex-col items-center mb-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-secondary-600 to-secondary-800 bg-clip-text text-transparent">
              How echodraft works
            </h2>
          </div>

          <p className="text-primary-600 mb-6 text-lg">
  Let's see it in action! Ready to create your first document? We gave you 
  <span className="bg-secondary-100 text-secondary-700 font-bold px-2 py-1 rounded-md mx-1">
    5 free generations
  </span>. 
  Follow these steps:
</p>


          {/* Step-by-step guide */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-secondary-600 mb-3">
                Quick Start Guide
              </h3>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-secondary-600 rounded-full flex items-center justify-center text-primary-100 text-sm font-bold flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-medium text-secondary-600">
                    Add a style source or use a demo document
                  </h4>
                  <p className="text-sm text-primary-600">
                    This is the writing style echodraft will learn from. You can
                    paste in text or upload a document.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-secondary-600 rounded-full flex items-center justify-center text-primary-100 text-sm font-bold flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-secondary-600">
                    Let AI create content in your style
                  </h4>
                  <p className="text-sm text-primary-600">
                    Type in the concept you want to write about, and select
                    your style source from the dropdown.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-secondary-600 rounded-full flex items-center justify-center text-primary-100 text-sm font-bold flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-secondary-600">
                    Wait while echodraft generates your document
                  </h4>
                  <p className="text-sm text-primary-600">
                    Select the paragraphs you like and click "Save to document"
                  </p>
                </div>
                
              </div>

              <h3 className="text-lg font-semibold text-secondary-600 mb-3">
                That's it!
              </h3>
            </div>

            {/* FIXED Video Demo Section */}
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-secondary-500 justify-center text-center mb-3">
                Watch Demo
              </h3>

              {!showVideo ? (
                <div
                  onClick={() => setShowVideo(true)}
                  className="relative rounded-lg overflow-hidden cursor-pointer group"
                  style={{
                    aspectRatio: "16/9",
                    backgroundImage: `url('/videos/echodraft-poster.jpg')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    minHeight: "160px",
                  }}
                >
                  {/* Dark overlay for better button visibility */}
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center group-hover:bg-opacity-50 transition-all">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-secondary-600 bg-opacity-90 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-secondary-700 transition-colors backdrop-blur-sm">
                        <svg
                          className="w-8 h-8 text-white ml-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                      <p className="text-sm text-white font-medium drop-shadow-lg">
                        Generate with STYLE in less than a minute!
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="relative rounded-lg overflow-hidden"
                  style={{ aspectRatio: "16/9" }}
                >
                  <video
                    className="w-full h-full object-cover"
                    controls
                    autoPlay
                    preload="metadata"
                    src="/videos/echodraft.mp4"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-2">
                Learn how to create your first document and use AI generation
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/documents/new"
              className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-primary-100 font-medium rounded-lg transition-colors"
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
              className="inline-flex items-center px-6 py-3 bg-secondary-600 hover:bg-secondary-700 text-secondary-100 font-medium rounded-lg transition-colors"
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

        <button
          onClick={onDismiss}
          className="ml-4 text-secondary-400 hover:text-secondary-600 dark:text-secondary-500 dark:hover:text-secondary-300 transition-colors"
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
