import React from "react";

export default function ImagemProduto({ produtoId, className = "" }) {
  // Retorna um SVG diferente com estilo Cartoon/Comic e cores neon para cada produto
  const renderSvg = () => {
    switch (produtoId) {
      case "produto_tiktok_shop":
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <rect width="200" height="200" fill="#000" />
            <circle cx="100" cy="100" r="70" fill="#ff2a74" opacity="0.2" />
            {/* TikTok Icon with Cartoon details */}
            <path d="M120,60 C110,60 100,70 100,80 L100,130 C100,140 90,150 80,150 C70,150 60,140 60,130 C60,120 70,110 80,110 L80,90 C55,90 35,110 35,135 C35,160 55,180 80,180 C105,180 120,165 120,140 L120,95 C130,105 145,110 155,110 L155,90 C140,90 125,80 120,60 Z" fill="#00f0ff" stroke="#000" strokeWidth="4" />
            <path d="M117,63 C107,63 97,73 97,83 L97,133 C97,143 87,153 77,153 C67,153 57,143 57,133 C57,123 67,113 77,113 L77,93 C52,93 32,113 32,138 C32,163 52,183 77,183 C102,183 117,168 117,143 L117,98 C127,108 142,113 152,113 L152,93 C137,93 122,83 117,63 Z" fill="#ff2a74" />
            {/* Bags and sparkles */}
            <rect x="130" y="130" width="40" height="30" rx="5" fill="#ffe600" stroke="#000" strokeWidth="3" />
            <path d="M140,130 Q150,115 160,130" fill="none" stroke="#000" strokeWidth="3" />
            <text x="100" y="45" textAnchor="middle" fill="#ffe600" fontSize="12" fontWeight="bold" fontFamily="Bungee">TIKTOK SHOP</text>
          </svg>
        );
      case "produto_robux":
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <rect width="200" height="200" fill="#000" />
            <circle cx="100" cy="100" r="70" fill="#ffe600" opacity="0.15" />
            {/* Golden Robux Hexagon with cartoon face or sparkles */}
            <polygon points="100,40 150,70 150,130 100,160 50,130 50,70" fill="#ffe600" stroke="#000" strokeWidth="5" />
            <polygon points="100,55 135,80 135,120 100,145 65,120 65,80" fill="#b3a100" stroke="#000" strokeWidth="3" />
            {/* Innermost Robux icon */}
            <polygon points="100,70 120,85 120,115 100,130 80,115 80,85" fill="#ffe600" stroke="#000" strokeWidth="3" />
            <text x="100" y="105" textAnchor="middle" fill="#000" fontSize="20" fontWeight="extrabold" fontFamily="Bungee">R$</text>
            <circle cx="45" cy="50" r="6" fill="#00f0ff" stroke="#00" strokeWidth="2" />
            <circle cx="160" cy="150" r="8" fill="#ff2a74" stroke="#00" strokeWidth="2" />
          </svg>
        );
      case "produto_steam_jogos":
      case "produto_keys_steam":
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <rect width="200" height="200" fill="#000" />
            <circle cx="100" cy="100" r="65" fill="#00f0ff" opacity="0.2" />
            {/* Steam Logo Cartoon */}
            <circle cx="100" cy="100" r="50" fill="none" stroke="#00f0ff" strokeWidth="8" />
            <circle cx="70" cy="120" r="20" fill="#b92cff" stroke="#000" strokeWidth="4" />
            <path d="M70,120 L120,90" stroke="#00f0ff" strokeWidth="8" strokeLinecap="round" />
            <path d="M70,120 L120,90" stroke="#000" strokeWidth="2" strokeLinecap="round" />
            <circle cx="120" cy="90" r="14" fill="#00f0ff" stroke="#000" strokeWidth="4" />
            <circle cx="120" cy="90" r="5" fill="#fff" />
            {/* Keys overlays */}
            <rect x="130" y="130" width="35" height="15" rx="3" fill="#ffe600" stroke="#000" strokeWidth="3" transform="rotate(-30, 130, 130)" />
            <text x="100" y="45" textAnchor="middle" fill="#00f0ff" fontSize="14" fontWeight="bold" fontFamily="Bungee">STEAM KEY</text>
          </svg>
        );
      case "produto_streaming":
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <rect width="200" height="200" fill="#000" />
            <rect x="40" y="60" width="120" height="80" rx="10" fill="#b92cff" stroke="#000" strokeWidth="5" />
            {/* TV Screen details */}
            <rect x="50" y="70" width="100" height="60" rx="5" fill="#0d091e" />
            {/* Play button */}
            <polygon points="90,85 120,100 90,115" fill="#ff2a74" stroke="#000" strokeWidth="3" />
            {/* Antennas */}
            <line x1="100" y1="60" x2="70" y2="35" stroke="#000" strokeWidth="5" strokeLinecap="round" />
            <line x1="100" y1="60" x2="130" y2="35" stroke="#000" strokeWidth="5" strokeLinecap="round" />
            <circle cx="70" cy="35" r="5" fill="#ffe600" />
            <circle cx="130" cy="35" r="5" fill="#00f0ff" />
            {/* Stand */}
            <polygon points="80,140 120,140 130,165 70,165" fill="#ffe600" stroke="#000" strokeWidth="4" />
          </svg>
        );
      case "produto_blox_fruits":
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <rect width="200" height="200" fill="#000" />
            {/* Cartoon Fruit (Devil Fruit-ish) with glowing aura */}
            <circle cx="100" cy="110" r="50" fill="#ff2a74" stroke="#000" strokeWidth="5" />
            {/* Swirls on fruit */}
            <path d="M80,90 Q75,110 90,110" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" />
            <path d="M120,90 Q125,110 110,110" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" />
            <path d="M100,120 Q80,130 100,140" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" />
            {/* Stem */}
            <path d="M100,60 Q110,40 130,45" fill="none" stroke="#00e676" strokeWidth="6" strokeLinecap="round" />
            <text x="100" y="35" textAnchor="middle" fill="#ffe600" fontSize="13" fontWeight="bold" fontFamily="Bungee">BLOX FRUITS</text>
          </svg>
        );
      case "produto_supercell":
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <rect width="200" height="200" fill="#000" />
            {/* Supercell Crown / BS theme */}
            <polygon points="50,150 50,70 85,95 100,55 115,95 150,70 150,150" fill="#00f0ff" stroke="#000" strokeWidth="5" />
            <circle cx="100" cy="115" r="15" fill="#ffe600" stroke="#000" strokeWidth="3" />
            <text x="100" y="122" textAnchor="middle" fill="#000" fontSize="12" fontWeight="bold" fontFamily="Bungee">S</text>
            <text x="100" y="180" textAnchor="middle" fill="#00e676" fontSize="11" fontWeight="bold" fontFamily="Bungee">SUPERCELL</text>
          </svg>
        );
      case "produto_painel_seguidores":
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <rect width="200" height="200" fill="#000" />
            {/* Growth chart/Follower icon */}
            <circle cx="100" cy="80" r="25" fill="#b92cff" stroke="#000" strokeWidth="4" />
            <path d="M60,150 C60,120 75,110 100,110 C125,110 140,120 140,150 Z" fill="#b92cff" stroke="#000" strokeWidth="4" />
            {/* Plus sign */}
            <path d="M135,65 L155,65 M145,55 L145,75" stroke="#00e676" strokeWidth="6" strokeLinecap="round" />
            {/* Sparkles */}
            <polygon points="50,60 55,50 60,60 50,60" fill="#ffe600" />
            <polygon points="160,130 165,120 170,130 160,130" fill="#ffe600" />
            <text x="100" y="35" textAnchor="middle" fill="#b92cff" fontSize="13" fontWeight="bold" fontFamily="Bungee">SEGUIDORES</text>
          </svg>
        );
      case "produto_discord_nitro":
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <rect width="200" height="200" fill="#000" />
            {/* Discord Nitro Purple Gem Cartoon */}
            <polygon points="100,35 155,75 140,150 60,150 45,75" fill="#b92cff" stroke="#000" strokeWidth="6" />
            <polygon points="100,48 143,80 130,140 70,140 57,80" fill="#4d0080" />
            {/* Inner gem shine */}
            <polygon points="100,50 135,80 100,135" fill="rgba(255,255,255,0.15)" />
            {/* Glowing lines */}
            <path d="M100,35 L100,150 M45,75 L155,75 M100,135 L60,150 M100,135 L140,150" stroke="#000" strokeWidth="3" />
            {/* Cartoon Wumpus / Controller face inside gem or text */}
            <text x="100" y="105" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold" fontFamily="Bungee" className="glow-roxo">NITRO</text>
            <circle cx="160" cy="45" r="10" fill="#00f0ff" stroke="#000" strokeWidth="2.5" />
            <text x="160" y="49" textAnchor="middle" fontSize="10" fill="#000" fontWeight="bold">!</text>
          </svg>
        );
      case "produto_email_virgem":
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <rect width="200" height="200" fill="#000" />
            <circle cx="100" cy="100" r="70" fill="#00e676" opacity="0.15" />
            {/* Cute Cartoon Envelope */}
            <rect x="40" y="65" width="120" height="80" rx="8" fill="#ffffff" stroke="#000" strokeWidth="5" />
            <path d="M40,70 L100,115 L160,70" fill="none" stroke="#000" strokeWidth="5" strokeLinecap="round" />
            {/* Sparkles of "Virgem" (Clean/Fresh) */}
            <path d="M100,40 L100,50 M95,45 L105,45" stroke="#ffe600" strokeWidth="3" />
            <path d="M30,120 L30,130 M25,125 L35,125" stroke="#ffe600" strokeWidth="3" />
            <text x="100" y="130" textAnchor="middle" fill="#000" fontSize="10" fontWeight="bold" fontFamily="Bungee">GMAIL/VIRGEM</text>
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <rect width="200" height="200" fill="#0d091e" />
            <circle cx="100" cy="100" r="40" fill="#ffe600" />
            <text x="100" y="105" textAnchor="middle" fill="#000" fontSize="24" fontWeight="bold">?</text>
          </svg>
        );
    }
  };

  return (
    <div className={`w-full aspect-square border-b-2 border-black overflow-hidden flex items-center justify-center bg-black ${className}`}>
      {renderSvg()}
    </div>
  );
}
