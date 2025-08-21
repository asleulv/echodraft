// components/dashboard/LiveOnboardingSection.tsx
import React, { useState } from "react";
import { useRouter } from "next/router";
import { Briefcase, Coffee, Tv } from "lucide-react";

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
  const router = useRouter();

  // Reduced to 3 most impressive and diverse styles
  const styleGuides: StyleGuide[] = [
    {
      id: "linkedin_productivity",
      title: "LinkedIn Post",
      description: "Professional, actionable advice",
      icon: <Briefcase className="w-6 h-6 text-secondary-600" />,
      example: "Focus on what matters most...",
      fullContent: `In today's fast-moving world, productivity isn't about doing more, it's about focusing on doing the right things. Too many of us mix up being busy for being effective. The key is building systems that reduce decision fatigue. For me that means blocking mornings for deep work and pushing meetings to afternoons. It's simple, but the difference is huge.

Here's a challenge... tomorrow, write down your top three priorities before checking email. Then reflect on how you feel at the end of the work day. Chances are you'll find yourself calmer and clearer about what truly matters. You might learn a lot!

Productivity hacks are everywhere, but lasting success comes from small and consistent habits. Focus, clarity, and discipline aren't buzzwords, they're the foundation of progress. What's your go-to habit for staying on track? Do you use an app or a reminder tool?`,
    },
    {
      id: "satirical_toast",
      title: "Satirical Humor",
      description: "Witty, exaggerated, playful",
      icon: <Coffee className="w-6 h-6 text-secondary-600" />,
      example: "Toast. The culinary equivalent of a participation trophy...",
      fullContent: `Toast. The culinary equivalent of a participation trophy. A slice of bread that went to charm school and came back crunchy, smug, and somehow overpriced. People act like it's the pinnacle of human achievement (butter! jam! avocado!) as if we've discovered a way to turn cardboard into art. Spoiler alert: we haven't.

Cafés now serve "artisanal toast" on wooden planks like it's the Mona Lisa of breakfast. They call it rustic. I call it financial terrorism. And sourdough? Right... sourdough. The bread that's aged like a fine wine but chews like a medieval boot. Seemingly, the older it is, the more "character" it has. Meanwhile, I'm getting grumpy... and even more hungry.

Here's a revolutionary thought: breakfast doesn't need an Instagram account. Blueberries in perfect triangles? Optional. Pancakes stacked like the Leaning Tower of Pisa? Unnecessary. Sometimes cereal in pajamas is all the philosophy you need.

Toast isn't a lifestyle. It's a minor sunburn for bread. Stop pretending it's enlightenment.`,
    },
    {
      id: "facebook_streaming_rant",
      title: "Social Media Rant",
      description: "Passionate, hashtag-heavy",
      icon: <Tv className="w-6 h-6 text-secondary-600" />,
      example: "Can we PLEASE talk about streaming services? 📺💸",
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-primary-50 rounded-lg max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-primary-100 border-b p-4 flex justify-between items-center">
          <div className="flex flex-col items-center p-4 border rounded-lg hover:shadow-md cursor-pointer">
            <div className="mb-2 flex justify-center">{style.icon}</div>
            <h3 className="text-sm font-semibold text-center">{style.title}</h3>
            <p className="text-xs text-secondary-600 text-center">
              {style.description}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-secondary-600 transition-colors"
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
          <div className="prose prose-sm max-w-none">
            {style.fullContent.split("\n").map((paragraph, index) => (
              <p
                key={index}
                className="mb-4 text-secondary-800 leading-relaxed"
              >
                {paragraph}
              </p>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t">
            <button
              onClick={() => {
                setSelectedStyle(style);
                setStep(2);
                onClose();
              }}
              className="w-full px-4 py-2 bg-secondary-600 text-primary-50 rounded-lg hover:bg-secondary-700 transition-colors"
            >
              Choose This Style
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-100 dark:to-primary-200 border border-primary-400 p-4 sm:p-6 mb-8">
      {/* Header with dismiss button */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div className="flex-1">
          <div className="flex flex-col items-center mb-4">
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-secondary-600 to-secondary-800 bg-clip-text text-transparent text-center">
              Now let's try!
            </h2>
            <p className="text-primary-700 text-center mt-2">
              See how echodraft mimics writing styles instantly
            </p>
          </div>

          {/* Progress indicators */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex space-x-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    step >= i ? "bg-secondary-500" : "bg-primary-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="order-first md:order-last self-end md:self-start text-primary-400 hover:text-primary-600 transition-colors p-1"
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

      {/* Step Content */}
      <div className="max-w-4xl mx-auto">
        {step === 1 && (
          <div>
            <h3 className="text-lg font-semibold text-center mb-2 text-secondary-700">
              Pick a Writing Style
            </h3>
            <p className="text-center text-primary-600 mb-6 text-sm">
              Choose one to see how EchoDraft transforms your ideas
            </p>

            {/* Simplified grid - 3 cards only */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {styleGuides.map((style) => (
                <div
                  key={style.id}
                  onClick={() => setPreviewingStyle(style)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md hover:border-secondary-400 ${
                    selectedStyle?.id === style.id
                      ? "border-secondary-500 bg-secondary-50 shadow-md"
                      : "border-primary-300"
                  }`}
                >
                  <div className="text-center">
                    <div className="flex justify-center mb-2">{style.icon}</div>
                    <h4 className="font-semibold text-secondary-700 mb-1">
                      {style.title}
                    </h4>
                    <p className="text-xs text-primary-600 mb-3">
                      {style.description}
                    </p>
                    <p className="text-xs text-primary-500 italic leading-relaxed">
                      "{style.example}"
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-6">
              <p className="text-xs text-primary-600 mb-4">
                Click any style above to preview and select
              </p>
              <button
                onClick={() => setStep(2)}
                disabled={!selectedStyle}
                className="px-6 py-3 bg-secondary-600 text-white rounded-lg disabled:bg-primary-300 disabled:cursor-not-allowed hover:bg-secondary-700 transition-colors"
              >
                {selectedStyle
                  ? `Continue with ${selectedStyle.title}`
                  : "Choose a style first"}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-lg mx-auto">
            <h3 className="text-lg font-semibold text-center mb-4 text-secondary-700">
              What Should We Write About?
            </h3>

            {/* Selected style summary */}
            <div className="mb-6 p-4 bg-secondary-50 rounded-lg border border-secondary-200">
              <div className="flex items-center justify-center mb-2">
                <span className="flex justify-center mr-2">{selectedStyle?.icon}</span>
                <span className="font-semibold text-secondary-700">
                  {selectedStyle?.title} Style
                </span>
              </div>
              <button
                onClick={() => setPreviewingStyle(selectedStyle)}
                className="text-xs text-secondary-600 hover:text-secondary-800 underline block mx-auto"
              >
                Review example
              </button>
            </div>

            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Enter your topic... (e.g., 'morning routines for busy professionals')"
              className="w-full p-4 border border-primary-300 rounded-lg h-24 resize-none focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500 mb-6"
            />

            <div className="flex space-x-4 justify-center">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-primary-300 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleGenerate}
                disabled={!userPrompt.trim()}
                className="px-6 py-2 bg-secondary-600 text-white rounded-lg disabled:bg-primary-300 disabled:cursor-not-allowed hover:bg-secondary-700 transition-colors"
              >
                Generate Sample
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
