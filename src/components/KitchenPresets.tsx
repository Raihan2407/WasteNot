/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { presetLeftovers } from "../data/presets";
import { PresetKitchenImg } from "../types";
import { Info, Sparkles } from "lucide-react";

interface KitchenPresetsProps {
  onSelectPreset: (preset: PresetKitchenImg) => void;
  selectedPresetId: string | null;
}

export default function KitchenPresets({ onSelectPreset, selectedPresetId }: KitchenPresetsProps) {
  return (
    <div className="bg-white rounded-[2rem] p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="w-5 h-5 text-[#1a6b3c]" />
        <h2 className="text-xl font-bold text-[#1a6b3c] tracking-tight">
          Uji coba cepat dengan bahan sisa
        </h2>
      </div>
      <p className="text-sm text-slate-500 mb-4 leading-relaxed">
        Belum ada bahan di dapur hari ini? Pilih salah satu kombinasi bahan sisa legendaris Indonesia di bawah ini untuk mensimulasikan foto snapshot atau daftar sisa kulkas.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {presetLeftovers.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              type="button"
              className={`group flex flex-col text-left rounded-2xl border transition-all duration-300 overflow-hidden cursor-pointer ${
                isSelected
                  ? "border-[#1a6b3c] bg-[#e8f5e9]/20 shadow-md ring-1 ring-[#1a6b3c]/30"
                  : "border-[#e8f5e9] hover:border-[#1a6b3c] hover:bg-slate-50 shadow-sm"
              }`}
            >
              {/* Graphic container */}
              <div className="aspect-video w-full bg-[#e8f5e9]/10 relative overflow-hidden flex items-center justify-center border-b border-inherit">
                <img
                  src={preset.imageUrl}
                  alt={preset.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-[#1a6b3c] text-white text-[10px] uppercase px-2 py-0.5 rounded-full font-bold shadow-sm">
                    Terpilih
                  </div>
                )}
              </div>

              {/* Text metadata */}
              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-[#1a6b3c] transition-colors leading-snug">
                    {preset.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {preset.desc}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#e8f5e9] flex items-center space-x-1 text-xs text-slate-500 font-medium">
                  <Info className="w-3.5 h-3.5 text-[#1a6b3c]" />
                  <span>{preset.ingredients.length} bahan dapur</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
