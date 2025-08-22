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
    description: "Understanding the writing style and tone from your reference documents",
    icon: FileText,
    color: "text-primary-700",
    bgColor: "bg-primary-50",
    borderColor: "border-primary-200",
  },
  processing: {
    title: "Processing Content", 
    message: "Preparing the perfect writing recipe...",
    description: "Extracting key patterns and preparing AI prompts",
    icon: Brain,
    color: "text-primary-700",
    bgColor: "bg-primary-50", 
    borderColor: "border-primary-200",
  },
  generating: {
    title: "AI is Writing",
    message: "Creating your personalized content...",
    description: "Generating original text that matches your style and concept",
    icon: Sparkles,
    color: "text-primary-800",
    bgColor: "bg-primary-50",
    borderColor: "border-success-300",
  },
  formatting: {
    title: "Almost Ready!",
    message: "Polishing and formatting...", 
    description: "Applying final formatting touches",
    icon: Check,
    color: "text-success-700",
    bgColor: "bg-success-50",
    borderColor: "border-success-300",
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
    <div className={`relative ${currentConfig.bgColor} ${currentConfig.borderColor} border-2 p-8 mb-6 transition-all duration-500 shadow-xl overflow-hidden`}>
      {/* Animated background elements - subtle */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-4 right-4 w-32 h-32 bg-gradient-to-br from-success-200 to-primary-200 rounded-full animate-pulse"></div>
        <div className="absolute bottom-4 left-4 w-24 h-24 bg-gradient-to-tr from-primary-200 to-success-200 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header with animated icon */}
      <div className="relative z-10 flex flex-col items-center justify-center mb-8">
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-success-200 rounded-full opacity-30 animate-ping"></div>
            <div className="relative bg-secondary-200 p-4 rounded-full shadow-lg border border-primary-200">
              <CurrentIcon className={`h-12 w-12 ${currentConfig.color} animate-pulse`} />
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className={`text-3xl font-bold ${currentConfig.color} mb-3 leading-tight`}>
            {currentConfig.title}
          </h2>
          <p className={`text-lg ${currentConfig.color} opacity-80 max-w-md`}>
            {currentConfig.message}
          </p>
        </div>
      </div>

      {/* Fun description */}
      <div className="relative z-10 text-center mb-8">
        <p className={`text-base ${currentConfig.color} opacity-70 italic max-w-lg mx-auto`}>
          {currentConfig.description}
        </p>
      </div>

      {/* Stage indicators - FIXED CONTRAST */}
      <div className="relative z-10 flex justify-center mb-10">
        {Object.entries(stageConfig).map(([stageName, config], index) => {
          const StageIcon = config.icon;
          const isCompleted = completedStages.includes(stageName as GenerationStage);
          const isCurrent = stage === stageName;

          return (
            <div key={stageName} className="flex items-center">
              <div
                className={`
                  relative rounded-full p-3 transition-all duration-500 border-2
                  ${isCompleted ? "bg-success-500 border-success-500 shadow-md" : ""}
                  ${isCurrent ? "bg-white border-success-500 scale-110 shadow-lg ring-4 ring-success-200" : ""}
                  ${!isCompleted && !isCurrent ? "bg-primary-100 border-primary-300" : ""}
                `}
              >
                {isCompleted && (
                  <div className="absolute inset-0 bg-success-200 rounded-full opacity-40 animate-pulse"></div>
                )}
                <StageIcon
                  className={`relative h-5 w-5 z-10 ${
                    isCompleted ? "text-white" :
                    isCurrent ? "text-success-600" :  // FIXED: Changed from config.color to success-600
                    "text-primary-400"
                  }`}
                />
              </div>
              {index < Object.keys(stageConfig).length - 1 && (
                <div
                  className={`w-8 h-2 mx-3 rounded-full transition-all duration-500 ${
                    isCompleted ? "bg-success-400" : "bg-primary-300"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Enhanced progress bars with success colors */}
      <div className="relative z-10 space-y-6 bg-primary-100 rounded-xl p-6 border border-primary-200 shadow-inner">
        {/* Overall progress bar */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className={`text-lg font-semibold ${currentConfig.color}`}>
              Overall Progress
            </span>
            <span className={`text-xl font-bold text-success-600`}>
              {Math.round(getOverallProgress())}%
            </span>
          </div>
          <div className="w-full bg-primary-200 rounded-full h-5 shadow-inner overflow-hidden">
            <div
              className="h-5 rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-success-400 to-success-500 shadow-sm relative"
              style={{ width: `${getOverallProgress()}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/40"></div>
            </div>
          </div>
        </div>

        {/* Current stage progress */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className={`text-sm font-medium ${currentConfig.color} opacity-80`}>
              Current Stage Progress
            </span>
            <span className={`text-sm font-bold text-success-600`}>
              {Math.round(getStageProgress())}%
            </span>
          </div>
          <div className="w-full bg-primary-200 rounded-full h-4 shadow-inner overflow-hidden">
            <div
              className="h-4 rounded-full transition-all duration-500 ease-in-out bg-gradient-to-r from-success-300 to-success-400 relative"
              style={{ width: `${getStageProgress()}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/50"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Time and stats - cleaner layout */}
      <div className="relative z-10 flex justify-between items-center mt-8 pt-4 border-t border-primary-300">
        <div className={`text-sm ${currentConfig.color} opacity-80 font-medium`}>
          <span className="text-primary-500">Time elapsed:</span>{" "}
          <span className="text-success-600 font-semibold">{formatTime(elapsedTime)}</span>
        </div>
        <div className={`text-sm ${currentConfig.color} opacity-80 font-medium`}>
          <span className="text-primary-500">Est. remaining:</span>{" "}
          <span className="text-success-600 font-semibold">{formatTime(Math.max(0, estimatedTotal - elapsedTime))}</span>
        </div>
      </div>


      {stage === "analyzing" && (
        <div className="relative z-10 mt-6 text-center">
          <div className="flex items-center justify-center space-x-2 bg-white/80 rounded-lg p-3 border border-primary-200 shadow-sm">
            <BookOpen className="h-4 w-4 text-success-500 opacity-80 animate-pulse" />
            <span className="text-sm text-primary-700 opacity-80 italic animate-pulse font-medium">
              Reading through your style references...
            </span>
            <BookOpen className="h-4 w-4 text-success-500 opacity-80 animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerationProgress;
