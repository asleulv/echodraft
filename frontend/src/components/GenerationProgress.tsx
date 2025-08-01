import React, { useEffect, useState } from "react";
import { BookOpen, Brain, FileText, Sparkles, Check } from "lucide-react";

export type GenerationStage =
  | "analyzing"
  | "processing"
  | "generating"
  | "formatting";

interface GenerationProgressProps {
  stage: GenerationStage;
  documentLength: string;
}

const stageConfig = {
  analyzing: {
    title: "Analyzing Your Style Sources",
    message: "Reading through your selected documents...",
    description:
      "Understanding the writing style and tone from your reference documents",
    icon: FileText,
    color: "text-secondary-600",
    bgColor: "bg-secondary-100",
    barColor: "bg-secondary-500",
  },
  processing: {
    title: "Processing Content",
    message: "Preparing the perfect writing recipe...",
    description: "Extracting key patterns and preparing AI prompts",
    icon: Brain,
    color: "text-secondary-600",
    bgColor: "bg-secondary-200",
    barColor: "bg-secondary-600",
  },
  generating: {
    title: "AI is Writing",
    message: "Creating your personalized content...",
    description: "Generating original text that matches your style and concept",
    icon: Sparkles,
    color: "text-secondary-700",
    bgColor: "bg-secondary-300",
    barColor: "bg-secondary-700",
  },
  formatting: {
    title: "Almost Ready!",
    message: "Polishing and formatting...",
    description: "Applying final formatting touches",
    icon: Check,
    color: "text-primary-600",
    bgColor: "bg-primary-100",
    barColor: "bg-primary-600",
  },
};

// More engaging estimated times
const estimatedTimes: Record<string, Record<GenerationStage, number>> = {
  micro: { analyzing: 2, processing: 3, generating: 8, formatting: 2 },
  very_short: { analyzing: 2, processing: 3, generating: 12, formatting: 2 },
  short: { analyzing: 3, processing: 4, generating: 18, formatting: 3 },
  medium: { analyzing: 3, processing: 5, generating: 30, formatting: 3 },
  long: { analyzing: 4, processing: 6, generating: 45, formatting: 4 },
  very_long: { analyzing: 4, processing: 7, generating: 70, formatting: 4 },
};

