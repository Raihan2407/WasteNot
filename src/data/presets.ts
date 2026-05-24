/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PresetKitchenImg } from "../types";

// SVG helper to convert the SVG string into base64 image URL to feed to Gemini if clicked
function makeSvgBase64(svgMarkup: string): string {
  // Simple check for safety on client/server boundary
  if (typeof btoa === 'undefined') return '';
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgMarkup)))}`;
}

// Preset 1: Sayuran & Telur Sisa
const svg1 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#F1F5F9"/>
  <!-- Wooden Cutting Board -->
  <rect x="50" y="60" width="300" height="180" rx="12" fill="#DDBE9E"/>
  <rect x="60" y="70" width="280" height="160" rx="8" fill="#CDAC8B"/>
  <circle cx="320" cy="90" r="10" fill="#9C7B5D"/>
  
  <!-- Bayam Sisa (Spinach leaves) -->
  <path d="M 120 180 C 100 130, 90 150, 110 120 C 130 90, 160 110, 150 150 Z" fill="#2E7D32"/>
  <path d="M 150 160 C 130 110, 120 130, 140 100 C 160 70, 190 90, 180 130 Z" fill="#388E3C"/>
  <path d="M 100 140 C 80 100, 110 90, 130 110" stroke="#1B5E20" stroke-width="2" fill="none"/>

  <!-- Telur Segar (Fresh eggs) -->
  <ellipse cx="230" cy="130" rx="20" ry="15" fill="#FFE0B2" transform="rotate(-15 230 130)"/>
  <ellipse cx="260" cy="145" rx="18" ry="14" fill="#FFE0B2" transform="rotate(10 260 145)"/>
  
  <!-- Bawang Putih & Bawang Merah (Garlic & Shallot) -->
  <path d="M 200 180 C 190 170, 190 160, 200 155 C 210 160, 210 170, 200 180" fill="#ECEFF1"/>
  <path d="M 185 190 C 175 180, 175 170, 185 165 C 195 170, 195 180, 185 190" fill="#D1C4E9"/>
  <circle cx="185" cy="188" r="1.5" fill="#7E57C2"/>

  <!-- Fork and Knife accents -->
  <path d="M 80 200 L 80 220 M 76 200 L 76 208 M 84 200 L 84 208" stroke="#78909C" stroke-width="2" stroke-linecap="round"/>
  
  <!-- Text Label -->
  <text x="200" y="270" font-family="sans-serif" font-size="14" font-weight="bold" fill="#334155" text-anchor="middle">Sisa Bayam, Telur, &amp; Bawang</text>
  <text x="200" y="288" font-family="sans-serif" font-size="11" fill="#64748B" text-anchor="middle">Potensi layu dan basi di kulkas</text>
</svg>
`;

// Preset 2: Nasi Dingin & Sosis Sisa
const svg2 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#FAF7F2"/>
  <!-- Kitchen Counter Plate -->
  <circle cx="200" cy="150" r="95" fill="#E2E8F0"/>
  <circle cx="200" cy="150" r="85" fill="#FFFFFF"/>
  
  <!-- Cold Rice Bowl/Mound (Nasi Dingin) -->
  <path d="M 140 150 Q 200 80 260 150 Z" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1"/>
  <circle cx="170" cy="130" r="3" fill="#F1F5F9"/>
  <circle cx="200" cy="115" r="4" fill="#F1F5F9"/>
  <circle cx="220" cy="135" r="3.5" fill="#F1F5F9"/>

  <!-- Leftover Sausage Slices (Sosis) -->
  <ellipse cx="160" cy="175" rx="18" ry="10" fill="#EF9A9A" transform="rotate(-20 160 175)"/>
  <ellipse cx="230" cy="170" rx="16" ry="9" fill="#EF9A9A" transform="rotate(30 230 170)"/>
  
  <!-- Scallions (Daun Bawang) -->
  <rect x="180" y="155" width="25" height="5" rx="2.5" fill="#4CAF50" transform="rotate(45 180 155)"/>
  <rect x="210" y="145" width="20" height="4" rx="2" fill="#4CAF50" transform="rotate(-15 210 145)"/>

  <!-- Red Chilies (Cabai Rawit) -->
  <path d="M 120 140 Q 115 125 105 130" fill="none" stroke="#E53935" stroke-width="6" stroke-linecap="round"/>
  <path d="M 105 130 L 102 125" fill="none" stroke="#43A047" stroke-width="2"/>
  
  <!-- Text Label -->
  <text x="200" y="270" font-family="sans-serif" font-size="14" font-weight="bold" fill="#334155" text-anchor="middle">Nasi Dingin semalam &amp; Sosis Kering</text>
  <text x="200" y="288" font-family="sans-serif" font-size="11" fill="#64748B" text-anchor="middle">Menu andalan penumpas lapar malam</text>
