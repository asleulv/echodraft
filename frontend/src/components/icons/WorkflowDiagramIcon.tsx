import React from "react";
export default function WorkflowDiagramIcon(
  props: React.SVGProps<SVGSVGElement>
) {
  return (
    <svg
      width="100%"
      height="auto"
      viewBox="0 0 160 56"
      version="1.1"
      className={props.className}
      {...props}
    >
      <defs>
        <linearGradient id="successGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop
            offset="0%"
            stopColor="var(--tw-secondary-200)"
            stopOpacity="1"
          />
          <stop
            offset="100%"
            stopColor="var(--tw-secondary-400)"
            stopOpacity="1"
          />
        </linearGradient>
        <linearGradient id="neutralGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--tw-primary-200)" stopOpacity="1" />
          <stop
            offset="100%"
            stopColor="var(--tw-primary-200)"
            stopOpacity="1"
          />
        </linearGradient>
        <linearGradient id="failureGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--tw-primary-200)" stopOpacity="1" />
          <stop
            offset="100%"
            stopColor="var(--tw-primary-500)"
            stopOpacity="1"
          />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0.2"
            dy="0.4"
            stdDeviation="0.2"
            floodOpacity="0.2"
          />
        </filter>
      </defs>

      <g transform="translate(-10, -3.5)">
        {/* Workflow elements - rectangles with rounded corners */}
        <g>
          {/* Document base */}
          <rect
            x="16"
            y="21"
            width="12"
            height="16"
            rx="1"
            ry="1"
            style={{
              fill: "url(#failureGradient)",
              filter: "url(#shadow)",
            }}
          />

          {/* Folded corner at top-right */}
          <polygon
            points="28,21 24,21 28,25"
            style={{ fill: "var(--tw-primary-400)" }}
          />

          {/* "Text" lines */}
          <line
            x1="17.5"
            y1="24"
            x2="26.5"
            y2="24"
            stroke="var(--tw-primary-50)"
            strokeWidth="0.6"
          />
          <line
            x1="17.5"
            y1="26"
            x2="26.5"
            y2="26"
            stroke="var(--tw-primary-50)"
            strokeWidth="0.6"
          />
          <line
            x1="17.5"
            y1="28"
            x2="26.5"
            y2="28"
            stroke="var(--tw-primary-50)"
            strokeWidth="0.6"
          />
        </g>

        <g>
          {/* Document base for success */}
          <rect
            x="13.5"
            y="38.5"
            width="12"
            height="16"
            rx="1"
            ry="1"
            style={{
              fill: "url(#successGradient)",
              filter: "url(#shadow)",
            }}
          />
          {/* Folded corner for success */}
          <polygon
            points="25.5,38.5 21.5,38.5 25.5,42.5"
            style={{ fill: "var(--tw-secondary-100)" }}
          />
          {/* "Text" lines for success */}
          <line
            x1="14.5"
            y1="41"
            x2="24.5"
            y2="41"
            stroke="var(--tw-primary-50)"
            strokeWidth="0.6"
          />
          <line
            x1="14.5"
            y1="43"
            x2="24.5"
            y2="43"
            stroke="var(--tw-primary-50)"
            strokeWidth="0.6"
          />
          <line
            x1="14.5"
            y1="45"
            x2="24.5"
            y2="45"
            stroke="var(--tw-primary-50)"
            strokeWidth="0.6"
          />

          {/* Document base for neutral */}
          <rect
            x="27"
            y="38.7"
            width="12"
            height="16"
            rx="1"
            ry="1"
            style={{
              fill: "url(#failureGradient)",
              filter: "url(#shadow)",
            }}
          />
          {/* Folded corner for neutral */}
          <polygon
            points="39,38.7 35,38.7 39,42.7"
            style={{ fill: "var(--tw-primary-400)" }}
          />
          {/* "Text" lines for neutral */}
          <line
            x1="28.5"
            y1="41.7"
            x2="38.5"
            y2="41.7"
            stroke="var(--tw-primary-50)"
            strokeWidth="0.6"
          />
          <line
            x1="28.5"
            y1="43.7"
            x2="38.5"
            y2="43.7"
            stroke="var(--tw-primary-50)"
            strokeWidth="0.6"
          />
          <line
            x1="28.5"
            y1="45.7"
            x2="38.5"
            y2="45.7"
            stroke="var(--tw-primary-50)"
            strokeWidth="0.6"
          />

          {/* Document base for failure */}
          <rect
            x="40.5"
            y="38.7"
            width="11"
            height="16"
            rx="1"
            ry="1"
            style={{
              fill: "url(#failureGradient)",
              filter: "url(#shadow)",
            }}
          />
          {/* Folded corner for failure */}
          <polygon
            points="51.5,38.7 47.5,38.7 51.5,42.7"
            style={{ fill: "var(--tw-primary-400)" }}
          />
          {/* "Text" lines for failure */}
          <line
            x1="41.5"
            y1="41.7"
            x2="50.5"
            y2="41.7"
            stroke="var(--tw-primary-50)"
            strokeWidth="0.6"
          />
          <line
            x1="41.5"
            y1="43.7"
            x2="50.5"
            y2="43.7"
            stroke="var(--tw-primary-50)"
            strokeWidth="0.6"
          />
          <line
            x1="41.5"
            y1="45.7"
            x2="50.5"
            y2="45.7"
            stroke="var(--tw-primary-50)"
            strokeWidth="0.6"
          />

          {/* Document base for success (top-right) */}
          <rect
            x="29.5"
            y="21.5"
            width="12"
            height="16"
            rx="1"
            ry="1"
            style={{
              fill: "url(#successGradient)",
              filter: "url(#shadow)",
            }}
          />
          {/* Folded corner for success (top-right) */}
          <polygon
            points="41.5,21.5 37.5,21.5 41.5,25.5"
            style={{ fill: "var(--tw-secondary-100)" }}
          />
          {/* "Text" lines for success (top-right) */}
          <line
            x1="30.5"
            y1="24"
            x2="40.5"
            y2="24"
            stroke="var(--tw-primary-50)"
            strokeWidth="0.6"
          />
          <line
            x1="30.5"
            y1="26"
            x2="40.5"
            y2="26"
            stroke="var(--tw-primary-50)"
            strokeWidth="0.6"
          />
          <line
            x1="30.5"
            y1="28"
            x2="40.5"
            y2="28"
            stroke="var(--tw-primary-50)"
            strokeWidth="0.6"
          />

          {/* Document base for success (top-left) */}
          <rect
            x="23.5"
            y="4.8"
            width="11"
            height="15"
            rx="1"
            ry="1"
            style={{
              fill: "url(#successGradient)",
              filter: "url(#shadow)",
            }}
          />
          {/* Folded corner for success (top-left) */}
          <polygon
            points="34.5,4.8 30.5,4.8 34.5,8.8"
            style={{ fill: "var(--tw-secondary-100)" }}
          />
          {/* "Text" lines for success (top-left) */}
          <line
            x1="24.5"
            y1="7.8"
            x2="33.5"
            y2="7.8"
            stroke="var(--tw-primary-50)"
            strokeWidth="0.6"
          />
          <line
            x1="24.5"
            y1="9.8"
            x2="33.5"
            y2="9.8"
            stroke="var(--tw-primary-50)"
            strokeWidth="0.6"
          />
          <line
            x1="24.5"
            y1="11.8"
            x2="33.5"
            y2="11.8"
            stroke="var(--tw-primary-50)"
            strokeWidth="0.6"
          />
        </g>

        {/* Status indicators - using proper icons instead of emojis */}
        <circle cx="35.5" cy="29.5" r="3" fillOpacity="0.5"  fill="var(--tw-secondary-400)" />
        <path
          d="M34.5,29.5 l1,1 l2,-2"
          stroke="var(--tw-primary-900)"
          strokeWidth="0.75"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle cx="29" cy="12.5" r="3" fillOpacity="0.5"  fill="var(--tw-secondary-400)" />
        <path
          d="M28,12.5 l1,1 l2,-2"
          stroke="var(--tw-primary-900)"
          strokeWidth="0.75"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle cx="19.5" cy="46.5" r="3" fillOpacity="0.5" fill="var(--tw-secondary-400)" />
        <path
          d="M18.5,46.5 l1,1 l2,-2"
          stroke="var(--tw-primary-900)"
          strokeWidth="0.75"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle cx="45.5" cy="46.5" r="3" fillOpacity="0.5" fill="var(--tw-danger-400)" />
        <path
          d="M44.3,45.3 l2.5,2.5 M46.8,45.3 l-2.5,2.5"
          stroke="var(--tw-primary-900)"
          strokeWidth="0.75"
          strokeLinecap="round"
        />

        <circle cx="33" cy="46.5" r="3" fillOpacity="0.5" fill="var(--tw-danger-400)" />
        <path
          d="M31.8,45.3 l2.5,2.5 M34.3,45.3 l-2.5,2.5"
          stroke="var(--tw-primary-900)"
          strokeWidth="0.75"
          strokeLinecap="round"
        />

        <circle cx="22" cy="29.5" r="3" fillOpacity="0.5" fill="var(--tw-danger-400)" />
        <path
          d="M20.8,28.3 l2.5,2.5 M23.3,28.3 l-2.5,2.5"
          stroke="var(--tw-primary-900)"
          strokeWidth="0.75"
          strokeLinecap="round"
        />

        {/* Connecting paths - sleeker and with arrowheads */}

        <defs>
          <marker
            id="arrow"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M 0 0 L 6 3 L 0 6 Z" fill="var(--tw-secondary-400)" />
          </marker>
        </defs>

        <path
          d="M 41,32.8 Q 80,32 122,35"
          style={{
            fill: "none",
            stroke: "var(--tw-secondary-400)",
            strokeWidth: 0.8,
          }}
          markerEnd="url(#arrow)"
        />

        <path
          d="M 34.5,13.2 Q 78,10 122,27.2"
          style={{
            fill: "none",
            stroke: "var(--tw-secondary-400)",
            strokeWidth: 0.8,
          }}
          markerEnd="url(#arrow)"
        />

        <path
          d="M 25.3,52.8 Q 80,60 122,43.1"
          style={{
            fill: "none",
            stroke: "var(--tw-secondary-400)",
            strokeWidth: 0.8,
          }}
          markerEnd="url(#arrow)"
        />

        {/* Filter definition for the glow effect */}
        <defs>
          <filter id="glow" x="-100%" y="-100%" width="400%" height="400%">
            {/* Increased blur radius for better glow spread */}
            <feGaussianBlur stdDeviation="7" result="blur" />{" "}
            {/* Increased from 5 to 7 */}
            {/* Brighter color matrix with better contrast */}
            <feColorMatrix
              type="matrix"
              values="
      0 0 0 0 0 
      0 0 0 0 1    {/* Max intensity for clean glow */}
      0 0 0 0 1    {/* Max intensity */}
      0 0 0 1.5 0"
            />
            {/* Increased opacity multiplier */}
            {/* Blend operations */}
            <feComposite in2="blur" operator="in" />
            <feComposite in="SourceGraphic" />
            {/* Optional: Add a second subtle blur layer for glow depth */}
            <feGaussianBlur stdDeviation="3" result="blur2" />
            <feComposite
              in2="blur2"
              in="SourceGraphic"
              operator="over"
              result="final"
            />
          </filter>
        </defs>

        <g>
          {/* Document-like Result Box with Glow */}
          <rect
            style={{
              fill: "url(#successGradient)",
              filter: "url(#glow)", // Glow filter applied here
            }}
            width="30"
            height="36"
            x="132"
            y="13.6"
            rx="2" // Slightly rounded corners for the document look
            ry="2"
          />

          {/* Folded corner at the top-right (dogear) */}
          <polygon
            points="162,13.6 157,13.6 162,18.6"
            style={{ fill: "var(--tw-secondary-100)" }}
          />

          {/* Text lines, extended to the right edge */}
          <line
            x1="134.5"
            y1="18"
            x2="159"
            y2="18"
            stroke="var(--tw-primary-50)"
            strokeWidth="0.6"
          />
          <line
            x1="134.5"
            y1="20"
            x2="159"
            y2="20"
            stroke="var(--tw-primary-50)"
            strokeWidth="0.6"
          />
          <line
            x1="134.5"
            y1="22"
            x2="159"
            y2="22"
            stroke="var(--tw-primary-50)"
            strokeWidth="0.6"
          />
          <line
            x1="134.5"
            y1="24"
            x2="159"
            y2="24"
            stroke="var(--tw-primary-50)"
            strokeWidth="0.6"
          />
          <line
            x1="134.5"
            y1="26"
            x2="159"
            y2="26"
            stroke="var(--tw-primary-50)"
            strokeWidth="0.6"
          />

          {/* Professional icon inside the document */}
          <g transform="translate(144, 30)">
            <circle
              cx="2"
              cy="2"
              r="10"
              fill="var(--tw-secondary-600)"
              fillOpacity="0.6"
            />
            <path
              d="M-4,2 L0,6 L8,-2"
              stroke="var(--tw-primary-800)"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </g>
      </g>
    </svg>
  );
}
