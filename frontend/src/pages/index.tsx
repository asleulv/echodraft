import { useState } from "react";
import Layout from "@/components/Layout";
import Link from "next/link";
import Head from "next/head";
import {
  Text,
  Share2,
  UserCheck,
  ShieldCheck,
  MousePointerClick,
  Rocket,
  Archive,
  Tag,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import WorkFlowDiagram from "@/components/icons/WorkFlowDiagram";
import EchopenIcon from "@/components/icons/EchopenIcon";
import ScreenshotShowcase from "@/components/ScreenshotShowcase";

// FAQ Item Component
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-primary-50 rounded-lg shadow-md overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 text-left flex justify-between items-center focus:outline-none"
        aria-expanded={isOpen}
      >
        <h3 className="text-xl font-semibold text-primary-600">{question}</h3>
        <span className="text-primary-500 ml-2">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </span>
      </button>

      {isOpen && (
        <div className="px-6 pb-6">
          <p className="text-primary-500">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Layout title="AI Content Generator">
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
                "echodraft turns your best posts into reusable, on-brand content using AI — so you never start from scratch again.",
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
          content="AI content generator, content repurposing, AI writing assistant, content creation tool, brand consistency, AI writing tool"
        />
      </Head>
      <div className="min-h-screen">
        {/* Hero Section with integrated wave bottom */}
        <section
          aria-labelledby="hero-heading"
          className="relative bg-gradient-to-br from-primary-50 via-primary-100 to-secondary-100 pb-16 md:pb-24"
        >
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-4xl mx-auto text-center">
              <h1
                id="hero-heading"
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight 
                          bg-clip-text text-transparent 
                          bg-gradient-to-r from-primary-400 to-primary-600
                          opacity-0 animate-fade-in"
              >
                Write it Once. Echo it Forever.
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

              <p className="text-xl md:text-2xl text-primary-600 dark:text-primary-500 mb-6 leading-relaxed">
                echodraft turns your best texts into reusable, on-brand content
                using AI — so you never start from scratch again.
              </p>
              <div className="mb-8">
                <EchopenIcon className="w-32 h-32 mx-auto text-secondary-500 dark:text-secondary-400" />
              </div>
              <Link
                href="#screenshots"
                className="inline-block px-8 py-4 bg-secondary-500 dark:bg-secondary-200 hover:bg-secondary-400 dark:hover:bg-secondary-400 text-primary-50 font-medium text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                See How It Works
              </Link>
            </div>
          </div>

          {/* Integrated wave at bottom of hero section */}
          <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
            <svg
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
              className="w-full h-[60px] rotate-180"
            >
              <path
                d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                className="fill-primary-50 dark:fill-primary-50"
              ></path>
            </svg>
          </div>
        </section>

        {/* Diagram Section */}
        <section
          aria-labelledby="workflow-heading"
          className="bg-primary-50 py-16"
        >
          <div className="container mx-auto px-4 text-center">
            <h2
              id="workflow-heading"
              className="text-3xl font-bold text-primary-500 mb-8"
            >
              Replicate What Works
            </h2>
            <div className="max-w-4xl mx-auto text-secondary-400">
              <WorkFlowDiagram className="mx-auto" />
            </div>
            <p className="text-lg text-primary-600 mt-8 max-w-2xl mx-auto">
              We use AI to analyze successful past content and then generate new
              content in the same style, tone, and feel, ensuring consistency
              and relevance.{" "}
            </p>
          </div>
        </section>

        {/* What Echodraft Does Section */}
        <section
          aria-labelledby="features-heading"
          className="bg-gradient-to-b from-primary-100 via-primary-50 to-primary-100 py-16"
        >
          <div className="container mx-auto px-4">
            <h2
              id="features-heading"
              className="text-3xl font-bold text-center text-primary-500 mb-12"
            >
              echodraft in three steps
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4 sm:px-0">
              <div className="relative bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl shadow-lg p-6 sm:p-8 transform transition-all duration-300 hover:scale-105 mx-auto sm:mx-0 max-w-md w-full">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 sm:-top-5 bg-secondary-400 text-primary-200 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-lg sm:text-xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-semibold text-primary-600 mb-4 mt-2">
                  Save & Organize
                </h3>
                <p className="text-primary-500">
                  Easily archive your past posts. Tag them with custom labels to
                  keep things tidy and searchable.
                </p>
              </div>

              <div className="relative bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl shadow-lg p-6 sm:p-8 transform transition-all duration-300 hover:scale-105 mx-auto sm:mx-0 max-w-md w-full">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 sm:-top-5 bg-secondary-400 text-primary-200 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-lg sm:text-xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-semibold text-primary-600 mb-4 mt-2">
                  Analyze Your Writing
                </h3>
                <p className="text-primary-500">
                  Pick up to three posts for AI to analyze. It studies your
                  tone, style, and voice to understand how you write.
                </p>
              </div>

              <div className="relative bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl shadow-lg p-6 sm:p-8 transform transition-all duration-300 hover:scale-105 mx-auto sm:mx-0 max-w-md w-full">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 sm:-top-5 bg-secondary-400 text-primary-200 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-lg sm:text-xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-semibold text-primary-600 mb-4 mt-2">
                  Generate New Content
                </h3>
                <p className="text-primary-500">
                  Get fresh content written in your exact style. Just choose a
                  topic, and you're done — ready to post anywhere.
                </p>
              </div>
            </div>

            <div className="mt-16 px-4 sm:px-6 lg:px-8">
              <div className="bg-gradient-to-r from-primary-100 to-primary-200 rounded-4xl shadow-sm p-6 sm:p-8 text-center max-w-3xl mx-auto">
                <p className="text-3xl sm:text-4xl font-semibold text-primary-600 leading-snug">
                  <span className="block mb-2 text-secondary-500 text-base uppercase tracking-wide font-bold">
                    In short
                  </span>
                  echodraft analyzes your best texts or sources of inspiration
                  and uses AI to create new content that matches your unique
                  style, tone, and emotion.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Screenshot Showcase Section */}
        <section
          id="screenshots"
          aria-label="Product Screenshots"
          className="pt-0"
        >
          <ScreenshotShowcase />
        </section>

        {/* FAQ Section */}
        <section aria-labelledby="faq-heading" className="bg-primary-100 py-16">
          <div className="container mx-auto px-4">
            <h2
              id="faq-heading"
              className="text-3xl font-bold text-center text-primary-500 mb-12"
            >
              Obvious Questions
            </h2>

            <div className="max-w-3xl mx-auto">
              <div className="space-y-4">
                <FaqItem
                  question="How does echodraft work?"
                  answer="echodraft uses AI to analyze your existing content, learn your unique writing style, tone, and voice, and then generate new content that matches your brand identity. Simply upload your best posts, let our AI analyze them, and then generate fresh content on any topic."
                />

                <FaqItem
                  question="Okay, but what do I actually *do* with echodraft?"
                  answer="Start by pasting in a couple of texts you love — these can be blog posts, social content, or anything that captures your tone. Organize them into categories, and even tag them if you like. Then, to see the magic: click 'Generate with AI', enter your new topic, and choose which of your uploaded texts should guide the tone. The result? New content that sounds just like you."
                />

                <FaqItem
                  question="Is echodraft free to use?"
                  answer="Yes! You can sign up for a free account that includes 3 AI text generations per month. For more frequent content creation, we offer affordable subscription plans with additional features."
                />

                <FaqItem
                  question="What types of content can I create with echodraft?"
                  answer="You can use echodraft to generate social media posts, blog intros, email copy, ad text, and short-form written content. It's especially useful for any writing that benefits from a consistent tone or brand voice. Just provide a few examples, and echodraft helps you create new content in that same style."
                />

                <FaqItem
                  question="How accurate is the AI at matching my writing style?"
                  answer="While we can't guarantee a perfect match every time, the AI models we integrate with are designed to recognize patterns in tone, style, and voice based on the examples you provide. As the name suggests — think of each AI-generated piece as a strong first draft. You're always in control, and we're constantly working to improve how well the system captures your unique voice."
                />
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section
          aria-labelledby="use-cases-heading"
          className="bg-primary-50 py-16"
        >
          <div className="container mx-auto px-4">
            <h2
              id="use-cases-heading"
              className="text-3xl font-bold text-center text-primary-500 mb-12"
            >
              How You Can Use echodraft
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="bg-white dark:bg-primary-50 rounded-lg shadow-md p-6 transform transition-all duration-300 hover:scale-105">
                <h3 className="text-xl font-semibold text-primary-600 mb-3">
                  Content Creators
                </h3>
                <p className="text-primary-500">
                  Maintain a consistent voice across all your platforms while
                  scaling your content production. Create variations of your
                  best-performing content to maximize engagement.
                </p>
              </div>

              <div className="bg-white dark:bg-primary-50 rounded-lg shadow-md p-6 transform transition-all duration-300 hover:scale-105">
                <h3 className="text-xl font-semibold text-primary-600 mb-3">
                  Small Businesses
                </h3>
                <p className="text-primary-500">
                  Keep your brand messaging consistent across all customer
                  touchpoints. Create on-brand content quickly without hiring
                  additional writers or spending hours crafting each message.
                </p>
              </div>

              <div className="bg-white dark:bg-primary-50 rounded-lg shadow-md p-6 transform transition-all duration-300 hover:scale-105">
                <h3 className="text-xl font-semibold text-primary-600 mb-3">
                  Marketing Teams
                </h3>
                <p className="text-primary-500">
                  Streamline your content creation process and ensure brand
                  consistency across campaigns. Quickly generate variations of
                  successful content for A/B testing.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section
          aria-labelledby="cta-heading"
          className="bg-gradient-to-b from-secondary-100 to-primary-50 py-16"
        >
          <div className="container mx-auto px-4 text-center">
            <h2
              id="cta-heading"
              className="text-3xl font-bold text-secondary-700 mb-6 flex items-center justify-center gap-2"
            >
              <Rocket className="w-10 h-10 text-secondary-700" />
              Ready to find your voice?
            </h2>
            <p className="text-xl text-primary-700 mb-8 max-w-2xl mx-auto">
              Try echodraft free — sign up and get access to all features plus 3
              AI text generations each month to start creating content right
              away.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="px-8 py-3 bg-secondary-500 hover:bg-secondary-600 text-primary-50 font-medium rounded-lg shadow-md transition-all duration-300"
              >
                Create Free Account
              </Link>
              <Link
                href="/login"
                className="px-8 py-3 bg-primary-50 hover:bg-primary-100 text-primary-800 font-medium rounded-lg shadow-md border border-primary-300 transition-all duration-300"
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
