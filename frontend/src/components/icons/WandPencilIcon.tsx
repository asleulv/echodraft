import React from "react";

export default function WandPencilIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      version="1.0"
      xmlns="http://www.w3.org/2000/svg"
      width="312pt"
      height="312pt"
      viewBox="0 0 312.000000 312.000000"
      preserveAspectRatio="xMidYMid meet"
      className={props.className}
      shapeRendering="auto"
      {...props}
    >
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop
            offset="0%"
            style={{ stopColor: "var(--tw-secondary-500)", stopOpacity: 1 }}
          />
          <stop
            offset="100%"
            style={{ stopColor: "var(--tw-secondary-300)", stopOpacity: 1 }}
          />
        </linearGradient>
      </defs>
      <g
        transform="translate(0.000000,312.000000) scale(0.100000,-0.100000)"
        fill="url(#gradient1)"
        stroke="none"
      >
        <path d="M1385 2949 c-602 -81 -1082 -534 -1202 -1136 -24 -122 -24 -394 0
        -516 58 -288 185 -526 391 -733 207 -206 445 -333 733 -391 122 -24 394 -24
        516 0 288 58 526 185 733 391 165 166 274 342 344 556 51 155 64 247 64 435 0
        188 -13 280 -64 435 -70 214 -179 390 -344 556 -206 205 -447 334 -728 389
        -99 20 -345 28 -443 14z m887 -467 c131 -44 218 -128 261 -252 22 -65 22 -70
        25 -797 l3 -733 -1001 0 -1001 0 3 732 c3 677 5 737 22 788 50 154 167 250
        339 279 29 5 329 8 667 7 608 -1 616 -2 682 -24z" />
        <path d="M930 2172 c-19 -9 -45 -32 -57 -51 -21 -30 -23 -46 -23 -147 l0 -114
        710 0 710 0 0 114 c0 101 -2 117 -23 147 -47 71 -24 69 -687 69 -547 0 -598
        -1 -630 -18z" />
        <path d="M850 1280 l0 -260 275 0 275 0 0 215 0 215 145 0 145 0 0 -215 0
        -215 290 0 290 0 0 260 0 260 -710 0 -710 0 0 -260z" />
      </g>
    </svg>
  );
}
