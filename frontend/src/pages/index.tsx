import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import Link from "next/link";
import Head from "next/head";
import {
  CheckCircle2,
  Newspaper,
  Users,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Save,
  Target,
  Wand2,
} from "lucide-react";
import WorkFlowDiagram from "@/components/icons/WorkFlowDiagram";
import EchopenIcon from "@/components/icons/EchopenIcon";

// FAQ Item Component - Updated with warm theme and single color codes
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
  // Fix for hydration error - only animate on client side
  const [animate, setAnimate] = useState(false);

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
                "echodraft is your personal text archive with AI intelligence. Save content that works, then generate new posts that match the exact same style and tone.",
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
        {/* Hero Section - Updated with warm theme */}
        <section
          aria-labelledby="hero-heading"
          className="bg-gradient-to-br from-primary-50 via-primary-100 to-secondary-100 py-16 md:py-24"
        >
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              {/* Large icon floating above headline */}
              <div className="mb-8">
                <EchopenIcon
                  className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 mx-auto text-secondary-600"
                  width={192}
                  height={192}
                />
              </div>

              <h1
                id="hero-heading"
                className={`text-3xl md:text-4xl lg:text-5xl mb-6 leading-tight 
      bg-clip-text text-transparent 
      bg-gradient-to-r from-secondary-700 to-primary-800
      pb-2 overflow-visible
      ${animate ? "animate-fade-in" : "opacity-0"}`}
              >
                Stop Starting From Scratch Every Time You Write
              </h1>

              <style jsx>{`
                @keyframes fade-in {
                  0% {
                    opacity: 0;
                  }
                  100% {
                    opacity: 1;
                  }
                }
                .animate-fade-in {
                  animation: fade-in 3.5s ease-out forwards;
                }
              `}</style>

              <p className="text-xl md:text-2xl text-primary-700 mb-8 leading-relaxed">
                echodraft is your personal text archive with AI intelligence.
                Save content that works, then generate new posts that match the
                exact same style and tone.
              </p>

              {/* Value proposition highlights - Sophisticated and compelling */}
              <div className="bg-gradient-to-br from-primary-50 to-secondary-50 border border-primary-300 p-10 mb-12 max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-primary-800 mb-3 font-heading">
                    Stop reinventing your voice every time you write
                  </h3>
                  <p className="text-primary-600 text-lg">
                    Your best content already shows you what works. Now make it
                    repeatable.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-primary-50" />
                    </div>
                    <h4 className="font-semibold text-primary-800 mb-2">
                      That viral LinkedIn post?
                    </h4>
                    <p className="text-primary-600 text-sm">
                      Use its exact tone for your next campaign
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Newspaper className="w-8 h-8 text-primary-50" />
                    </div>
                    <h4 className="font-semibold text-primary-800 mb-2">
                      That newsletter everyone loved?
                    </h4>
                    <p className="text-primary-600 text-sm">
                      Recreate its magic for your blog series
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-primary-50" />
                    </div>
                    <h4 className="font-semibold text-primary-800 mb-2">
                      That email with 45% opens?
                    </h4>
                    <p className="text-primary-600 text-sm">
                      Scale that voice across all your content
                    </p>
                  </div>
                </div>

                <div className="text-center mt-8 pt-6 border-t border-primary-200">
                  <p className="text-primary-700 font-medium">
                    Your audience already told you what they want to hear.
                    <span className="text-secondary-600 font-semibold">
                      {" "}
                      Now give them more of it.
                    </span>
                  </p>
                </div>
              </div>

              {/* VIDEO DIRECTLY IN HERO - Card Style */}
              <div className="max-w-4xl mx-auto mb-8">
                <div className="bg-primary-50 shadow-lg border border-primary-200 p-8">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-semibold text-primary-800 mb-2 font-heading">
                      See echodraft in action
                    </h3>
                    <div className="w-16 h-0.5 bg-secondary-500 mx-auto mb-4"></div>
                    <p className="text-primary-700">
                      Watch how we transform your successful content into new
                      posts
                    </p>
                  </div>

                  <div className="relative bg-primary-800 overflow-hidden">
                    <video
                      controls
                      poster="/videos/echodraft-poster.jpg"
                      className="w-full"
                      preload="metadata"
                    >
                      <source src="/videos/echodraft.mp4" type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
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
              <div className="bg-primary-50 border-2 border-primary-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <X className="w-10 h-10 text-danger-600 mr-3" />
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
              <div className="bg-secondary-50 border-2 border-secondary-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <Check className="w-10 h-10 text-secondary-600 mr-3" />
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
          className="bg-primary-200 py-16 relative"
        >
          <div className="container mx-auto px-4 text-center">
            <h2
              id="workflow-heading"
              className="text-3xl font-bold text-primary-800 mb-8"
            >
              It's Stupidly Simple
            </h2>
            <div className="max-w-4xl mx-auto text-secondary-600">
              <WorkFlowDiagram className="mx-auto" />
            </div>
            <p className="text-lg text-primary-700 mt-8 max-w-2xl mx-auto">
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

        {/* CTA Section */}
        <section
          aria-labelledby="cta-heading"
          className="bg-gradient-to-b from-secondary-100 to-primary-100 py-16"
        >
          <div className="container mx-auto px-4 text-center">
            <h2
              id="cta-heading"
              className="text-3xl font-bold text-secondary-800 mb-6 flex items-center justify-center gap-2"
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
                className="px-8 py-3 bg-secondary-600 hover:bg-secondary-700 text-primary-50 font-medium  shadow-md transition-all duration-300 focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 focus:ring-offset-secondary-100"
              >
                Start Creating Content
              </Link>
              <Link
                href="/login"
                className="px-8 py-3 bg-primary-50 hover:bg-primary-200 text-primary-800 font-medium  shadow-md border border-primary-300 transition-all duration-300 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-secondary-100"
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