const GenerationProgress: React.FC<GenerationProgressProps> = ({
  stage,
  documentLength,
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTotal, setEstimatedTotal] = useState(0);
  const [completedStages, setCompletedStages] = useState<GenerationStage[]>([]);

  const currentConfig = stageConfig[stage];
  const CurrentIcon = currentConfig.icon;

  useEffect(() => {
    setElapsedTime(0);

    // Calculate estimated total time for all stages
    const length = documentLength || "medium";
    const times = estimatedTimes[length];
    const total = Object.values(times).reduce((sum, time) => sum + time, 0);
    setEstimatedTotal(total);

    // Update completed stages
    const stages: GenerationStage[] = [
      "analyzing",
      "processing",
      "generating",
      "formatting",
    ];
    const currentIndex = stages.indexOf(stage);
    setCompletedStages(stages.slice(0, currentIndex));

    // Start timer
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, documentLength]);

  const getStageProgress = () => {
    const length = documentLength || "medium";
    const stageTime = estimatedTimes[length][stage];
    return Math.min(100, (elapsedTime / stageTime) * 100);
  };

  const getOverallProgress = () => {
    const length = documentLength || "medium";
    const times = estimatedTimes[length];

    let completedTime = 0;
    const stages: GenerationStage[] = [
      "analyzing",
      "processing",
      "generating",
      "formatting",
    ];
    const currentStageIndex = stages.indexOf(stage);

    for (let i = 0; i < currentStageIndex; i++) {
      completedTime += times[stages[i]];
    }

    const currentStageProgress = Math.min(elapsedTime, times[stage]);
    const totalProgress = completedTime + currentStageProgress;

    return Math.min(100, (totalProgress / estimatedTotal) * 100);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`border-4 rounded-xl p-8 mb-6 transition-all duration-500 ${currentConfig.bgColor} border-secondary-300 shadow-lg`}
    >
      {/* Header with animated icon */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          <CurrentIcon
            className={`h-12 w-12 mr-4 ${currentConfig.color} animate-pulse`}
          />
        </div>

        <div className="text-center">
          <h2 className={`text-3xl font-bold ${currentConfig.color} mb-2`}>
            {currentConfig.title}
          </h2>
          <p className={`text-lg ${currentConfig.color} opacity-80`}>
            {currentConfig.message}
          </p>
        </div>
      </div>

      {/* Fun description */}
      <div className="text-center mb-8">
        <p className={`text-base ${currentConfig.color} opacity-70 italic`}>
          {currentConfig.description}
        </p>
      </div>

      {/* Stage indicators */}
      <div className="flex justify-center mb-8">
        {Object.entries(stageConfig).map(([stageName, config], index) => {
          const StageIcon = config.icon;
          const isCompleted = completedStages.includes(
            stageName as GenerationStage
          );
          const isCurrent = stage === stageName;

          return (
            <div key={stageName} className="flex items-center">
              <div
                className={`
                rounded-full p-3 transition-all duration-300 border-2
                ${isCompleted ? "bg-secondary-200 border-secondary-400" : ""}
                ${
                  isCurrent
                    ? `${config.bgColor} ${config.color} border-secondary-400 scale-110`
                    : ""
                }
                ${
                  !isCompleted && !isCurrent
                    ? "bg-primary-100 border-primary-200"
                    : ""
                }
              `}
              >
                <StageIcon
                  className={`h-5 w-5 ${
                    isCompleted
                      ? "text-primary-600"
                      : isCurrent
                      ? config.color
                      : "text-secondary-400"
                  }`}
                />
              </div>
              {index < Object.keys(stageConfig).length - 1 && (
                <div
                  className={`w-8 h-1 mx-2 transition-all duration-300 ${
                    isCompleted ? "bg-primary-400" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Enhanced progress bars */}
      <div className="space-y-6">
        {/* Overall progress bar */}
        <div>
          <div className="flex justify-between mb-3">
            <span className={`text-lg font-semibold ${currentConfig.color}`}>
              Overall Progress
            </span>
            <span className={`text-lg font-bold ${currentConfig.color}`}>
              {Math.round(getOverallProgress())}%
            </span>
          </div>
          <div className="w-full bg-white/50 rounded-full h-4 shadow-inner">
            <div
              className={`h-4 rounded-full transition-all duration-500 ease-out shadow-sm ${currentConfig.barColor}`}
              style={{ width: `${getOverallProgress()}%` }}
            >
              <div className="h-full w-full rounded-full bg-gradient-to-r from-transparent to-white/20"></div>
            </div>
          </div>
        </div>

        {/* Current stage progress */}
        <div>
          <div className="flex justify-between mb-3">
            <span
              className={`text-sm font-medium ${currentConfig.color} opacity-80`}
            >
              Current Stage Progress
            </span>
            <span className={`text-sm font-semibold ${currentConfig.color}`}>
              {Math.round(getStageProgress())}%
            </span>
          </div>
          <div className="w-full bg-white/30 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ease-in-out ${currentConfig.barColor} opacity-80`}
              style={{ width: `${getStageProgress()}%` }}
            >
              <div className="h-full w-full rounded-full bg-gradient-to-r from-transparent to-white/30"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Time and fun facts */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-secondary-300/30">
        <div className={`text-sm ${currentConfig.color} opacity-70`}>
          <span className="font-medium">Time elapsed:</span>{" "}
          {formatTime(elapsedTime)}
        </div>
        <div className={`text-sm ${currentConfig.color} opacity-70`}>
          <span className="font-medium">Est. remaining:</span>{" "}
          {formatTime(Math.max(0, estimatedTotal - elapsedTime))}
        </div>
      </div>

      {/* Fun loading messages */}
      {stage === "generating" && (
        <div className="mt-4 text-center">
          <div className="flex items-center justify-center space-x-2">
            <Sparkles className="h-4 w-4 text-secondary-600 opacity-60 animate-pulse" />
            <span className="text-sm text-secondary-600 opacity-60 italic animate-pulse">
              The AI is putting pen to paper...
            </span>
          </div>
        </div>
      )}

      {stage === "analyzing" && (
        <div className="mt-4 text-center">
          <div className="flex items-center justify-center space-x-2">
            <BookOpen className="h-4 w-4 text-secondary-600 opacity-60 animate-pulse" />
            <span className="text-sm text-secondary-600 opacity-60 italic animate-pulse">
              Reading through your style references...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerationProgress;
