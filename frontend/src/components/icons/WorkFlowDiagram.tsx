import React, { useEffect, useState, useRef } from "react";

interface WorkFlowDiagramProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  [key: string]: any;
}

export default function WorkFlowDiagram({ 
  width,
  height,
  className,
  ...otherProps
}: WorkFlowDiagramProps) {
  const [isVisible, setIsVisible] = useState(false);
  const diagramRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          if (diagramRef.current) {
            observer.unobserve(diagramRef.current);
          }
        }
      },
      { threshold: 0.2 }
    );

    if (diagramRef.current) {
      observer.observe(diagramRef.current);
    }

    return () => {
      if (diagramRef.current) {
        observer.unobserve(diagramRef.current);
      }
    };
  }, []);

  const animationClass = isVisible ? "animate" : "no-animate";

  return (
    <div className="w-full flex justify-center py-8">
      <svg
        ref={diagramRef}
        width={width || "100%"}
        height={height || "100%"}
        viewBox="0 0 900 220"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
        className={`${className} max-w-5xl`}
        style={{ maxWidth: "100%", maxHeight: "100%" }}
        {...otherProps}
      >
        <defs>
          <style>
            {`
              @keyframes slideInLeft {
                from { opacity: 0; transform: translateX(-30px); }
                to { opacity: 1; transform: translateX(0); }
              }
              
              @keyframes slideInCenter {
                from { opacity: 0; transform: scale(0.8); }
                to { opacity: 1; transform: scale(1); }
              }
              
              @keyframes slideInRight {
                from { opacity: 0; transform: translateX(30px); }
                to { opacity: 1; transform: translateX(0); }
              }
              
              @keyframes drawArrow {
                from { stroke-dashoffset: 100; opacity: 0; }
                to { stroke-dashoffset: 0; opacity: 1; }
              }

              .elegant-workflow .step-1 { animation: slideInLeft 0.8s ease-out forwards; animation-delay: 0.3s; opacity: 0; }
              .elegant-workflow .step-2 { animation: slideInCenter 0.8s ease-out forwards; animation-delay: 0.6s; opacity: 0; }
              .elegant-workflow .step-3 { animation: slideInRight 0.8s ease-out forwards; animation-delay: 0.9s; opacity: 0; }
              .elegant-workflow .arrow { animation: drawArrow 1s ease-out forwards; animation-delay: 1.2s; opacity: 0; }
              
              .no-animate .step-1,
              .no-animate .step-2,
              .no-animate .step-3,
              .no-animate .arrow { opacity: 0; }
            `}
          </style>
          
          {/* Light mode gradient */}
          <linearGradient id="lightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#faf8f5" />
            <stop offset="100%" stopColor="#f5f1ec" />
          </linearGradient>
          
          {/* Dark mode gradient */}
          <linearGradient id="darkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1c1713" />
            <stop offset="100%" stopColor="#0f0d0a" />
          </linearGradient>
          
          {/* Drop shadow filter */}
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(44, 32, 24, 0.1)"/>
          </filter>
          
          {/* Arrow marker */}
          <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                  refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#8b7355" className="dark:fill-[#a8947d]" />
          </marker>
        </defs>

        <g className={`${animationClass} elegant-workflow`}>
          
          {/* Step 1: Your Content */}
          <g className="step-1">
            <rect x="50" y="50" width="180" height="120" rx="12" 
                  fill="#faf8f5" 
                  stroke="#8b7355" 
                  strokeWidth="2" 
                  filter="url(#softShadow)"
                  className="dark:fill-[#1c1713] dark:stroke-[#a8947d]"/>
            
            {/* Success indicator */}
            <circle cx="200" cy="80" r="16" 
                    fill="#127034ff" 
                    />
            <path d="M194 80 l4 4 l8 -8" 
                  stroke="white" 
                  strokeWidth="3" 
                  fill="none" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"/>
            
            <text x="140" y="125" textAnchor="middle" 
                  fill="#2c2018" 
                  fontSize="16" fontWeight="700" 
                  fontFamily="Lora, serif"
                  className="dark:fill-[#faf8f5]">
              Your Content
            </text>
            <text x="140" y="145" textAnchor="middle" 
                  fill="#8b7355" 
                  fontSize="12" 
                  className="dark:fill-[#a8947d]">
              What actually worked
            </text>
          </g>

          {/* Arrow 1 */}
          <g className="arrow">
            <path d="M240 110 L325 110" 
                  stroke="#8b7355" 
                  strokeWidth="3" 
                  fill="none" 
                  strokeDasharray="8,4"
                  strokeDashoffset="100"
                  markerEnd="url(#arrowhead)"
                  className="dark:stroke-[#a8947d]"/>
          </g>

          {/* Step 2: AI */}
          <g className="step-2">
            <circle cx="400" cy="110" r="60" 
                    fill="#faf8f5" 
                    stroke="#8b7355" 
                    strokeWidth="3" 
                    filter="url(#softShadow)"
                    className="dark:fill-[#1c1713] dark:stroke-[#a8947d]"/>
            
            <text x="400" y="120" textAnchor="middle" 
                  fill="#8b7355" 
                  fontSize="24" fontWeight="800" 
                  fontFamily="Lora, serif"
                  className="dark:fill-[#a8947d]">
              AI
            </text>
            <text x="400" y="190" textAnchor="middle" 
                  fill="#2c2018" 
                  fontSize="12" fontWeight="500"
                  className="dark:fill-[#faf8f5]">
              Learns your style
            </text>
          </g>

          {/* Arrow 2 */}
          <g className="arrow">
            <path d="M470 110 L570 110" 
                  stroke="#8b7355" 
                  strokeWidth="3" 
                  fill="none" 
                  strokeDasharray="8,4"
                  strokeDashoffset="100"
                  markerEnd="url(#arrowhead)"
                  className="dark:stroke-[#a8947d]"/>
          </g>

          {/* Step 3: New Content */}
          <g className="step-3">
            <rect x="590" y="50" width="180" height="120" rx="12" 
                  fill="#faf8f5" 
                  stroke="#8b7355" 
                  strokeWidth="3" 
                  filter="url(#softShadow)"
                  className="dark:fill-[#1c1713] dark:stroke-[#a8947d]"/>
            
            {/* Success indicator */}
            <circle cx="740" cy="80" r="16" 
                    fill="#127034ff" 
                    />
            <path d="M734 80 l4 4 l8 -8" 
                  stroke="white" 
                  strokeWidth="3" 
                  fill="none" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"/>
            
            <text x="680" y="125" textAnchor="middle" 
                  fill="#2c2018" 
                  fontSize="16" fontWeight="700" 
                  fontFamily="Lora, serif"
                  className="dark:fill-[#faf8f5]">
              New Content
            </text>
            <text x="680" y="145" textAnchor="middle" 
                  fill="#127034ff" 
                  fontSize="12" fontWeight="600"
                  className="dark:fill-[#4ade80]">
              Same winning style
            </text>
          </g>

        </g>
      </svg>
    </div>
  );
}
