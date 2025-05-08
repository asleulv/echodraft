import { useTheme } from "@/context/ThemeContext";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import ImageModal from "./modals/ImageModal";

const screenshotData = [
  {
    id: 1,
    title: "Organize Your Content",
    description:
      "Once signed up to echodraft you will create categories and add your texts with tags for better searchability",
  },
  {
    id: 2,
    title: "Start the Generation Process",
    description:
      "Click the + button followed by Generate by AI to create your next draft",
  },
  {
    id: 3,
    title: "Define Your New Content",
    description: "Enter the info about the new text you wanna generate",
  },
  {
    id: 4,
    title: "Select Source Texts",
    description:
      "Filter your source texts and choose the ones to echo the style, tone and voice from",
  },
  {
    id: 5,
    title: "AI Analysis in Progress",
    description:
      "Now be patient while AI analyzes your source texts and generate the new text",
  },
  {
    id: 6,
    title: "Enjoy Your New Content",
    description: "Enjoy your newly generated text echoing your past successes",
  },
];

export default function ScreenshotCarousel() {
  const { theme } = useTheme();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedAlt, setSelectedAlt] = useState<string>("");
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">(theme);
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const autoSlideInterval = useRef<NodeJS.Timeout>();

  const isDarkMode = () => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return theme === "dark";
  };

  const getImagePath = (screenshotId: number, useMini = true) => {
    const themeToUse = isDarkMode() ? "dark" : "light";
    const suffix = useMini ? "_mini" : "";
    return `/images/generatescreen${screenshotId}_${themeToUse}${suffix}.png`;
  };

  useEffect(() => {
    setIsClient(true);

    if (typeof window !== "undefined") {
      const darkModeActive = isDarkMode();
      setCurrentTheme(darkModeActive ? "dark" : "light");

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === "class") {
            const darkModeActive = isDarkMode();
            setCurrentTheme(darkModeActive ? "dark" : "light");
          }
        });
      });

      observer.observe(document.documentElement, { attributes: true });

      return () => {
        observer.disconnect();
      };
    }
  }, [theme]);

  useEffect(() => {
    if (selectedImage) {
      const selectedId = parseInt(
        selectedImage.match(/generatescreen(\d+)_/)?.[1] || "1"
      );
      // When theme changes, maintain the same image type (mini or full-size)
      const useMini = selectedImage.includes("_mini");
      setSelectedImage(getImagePath(selectedId, useMini));
    }
  }, [currentTheme, theme]);

  const scrollToSlide = () => {
    if (carouselRef.current) {
      const slideWidth = carouselRef.current.clientWidth;
      carouselRef.current.scrollTo({
        left: currentSlide * slideWidth,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    scrollToSlide();
  }, [currentSlide]);

  // Add scroll event listener to update current slide when swiping
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    let isScrolling = false;
    
    const handleScroll = () => {
      // Clear the timeout if it's already set
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      // Set a flag to indicate we're currently scrolling
      isScrolling = true;
      
      // Set a timeout to run after scrolling ends
      scrollTimeout = setTimeout(() => {
        if (carouselRef.current) {
          const scrollLeft = carouselRef.current.scrollLeft;
          const slideWidth = carouselRef.current.clientWidth;
          const newSlide = Math.round(scrollLeft / slideWidth);
          
          // Only update if different and we're not in the middle of a programmatic scroll
          if (newSlide !== currentSlide && isScrolling) {
            setCurrentSlide(newSlide);
          }
          
          // Reset the scrolling flag
          isScrolling = false;
        }
      }, 150); // Wait for scrolling to finish
    };

    const carouselElement = carouselRef.current;
    if (carouselElement) {
      carouselElement.addEventListener('scroll', handleScroll);
      
      return () => {
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }
        carouselElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [currentSlide]);

  const openModal = (screenshotId: number, alt: string) => {
    setSelectedImage(getImagePath(screenshotId, false)); // Use full-size image in modal
    setSelectedAlt(alt);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrev = () => {
    setCurrentSlide((prev) =>
      prev === 0 ? screenshotData.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentSlide((prev) =>
      prev === screenshotData.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className="py-16 bg-primary-50 overflow-hidden">
      <div className="w-full">
        <h2 className="text-3xl font-bold text-center text-primary-500 mb-12">
          The echodraft process
        </h2>

        <div className="relative w-full overflow-hidden">
          {/* Carousel Track - Hide scrollbar */}
          {/* Add CSS to hide scrollbar */}
          <style jsx>{`
            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .no-scrollbar {
              -ms-overflow-style: none; /* IE and Edge */
              scrollbar-width: none; /* Firefox */
            }
          `}</style>

          <div
            ref={carouselRef}
            className="flex snap-x snap-mandatory scroll-smooth overflow-x-auto no-scrollbar"
          >
            {screenshotData.map((screenshot) => {
              const imageAlt = `Step ${screenshot.id}: ${screenshot.title}`;

              return (
                <div
                  key={screenshot.id}
                  className="flex-shrink-0 w-full snap-start"
                >
                  <div className="bg-gradient-to-b from-primary-50 w-full via-secondary-50 to-primary-50 flex flex-col items-center p-6">

                    <div className="flex items-center mb-4 rounded-lg p-4 shadow-sm">
                      <div className="bg-secondary-400 text-primary-50 w-8 h-8 rounded-full flex items-center justify-center shadow-md mr-4">
                        {screenshot.id}
                      </div>
                      <div className="text-xl font-semibold text-primary-600 leading-none">
                        {screenshot.title}
                      </div>
                    </div>

                    <p className="text-primary-600 text-center text-lg max-w-md">
                      {screenshot.description}
                    </p>
                    <div
                      className="relative mb-4 rounded-lg overflow-hidden border-2 border-primary-500"
                    >
                      <div className="relative">
                        {isClient && (
                          <Image
                            key={`screenshot-${screenshot.id}-${currentTheme}`}
                            src={getImagePath(screenshot.id, true)} // Use mini version for thumbnails
                            alt={imageAlt}
                            width={800}
                            height={600}
                            className="w-full h-auto"
                            priority={screenshot.id <= 2}
                            unoptimized={true}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={goToPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all z-10"
            aria-label="Previous slide"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all z-10"
            aria-label="Next slide"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Indicators */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {screenshotData.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  currentSlide === index
                    ? "bg-secondary-300 w-6"
                    : "bg-gray-500"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      <ImageModal
        isOpen={!!selectedImage}
        onClose={closeModal}
        imageSrc={selectedImage || ""}
        imageAlt={selectedAlt}
      />
    </div>
  );
}