</svg>
`;

// Preset 3: Pisang Kematangan
const svg3 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#FEF3C7"/>
  <!-- Slate tray -->
  <rect x="60" y="70" width="280" height="150" rx="8" fill="#334155"/>
  <rect x="70" y="80" width="260" height="130" rx="4" fill="#1E293B"/>

  <!-- Ripe Bananas (Pisang Banyak Bintik Hitam) -->
  <path d="M 120 140 Q 180 100 240 140 Q 180 120 120 140" fill="#FFC107" stroke="#8D6E63" stroke-width="1.5"/>
  <circle cx="160" cy="125" r="2.5" fill="#4E342E"/>
  <circle cx="190" cy="124" r="3" fill="#4E342E"/>
  <circle cx="215" cy="130" r="2" fill="#4E342E"/>
  
  <path d="M 130 160 Q 190 120 250 160 Q 190 140 130 160" fill="#FFB300" stroke="#8D6E63" stroke-width="1.5"/>
  <circle cx="180" cy="144" r="3" fill="#4E342E"/>
  <circle cx="210" cy="145" r="2.5" fill="#4E342E"/>

  <!-- Grated Coconut heap (Kelapa Parut sisa) -->
  <path d="M 250 170 Q 280 130 310 170 Z" fill="#ECEFF1"/>
  <circle cx="280" cy="165" r="2.5" fill="#CFD8DC"/>
  <circle cx="265" cy="160" r="1.5" fill="#CFD8DC"/>

  <!-- Flour bag side -->
  <path d="M 85 170 L 115 170 L 110 120 L 90 120 Z" fill="#F8FAFC" stroke="#94A3B8" stroke-width="2"/>
  <text x="100" y="145" font-family="monospace" font-size="8" font-weight="bold" fill="#64748B" text-anchor="middle">TEPUNG</text>

  <!-- Text Label -->
  <text x="200" y="270" font-family="sans-serif" font-size="14" font-weight="bold" fill="#334155" text-anchor="middle">Pisang Kematangan (Bintik Hitam)</text>
  <text x="200" y="288" font-family="sans-serif" font-size="11" fill="#64748B" text-anchor="middle">Hampir busuk tapi manis luar biasa</text>
</svg>
`;

export const presetLeftovers: PresetKitchenImg[] = [
  {
    id: "preset-spinach-egg",
    name: "Tumpukan Bayam & Telur Layu",
    desc: "1 Ikat bayam tua agak layu, 2 butir telur, bumbu bawang putih & bawang merah sisa.",
    imageUrl: makeSvgBase64(svg1),
    ingredients: ["bayam tua agak layu", "telur ayam", "bawang putih", "bawang merah"]
  },
  {
    id: "preset-cold-rice",
    name: "Nasi Dingin & Sosis Kering",
    desc: "1 Piring penuh nasi dingin semalam, 2 batang sosis kulkas, daun bawang, & cabai rawit.",
    imageUrl: makeSvgBase64(svg2),
    ingredients: ["nasi dingin semalam", "sosis sapi", "daun bawang", "cabai rawit"]
  },
  {
    id: "preset-ripe-bananas",
    name: "Pisang Kemasukan & Kelapa Parut",
    desc: "3 Buah pisang raja kematangan berbercak hitam di kulit, sisa kelapa parut takjil, tepung terigu.",
    imageUrl: makeSvgBase64(svg3),
    ingredients: ["pisang raja kematangan", "kelapa parut sisa", "tepung terigu"]
  }
];
