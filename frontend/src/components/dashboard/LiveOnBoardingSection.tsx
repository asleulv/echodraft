// components/dashboard/LiveOnboardingSection.tsx
import React, { useState } from "react";
import { useRouter } from "next/router";
import { Briefcase, Coffee, Tv, Zap, ArrowRight } from "lucide-react";

interface LiveOnboardingSectionProps {
  onDismiss: () => void;
}

interface StyleGuide {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  example: string;
  fullContent: string;
  bgGradient: string;
  accentColor: string;
  platformStyle: string;
}

const LiveOnboardingSection: React.FC<LiveOnboardingSectionProps> = ({
  onDismiss,
}) => {
  const [step, setStep] = useState(1);
  const [selectedStyle, setSelectedStyle] = useState<StyleGuide | null>(null);
  const [userPrompt, setUserPrompt] = useState("");
  const [previewingStyle, setPreviewingStyle] = useState<StyleGuide | null>(
    null
  );
  const [hoveredStyle, setHoveredStyle] = useState<string | null>(null);
  const router = useRouter();

  const styleGuides: StyleGuide[] = [
    {
      id: "linkedin_productivity",
      title: "LinkedIn Pro",
      description: "Professional wisdom that gets engagement",
      icon: (
        <Briefcase className="w-10 h-10 text-secondary-600 dark:text-secondary-400" />
      ),
      example: "Focus on what matters most...",
      bgGradient:
        "from-secondary-500 via-secondary-600 to-secondary-700 dark:from-primary-400 dark:via-primary-500 dark:to-primary-600",
      accentColor: "secondary-500",
      platformStyle: "linkedin",
      fullContent: `In today's fast-moving world, productivity isn't about doing more, it's about focusing on doing the right things. Too many of us mix up being busy for being effective. The key is building systems that reduce decision fatigue. For me that means blocking mornings for deep work and pushing meetings to afternoons. It's simple, but the difference is huge.

Here's a challenge... tomorrow, write down your top three priorities before checking email. Then reflect on how you feel at the end of the work day. Chances are you'll find yourself calmer and clearer about what truly matters. You might learn a lot!

Productivity hacks are everywhere, but lasting success comes from small and consistent habits. Focus, clarity, and discipline aren't buzzwords, they're the foundation of progress. What's your go-to habit for staying on track? Do you use an app or a reminder tool?`,
    },
    {
      id: "satirical_toast",
      title: "Sharp Wit",
      description: "Comedy gold that makes people think",
      icon: (
        <Coffee className="w-10 h-10 text-secondary-600 dark:text-success-400" />
      ),
      example: "Toast. The culinary equivalent of a participation trophy...",
      bgGradient:
        "from-success-400 via-success-500 to-success-600 dark:from-success-400 dark:via-success-300 dark:to-success-200",
      accentColor: "success-500",
      platformStyle: "blog",
      fullContent: `Toast. The culinary equivalent of a participation trophy. A slice of bread that went to charm school and came back crunchy, smug, and somehow overpriced. People act like it's the pinnacle of human achievement (butter! jam! avocado!) as if we've discovered a way to turn cardboard into art. Spoiler alert: we haven't.

Cafés now serve "artisanal toast" on wooden planks like it's the Mona Lisa of breakfast. They call it rustic. I call it financial terrorism. And sourdough? Right... sourdough. The bread that's aged like a fine wine but chews like a medieval boot. Seemingly, the older it is, the more "character" it has. Meanwhile, I'm getting grumpy... and even more hungry.

Here's a revolutionary thought: breakfast doesn't need an Instagram account. Blueberries in perfect triangles? Optional. Pancakes stacked like the Leaning Tower of Pisa? Unnecessary. Sometimes cereal in pajamas is all the philosophy you need.

Toast isn't a lifestyle. It's a minor sunburn for bread. Stop pretending it's enlightenment.`,
    },
    {
      id: "facebook_streaming_rant",
      title: "Viral Rant",
      description: "Passionate posts that get shared everywhere",
      icon: (
        <Tv className="w-10 h-10 text-secondary-600 dark:text-danger-400" />
      ),
      example: "Can we PLEASE talk about streaming services? 📺💸",
      bgGradient:
        "from-danger-400 via-danger-500 to-danger-600 dark:from-red-600 dark:via-red-500 dark:to-red-400",
      accentColor: "danger-500",
      platformStyle: "social",
      fullContent: `Okay but can we PLEASE talk about how I need like 47 different streaming services just to watch my shows? 📺💸 #StreamingStruggles #ModernProblems

Netflix has Stranger Things but then cancels everything else after one season 🙄 Disney+ has Marvel but costs extra for the good stuff 🦸‍♀️💰 HBO Max (sorry, "Max" 🤡) has the prestige dramas but changes its name every five minutes #ConfusionMaximized

And don't even get me STARTED on Peacock having The Office 😤 Like sir, that used to be FREE on Netflix and now you want me to pay $12.99/month to watch Jim prank Dwight? The audacity! 🏢📋 #TheOffice #StreamingScam

Me trying to remember which platform has which show: 🤯🔄 Also me: *pirates everything anyway* 🏴‍☠️ (JK Netflix lawyers, I would never 👀💅) #StreamingLife #DigitalNomad #BrokeMillennial

Anyway, time to spend 45 minutes scrolling through all my apps to find something to watch 📱⏰ Will probably end up rewatching The Office on Peacock because I'm predictable like that 🤷‍♀️ #StreamingParalysis #BasicMillennial`,
    },
  ];

  const handleGenerate = () => {
    router.push({
      pathname: "/documents/generate",
      query: {
        concept: userPrompt,
        demo_style_slug: selectedStyle?.id,
      },
    });
  };

  const StylePreviewModal = ({
    style,
    onClose,
  }: {
    style: StyleGuide;
    onClose: () => void;
  }) => (
    <div className="fixed inset-0 bg-primary-900 dark:bg-primary-50 bg-opacity-60 dark:bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-primary-50 dark:bg-primary-200 rounded-2xl max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300">
        <div
          className={`sticky top-0 bg-gradient-to-r ${style.bgGradient} p-6 flex justify-between items-center rounded-t-2xl`}
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary-50 bg-opacity-20 backdrop-blur rounded-full">
              {style.icon}
            </div>
            <div>
              <h3 className="text-xl font-bold text-primary-50 dark:text-primary-800">
                {style.title}
              </h3>
              <p className="text-primary-100 dark:text-primary-700 text-sm">
                {style.description}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-primary-100 dark:text-primary-700 hover:text-primary-50 dark:hover:text-primary-900 transition-colors p-2 hover:bg-primary-50 hover:bg-opacity-20 rounded-lg"
            aria-label="Close preview"
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

        <div className="p-6">
          <div className="prose prose-lg max-w-none">
            {style.fullContent.split("\n").map((paragraph, index) => (
              <p
                key={index}
                className="mb-4 text-primary-700 dark:text-primary-700 leading-relaxed"
              >
                {paragraph}
              </p>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-primary-200 dark:border-primary-400">
            <button
              onClick={() => {
                setSelectedStyle(style);
                setStep(2);
                onClose();
              }}
              className={`w-full px-6 py-4 bg-gradient-to-r ${style.bgGradient} text-primary-50 dark:text-primary-800 rounded-xl hover:shadow-lg hover:brightness-110 transition-all duration-200 font-semibold text-lg flex items-center justify-center space-x-2`}
            >
              <Zap className="w-5 h-5" />
              <span>Choose This Voice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-primary-25 to-secondary-50 dark:from-primary-100 dark:via-primary-200 dark:to-primary-300 border-2 border-secondary-200 dark:border-primary-400 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl">
      {/* Animated background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-secondary-200 to-success-200 dark:from-primary-400 dark:to-primary-500 rounded-full opacity-20 dark:opacity-10 -translate-y-32 translate-x-32 animate-pulse"></div>
      <div
        className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-secondary-200 to-secondary-300 dark:from-primary-400 dark:to-primary-500 rounded-full opacity-20 dark:opacity-10 translate-y-24 -translate-x-24 animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>

      {/* Header with dismiss button */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div className="flex-1">
          <div className="flex flex-col items-center mb-6 pb-2">
            <h2 className="text-3xl sm:text-4xl font-bold leading-relaxed bg-gradient-to-r from-secondary-600 via-secondary-700 to-secondary-800 dark:from-primary-700 dark:via-primary-800 dark:to-primary-900 bg-clip-text text-transparent text-center relative pb-1">
              Before we start... let us go for a test drive!
            </h2>
            <p className="text-primary-600 dark:text-primary-700 text-center mt-3 text-lg font-medium">
              This is just a quick style showcase... once you start using
              echodraft, YOUR texts will be the style inspiration!
            </p>
          </div>
        </div>

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="order-first md:order-last self-end md:self-start text-primary-400 dark:text-primary-600 hover:text-primary-600 dark:hover:text-primary-800 transition-colors p-2 hover:bg-primary-100 dark:hover:bg-primary-300 rounded-lg"
          aria-label="Dismiss live demo section"
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

      {/* Simple progress indicators - now full width centered */}
      <div className="relative z-10 flex items-center justify-center mb-8">
        <div className="flex space-x-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                step >= i
                  ? "bg-secondary-500 dark:bg-secondary-400 shadow-lg"
                  : "bg-primary-300 dark:bg-primary-500"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="relative z-10 max-w-5xl mx-auto">
        {step === 1 && (
          <div>
            <h3 className="text-2xl font-bold text-center mb-3 text-secondary-700 dark:text-primary-800">
              Which voice speaks to you?
            </h3>
            <p className="text-center text-primary-600 dark:text-primary-700 mb-8 text-lg">
              Pick a style and see the transformation happen instantly
            </p>

            {/* Dynamic grid layout with new hover effects */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-8">
              {styleGuides.map((style, index) => (
                <div
                  key={style.id}
                  onClick={() => setPreviewingStyle(style)}
                  onMouseEnter={() => setHoveredStyle(style.id)}
                  onMouseLeave={() => setHoveredStyle(null)}
                  className={`group relative overflow-hidden cursor-pointer transform transition-all duration-300 hover:shadow-2xl hover:brightness-105 ${
                    selectedStyle?.id === style.id
                      ? "ring-4 ring-secondary-300 dark:ring-secondary-400 shadow-2xl"
                      : "hover:shadow-xl"
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Card background with gradient */}
                  <div
                    className={`bg-gradient-to-br ${style.bgGradient} p-6 h-full min-h-[320px] flex flex-col relative overflow-hidden`}
                  >
                    {/* Animated background pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary-50 dark:bg-primary-800 transform translate-x-16 -translate-y-16 group-hover:translate-x-12 group-hover:-translate-y-12 transition-transform duration-700"></div>
                      <div
                        className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-primary-50 dark:bg-primary-800 transform -translate-x-12 translate-y-12 group-hover:-translate-x-6 group-hover:translate-y-6 transition-transform duration-700"
                        style={{ animationDelay: "200ms" }}
                      ></div>
                    </div>

                    {/* Icon and title */}
                    <div className="relative z-10 text-center mb-4">
                      <div className="inline-flex p-4 bg-primary-50 bg-opacity-20 backdrop-blur rounded-full mb-4 group-hover:bg-opacity-30 transition-all duration-300">
                        {style.icon}
                      </div>
                      <h4 className="text-xl font-bold text-primary-50 mb-2">
                        {style.title}
                      </h4>
                      <p className="text-primary-100 text-sm font-medium">
                        {style.description}
                      </p>
                    </div>

                    {/* Enhanced preview box */}
                    <div className="relative z-10 flex-1 flex items-end">
                      <div className="w-full bg-primary-50 bg-opacity-90 backdrop-blur p-4 border border-primary-50 border-opacity-30 group-hover:bg-opacity-100 transition-all duration-300">
                        <div className="flex items-start space-x-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-current opacity-60"></div>
                          <div className="w-2 h-2 rounded-full bg-current opacity-40"></div>
                          <div className="w-2 h-2 rounded-full bg-current opacity-20"></div>
                        </div>
                        <p className="text-primary-800 text-sm font-medium leading-relaxed line-clamp-3">
                          "{style.example}"
                        </p>

                        {hoveredStyle === style.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/30 dark:bg-black/30 backdrop-blur-sm animate-in fade-in duration-200 z-20">
                            <span className="text-priary-600 text-xl tracking-wide">
                              Preview Style
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selection indicator */}
                    {selectedStyle?.id === style.id && (
                      <div className="absolute top-4 right-4 bg-success-500 dark:bg-success-500 text-primary-50 dark:text-primary-900 rounded-full p-2 animate-in zoom-in duration-200">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={() => setStep(2)}
                disabled={!selectedStyle}
                className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center space-x-3 mx-auto ${
                  selectedStyle
                    ? "bg-gradient-to-r from-secondary-600 to-secondary-700 dark:from-secondary-400 dark:to-secondary-500 text-primary-50 dark:text-primary-900 hover:from-secondary-700 hover:to-secondary-800 dark:hover:from-secondary-500 dark:hover:to-secondary-600 hover:shadow-xl hover:brightness-110"
                    : "bg-primary-300 dark:bg-primary-500 text-primary-500 dark:text-primary-700 cursor-not-allowed"
                }`}
              >
                <Zap className="w-5 h-5" />
                <span>
                  {selectedStyle
                    ? `Continue with ${selectedStyle.title}`
                    : "Choose your voice first"}
                </span>
                {selectedStyle && <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-1">
              <h3 className="text-2xl font-bold mb-3 text-secondary-700 dark:text-primary-800">
                What should we write about?
              </h3>
              <p className="text-primary-600 dark:text-primary-700 text-lg">
                Type a topic below, and we will draft it in your chosen style:
              </p>
            </div>

            {/* Selected style summary - enhanced */}
            <div
              className={`mb-8 p-6 bg-gradient-to-r ${selectedStyle?.bgGradient} shadow-lg`}
            >
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-primary-50 bg-opacity-20 backdrop-blur rounded-xl mr-4">
                  {selectedStyle?.icon}
                </div>
                <div className="text-center">
                  <span className="text-xl font-bold text-primary-50 dark:text-primary-900 block">
                    {selectedStyle?.title} Style
                  </span>
                  <span className="text-primary-100 dark:text-primary-800 text-sm">
                    {selectedStyle?.description}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPreviewingStyle(selectedStyle)}
                className="text-primary-100 dark:text-primary-800 hover:text-primary-50 dark:hover:text-primary-900 text-sm font-medium underline block mx-auto transition-colors flex items-center space-x-1"
              >
                <span>Review full example</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Enhanced textarea */}
            <div className="relative mb-8">
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Enter your topic... (e.g., 'morning routines for busy professionals', 'why pineapple on pizza is controversial', 'the future of remote work')"
                className="w-full p-6 border-2 bg-white dark:bg-primary-200 text-primary-700 dark:text-primary-800 border-primary-200 dark:border-primary-400 h-32 resize-none focus:border-secondary-400 dark:focus:border-secondary-500 focus:ring-4 focus:ring-secondary-100 dark:focus:ring-secondary-500/20 transition-all duration-200 text-lg placeholder-primary-400 dark:placeholder-primary-600"
              />
              <div className="absolute bottom-3 right-3 text-primary-400 dark:text-primary-600 text-sm">
                {userPrompt.trim().length}/500
              </div>
            </div>

            <div className="flex space-x-4 justify-center">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border-2 border-primary-300 dark:border-primary-500 text-primary-700 dark:text-primary-800 hover:bg-primary-100 dark:hover:bg-primary-300 transition-all duration-200 font-semibold flex items-center space-x-2"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                <span>Back</span>
              </button>

              <button
                onClick={handleGenerate}
                disabled={!userPrompt.trim()}
                className={`px-8 py-3 font-bold text-lg transition-all duration-300 flex items-center space-x-3 ${
                  userPrompt.trim()
                    ? "bg-gradient-to-r from-secondary-600 to-secondary-700 dark:from-secondary-400 dark:to-secondary-500 text-primary-50 dark:text-primary-900 hover:from-secondary-700 hover:to-secondary-800 dark:hover:from-secondary-500 dark:hover:to-secondary-600 hover:shadow-xl hover:brightness-110"
                    : "bg-primary-300 dark:bg-primary-500 text-primary-500 dark:text-primary-700 cursor-not-allowed"
                }`}
              >
                <Zap className="w-5 h-5" />
                <span>Generate text</span>
                {userPrompt.trim() && <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Style Preview Modal */}
      {previewingStyle && (
        <StylePreviewModal
          style={previewingStyle}
          onClose={() => setPreviewingStyle(null)}
        />
      )}
    </div>
  );
};

export default LiveOnboardingSection;
