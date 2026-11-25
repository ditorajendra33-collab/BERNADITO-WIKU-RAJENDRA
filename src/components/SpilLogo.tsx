export function SpilLogo({ className = 'w-11 h-9' }: { className?: string }) {
  return (
    <div className={`${className} rounded-lg bg-white flex items-center justify-center p-1 shrink-0`}>
      <svg
        viewBox="0 0 130 96"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Logo PT SPIL"
      >
        <g fill="none" stroke="#c91d2b" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="11" r="5" fill="#ffffff" strokeWidth="3.2" />
          <line x1="9" y1="16" x2="34" y2="92" strokeWidth="3" />
          <line x1="13" y1="15" x2="38" y2="91" strokeWidth="2.2" />
          <path
            d="M13 15 C 34 3, 56 20, 79 11 C 96 4, 110 8, 118 14 L 126 70 C 115 62, 100 58, 84 66 C 63 76, 44 58, 25 68 Z"
            fill="#ffffff"
            strokeWidth="3.2"
          />
          <path
            d="M16 21 C 35 10, 56 26, 79 17 C 95 11, 108 14, 115 19"
            strokeWidth="2.2"
          />
          <path
            d="M23 61 C 43 52, 62 69, 83 59 C 98 52, 112 56, 122 63"
            strokeWidth="2.2"
          />
          <path d="M117 65 L 121 75 L 126 70" fill="#ffffff" strokeWidth="2.4" />
        </g>
        <g transform="translate(69, 46) rotate(4)" fill="#c91d2b">
          <text
            x="0"
            y="0"
            textAnchor="middle"
            fontFamily="Plus Jakarta Sans, Arial, sans-serif"
            fontWeight="900"
            fontSize="31"
            letterSpacing="1.5"
          >
            SPIL
          </text>
        </g>
      </svg>
    </div>
  );
}
