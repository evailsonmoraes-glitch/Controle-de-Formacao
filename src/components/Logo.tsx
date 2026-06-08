import React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

export default function Logo({ size = 44, className, ...props }: LogoProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 200 200" 
      width={size} 
      height={size} 
      className={className}
      {...props}
    >
      <defs>
        {/* Soft, rich shadow to give the sticker a lifted 3D effect */}
        <filter id="sticker-lift-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="1.5" dy="3.5" stdDeviation="4.5" floodColor="#000000" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Wrapper group applying the drop shadow filter */}
      <g filter="url(#sticker-lift-shadow)">
        
        {/* ======================================================== */}
        {/* 1. SMALL TANGRAM (TOP LEFT) - WHITE STICKER BACKING     */}
        {/* ======================================================== */}
        <g stroke="#ffffff" strokeWidth="18" strokeLinejoin="round" strokeLinecap="round" fill="#ffffff">
          <rect x="25" y="25" width="22" height="22" />
          <polygon points="47,25 69,25 69,69 25,69 25,47 47,47" />
          <polygon points="69,25 91,36 69,47" />
          <polygon points="25,47 47,47 47,69" />
          <polygon points="47,69 69,69 69,91" />
        </g>

        {/* ======================================================== */}
        {/* 2. LARGE TANGRAM (BOTTOM RIGHT) - WHITE STICKER BACKING  */}
        {/* ======================================================== */}
        <g stroke="#ffffff" strokeWidth="18" strokeLinejoin="round" strokeLinecap="round" fill="#ffffff">
          <polygon points="110,80 110,120 70,120" />
          <rect x="145" y="80" width="40" height="40" />
          <polygon points="110,80 145,80 145,120 185,120 185,155 110,155" />
          <polygon points="70,155 110,155 110,195" />
          <polygon points="145,155 185,155 145,195" />
        </g>

        {/* ======================================================== */}
        {/* 3. SMALL TANGRAM (TOP LEFT) - COLORED SECTOR SHAPES      */}
        {/* ======================================================== */}
        <g stroke="#313131" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
          {/* Green square */}
          <rect x="25" y="25" width="22" height="22" fill="#4fae41" />
          {/* Orange body */}
          <polygon points="47,25 69,25 69,69 25,69 25,47 47,47" fill="#d98d36" />
          {/* Yellow right triangle */}
          <polygon points="69,25 91,36 69,47" fill="#fae71d" />
          {/* Red bottom-left triangle */}
          <polygon points="25,47 47,47 47,69" fill="#df201e" />
          {/* Blue bottom-right triangle */}
          <polygon points="47,69 69,69 69,91" fill="#244f9f" />
        </g>

        {/* ======================================================== */}
        {/* 4. LARGE TANGRAM (BOTTOM RIGHT) - COLORED SECTOR SHAPES  */}
        {/* ======================================================== */}
        <g stroke="#313131" strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round">
          {/* Yellow left triangle */}
          <polygon points="110,80 110,120 70,120" fill="#fae71d" />
          {/* Green square */}
          <rect x="145" y="80" width="40" height="40" fill="#4fae41" />
          {/* Orange body */}
          <polygon points="110,80 145,80 145,120 185,120 185,155 110,155" fill="#d98d36" />
          {/* Blue bottom-left triangle */}
          <polygon points="70,155 110,155 110,195" fill="#244f9f" />
          {/* Red bottom-right triangle */}
          <polygon points="145,155 185,155 145,195" fill="#df201e" />
        </g>

      </g>
    </svg>
  );
}
