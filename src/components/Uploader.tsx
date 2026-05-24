/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from "react";
import { 
  Camera, 
  Upload, 
  X, 
  Map, 
  Type as FontIcon, 
  ChefHat 
} from "lucide-react";
import { translations } from "../translations";

interface UploaderProps {
  onAnalyze: (inputs: { 
    image: string | null; 
    textIngredients: string | null; 
    regionFilter: string;
    isEmergencyMode: boolean;
    cookingVibe: string;
  }) => void;
  isLoading: boolean;
  selectedPresetImage: string | null;
  selectedPresetIngredients: string[] | null;
  onClearPreset: () => void;
  isEmergencyMode: boolean;
  setIsEmergencyMode: (val: boolean) => void;
  cookingVibe: string;
  setCookingVibe: (val: string) => void;
  firstName: string;
  language?: "id" | "en";
}

export default function Uploader({
  onAnalyze,
  isLoading,
  selectedPresetImage,
  selectedPresetIngredients,
  onClearPreset,
  isEmergencyMode,
  setIsEmergencyMode,
  cookingVibe,
  setCookingVibe,
  firstName,
  language = "id",
}: UploaderProps) {
  const [tab, setTab] = useState<"photo" | "text">("photo");
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [textInput, setTextInput] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = translations[language];

  // Handle local image file conversions to Base64
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      const errAlert = language === "en" ? "Only image files are supported." : "Hanya file gambar yang didukung.";
      alert(errAlert);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageFile(reader.result as string);
      onClearPreset(); // clear preset since we used custom file
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    onClearPreset();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerSearch = () => {
    const defaultRegion = language === "en" ? "All" : "Semua";
    if (tab === "photo") {
      const finalImage = selectedPresetImage || imageFile;
      const finalIngredients = selectedPresetImage ? selectedPresetIngredients?.join(", ") : null;
      onAnalyze({
        image: finalImage,
        textIngredients: finalIngredients,
        regionFilter: defaultRegion, // will be filtered dynamically in Step B!
        isEmergencyMode,
        cookingVibe,
      });
    } else {
      if (!textInput.trim()) {
        const inputAlert = language === "en" ? "Please enter your kitchen ingredients in the text area." : "Harap ketik isi sisa bahan makanan di kolom teks.";
        alert(inputAlert);
        return;
      }
      onAnalyze({
        image: null,
        textIngredients: textInput,
        regionFilter: defaultRegion, // will be filtered dynamically in Step B!
        isEmergencyMode,
        cookingVibe,
      });
    }
  };

  const currentImage = selectedPresetImage || imageFile;

  const vibesMap = [
    { value: "quick", label: t.vibeQuick, desc: language === "en" ? "Super instant steps" : "Resep super instan", icon: "😴", bgClass: "bg-[#fef9c3] dark:bg-[#3f3a15] dark:text-yellow-100" },
    { value: "pro", label: t.vibePro, desc: language === "en" ? "Savory Indonesian (30m)" : "Nikmat & wangi (30m)", icon: "👨‍🍳", bgClass: "bg-[#dbeafe] dark:bg-[#1a2d42] dark:text-blue-100" },
    { value: "healthy", label: t.vibeHealthy, desc: language === "en" ? "Balanced nutrients" : "Nutrisi seimbang", icon: "🥗", bgClass: "bg-[#dcfce7] dark:bg-[#14321e] dark:text-green-100" },
    { value: "family", label: t.vibeFamily, desc: language === "en" ? "Larger portions" : "Porsi lebih besar", icon: "🎉", bgClass: "bg-[#f3e8ff] dark:bg-[#2c1a3f] dark:text-purple-100" },
  ];

  return (
    <div className={`rounded-[2rem] p-6 border transition-all duration-300 flex flex-col space-y-6 ${
      isEmergencyMode 
        ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/50 shadow-md" 
        : "bg-white border-[#e8f5e9] dark:bg-[#1a2e1a] dark:border-emerald-900/30 shadow-sm"
    }`}>
      
      {/* COGNITIVE LOAD REDUCTION: Mode Darurat Kulkas at the TOP of upload section */}
      <div 
        onClick={() => setIsEmergencyMode(!isEmergencyMode)}
        className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between ${
          isEmergencyMode 
            ? "bg-red-500 text-white border-red-650 shadow-md ring-2 ring-red-400/50" 
            : "bg-orange-50 border-orange-200 text-orange-900 hover:bg-orange-100/70 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-100"
        }`}
      >
        <div className="flex items-center space-x-3 text-left">
          <div className="flex items-center justify-center">
            <span className={`text-2xl inline-block ${isEmergencyMode ? 'shake-emergency' : ''}`}>
              🚨
            </span>
          </div>
          <div>
            <p className={`text-sm font-black ${isEmergencyMode ? "text-white" : "text-slate-900 dark:text-slate-100"}`}>
              {isEmergencyMode ? t.emergencyActive : t.emergencyInactive}
            </p>
            <p className={`text-xs ${isEmergencyMode ? "text-white/95 font-bold" : "text-orange-750 dark:text-amber-300 font-bold"}`}>
              {isEmergencyMode 
                ? `${t.emergencyAlertName.replace("{name}", firstName)}` 
                : t.emergencyTapHint}
            </p>
          </div>
        </div>
        <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-200 flex-shrink-0 ${isEmergencyMode ? 'bg-red-700' : 'bg-slate-200 dark:bg-slate-700'}`}>
          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${isEmergencyMode ? 'translate-x-4' : 'translate-x-0'}`} />
        </div>
      </div>

      {/* Main Panel Content with 200px+ Upload area */}
      <div className="w-full">
        {tab === "photo" ? (
          <div className="space-y-4">
            {currentImage ? (
              <div className="relative rounded-2xl overflow-hidden border border-[#e8f5e9] dark:border-emerald-900/20 group min-h-[200px] bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center shadow-inner">
                <img
                  src={currentImage}
                  alt="Snapshot kulkas"
                  className="w-full h-full max-h-[260px] object-contain rounded-2xl"
                  referrerPolicy="no-referrer"
                />
                
                {/* Overlay Metadata if preset is active */}
                {selectedPresetIngredients && (
                  <div className="absolute bottom-0 inset-x-0 bg-slate-900/90 text-slate-100 p-3 text-xs text-left">
                    <p className="font-bold text-emerald-300 text-[11px]">
                      {language === "en" ? "Opened preset:" : "Preset terbuka:"}
                    </p>
                    <p className="line-clamp-2 mt-0.5">{selectedPresetIngredients.join(", ")}</p>
                  </div>
                )}

                <button
                  onClick={clearImage}
                  type="button"
                  className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white rounded-full p-2.5 transition-transform hover:scale-105 cursor-pointer shadow-md"
                  title={language === "en" ? "Delete photo" : "Hapus foto"}
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="marching-ants-box rounded-2xl cursor-pointer p-8 min-h-[200px] text-center transition-all duration-300 flex flex-col items-center justify-center space-y-3.5 bg-[#f0faf4] dark:bg-[#1a2d1d] border-2 border-dashed border-emerald-500/25 pulse-upload-indicator"
              >
                <div className="p-3.5 bg-white dark:bg-slate-800 text-[#1a6b3c] dark:text-emerald-400 rounded-[1.25rem] border border-emerald-100 dark:border-emerald-900/40 shadow-3xs hover:scale-105 transition-transform">
                  <Camera className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-base font-black text-slate-950 dark:text-white">
                    📷 {t.uploadFridgePhoto}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed font-semibold">
                    {language === "en" ? "Take a photo of leftover ingredients so that AI can turn them into gourmet recipes!" : "Ambil foto sisa belanjaanmu di dapur (sayur layu, bumbu, telur) biar diubah jadi hidangan Nusantara lezat!"}
                  </p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            )}
            
            <div className="text-center pt-1">
              <button
                onClick={() => setTab("text")}
                type="button"
                className="text-sm font-bold text-[#1a6b3c] dark:text-emerald-400 hover:underline cursor-pointer inline-flex items-center gap-1 min-h-[44px] px-4 font-black"
              >
                <span>{language === "en" ? "or enter manually ✍️" : "atau ketik manual ✍️"}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2 text-left">
              <label className="text-xs font-black text-slate-400 block uppercase tracking-widest pl-1">
                {language === "en" ? "List your leftover fridge contents" : "Tulis daftar sisa makanan di kulkamu"}
              </label>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={language === "en" ? "E.g. leftover cabbage from yesterday, 2 sausages, eggs, half onion..." : "Contoh: sayur sawi sisa kemarin, sosis sapi 2 buah, telur, bawang bombay setengah..."}
                rows={4}
                className="w-full text-sm p-4 bg-white border border-[#e8f5e9] dark:bg-slate-900 dark:border-emerald-900/20 rounded-2xl focus:outline-none focus:border-[#1a6b3c] transition-all text-slate-800 dark:text-slate-100 font-semibold"
              />
            </div>
            
            <div className="text-center">
              <button
                onClick={() => setTab("photo")}
                type="button"
                className="text-sm font-bold text-[#1a6b3c] dark:text-emerald-400 hover:underline cursor-pointer inline-flex items-center gap-1 min-h-[44px] px-4 font-black"
              >
                <span>{language === "en" ? "or use photo 📷" : "atau gunakan foto 📷"}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* UNIQUENESS CRITERIA: 5. Vibe Masak - Mood Selector */}
      <div className="space-y-3 text-left">
        <div className="flex items-center space-x-1.5 text-[#1a6b3c] dark:text-emerald-400">
          <span className="text-base">✨</span>
          <span className="text-sm font-black text-slate-850 dark:text-slate-100">{t.uploadChooseVibe}</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {vibesMap.map((item) => {
            const isSelected = cookingVibe === item.value;
            return (
              <button
                key={item.value}
                onClick={() => setCookingVibe(item.value)}
                type="button"
                className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer min-h-[76px] flex flex-col justify-center relative ${item.bgClass} ${
                  isSelected 
                    ? "border-[#1a6b3c] dark:border-emerald-400 ring-2 ring-[#1a6b3c]/20 font-extrabold" 
                    : "border-slate-100/50 scale-[0.98] hover:scale-100 hover:border-slate-300 opacity-85 hover:opacity-100"
                }`}
              >
                {isSelected && (
                  <span className="absolute top-2 right-2 bg-[#1a6b3c] dark:bg-emerald-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-black shadow-xs">
                    ✓
                  </span>
                )}
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-xs font-black leading-tight">{item.label}</span>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-1 leading-snug font-semibold">{item.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary scanning call-to-action button (minimum 56px height, always active green, blinking pulse animation) */}
      <button
        onClick={triggerSearch}
        disabled={isLoading}
        type="button"
        className="w-full bg-[#1a6b3c] dark:bg-emerald-600 hover:bg-[#14522e] dark:hover:bg-emerald-700 text-white font-black text-sm h-14 min-h-[56px] rounded-2xl transition-all duration-300 shadow-md flex items-center justify-center space-x-2 cursor-pointer border border-[#1a6b3c]/20 transform active:scale-[0.99] cta-pulse-button"
      >
        <ChefHat className="w-5 h-5 text-white" />
        <span>
          {isLoading 
            ? t.btnAnalyzing
            : isEmergencyMode 
              ? (language === "en" ? "🚨 Find Emergency Recipes Now!" : "🚨 Cari Resep Darurat Sekarang!") 
              : t.btnAnalyze}
        </span>
      </button>

    </div>
  );
}
