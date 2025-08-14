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
    <div className="w-full flex justify-center py-8 px-4">
      <div className="w-full max-w-4xl">
        <svg
          ref={diagramRef}
          width="100%"
          height="100%"
          viewBox="0 0 500 300"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
          className={`${className} w-full h-auto`}
          {...otherProps}
        >
          <defs>
            <style>
              {`
                @keyframes fadeInUp {
                  from { opacity: 0; transform: translateY(20px); }
                  to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes fadeInScale {
                  from { opacity: 0; transform: scale(0.9); }
                  to { opacity: 1; transform: scale(1); }
                }
                
                @keyframes drawPath {
                  from { stroke-dashoffset: 50; opacity: 0; }
                  to { stroke-dashoffset: 0; opacity: 1; }
                }

                .modern-workflow .step-1 { animation: fadeInUp 0.6s ease-out forwards; animation-delay: 0.2s; opacity: 0; }
                .modern-workflow .step-2 { animation: fadeInScale 0.6s ease-out forwards; animation-delay: 0.5s; opacity: 0; }
                .modern-workflow .step-3 { animation: fadeInUp 0.6s ease-out forwards; animation-delay: 0.8s; opacity: 0; }
                .modern-workflow .connection { animation: drawPath 0.8s ease-out forwards; animation-delay: 1.1s; opacity: 0; }
                
                .no-animate .step-1,
                .no-animate .step-2,
                .no-animate .step-3,
                .no-animate .connection { opacity: 0; }

                @media (max-width: 640px) {
                  .step-text { font-size: 12px; }
                  .subtitle-text { font-size: 10px; }
                  .ai-text { font-size: 18px; }
                }
              `}
            </style>

            {/* Light mode gradients using your warm theme */}
            <linearGradient
              id="lightCardGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#faf8f5" />
              <stop offset="100%" stopColor="#f5f1ec" />
            </linearGradient>

            <linearGradient
              id="lightAiGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#8b7355" />
              <stop offset="100%" stopColor="#6f5a43" />
            </linearGradient>

            {/* Dark mode gradients using your dark theme */}
            <linearGradient
              id="darkCardGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#0a0a0a" />
              <stop offset="100%" stopColor="#141414" />
            </linearGradient>

            <linearGradient
              id="darkAiGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#737373" />
              <stop offset="100%" stopColor="#525252" />
            </linearGradient>

            {/* Modern shadow */}
            <filter
              id="modernShadow"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feDropShadow
                dx="0"
                dy="4"
                stdDeviation="8"
                floodColor="rgba(44, 32, 24, 0.15)"
              />
            </filter>

            <filter
              id="darkShadow"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feDropShadow
                dx="0"
                dy="4"
                stdDeviation="8"
                floodColor="rgba(0, 0, 0, 0.3)"
              />
            </filter>

            {/* Connection path markers */}
            <marker
              id="lightArrow"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M2,2 L2,6 L6,4 z" fill="#6b5b50" />
            </marker>

            <marker
              id="darkArrow"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M2,2 L2,6 L6,4 z" fill="#a3a3a3" />
            </marker>
          </defs>

          <g className={`${animationClass} modern-workflow`}>
            {/* Step 1: Your Content */}
            <g className="step-1">
              <rect
                x="50"
                y="50"
                width="120"
                height="80"
                rx="16"
                fill="url(#lightCardGradient)"
                stroke="#cbbba8"
                strokeWidth="1.5"
                filter="url(#modernShadow)"
                className="dark:fill-[url(#darkCardGradient)] dark:stroke-[#404040] dark:filter-[url(#darkShadow)]"
              />

              <circle
                cx="145"
                cy="70"
                r="8"
                fill="#449944"
                className="dark:fill-[#22c55e]"
              />
              <path
                d="M142 70 l2.5 2 l4 -4"
                stroke="white"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />

              <text
                x="110"
                y="95"
                textAnchor="middle"
                className="step-text"
                fill="#2c2018"
                fontSize="14"
                fontWeight="600"
                fontFamily="Inter, sans-serif"
              >
                <tspan className="dark:fill-white">Your Content</tspan>
              </text>
              <text
                x="110"
                y="115"
                textAnchor="middle"
                className="subtitle-text"
                fill="#6b5b50"
                fontSize="11"
              >
                <tspan className="dark:fill-[#d4d4d4]">What worked</tspan>
              </text>
            </g>

            {/* Connection 1 - Smooth curve matching the second line */}
            <g className="connection">
              <path
                d="M170 90 Q200 90 200 120 Q200 150 218 150"
                stroke="#6b5b50"
                strokeWidth="2"
                fill="none"
                strokeDasharray="6,3"
                strokeDashoffset="50"
                markerEnd="url(#lightArrow)"
                className="dark:stroke-[#a3a3a3] dark:marker-end-[url(#darkArrow)]"
              />
            </g>

            {/* Step 2: AI (Perfectly centered) */}
            <g className="step-2">
              <circle
                cx="250"
                cy="150"
                r="35"
                fill="url(#lightAiGradient)"
                filter="url(#modernShadow)"
                className="dark:fill-[url(#darkAiGradient)] dark:filter-[url(#darkShadow)]"
              />

              <text
                x="250"
                y="157"
                textAnchor="middle"
                className="ai-text"
                fill="#faf8f5"
                fontSize="20"
                fontWeight="700"
                fontFamily="Inter, sans-serif"
              >
                <tspan className="dark:fill-white">AI</tspan>
              </text>
              <text
                x="250"
                y="200"
                textAnchor="middle"
                className="subtitle-text"
                fill="#6b5b50"
                fontSize="11"
              >
                <tspan className="dark:fill-[#d4d4d4]">Learns your style</tspan>
              </text>
            </g>

            {/* Connection 2 - Symmetric curve going up then down (mirror of first) */}
            <g className="connection">
              <path
                d="M285 150 Q300 150 300 130 Q300 90 330 90"
                stroke="#6b5b50"
                strokeWidth="2"
                fill="none"
                strokeDasharray="6,3"
                strokeDashoffset="50"
                markerEnd="url(#lightArrow)"
                className="dark:stroke-[#a3a3a3] dark:marker-end-[url(#darkArrow)]"
              />
            </g>

            {/* Step 3: New Content */}
            <g className="step-3">
              <rect
                x="330"
                y="50"
                width="120"
                height="80"
                rx="16"
                fill="url(#lightCardGradient)"
                stroke="#449944"
                strokeWidth="2"
                filter="url(#modernShadow)"
                className="dark:fill-[url(#darkCardGradient)] dark:stroke-[#22c55e] dark:filter-[url(#darkShadow)]"
              />

              <circle
                cx="425"
                cy="70"
                r="8"
                fill="#449944"
                className="dark:fill-[#22c55e]"
              />
              <path
                d="M422 70 l2.5 2 l4 -4"
                stroke="white"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />

              <text
                x="390"
                y="95"
                textAnchor="middle"
                className="step-text"
                fill="#2c2018"
                fontSize="14"
                fontWeight="600"
                fontFamily="Inter, sans-serif"
              >
                <tspan className="dark:fill-white">New Content</tspan>
              </text>
              <text
                x="390"
                y="115"
                textAnchor="middle"
                className="subtitle-text"
                fill="#449944"
                fontSize="11"
                fontWeight="600"
              >
                <tspan className="dark:fill-[#22c55e]">Same style</tspan>
              </text>
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}
