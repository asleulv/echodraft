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
            
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.7; }
            }

            /* Much lighter backgrounds for light mode */
            .workflow-diagram {
              /* Success colors (teal) - VERY light backgrounds */
              --success-bg: #ffffff;          /* Pure white background */
              --success-border: #14b8a6;      /* Teal-500 */
              --success-header: #14b8a6;      /* Teal-500 */
              
              /* Failure colors (gray) - VERY light backgrounds */
              --failure-bg: #ffffff;          /* Pure white background */
              --failure-border: #6b7280;      /* Gray-500 */
              --failure-header: #6b7280;      /* Gray-500 */
              
              /* Other colors */
              --content-lines: #f3f4f6;       /* Very light gray lines */
              --ai-color: #14b8a6;            /* Teal for AI */
              --arrow-color: #374151;         /* Dark gray for arrow */
            }

            /* Dark mode overrides */
            @media (prefers-color-scheme: dark) {
              .workflow-diagram {
                --success-bg: #064e3b;        /* Dark teal background */
                --success-border: #14b8a6;    /* Keep teal border */
                --success-header: #14b8a6;    /* Keep teal header */
                --failure-bg: #1f2937;        /* Dark gray background */
                --failure-border: #9ca3af;    /* Light gray border */
                --failure-header: #9ca3af;    /* Light gray header */
                --content-lines: #4b5563;     /* Medium gray lines */
                --ai-color: #14b8a6;          /* Keep teal AI */
                --arrow-color: #d1d5db;       /* Light gray arrow */
              }
            }

            /* Support for explicit dark mode class */
            .dark .workflow-diagram {
              --success-bg: #064e3b !important;
              --success-border: #14b8a6 !important;
              --success-header: #14b8a6 !important;
              --failure-bg: #1f2937 !important;
              --failure-border: #9ca3af !important;
              --failure-header: #9ca3af !important;
              --content-lines: #4b5563 !important;
              --ai-color: #14b8a6 !important;
              --arrow-color: #d1d5db !important;
            }

            /* Explicit success background class for light mode */
            .success-doc-bg {
              fill: #ffffff; /* Pure white - very light */
            }

            /* Explicit failure background class for light mode */
            .failure-doc-bg {
              fill: #ffffff; /* Pure white - very light */
            }

            /* Dark mode overrides */
            @media (prefers-color-scheme: dark) {
              .success-doc-bg {
                fill: #064e3b;
              }
              .failure-doc-bg {
                fill: #1f2937;
              }
            }

            .dark .success-doc-bg {
              fill: #064e3b !important;
            }

            .dark .failure-doc-bg {
              fill: #1f2937 !important;
            }
            
            .doc { opacity: 0; }
            
            .animate .doc-fail-1 { animation: fadeIn 0.5s ease forwards 0.2s, fadeOut 0.5s ease forwards 1.8s; }
            .animate .doc-success-1 { animation: fadeIn 0.5s ease forwards 0.4s, moveToAI 1s ease forwards 2s; }
            .animate .doc-fail-2 { animation: fadeIn 0.5s ease forwards 0.6s, fadeOut 0.5s ease forwards 2.2s; }
            
            .animate .ai { opacity: 0; animation: scaleIn 0.8s ease forwards 1.2s, pulse 2s infinite 1.5s; }
            
            .animate .new-doc { opacity: 0; animation: scaleIn 0.8s ease forwards 2.6s; }
            .animate .new-doc-check { stroke-dasharray: 100; stroke-dashoffset: 100; animation: drawCheck 0.6s ease forwards 3s; }
            
            .animate .arrow { opacity: 0; animation: fadeIn 0.5s ease forwards 2.4s; }
            
            .no-animate .doc, .no-animate .ai, .no-animate .new-doc, .no-animate .arrow { opacity: 0; }
          `}
        </style>
      </defs>

      <g className={`${animationClass} workflow-diagram`}>
        {/* Left column - Documents: top and bottom are failures, middle is success */}
        <g>
          {/* Top Doc - Failure */}
          <g className="doc doc-fail-1">
            <rect
              x="80"
              y="40"
              width="160"
              height="120"
              rx="6"
              className="failure-doc-bg"
              stroke="var(--failure-border)"
              strokeWidth="2"
            />
            <rect x="80" y="40" width="160" height="24" rx="6" fill="var(--failure-header)" />
            <text x="90" y="57" fontSize="14" fill="white" fontWeight="bold">
              FAILURE
            </text>
            <line x1="100" y1="80" x2="220" y2="80" stroke="var(--content-lines)" strokeWidth="1" />
            <line x1="100" y1="100" x2="220" y2="100" stroke="var(--content-lines)" strokeWidth="1" />
            <line x1="100" y1="120" x2="220" y2="120" stroke="var(--content-lines)" strokeWidth="1" />
            <line x1="100" y1="140" x2="180" y2="140" stroke="var(--content-lines)" strokeWidth="1" />
            <circle cx="210" cy="130" r="12" fill="var(--failure-border)" />
            <path d="M204 124 l12 12 M204 136 l12 -12" stroke="white" strokeWidth="2" />
          </g>

          {/* Middle Doc - Success */}
          <g className="doc doc-success-1">
            <rect
              x="80"
              y="180"
              width="160"
              height="120"
              rx="6"
              className="success-doc-bg"
              stroke="var(--success-border)"
              strokeWidth="2"
            />
            <rect x="80" y="180" width="160" height="24" rx="6" fill="var(--success-header)" />
            <text x="90" y="197" fontSize="14" fill="white" fontWeight="bold">
              SUCCESS
            </text>
            <line x1="100" y1="220" x2="220" y2="220" stroke="var(--content-lines)" strokeWidth="1" />
            <line x1="100" y1="240" x2="220" y2="240" stroke="var(--content-lines)" strokeWidth="1" />
            <line x1="100" y1="260" x2="220" y2="260" stroke="var(--content-lines)" strokeWidth="1" />
            <line x1="100" y1="280" x2="180" y2="280" stroke="var(--content-lines)" strokeWidth="1" />
            <circle cx="210" cy="270" r="12" fill="var(--success-border)" />
            <path d="M204 270 l4 4 l8 -8" stroke="white" strokeWidth="2" fill="none" />
          </g>

          {/* Bottom Doc - Failure */}
          <g className="doc doc-fail-2">
            <rect
              x="80"
              y="320"
              width="160"
              height="120"
              rx="6"
              className="failure-doc-bg"
              stroke="var(--failure-border)"
              strokeWidth="2"
            />
            <rect x="80" y="320" width="160" height="24" rx="6" fill="var(--failure-header)" />
            <text x="90" y="337" fontSize="14" fill="white" fontWeight="bold">
              FAILURE
            </text>
            <line x1="100" y1="360" x2="220" y2="360" stroke="var(--content-lines)" strokeWidth="1" />
            <line x1="100" y1="380" x2="220" y2="380" stroke="var(--content-lines)" strokeWidth="1" />
            <line x1="100" y1="400" x2="220" y2="400" stroke="var(--content-lines)" strokeWidth="1" />
            <line x1="100" y1="420" x2="180" y2="420" stroke="var(--content-lines)" strokeWidth="1" />
            <circle cx="210" cy="410" r="12" fill="var(--failure-border)" />
            <path d="M204 404 l12 12 M204 416 l12 -12" stroke="white" strokeWidth="2" />
          </g>
        </g>

        {/* AI in the center */}
        <g className="ai">
          <circle
            cx="500"
            cy="240"
            r="60"
            fill="none"
            stroke="var(--ai-color)"
            strokeWidth={4}
          />
          <text
            x="500"
            y="248"
            textAnchor="middle"
            fill="var(--ai-color)"
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
            stroke="var(--arrow-color)"
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
            className="success-doc-bg"
            stroke="var(--success-border)"
            strokeWidth="3"
          />
          <rect x="600" y="140" width="180" height="30" rx="8" fill="var(--success-header)" />
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
          <line x1="620" y1="190" x2="760" y2="190" stroke="var(--content-lines)" strokeWidth="1" />
          <line x1="620" y1="210" x2="760" y2="210" stroke="var(--content-lines)" strokeWidth="1" />
          <line x1="620" y1="230" x2="760" y2="230" stroke="var(--content-lines)" strokeWidth="1" />
          <line x1="620" y1="250" x2="760" y2="250" stroke="var(--content-lines)" strokeWidth="1" />
          <line x1="620" y1="270" x2="760" y2="270" stroke="var(--content-lines)" strokeWidth="1" />
          <line x1="620" y1="290" x2="740" y2="290" stroke="var(--content-lines)" strokeWidth="1" />
          <line x1="620" y1="310" x2="740" y2="310" stroke="var(--content-lines)" strokeWidth="1" />
          <path
            className="new-doc-check"
            d="M670 270 l20 20 l40 -40"
            stroke="var(--success-border)"
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
