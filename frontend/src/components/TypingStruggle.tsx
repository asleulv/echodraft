import React, { useState, useEffect } from 'react';

const TypingStruggle = () => {
  const strugglingPhrases = [
  "",  // Start completely blank
  "Um...",
  "So I need to write about...",
  "Actually, maybe I should...",
  "Wait, what was I going to say?",
  "This is harder than I thought...",
  "I hate blank pages..."
];
  
  const finalPhrase = "";
  
  const [displayText, setDisplayText] = useState('');
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    if (isComplete) return;
    
    const currentString = currentPhrase < strugglingPhrases.length 
      ? strugglingPhrases[currentPhrase] 
      : finalPhrase;
    
    const timeout = setTimeout(() => {
      if (isDeleting) {
        setDisplayText(currentString.substring(0, displayText.length - 1));
        
        if (displayText === '') {
          setIsDeleting(false);
          if (currentPhrase < strugglingPhrases.length) {
            setCurrentPhrase(currentPhrase + 1);
          }
        }
      } else {
        setDisplayText(currentString.substring(0, displayText.length + 1));
        
        if (displayText === currentString) {
          if (currentPhrase < strugglingPhrases.length) {
            // Pause then start deleting struggling phrases
            setTimeout(() => setIsDeleting(true), 1200);
          } else {
            // Keep final phrase
            setIsComplete(true);
          }
        }
      }
    }, isDeleting ? 75 : 120); // Slightly slower for more realistic hesitation
    
    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentPhrase, isComplete]);

  return (
    <div className="typing-container h-20 flex items-center justify-center mb-8">
      <div className="text-2xl md:text-3xl text-primary-800 font-mono">
        <span className="typing-line border-b-2 border-secondary-600 pb-1">
          {displayText}
          <span className="cursor ml-1 animate-pulse">
            <span className="bg-secondary-600 inline-block w-2 h-6"></span>
          </span>
        </span>
      </div>
    </div>
  );
};

export default TypingStruggle;
