import React, { useEffect, useState, useRef } from "react";

interface WorkFlowDiagramProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  [key: string]: any; // For any other props
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
    // Create an Intersection Observer to detect when the diagram is visible
    const observer = new IntersectionObserver(
      (entries) => {
        // If the diagram is intersecting (visible), set isVisible to true
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          // Once we've seen it, no need to keep observing
          if (diagramRef.current) {
            observer.unobserve(diagramRef.current);
          }
        }
      },
      { threshold: 0.2 } // Trigger when at least 20% of the element is visible
    );

    // Start observing the diagram
    if (diagramRef.current) {
      observer.observe(diagramRef.current);
    }

    // Clean up the observer when component unmounts
    return () => {
      if (diagramRef.current) {
        observer.unobserve(diagramRef.current);
      }
    };
  }, []);

  // CSS classes with animation will only be applied when isVisible is true
  const animationClass = isVisible ? "animate" : "no-animate";

  return (
    <svg
      ref={diagramRef}
      width={width || "100%"}
      height={height || "100%"}
      viewBox="0 0 1024 600"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      style={{ maxWidth: "100%", maxHeight: "100%" }}
      {...otherProps}
    >
      <defs>
        <style>
          {`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            
            @keyframes scaleIn {
              from { transform: scale(0.5); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
            
            @keyframes moveToAI {
              0% { transform: translateX(0); }
              100% { transform: translateX(140px); }
            }
            
            @keyframes fadeOut {
              0% { opacity: 1; }
              100% { opacity: 0.3; }
            }
            
            @keyframes drawCheck {
              to { stroke-dashoffset: 0; }
            }
            

            
            .doc { opacity: 0; }
            
            .animate .doc-success-1 { animation: fadeIn 0.5s ease forwards 0.2s, moveToAI 1s ease forwards 1.8s; }
            .animate .doc-success-2 { animation: fadeIn 0.5s ease forwards 0.4s, moveToAI 1s ease forwards 2s; }
            .animate .doc-success-3 { animation: fadeIn 0.5s ease forwards 0.6s, moveToAI 1s ease forwards 2.2s; }
            
            .animate .doc-fail-1 { animation: fadeIn 0.5s ease forwards 0.3s, fadeOut 0.5s ease forwards 1.8s; }
            .animate .doc-fail-2 { animation: fadeIn 0.5s ease forwards 0.5s, fadeOut 0.5s ease forwards 2s; }
            
            .animate .ai { opacity: 0; animation: scaleIn 0.8s ease forwards 1.2s, pulse 2s infinite 1.5s; }
            
            .animate .new-doc { opacity: 0; animation: scaleIn 0.8s ease forwards 2.6s; }
            .animate .new-doc-check { stroke-dasharray: 100; stroke-dashoffset: 100; animation: drawCheck 0.6s ease forwards 3s; }
            
            .animate .arrow { opacity: 0; animation: fadeIn 0.5s ease forwards 2.4s; }
            
            .no-animate .doc, .no-animate .ai, .no-animate .new-doc, .no-animate .arrow { opacity: 0; }
          `}
        </style>
      </defs>

      {/* Wrapper with animation class */}
      <g className={animationClass}>
        {/* Left column - Successful documents */}
        <g>
        {/* Doc 1 - Success */}
        <g className="doc doc-success-1">
          <rect
            x="80"
            y="40"
            width="160"
            height="120"
            rx="6"
            fill="#E6FFFA"
            stroke="#38B2AC"
            strokeWidth="2"
          />
          <rect x="80" y="40" width="160" height="24" rx="6" fill="#38B2AC" />
          <text x="90" y="57" fontSize="14" fill="white" fontWeight="bold">
            SUCCESS
          </text>
          <line
            x1="100"
            y1="80"
            x2="220"
            y2="80"
            stroke="#E2E8F0"
            strokeWidth="1"
          />
          <line
            x1="100"
            y1="100"
            x2="220"
            y2="100"
            stroke="#E2E8F0"
            strokeWidth="1"
          />
          <line
            x1="100"
            y1="120"
            x2="220"
            y2="120"
            stroke="#E2E8F0"
            strokeWidth="1"
          />
          <line
            x1="100"
            y1="140"
            x2="180"
            y2="140"
            stroke="#E2E8F0"
            strokeWidth="1"
          />
          <circle cx="210" cy="130" r="12" fill="#38B2AC" />
          <path
            d="M204 130 l4 4 l8 -8"
            stroke="white"
            strokeWidth="2"
            fill="none"
          />
        </g>

        {/* Doc 2 - Success */}
        <g className="doc doc-success-2">
          <rect
            x="80"
            y="180"
            width="160"
            height="120"
            rx="6"
            fill="#E6FFFA"
            stroke="#38B2AC"
            strokeWidth="2"
          />
          <rect x="80" y="180" width="160" height="24" rx="6" fill="#38B2AC" />
          <text x="90" y="197" fontSize="14" fill="white" fontWeight="bold">
            SUCCESS
          </text>
          <line
            x1="100"
            y1="220"
            x2="220"
            y2="220"
            stroke="#E2E8F0"
            strokeWidth="1"
          />
          <line
            x1="100"
            y1="240"
            x2="220"
            y2="240"
            stroke="#E2E8F0"
            strokeWidth="1"
          />
          <line
            x1="100"
            y1="260"
            x2="220"
            y2="260"
            stroke="#E2E8F0"
            strokeWidth="1"
          />
          <line
            x1="100"
            y1="280"
            x2="180"
            y2="280"
            stroke="#E2E8F0"
            strokeWidth="1"
          />
          <circle cx="210" cy="270" r="12" fill="#38B2AC" />
          <path
            d="M204 270 l4 4 l8 -8"
            stroke="white"
            strokeWidth="2"
            fill="none"
          />
        </g>

        {/* Doc 3 - Success */}
        <g className="doc doc-success-3">
          <rect
            x="80"
            y="320"
            width="160"
            height="120"
            rx="6"
            fill="#E6FFFA"
            stroke="#38B2AC"
            strokeWidth="2"
          />
          <rect x="80" y="320" width="160" height="24" rx="6" fill="#38B2AC" />
          <text x="90" y="337" fontSize="14" fill="white" fontWeight="bold">
            SUCCESS
          </text>
          <line
            x1="100"
            y1="360"
            x2="220"
            y2="360"
            stroke="#E2E8F0"
            strokeWidth="1"
          />
          <line
            x1="100"
            y1="380"
            x2="220"
            y2="380"
            stroke="#E2E8F0"
            strokeWidth="1"
          />
          <line
            x1="100"
            y1="400"
            x2="220"
            y2="400"
            stroke="#E2E8F0"
            strokeWidth="1"
          />
          <line
            x1="100"
            y1="420"
            x2="180"
            y2="420"
            stroke="#E2E8F0"
            strokeWidth="1"
          />
          <circle cx="210" cy="410" r="12" fill="#38B2AC" />
          <path
            d="M204 410 l4 4 l8 -8"
            stroke="white"
            strokeWidth="2"
            fill="none"
          />
        </g>
        </g>

        {/* Right column - Failed documents */}
        <g>
        {/* Doc 1 - Fail */}
        <g className="doc doc-fail-1">
          <rect
            x="260"
            y="120"
            width="160"
            height="120"
            rx="6"
            fill="#FFF5F5"
            stroke="#FC8181"
            strokeWidth="2"
          />
          <rect x="260" y="120" width="160" height="24" rx="6" fill="#FC8181" />
          <text x="270" y="137" fontSize="14" fill="white" fontWeight="bold">
            FAILURE
          </text>
          <line
            x1="280"
            y1="160"
            x2="400"
            y2="160"
            stroke="#E2E8F0"
            strokeWidth="1"
          />
          <line
            x1="280"
            y1="180"
            x2="400"
            y2="180"
            stroke="#E2E8F0"
            strokeWidth="1"
          />
          <line
            x1="280"
            y1="200"
            x2="400"
            y2="200"
            stroke="#E2E8F0"
            strokeWidth="1"
          />
          <line
            x1="280"
            y1="220"
            x2="360"
            y2="220"
            stroke="#E2E8F0"
            strokeWidth="1"
          />
          <circle cx="390" cy="210" r="12" fill="#FC8181" />
          <path
            d="M384 204 l12 12 M384 216 l12 -12"
            stroke="white"
            strokeWidth="2"
          />
        </g>

        {/* Doc 2 - Fail */}
        <g className="doc doc-fail-2">
          <rect
            x="260"
            y="260"
            width="160"
            height="120"
            rx="6"
            fill="#FFF5F5"
            stroke="#FC8181"
            strokeWidth="2"
          />
          <rect x="260" y="260" width="160" height="24" rx="6" fill="#FC8181" />
          <text x="270" y="277" fontSize="14" fill="white" fontWeight="bold">
            FAILURE
          </text>
          <line
            x1="280"
            y1="300"
            x2="400"
            y2="300"
            stroke="#E2E8F0"
            strokeWidth="1"
          />
          <line
            x1="280"
            y1="320"
            x2="400"
            y2="320"
            stroke="#E2E8F0"
            strokeWidth="1"
          />
          <line
            x1="280"
            y1="340"
            x2="400"
            y2="340"
            stroke="#E2E8F0"
            strokeWidth="1"
          />
          <line
            x1="280"
            y1="360"
            x2="360"
            y2="360"
            stroke="#E2E8F0"
            strokeWidth="1"
          />
          <circle cx="390" cy="350" r="12" fill="#FC8181" />
          <path
            d="M384 344 l12 12 M384 356 l12 -12"
            stroke="white"
            strokeWidth="2"
          />
        </g>
        </g>

        {/* AI in the center */}
        <g className="ai">
        <circle
          cx="500"
          cy="240"
          r="60"
          fill="none"
          stroke="currentColor"
          strokeWidth={4}
        />
        <text
          x="500"
          y="248"
          textAnchor="middle"
          fill="currentColor"
          fontSize="26"
          fontWeight="600"
          fontFamily="Arial, sans-serif"
        >
          AI
        </text>
        </g>

        {/* Arrow to new document */}
        <g className="arrow">
        <path
          d="M560 240 L600 240"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
        />
        </g>

        <g className="new-doc">
  <rect
    x="600"
    y="140"
    width="180"
    height="200"
    rx="8"
    fill="#E6FFFA"
    stroke="#38B2AC"
    strokeWidth="3"
  />
  <rect x="600" y="140" width="180" height="30" rx="8" fill="#38B2AC" />
  <text
    x="691"
    y="160"
    fontSize="16"
    fill="white"
    fontWeight="bold"
    textAnchor="middle"
  >
    NEW SUCCESS
  </text>
  <line x1="620" y1="190" x2="760" y2="190" stroke="#E2E8F0" strokeWidth="1" />
  <line x1="620" y1="210" x2="760" y2="210" stroke="#E2E8F0" strokeWidth="1" />
  <line x1="620" y1="230" x2="760" y2="230" stroke="#E2E8F0" strokeWidth="1" />
  <line x1="620" y1="250" x2="760" y2="250" stroke="#E2E8F0" strokeWidth="1" />
  <line x1="620" y1="270" x2="760" y2="270" stroke="#E2E8F0" strokeWidth="1" />
  <line x1="620" y1="290" x2="740" y2="290" stroke="#E2E8F0" strokeWidth="1" />
  <line x1="620" y1="310" x2="740" y2="310" stroke="#E2E8F0" strokeWidth="1" />
  <path
    className="new-doc-check"
    d="M670 270 l20 20 l40 -40"
    stroke="#38B2AC"
    strokeWidth="8"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
        </g>
      </g>
    </svg>
  );
}
