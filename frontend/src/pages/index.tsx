import { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import Link from "next/link";
import Head from "next/head";
import {
  CheckCircle2,
  Newspaper,
  Users,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  Save,
  Target,
  Wand2,
  ThumbsDown,
  CornerLeftDown,
} from "lucide-react";
import WorkFlowDiagram from "@/components/icons/WorkFlowDiagram";
import EchopenIcon from "@/components/icons/EchopenIcon";
import TypingStruggle from "@/components/TypingStruggle";
import GoogleLoginButton from "@/components/GoogleLoginButton";

// FAQ Item Component - Move OUTSIDE of Home component
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-primary-100 rounded-lg shadow-md overflow-hidden border border-primary-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 focus:ring-offset-primary-50"
        aria-expanded={isOpen}
      >
        <h3 className="text-xl font-semibold text-primary-800">{question}</h3>
        <span className="text-secondary-600 ml-2">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </span>
      </button>

      {isOpen && (
        <div className="px-6 pb-6 border-t border-primary-200">
          <p className="text-primary-700 pt-4">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  // Video overlay state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [videoDuration, setVideoDuration] = useState<string>("");

  // Animation state
  const [animate, setAnimate] = useState(false);

  const handlePlayClick = () => {
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.warn("Video play failed:", error);
        setShowOverlay(false);
      });
    }
  };

  useEffect(() => {
    setAnimate(true);
  }, []);

  return (
    <Layout title="AI Text Generator">
      <Head>
        {/* JSON-LD structured data for SaaS product */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "echodraft",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              description:
                "Save your best content and generate new posts in the same style. Never start from scratch again.",
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "5",
                ratingCount: "1",
                bestRating: "5",
                worstRating: "1",
              },
            }),
          }}
        />

        {/* Additional SEO meta tags */}
        <meta
          name="keywords"
          content="AI text generator, content repurposing, AI writing assistant, content creation tool, brand consistency, AI writing tool"
        />
      </Head>
      <div className="min-h-screen">
        {/* Hero Section - Streamlined and Focused */}
        <section
          aria-labelledby="hero-heading"
          className="bg-gradient-to-br from-primary-50 via-primary-100 to-secondary-100 py-16 md:py-24"
        >
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto text-center">
              {/* Typing Animation - Shows writing struggle */}
              <TypingStruggle />

              <h1
                id="hero-heading"
                className={`text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight 
                bg-clip-text text-transparent 
                bg-gradient-to-r from-secondary-700 to-primary-800
                pb-2 overflow-visible font-bold
                ${animate ? "animate-fade-in" : "opacity-0"}`}
              >
                Never Stare at a Blank Page Again
              </h1>

              <style jsx>{`
                @keyframes fade-in {
                  0% {
                    opacity: 0;
                    transform: translateY(20px);
                  }
                  100% {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
                .animate-fade-in {
                  animation: fade-in 1s ease-out forwards;
                }
              `}</style>

              <p className="text-xl md:text-2xl text-primary-700 mb-12 leading-relaxed max-w-3xl mx-auto">
                Store your texts. Teach AI your style. Generate new drafts in
                your voice.{" "}
                <span className="block mt-2 text-lg text-primary-600">
                  Don't use generic AI voices. Use your own.
                </span>
              </p>

              <div className="max-w-4xl mx-auto mb-12">
                <div className="text-sm text-primary-600 mb-4 flex">
                  <CornerLeftDown className="w-5 h-5 mt-1 mr-2 flex-shrink-0" />
                  <span>
                    This video shows how the user uses AI to write about the
                    John Lennon using the style of a previous social
                    media rant
                  </span>
                </div>
                <div className="relative overflow-hidden shadow-2xl bg-primary-100 dark:bg-primary-900">
                  <video
                    ref={videoRef}
                    poster="/videos/echodraft-poster.jpg"
                    className="w-full h-auto"
                    preload="metadata"
                    controls={!showOverlay}
                    onPlay={() => setShowOverlay(false)}
                    onPause={() => setShowOverlay(true)}
                    onEnded={() => setShowOverlay(true)}
                    onLoadedMetadata={() => {
                      if (
                        videoRef.current &&
                        !isNaN(videoRef.current.duration)
                      ) {
                        const duration = videoRef.current.duration;
                        const minutes = Math.floor(duration / 60);
                        const seconds = Math.floor(duration % 60);
                        setVideoDuration(
                          `${minutes}:${seconds.toString().padStart(2, "0")}`
                        );
                      }
                    }}
                  >
                    <source src="/videos/echodraft.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>

                  {/* Custom Play Button Overlay */}
                  {showOverlay && (
                    <div
                      className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center cursor-pointer group-hover:bg-opacity-30 transition-all duration-300"
                      onClick={handlePlayClick}
                    >
                      <div className="w-20 h-20 md:w-24 md:h-24 bg-secondary-600 hover:bg-secondary-700 rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-all duration-300">
                        <svg
                          className="w-8 h-8 md:w-10 md:h-10 text-white ml-1"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Duration Badge */}
                  {showOverlay && videoDuration && (
                    <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                      {videoDuration}
                    </div>
                  )}
                </div>
              </div>

              {/* Simplified Value Props - More Concise */}
              <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="w-16 h-16 bg-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-primary-50" />
                  </div>
                  <h3 className="font-semibold text-primary-800 mb-2">
                    That viral LinkedIn post?
                  </h3>
                  <p className="text-primary-600 text-sm">
                    Use its exact tone for your next campaign
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Newspaper className="w-8 h-8 text-primary-50" />
                  </div>
                  <h3 className="font-semibold text-primary-800 mb-2">
                    That newsletter everyone loved?
                  </h3>
                  <p className="text-primary-600 text-sm">
                    Recreate its magic for your blog series
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-primary-50" />
                  </div>
                  <h3 className="font-semibold text-primary-800 mb-2">
                    That email with 45% opens?
                  </h3>
                  <p className="text-primary-600 text-sm">
                    Scale that voice across all your content
                  </p>
                </div>
              </div>

              {/* Single, Clear CTA */}
              <div className="text-center">
                <Link
                  href="/register"
                  className="inline-block px-12 py-4 bg-secondary-600 hover:bg-secondary-700 text-primary-50 text-xl font-semibold rounded-lg shadow-lg transition-all duration-300 focus:ring-4 focus:ring-secondary-500 focus:ring-offset-2 focus:ring-offset-primary-100 transform hover:scale-105"
                >
                  Try 5 Free Generations
                </Link>
                <p className="text-sm text-primary-600 mt-3">
                  No credit card required • Takes 2 minutes to set up
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Audience Qualification Section */}
        <section
          aria-labelledby="audience-heading"
          className="bg-primary-100 py-16 relative"
        >
          <div className="container mx-auto px-4">
            <h2
              id="audience-heading"
              className="text-3xl font-bold text-center text-primary-800 mb-12"
            >
              Is echodraft for you?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Not For You */}
              <div className="bg-primary-50 border-2 border-primary-200 p-6">
                <div className="flex items-center mb-4">
                  <ThumbsDown className="w-10 h-10 text-danger-600 mr-3" />
                  <h3 className="text-xl font-semibold text-primary-800">
                    Not for you if:
                  </h3>
                </div>
                <ul className="space-y-3 text-primary-700">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-primary-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>You barely write any text content</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-primary-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>You only write once-off, unique pieces</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-primary-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>You prefer starting completely fresh every time</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-primary-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>You're happy with inconsistent messaging</span>
                  </li>
                </ul>
              </div>

              {/* Perfect For You */}
              <div className="bg-secondary-50 border-2 border-secondary-200 p-6">
                <div className="flex items-center mb-4">
                  <ThumbsUp className="w-10 h-10 text-secondary-600 mr-3" />
                  <h3 className="text-xl font-semibold text-secondary-800">
                    Perfect for you if:
                  </h3>
                </div>
                <ul className="space-y-3 text-secondary-700">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-secondary-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>
                      You regularly create{" "}
                      <strong>blog posts, social media, newsletters</strong>
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-secondary-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>
                      You write{" "}
                      <strong>marketing copy, emails, articles</strong>
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-secondary-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>
                      You want <strong>consistent brand voice</strong> across
                      content
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-secondary-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>
                      You've had posts that <strong>worked well</strong> and
                      want more like them
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="text-center mt-12">
              <p className="text-xl text-primary-700 font-medium mb-6">
                If you're a heavy text user who wants to stop reinventing the
                wheel every time you write, echodraft will make your life
                easier.
              </p>
              <Link
                href="/register"
                className="inline-block px-8 py-3 bg-secondary-600 hover:bg-secondary-700 text-primary-50 font-medium shadow-md transition-all duration-300 focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 focus:ring-offset-primary-100"
              >
                Yes, this sounds like me
              </Link>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
            <svg
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
              className="w-full h-[60px] rotate-180"
            >
              <path
                d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                className="fill-primary-200"
              ></path>
            </svg>
          </div>
        </section>

        {/* Diagram Section */}
        <section
          aria-labelledby="workflow-heading"
          className="bg-primary-200 py-10 relative"
        >
          <div className="container mx-auto px-4 text-center">
            <h2
              id="workflow-heading"
              className="text-3xl font-bold text-primary-800"
            >
              A Simple Concept
            </h2>
            <div className="max-w-4xl mx-auto text-secondary-600">
              <WorkFlowDiagram className="mx-auto" />
            </div>
            <p className="text-lg text-primary-700 max-w-2xl mx-auto">
              Think of it as having a writing assistant who studied all your
              best content and can recreate that magic on demand.
            </p>
          </div>

          <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
            <svg
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
              className="w-full h-[60px] rotate-180"
            >
              <path
                d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                className="fill-primary-100"
              ></path>
            </svg>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          aria-labelledby="features-heading"
          className="bg-primary-100 py-16 pb-24 relative"
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2
                id="features-heading"
                className="text-3xl font-bold text-primary-800 mb-8"
              >
                How It Works
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-secondary-100 rounded-full flex items-center justify-center">
                    <Save className="w-8 h-8 text-secondary-700" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-primary-800">
                    Save What Works
                  </h3>
                  <p className="text-primary-700">
                    Upload your successful posts, emails, or any text you want
                    to replicate
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-secondary-100 rounded-full flex items-center justify-center">
                    <Target className="w-8 h-8 text-secondary-700" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-primary-800">
                    Pick Your Style
                  </h3>
                  <p className="text-primary-700">
                    Choose which saved content should guide the tone for your
                    new post
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-secondary-100 rounded-full flex items-center justify-center">
                    <Wand2 className="w-8 h-8 text-secondary-700" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-primary-800">
                    Get Your Draft
                  </h3>
                  <p className="text-primary-700">
                    AI writes new content that matches your chosen style
                    perfectly
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Wave divider at bottom of section */}
          <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
            <svg
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
              className="w-full h-[60px] rotate-180"
            >
              <path
                d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                className="fill-primary-200"
              ></path>
            </svg>
          </div>
        </section>

        {/* FAQ Section */}
        <section
          aria-labelledby="faq-heading"
          className="bg-primary-200 py-16 pb-24 relative"
        >
          <div className="container mx-auto px-4">
            <h2
              id="faq-heading"
              className="text-3xl font-bold text-center text-primary-800 mb-12"
            >
              The obvious questions about your new AI writing assistant
            </h2>

            <div className="max-w-3xl mx-auto">
              <div className="space-y-4">
                <FaqItem
                  question="How does echodraft work?"
                  answer="It's a text archive with AI intelligence. Upload posts that worked well, then when you need new content, choose which saved post should guide the tone and style. The AI analyzes your example and writes new content that matches it perfectly."
                />

                <FaqItem
                  question="What do I actually *do* with echodraft?"
                  answer="Start by uploading a few of your best posts - anything that got good engagement or results. When you need new content, just enter your topic and pick which saved post should guide the style. You'll get a draft that sounds like you wrote it."
                />

                <FaqItem
                  question="Is echodraft free to use?"
                  answer="Yes! Every new account comes with 5 free AI generations. If you love it and want to create more content, you only pay for what you need. We have no paid subscriptions."
                />

                <FaqItem
                  question="What types of content can I create?"
                  answer="Any short-form text content - social media posts, emails, blog intros, ad copy, product descriptions. If you have examples of content that worked, echodraft can help you create more in that same style."
                />

                <FaqItem
                  question="How accurate is the AI at copying my style?"
                  answer="Think of it as getting you started with a strong first draft. The AI is designed to match your tone and style based on your examples, but you're always in control to edit and refine the output to make it perfect."
                />
              </div>
            </div>
          </div>

          {/* Wave divider at bottom of section */}
          <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
            <svg
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
              className="w-full h-[60px] rotate-180"
            >
              <path
                d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                className="fill-secondary-100"
              ></path>
            </svg>
          </div>
        </section>

        {/* CTA Section - Updated with EchopenIcon */}
        <section
          aria-labelledby="cta-heading"
          className="bg-gradient-to-b from-secondary-100 to-primary-100 py-16"
        >
          <div className="container mx-auto px-4 text-center">
            {/* Add the EchopenIcon here */}
            <div className="mb-8">
              <EchopenIcon
                className="w-24 h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 mx-auto text-secondary-600"
                width={144}
                height={144}
              />
            </div>

            <h2
              id="cta-heading"
              className="text-3xl font-bold text-secondary-800 mb-6"
            >
              Ready to never stare at a blank page again?
            </h2>
            <p className="text-xl text-primary-700 mb-8 max-w-2xl mx-auto">
              Test it yourself! Every new account comes with 5 free AI
              generations to try out. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="px-8 py-3 bg-secondary-600 hover:bg-secondary-700 text-primary-50 font-medium shadow-md transition-all duration-300 focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 focus:ring-offset-secondary-100"
              >
                Start Creating Content
              </Link>
              <Link
                href="/login"
                className="px-8 py-3 bg-primary-50 hover:bg-primary-200 text-primary-800 font-medium shadow-md border border-primary-300 transition-all duration-300 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-secondary-100"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
