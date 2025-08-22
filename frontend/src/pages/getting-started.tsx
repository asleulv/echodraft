import Layout from "@/components/Layout";
import Head from "next/head";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import {
  CornerLeftDown,
  Lightbulb,
  PencilLine,
  Plus,
  FileText,
  BookText,
  Wand2,
  CheckCircle,
  Upload,
  Target,
} from "lucide-react";

export default function GettingStarted() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [videoDuration, setVideoDuration] = useState<string>("");

  const handlePlayClick = () => {
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.warn("Video play failed:", error);
        setShowOverlay(false);
      });
    }
  };

  return (
    <Layout title="Getting Started - Use Your Own Writing Style">
      <Head>
        <meta
          name="description"
          content="Learn how to add your own content and generate new posts in your personal writing style with EchoDraft"
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-secondary-600 via-secondary-700 to-secondary-800 bg-clip-text text-transparent mb-6 leading-tight pb-2">
              Now let's use YOUR writing style!
            </h1>

            <p className="text-xl text-primary-600 max-w-3xl mx-auto leading-relaxed">
              You've tried our demo styles. Here's how to add your own content
              and generate posts that sound exactly like you.
            </p>
          </div>

          {/* Video Section */}
          <div className="mb-16">
            <div className="text-sm text-primary-600 mb-4 flex items-start max-w-4xl mx-auto">
              <CornerLeftDown className="w-5 h-5 mt-1 mr-2 flex-shrink-0" />
              <span>
                This video shows how the user uses AI to write about John Lennon
                using the style of a previous social media rant
              </span>
            </div>

            <div className="relative overflow-hidden shadow-2xl bg-primary-100 max-w-4xl mx-auto">
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
                  if (videoRef.current && !isNaN(videoRef.current.duration)) {
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
              {/* Custom Play Button Overlay - Modified */}
              {showOverlay && (
                <div
                  className="absolute inset-0 flex items-center justify-center cursor-pointer group transition-all duration-300"
                  onClick={handlePlayClick}
                  style={{
                    background:
                      "radial-gradient(circle at center, rgba(0,0,0,0.2) 30%, rgba(0,0,0,0.6) 70%)",
                  }}
                >
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-secondary-600 hover:bg-secondary-700 rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-all duration-300">
                    <svg
                      className="w-8 h-8 md:w-10 md:h-10 text-primary-50 ml-1"
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
                <div className="absolute bottom-4 right-4 bg-primary-900 bg-opacity-75 text-primary-50 px-2 py-1 rounded text-sm">
                  {videoDuration}
                </div>
              )}
            </div>
          </div>

          {/* What You Just Saw Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-success-700 mb-12">
              What You Just Saw: Step by Step
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Step 1 */}
              <div className="bg-success-50 p-8 border border-success-200 shadow-lg">
                <div className="w-16 h-16 bg-success-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Upload className="w-8 h-8 text-primary-50" />
                </div>
                <h3 className="text-xl font-bold text-success-700 mb-4 text-center">
                  1. Adding Your Style Source
                </h3>
                <div className="space-y-3 text-success-600">
                  <div className="flex items-start">
                    <Plus className="w-5 h-5 mt-0.5 mr-3 text-success-500 flex-shrink-0" />
                    <span>
                      Click the <strong>+</strong> button (top right corner)
                    </span>
                  </div>
                  <div className="flex items-start">
                    <FileText className="w-5 h-5 mt-0.5 mr-3 text-success-500 flex-shrink-0" />
                    <span>
                      Select <strong>"Create Document"</strong>
                    </span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 mt-0.5 mr-3 text-success-500 flex-shrink-0" />
                    <span>
                      Paste in your best-performing content (like that viral
                      LinkedIn post or engaging email)
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-success-50 p-8 border border-success-200 shadow-lg">
                <div className="w-16 h-16 bg-success-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Wand2 className="w-8 h-8 text-primary-50" />
                </div>
                <h3 className="text-xl font-bold text-success-700 mb-4 text-center">
                  2. Generating New Content
                </h3>
                <div className="space-y-3 text-success-600">
                  <div className="flex items-start">
                    <Plus className="w-5 h-5 mt-0.5 mr-3 text-success-500 flex-shrink-0" />
                    <span>
                      Click <strong>+</strong> again, select{" "}
                      <strong>"Generate with AI"</strong>
                    </span>
                  </div>
                  <div className="flex items-start">
                    <FileText className="w-5 h-5 mt-0.5 mr-3 text-success-500 flex-shrink-0" />
                    <span>
                      Enter your new topic and choose paragraph length
                    </span>
                  </div>
                  <div className="flex items-start">
                    <Target className="w-5 h-5 mt-0.5 mr-3 text-success-500 flex-shrink-0" />
                    <span>
                      Choose your uploaded document as the style source
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-success-50 p-8 border border-success-200 shadow-lg">
                <div className="w-16 h-16 bg-success-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-primary-50" />
                </div>
                <h3 className="text-xl font-bold text-success-700 mb-4 text-center">
                  3. The Result
                </h3>
                <div className="space-y-3 text-success-600">
                  <div className="flex items-start rounded-">
                    <CheckCircle className="w-5 h-5 mt-0.5 mr-3 text-success-500 flex-shrink-0" />
                    <span>
                      Content that sounds like <strong>you</strong> wrote it
                    </span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 mt-0.5 mr-3 text-success-500 flex-shrink-0" />
                    <span>Maintains your unique tone and style</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 mt-0.5 mr-3 text-success-500 flex-shrink-0" />
                    <span>Ready to edit and publish</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Benefits */}
          <div className="mb-16 bg-gradient-to-r from-secondary-100 to-primary-100 p-8 md:p-12">
            <h2 className="text-2xl font-bold text-center text-secondary-700 mb-8">
              Why This Works So Well
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-secondary-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-primary-50" />
                </div>
                <div>
                  <h3 className="font-semibold text-secondary-700 mb-2">
                    No More Generic AI Content
                  </h3>
                  <p className="text-primary-600">
                    Instead of bland, robotic writing, you get content that
                    captures YOUR unique voice and personality.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-secondary-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-primary-50" />
                </div>
                <div>
                  <h3 className="font-semibold text-secondary-700 mb-2">
                    Consistent Brand Voice
                  </h3>
                  <p className="text-primary-600">
                    Whether it's emails, social posts, or blog content -
                    everything sounds cohesively like you.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-secondary-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-primary-50" />
                </div>
                <div>
                  <h3 className="font-semibold text-secondary-700 mb-2">
                    Learn From Your Best Work
                  </h3>
                  <p className="text-primary-600">
                    That post that got amazing engagement? Now you can recreate
                    that magic whenever you need it.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-secondary-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-primary-50" />
                </div>
                <div>
                  <h3 className="font-semibold text-secondary-700 mb-2">
                    Save Hours of Writing Time
                  </h3>
                  <p className="text-primary-600">
                    Start with a strong first draft instead of staring at a
                    blank page for hours.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pro Tips */}
          <div className="mb-16 bg-primary-100 p-8 border border-primary-200">
            <h2 className="text-2xl font-bold text-center text-primary-800 mb-8 flex items-center justify-center">
              Pro Tips for Best Results
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="bg-primary-50 p-6 border border-primary-200">
                <h3 className="font-semibold text-primary-800 mb-2 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-primary-600" />
                  Choose Your Best Content
                </h3>
                <p className="text-primary-600 text-sm">
                  Upload posts that got great engagement, emails with high open
                  rates, or content that perfectly captures your voice.
                </p>
              </div>
              <div className="bg-primary-50 p-6 border border-primary-200">
                <h3 className="font-semibold text-primary-800 mb-2 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-primary-600" />
                  Be Specific with Topics
                </h3>
                <p className="text-primary-600 text-sm">
                  Instead of "SEO" try "SEO advice for small businesses" -
                  specificity helps the AI write better content.
                </p>
              </div>
              <div className="bg-primary-50 p-6 border border-primary-200">
                <h3 className="font-semibold text-primary-800 mb-2 flex items-center">
                  <PencilLine className="w-5 h-5 mr-2 text-primary-600" />
                  Edit and Personalize
                </h3>
                <p className="text-primary-600 text-sm">
                  Use the AI draft as your starting point, then add your
                  personal insights and experiences to make it uniquely yours.
                </p>
              </div>
              <div className="bg-primary-50 p-6 border border-primary-200">
                <h3 className="font-semibold text-primary-800 mb-2 flex items-center">
                  <BookText className="w-5 h-5 mr-2 text-primary-600" />
                  Build Your Style Library
                </h3>
                <p className="text-primary-600 text-sm">
                  Upload different types of content - professional posts, casual
                  emails, technical writing - for different occasions.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-to-r from-secondary-600 to-secondary-700 p-12 text-primary-50">
            <h2 className="text-3xl font-bold mb-6 text-primary-50">
              Ready to try it with your own content?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Stop using generic AI voices. Start creating content that sounds
              like you wrote it. Or, even, a writer you admire.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/documents"
                className="px-8 py-4 bg-primary-50 hover:bg-primary-100 text-secondary-700 font-semibold text-lg inline-flex items-center space-x-2 transition-all duration-200 hover:bg-primary-300"
              >
                <Plus className="w-5 h-5" />
                <span>Add My First Style Source</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
