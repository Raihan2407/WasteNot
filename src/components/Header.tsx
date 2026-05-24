/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Leaf, Award, Flame, CookingPot } from "lucide-react";
import { motion } from "motion/react";

interface HeaderProps {
  totalSavedWeight: number; // in grams
  totalRecipesMade: number;
}

export default function Header({ totalSavedWeight, totalRecipesMade }: HeaderProps) {
  const kgValue = (totalSavedWeight / 1000).toFixed(2);

  return (
    <header className="bg-white border-b border-[#e8f5e9] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1a6b3c] rounded-2xl flex items-center justify-center text-white">
              <CookingPot className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1a6b3c] tracking-tight">WasteNot</h1>
              <p className="text-sm text-slate-500">Asisten masak Indonesia dan pengurang sampah makanan</p>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Grams Saved Stats */}
            <motion.div 
              key={totalSavedWeight}
              initial={{ scale: 0.95, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-white border border-[#e8f5e9] rounded-2xl py-1.5 px-4 flex items-center gap-3 shadow-sm"
            >
              <div className="p-1.5 bg-[#e8f5e9] text-[#1a6b3c] rounded-xl">
                <Leaf className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">
                  Sisa diselamatkan
                </div>
                <div className="text-sm font-bold text-slate-800">
                  {kgValue} kg
                </div>
              </div>
            </motion.div>

            {/* Recipes Stats */}
            <motion.div 
              key={totalRecipesMade}
              initial={{ scale: 0.95, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white border border-[#e8f5e9] rounded-2xl py-1.5 px-4 flex items-center gap-3 shadow-sm"
            >
              <div className="p-1.5 bg-[#e8f5e9] text-[#1a6b3c] rounded-xl">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">
                  Resep dimasak
                </div>
                <div className="text-sm font-bold text-slate-800">
                  {totalRecipesMade} resep
                </div>
              </div>
            </motion.div>

            {/* Eco Rank badge */}
            <div className="bg-[#1a6b3c] text-white px-4 py-2 rounded-2xl flex items-center gap-2 shadow-sm">
              <Flame className="w-4 h-4 text-[#f5c842]" />
              <div>
                <div className="text-[10px] text-emerald-100 font-medium">
                  Kategori dapur
                </div>
                <div className="text-sm font-bold">
                  {totalSavedWeight > 5000 
                    ? "Pahlawan Nusantara 🏆" 
                    : totalSavedWeight > 2000 
                    ? "Koki Bijak Dapur ⭐" 
                    : "Penyelamat Pemula 🌱"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
