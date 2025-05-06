import React from "react";

export default function NotFoundIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
      {...props}
    >
      <defs>
        <linearGradient id="notFoundGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop
            offset="0%"
            style={{ stopColor: "var(--tw-primary-500)", stopOpacity: 1 }}
          />
          <stop
            offset="100%"
            style={{ stopColor: "var(--tw-primary-300)", stopOpacity: 1 }}
          />
        </linearGradient>
      </defs>
      
      {/* Document with question mark */}
      <path 
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" 
        fill="none" 
        stroke="url(#notFoundGradient)" 
      />
      <path 
        d="M14 2v6h6" 
        fill="none" 
        stroke="url(#notFoundGradient)" 
      />
      <path 
        d="M12 18h.01" 
        fill="none" 
        stroke="url(#notFoundGradient)" 
        strokeWidth="2" 
      />
      <path 
        d="M12 14a2 2 0 0 0 .914-3.782 1.98 1.98 0 0 0-1.828 0A2 2 0 0 0 12 14z" 
        fill="none" 
        stroke="url(#notFoundGradient)" 
      />
      
      {/* Magnifying glass */}
      <circle 
        cx="18.5" 
        cy="17.5" 
        r="2.5" 
        fill="none" 
        stroke="url(#notFoundGradient)" 
      />
      <line 
        x1="21.5" 
        y1="20.5" 
        x2="23" 
        y2="22" 
        stroke="url(#notFoundGradient)" 
        strokeWidth="2" 
      />
      
      {/* X mark */}
      <line 
        x1="4" 
        y1="4" 
        x2="8" 
        y2="8" 
        stroke="url(#notFoundGradient)" 
        strokeWidth="1" 
      />
      <line 
        x1="8" 
        y1="4" 
        x2="4" 
        y2="8" 
        stroke="url(#notFoundGradient)" 
        strokeWidth="1" 
      />
    </svg>
  );
}
