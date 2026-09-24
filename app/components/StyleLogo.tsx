'use client';

/**
 * STYLE Barbershop SVG Logo
 * Inspired by the original logo: ornate frame with bearded face,
 * "STYLE" text in the center, decorative scrollwork
 */
export default function StyleLogo({
  size = 48,
  className = '',
  showText = false,
}: {
  size?: number;
  className?: string;
  showText?: boolean;
}) {
  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: showText ? 12 : 0,
        flexDirection: showText ? 'row' : 'column',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 0 12px rgba(201, 168, 76, 0.3))' }}
      >
        {/* Outer ornamental circle */}
        <circle
          cx="100"
          cy="100"
          r="92"
          stroke="url(#goldGradient)"
          strokeWidth="1.5"
          fill="none"
          opacity="0.4"
        />
        <circle
          cx="100"
          cy="100"
          r="86"
          stroke="url(#goldGradient)"
          strokeWidth="0.5"
          fill="none"
          opacity="0.2"
        />

        {/* Top ornament — concentric circles */}
        <circle cx="100" cy="38" r="12" stroke="url(#goldGradient)" strokeWidth="2" fill="none" />
        <circle cx="100" cy="38" r="7" stroke="url(#goldGradient)" strokeWidth="1.5" fill="none" />
        <circle cx="100" cy="38" r="3" fill="url(#goldGradient)" />

        {/* Vertical line from top ornament to banner */}
        <line x1="100" y1="50" x2="100" y2="62" stroke="url(#goldGradient)" strokeWidth="1.5" />

        {/* Decorative scrollwork — left */}
        <path
          d="M58 68 Q70 58 82 62 Q90 65 92 70"
          stroke="url(#goldGradient)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M58 68 Q55 64 58 60 Q62 55 68 58"
          stroke="url(#goldGradient)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Small diamond — left */}
        <path d="M76 62 L78 60 L80 62 L78 64 Z" fill="url(#goldGradient)" opacity="0.6" />

        {/* Decorative scrollwork — right */}
        <path
          d="M142 68 Q130 58 118 62 Q110 65 108 70"
          stroke="url(#goldGradient)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M142 68 Q145 64 142 60 Q138 55 132 58"
          stroke="url(#goldGradient)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Small diamond — right */}
        <path d="M120 62 L122 60 L124 62 L122 64 Z" fill="url(#goldGradient)" opacity="0.6" />

        {/* Banner / Name plate */}
        <rect x="52" y="72" width="96" height="36" rx="2" stroke="url(#goldGradient)" strokeWidth="2" fill="rgba(201, 168, 76, 0.05)" />
        <line x1="52" y1="76" x2="148" y2="76" stroke="url(#goldGradient)" strokeWidth="0.5" opacity="0.3" />
        <line x1="52" y1="104" x2="148" y2="104" stroke="url(#goldGradient)" strokeWidth="0.5" opacity="0.3" />

        {/* STYLE text */}
        <text
          x="100"
          y="96"
          textAnchor="middle"
          fontFamily="serif"
          fontSize="24"
          fontWeight="700"
          fill="url(#goldGradient)"
          letterSpacing="6"
        >
          STYLE
        </text>

        {/* Decorative dots under banner */}
        <circle cx="72" cy="116" r="1.5" fill="url(#goldGradient)" opacity="0.5" />
        <circle cx="78" cy="116" r="1.5" fill="url(#goldGradient)" opacity="0.5" />
        <circle cx="84" cy="116" r="1.5" fill="url(#goldGradient)" opacity="0.5" />
        <circle cx="90" cy="116" r="1.5" fill="url(#goldGradient)" opacity="0.5" />

        <circle cx="110" cy="116" r="1.5" fill="url(#goldGradient)" opacity="0.5" />
        <circle cx="116" cy="116" r="1.5" fill="url(#goldGradient)" opacity="0.5" />
        <circle cx="122" cy="116" r="1.5" fill="url(#goldGradient)" opacity="0.5" />
        <circle cx="128" cy="116" r="1.5" fill="url(#goldGradient)" opacity="0.5" />

        {/* Face outline — curved sides (mustache shape) */}
        <path
          d="M72 118 Q65 130 68 140 Q72 148 80 148"
          stroke="url(#goldGradient)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M128 118 Q135 130 132 140 Q128 148 120 148"
          stroke="url(#goldGradient)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Eyes — narrow slits */}
        <path
          d="M82 132 Q86 128 92 132"
          stroke="url(#goldGradient)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M108 132 Q112 128 118 132"
          stroke="url(#goldGradient)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Beard — heart shaped */}
        <path
          d="M80 148 Q84 144 92 148 Q100 154 100 172 Q100 154 108 148 Q116 144 120 148"
          fill="url(#goldGradient)"
          opacity="0.85"
        />

        {/* Beard lines */}
        <line x1="96" y1="152" x2="96" y2="166" stroke="rgba(13,9,6,0.3)" strokeWidth="0.8" />
        <line x1="100" y1="154" x2="100" y2="170" stroke="rgba(13,9,6,0.3)" strokeWidth="0.8" />
        <line x1="104" y1="152" x2="104" y2="166" stroke="rgba(13,9,6,0.3)" strokeWidth="0.8" />

        {/* Gradient definitions */}
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e2c87a" />
            <stop offset="50%" stopColor="#c9a84c" />
            <stop offset="100%" stopColor="#a68930" />
          </linearGradient>
        </defs>
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="logo-text">STYLE</span>
          <span className="logo-text-sm">BARBERSHOP</span>
        </div>
      )}
    </div>
  );
}
