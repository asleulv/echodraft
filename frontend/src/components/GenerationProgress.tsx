import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export type GenerationStage = 
  | 'analyzing' 
  | 'processing' 
  | 'generating' 
  | 'formatting';

interface GenerationProgressProps {
  stage: GenerationStage;
  documentLength: string;
}

const stageMessages = {
  analyzing: 'Analyzing selected documents and filters...',
  processing: 'Processing reference content...',
  generating: 'Generating document with AI...',
  formatting: 'Formatting and saving document...'
};

const stageDescriptions = {
  analyzing: 'Filtering documents based on your criteria',
  processing: 'Preparing content for the AI model',
  generating: 'Creating new content with GPT-4',
  formatting: 'Applying HTML formatting and saving'
};

// Estimated times in seconds for each stage based on document length
const estimatedTimes: Record<string, Record<GenerationStage, number>> = {
  micro: {
    analyzing: 1,
    processing: 2,
    generating: 5,
    formatting: 1
  },
  very_short: {
    analyzing: 1,
    processing: 2,
    generating: 10,
    formatting: 1
  },
  short: {
    analyzing: 2,
    processing: 3,
    generating: 15,
    formatting: 2
  },
  medium: {
    analyzing: 2,
    processing: 4,
    generating: 25,
    formatting: 2
  },
  long: {
    analyzing: 3,
    processing: 5,
    generating: 40,
    formatting: 3
  },
  very_long: {
    analyzing: 3,
    processing: 6,
    generating: 60,
    formatting: 3
  }
};

const GenerationProgress: React.FC<GenerationProgressProps> = ({ stage, documentLength }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTotal, setEstimatedTotal] = useState(0);
  
  // Reset elapsed time when stage changes
  useEffect(() => {
    setElapsedTime(0);
    
    // Calculate estimated total time for all stages
    const length = documentLength || 'medium';
    const times = estimatedTimes[length];
    const total = Object.values(times).reduce((sum, time) => sum + time, 0);
    setEstimatedTotal(total);
    
    // Start timer
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [stage, documentLength]);
  
  // Calculate progress for current stage
  const getStageProgress = () => {
    const length = documentLength || 'medium';
    const stageTime = estimatedTimes[length][stage];
    return Math.min(100, (elapsedTime / stageTime) * 100);
  };
  
  // Calculate overall progress
  const getOverallProgress = () => {
    const length = documentLength || 'medium';
    const times = estimatedTimes[length];
    
    // Sum up times for completed stages
    let completedTime = 0;
    const stages: GenerationStage[] = ['analyzing', 'processing', 'generating', 'formatting'];
    const currentStageIndex = stages.indexOf(stage);
    
    for (let i = 0; i < currentStageIndex; i++) {
      completedTime += times[stages[i]];
    }
    
    // Add progress from current stage
    const currentStageProgress = Math.min(elapsedTime, times[stage]);
    const totalProgress = completedTime + currentStageProgress;
    
    return Math.min(100, (totalProgress / estimatedTotal) * 100);
  };
  
  return (
    <div className="bg-white dark:bg-primary-100 border border-primary-200 dark:border-primary-300 rounded-md p-6 mb-6 generation-progress-container">
      <div className="flex items-center mb-4">
        <Loader2 className="h-6 w-6 mr-3 text-primary-500 animate-spin" />
        <h2 className="text-xl font-semibold text-primary-700 dark:text-primary-300">
          {stageMessages[stage]}
        </h2>
      </div>
      
      <p className="text-primary-600 dark:text-primary-400 mb-4">
        {stageDescriptions[stage]}
      </p>
      
      {/* Overall progress bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-1">
          <span className="text-sm text-primary-500">Overall Progress</span>
          <span className="text-sm text-primary-500">{Math.round(getOverallProgress())}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div 
            className="bg-primary-500 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
            style={{ width: `${getOverallProgress()}%` }}
          ></div>
        </div>
      </div>
      
      {/* Current stage progress bar */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-sm text-primary-500">Current Stage</span>
          <span className="text-sm text-primary-500">{Math.round(getStageProgress())}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div 
            className="bg-primary-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
            style={{ width: `${getStageProgress()}%` }}
          ></div>
        </div>
      </div>
      
      {/* Elapsed time */}
      <div className="mt-4 text-sm text-primary-500 text-right">
        Time elapsed: {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
      </div>
    </div>
  );
};

export default GenerationProgress;
