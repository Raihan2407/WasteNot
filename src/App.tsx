/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import KitchenPresets from "./components/KitchenPresets";
import Uploader from "./components/Uploader";
import { Recipe, AnalyzeResult, ChatMessage, PresetKitchenImg, SavedRecipe } from "./types";
import { jsPDF } from "jspdf";
import { 
  Leaf, 
  Sparkles, 
  MessageSquare, 
  Send, 
  CheckCircle, 
  AlertTriangle,
  RotateCcw,
  BookOpen,
  CookingPot,
  Camera,
  Sun,
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { translations } from "./translations";

import { auth, db, googleProvider, signInWithPopup, signOut, handleFirestoreError, OperationType } from "./firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";


// CountUp Animations helper for judging criteria
function CountUp({ end, prefix = "", suffix = "", duration = 1000 }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCurrent(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <span>{prefix}{current.toLocaleString("id-ID")}{suffix}</span>;
}

function CountUpFloat({ end, prefix = "", suffix = "", duration = 1000 }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCurrent(progress * end);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <span>{prefix}{current.toFixed(1)}{suffix}</span>;
}

// Chime generator using browser Web Audio API for delightful feedback
function playDing() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    
    const now = ctx.currentTime;
    // Multi-tone arpeggio: C5 -> E5 -> G5 -> C6
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.08);
    osc.frequency.setValueAtTime(783.99, now + 0.16);
    osc.frequency.setValueAtTime(1046.50, now + 0.24);
    
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.45);
    
    osc.start(now);
    osc.stop(now + 0.45);
  } catch (e) {
    console.warn("Audio Context beep failed:", e);
  }
}

// Stagger and Bounce animations for ingredients pop-in
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.3, y: 30 },
  show: { 
    opacity: 1, 
    scale: [0.3, 1.1, 1], 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 15
    }
  }
};

// Damsak Nyata-mu interactive results card
interface DampakNyataCardProps {
  impact: { recipeName: string; grams: number; moneySaved: number; co2Saved: number; acHours: number; portions: number };
  onClose: () => void;
}

function DampakNyataCard({ impact, onClose }: DampakNyataCardProps) {
  const [shared, setShared] = useState(false);

  const handleShare = () => {
    setShared(true);
    navigator.clipboard.writeText(
      `Saya baru saja memasak "${impact.recipeName}" menggunakan WasteNot AI! Makanan terselamatkan: ~${impact.grams}g, Hemat Rp ${impact.moneySaved.toLocaleString("id-ID")}, dan mengurangi ${impact.co2Saved} kg CO₂! Ayo kurangi sampah makanan bersama! 🌱`
    ).catch(() => {});
    
    setTimeout(() => {
      setShared(false);
    }, 2500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", damping: 20 }}
      className="bg-emerald-900 text-white rounded-[2rem] p-6 shadow-xl border border-emerald-500/20 relative overflow-hidden space-y-5"
    >
      <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 bg-emerald-850 text-[#f5c842] rounded-xl text-xs">🎉</span>
          <h3 className="text-xs font-black tracking-widest uppercase text-emerald-300">Dampak Nyata-mu Hari Ini!</h3>
        </div>
        <button 
          onClick={onClose}
          className="text-emerald-400 hover:text-white font-bold text-xs px-2.5 py-1 bg-emerald-950/60 rounded-xl transition-all cursor-pointer"
        >
          ✕ Tutup
        </button>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-emerald-300">Hasil masakan penyelamat panganmu:</p>
        <h4 className="text-lg font-black text-[#f5c842] leading-tight pr-4">
          {impact.recipeName.replace(/\[.*\]/, "")} (~{impact.grams}g bahan diselamatkan!)
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Money Saver */}
        <div className="bg-emerald-950/40 rounded-2xl p-4 border border-emerald-850/20 flex flex-col justify-between">
          <span className="text-lg">💰</span>
          <div>
            <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider mt-2">Duit Dihemat</div>
            <p className="text-lg font-black text-white mt-0.5">
              <CountUp end={impact.moneySaved} prefix="Rp " />
            </p>
            <p className="text-[10px] text-[#f5c842] font-semibold mt-1 leading-normal">
              Kamu hemat estimasi Rp {Math.round(impact.moneySaved * 0.8 / 1000) * 1000}&ndash;{Math.round(impact.moneySaved * 1.2 / 1000) * 1000} hari ini
            </p>
          </div>
        </div>

        {/* Carbon Saver */}
        <div className="bg-emerald-950/40 rounded-2xl p-4 border border-emerald-850/20 flex flex-col justify-between">
          <span className="text-lg">🌿</span>
          <div>
            <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider mt-2">Reduksi CO₂</div>
            <p className="text-lg font-black text-white mt-0.5">
              <CountUpFloat end={impact.co2Saved} suffix=" kg" />
            </p>
            <p className="text-[10px] text-emerald-250 font-semibold mt-1 leading-normal">
              Mengurangi ~{impact.co2Saved.toFixed(1)} kg CO₂ &mdash; setara matikan AC {impact.acHours} jam
            </p>
          </div>
        </div>

        {/* Portions / Nutrition */}
        <div className="bg-emerald-950/40 rounded-2xl p-4 border border-emerald-850/20 flex flex-col justify-between">
          <span className="text-lg">🍽️</span>
          <div>
            <div className="text-[10px] text-[#f5c842] font-bold uppercase tracking-wider mt-2">Pecahan Porsi</div>
            <p className="text-lg font-black text-white mt-0.5">
              {impact.portions} Porsi Penuh
            </p>
            <p className="text-[10px] text-emerald-250 font-semibold mt-1 leading-normal">
              Bahan ini cukup untuk {impact.portions} porsi bergizi penuh
            </p>
          </div>
        </div>

      </div>

      {/* Dynamic equivalence tag line */}
      <div className="bg-[#14522e]/80 px-4 py-3 rounded-2xl text-xs text-emerald-200 leading-relaxed font-semibold border border-[#e8f5e9]/10">
        📢 <strong>Ekuivalensi:</strong> Masakan ini menyelamatkan sisa makanan dan memangkas karbon setara dengan <strong>mematikan pendingin udara (AC) selama <CountUp end={impact.acHours} /> jam!</strong> Sungguh langkah kecil penyelamat bumi 🌍
      </div>

      <div className="flex flex-col sm:flex-row gap-2 justify-between items-center pt-2">
        <p className="text-[10px] text-emerald-400">
          *Dihitung dinamis menggunakan formula dampak carbon WasteNot 2026.
        </p>
        
        <button
          onClick={handleShare}
          className="py-2 px-4 rounded-xl bg-[#f5c842] hover:bg-[#e0b430] text-slate-900 font-bold text-xs flex items-center space-x-1.5 transition-transform hover:scale-[1.02] cursor-pointer shadow-sm active:translate-y-[1px]"
        >
          <span>🌱</span>
          <span>{shared ? "Berhasil disalin! 📋" : "Bagikan dampakku 🌱"}</span>
        </button>
      </div>

    </motion.div>
  );
}

export default function App() {
  // Navigation view state: 'hero' | 'dashboard' | 'recipes'
  const [view, setView] = useState<"hero" | "dashboard" | "recipes">("hero");
  const [foodWastedSinceOpen, setFoodWastedSinceOpen] = useState<number>(0);
  const [scrolled, setScrolled] = useState<boolean>(false);

  // Saved Recipes states
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>(() => {
    try {
      const data = localStorage.getItem("wastenot_saved_recipes");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  // Simple Toast notification system
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 3000);
  };

  const handleSaveRecipeToMyRecipes = (recipe: Recipe) => {
    const isAlreadySaved = savedRecipes.some(
      (r) => r.nama.toLowerCase() === recipe.nama.toLowerCase()
    );
    if (isAlreadySaved) {
      showToast(language === "en" ? "Recipe already saved!" : "Resep sudah disimpan sebelumnya!");
      return;
    }
    const newSaved: SavedRecipe = {
      id: Date.now().toString(),
      nama: recipe.nama,
      daerah: recipe.daerah,
      bahan_dipakai: recipe.bahan_dipakai,
      langkah: recipe.langkah,
      estimasi_waste: recipe.estimasi_waste,
      dateSaved: new Date().toLocaleDateString(language === "en" ? "en-US" : "id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };
    const updatedList = [newSaved, ...savedRecipes];
    setSavedRecipes(updatedList);
    localStorage.setItem("wastenot_saved_recipes", JSON.stringify(updatedList));
    showToast(translations[language].toastRecipeSaved);
  };

  const handleDeleteRecipe = (id: string) => {
    const updatedList = savedRecipes.filter((r) => r.id !== id);
    setSavedRecipes(updatedList);
    localStorage.setItem("wastenot_saved_recipes", JSON.stringify(updatedList));
    showToast(language === "en" ? "🗑️ Recipe removed!" : "🗑️ Resep dihapus!");
  };

  const generateRecipePDF = (recipe: Recipe | SavedRecipe) => {
    const isEn = language === "en";
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Design settings
      const primaryColor = [26, 107, 60]; // #1a6b3c
      const textDark = [33, 41, 54]; // #212936
      const textGray = [100, 116, 139]; // #64748b

      let y = 38;

      // 1. HEADER BRANDING
      // Full-width green block of 25mm height at the top
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 25, "F");

      // White text inside the green header block
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text("WasteNot", 20, 16);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text("#JuaraVibeCoding 2026", 190, 15.5, { align: "right" });

      // 2. RECIPE DISPLAY TITLE
      const recipeName = recipe.nama.replace(/\*\*/g, "").replace(/\[.*\]/g, "").trim();
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(16); // 16pt recipe title, bold, green color
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      
      const wrappedName = doc.splitTextToSize(recipeName, 170);
      doc.text(wrappedName, 20, y);
      y += (wrappedName.length * 7) + 3;

      // Styles Badges & Vibe
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      const daerahText = `[${(recipe.daerah || "UMUM").toUpperCase()}]`;
      doc.text(daerahText, 20, y);

      doc.setFont("Helvetica", "normal");
      doc.setTextColor(textGray[0], textGray[1], textGray[2]);
      const vibeLabel = isEn ? "Vibe: Green Kitchen Cooking" : "Vibe Masak: Kreasi Sehat Nusantara";
      doc.text(`${vibeLabel}  |  Est: ~15-20 m`, 55, y);

      // Light Divider
      y += 6;
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.2);
      doc.line(20, y, 190, y);

      // 3. INGREDIENTS LIST
      y += 10;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(translations[language].recipeIngredientsTitle, 20, y);

      y += 5;
      recipe.bahan_dipakai.forEach((ingredient) => {
        const cleanIngredient = ingredient.replace(/\*\*/g, "");
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(textDark[0], textDark[1], textDark[2]);
        doc.text("-  " + cleanIngredient, 25, y);

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(26, 120, 60);
        doc.text(isEn ? " (detected from fridge photo)" : " (dari foto kulkasmu)", 27 + doc.getTextWidth("-  " + cleanIngredient), y);
        y += 6;
      });

      // 4. DIRECTIONS SECTION
      y += 4;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(translations[language].recipeStepsTitle, 20, y);

      y += 6;
      recipe.langkah.forEach((step, index) => {
        const cleanStep = step.replace(/\*\*/g, "");
        // Line constraint check
        if (y > 250) {
          doc.addPage();
          
          // Header bar style on new pages
          doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.rect(0, 0, 210, 18, "F");
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(255, 255, 255);
          doc.text("WasteNot - " + recipeName, 20, 11);
          
          y = 30;
        }

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(`${index + 1}.`, 22, y);

        doc.setFont("Helvetica", "normal");
        doc.setTextColor(textDark[0], textDark[1], textDark[2]);
        
        const wrappedStep = doc.splitTextToSize(cleanStep, 155);
        doc.text(wrappedStep, 28, y);
        y += (wrappedStep.length * 5) + 3;
      });

      // 5. ENVIRONMENTAL IMPACT SECTION
      if (y > 225) {
        doc.addPage();
        
        // Header bar on impact box new page
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, 0, 210, 18, "F");
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text("WasteNot - " + recipeName, 20, 11);

        y = 30;
      } else {
        y += 6;
      }

      // Elegant background filled rectangle for impact report (#EAF3DE)
      doc.setFillColor(234, 243, 222);
      doc.rect(20, y, 170, 32, "F");

      // Card Header
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(translations[language].recipeImpactTitle, 25, y + 6);

      // Contribution Rows
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);

      const estWaste = recipe.estimasi_waste || 250;
      const rupiahSaved = Math.round(estWaste * 18.281).toLocaleString("id-ID");
      const carbonSaved = (estWaste / 1000 * 0.328).toFixed(2);
      const treeSaved = (estWaste / 1000 * 0.031).toFixed(3);

      const savesText = `${translations[language].recipeImpactSaves}: Rp ${rupiahSaved}`;
      const carbonText = `${translations[language].recipeImpactCarbon} ${carbonSaved} kg CO2`;
      const treesText = `${translations[language].recipeImpactTrees} ${treeSaved} ${isEn ? "trees" : "pohon"}`;

      doc.text(`- ${savesText}`, 27, y + 12);
      doc.text(`- ${carbonText}`, 27, y + 17);
      doc.text(`- ${treesText}`, 27, y + 22);

      // Hero Tag Without Emoji
      const badgeText = isEn ? "You are an environmental hero!" : "Kamu pahlawan lingkungan!";
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(16, 120, 60);
      doc.text(badgeText, 27, y + 27);

      // 6. FOOTER WITH THIN GREEN SEPARATOR LINE
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.25);
      doc.line(20, 271, 190, 271);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(textGray[0], textGray[1], textGray[2]);
      doc.text("Crafted by Raihan Darma · WasteNot AI", 20, 276);
      doc.text("wastenot-478604489147.asia-southeast1.run.app", 20, 280);

      const todayStr = new Date().toLocaleDateString(isEn ? "en-US" : "id-ID", {
        year: "numeric", month: "long", day: "numeric"
      });
      doc.text(`Generated: ${todayStr}`, 190, 276, { align: "right" });
      doc.text(isEn ? "Share your cooking journey: #JuaraVibeCoding" : "Bagikan perjalanan masakmu: #JuaraVibeCoding", 190, 280, { align: "right" });

      // Custom Name format: "WasteNot-[NamaResep]-[Tanggal].pdf"
      const dateFormatted = new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }).replace(/\//g, ""); // e.g. 24052026

      const sanitizedName = recipeName.replace(/[^a-zA-Z0-9]/g, "");
      const fileName = `WasteNot-${sanitizedName}-${dateFormatted}.pdf`;

      doc.save(fileName);
      showToast(translations[language].toastPdfSuccess);
    } catch (error) {
      console.error("PDF generation error:", error);
      alert(isEn ? "Failed to save PDF." : "Gagal menyimpan PDF.");
    }
  };

  // Bilingual and Dark Mode support
  const [language, setLanguage] = useState<"id" | "en">(() => {
    return (localStorage.getItem("wastenot_lang") as "id" | "en") || "id";
  });
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("wastenot_dark") === "true";
  });
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Today's dynamic baselined wastage counter (starts from elapsed seconds in current day)
  const [foodWastedToday, setFoodWastedToday] = useState<number>(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const secondsToday = (now.getTime() - startOfDay.getTime()) / 1000;
    return Math.max(0, secondsToday * 634.19);
  });

  // Authentication & Onboarding states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [onboardingStep, setOnboardingStep] = useState<number>(0); // 0: none, 1: role select, 2: affirmation
  const [selectedOnboardingRole, setSelectedOnboardingRole] = useState<"Mahasiswa" | "Orang tua" | "Anak kos" | "Profesional" | "">("");
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  // Base state of statistics
  const [totalSavedWeight, setTotalSavedWeight] = useState<number>(12800);
  const [totalRecipesMade, setTotalRecipesMade] = useState<number>(14);

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Save states to localStorage and apply theme
  useEffect(() => {
    localStorage.setItem("wastenot_lang", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("wastenot_dark", String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Track dynamic national food wastage
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsedSeconds = (Date.now() - startTime) / 1000;
      setFoodWastedSinceOpen(elapsedSeconds * 634.19); // ~635 kg/second based on 20 million tons/year

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const secondsToday = (now.getTime() - startOfDay.getTime()) / 1000;
      setFoodWastedToday(Math.max(0, secondsToday * 634.19));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Sync auth and load user profile from Firestore on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (srvUser) => {
      if (srvUser) {
        setCurrentUser(srvUser);
        
        // 3. FALLBACK: Check localStorage FIRST before Firestore to determine if onboarding is needed
        const isAlreadyOnboarded = localStorage.getItem("wastenot_onboarded") === "true";
        const storedRole = localStorage.getItem("wastenot_role");
        
        if (isAlreadyOnboarded) {
          console.log("Onboarding skip: User is already onboarded according to localStorage.");
          setOnboardingStep(0);
          if (storedRole) {
            setSelectedOnboardingRole(storedRole as any);
          }
          setAuthLoading(false); // don't block user, let them in right away!
        }
        
        try {
          const docRef = doc(db, "users", srvUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setTotalSavedWeight(data.cookingStats?.kgSaved ?? 0);
            setTotalRecipesMade(data.cookingStats?.recipesCooked ?? 0);
            
            // Only update onboardingStep if localStorage fallback didn't resolve it yet
            if (!isAlreadyOnboarded) {
              if (data.firstLogin !== false) {
                setOnboardingStep(1);
              } else {
                setOnboardingStep(0);
                if (data.selectedRole) {
                  setSelectedOnboardingRole(data.selectedRole);
                }
              }
            }
          } else {
            // New user, trigger 2-step onboarding
            if (!isAlreadyOnboarded) {
              setTotalSavedWeight(0);
              setTotalRecipesMade(0);
              setOnboardingStep(1);
            }
          }
        } catch (error) {
          console.error("Error reading profile document on login", error);
        } finally {
          setAuthLoading(false);
        }
      } else {
        setCurrentUser(null);
        setTotalSavedWeight(12800);
        setTotalRecipesMade(14);
        setOnboardingStep(0);
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const getFirstName = (name?: string | null) => {
    if (!name) return "Pahlawan";
    const parts = name.trim().split(/\s+/);
    return parts[0] || "Pahlawan";
  };

  const firstName = currentUser ? getFirstName(currentUser.displayName) : "Pahlawan";

  const handleMulaiSekarang = () => {
    setView("dashboard");
    setTimeout(() => {
      const el = document.getElementById("dashboard-root");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }, 120);
  };


  // Custom visual uniqueness states
  const [isEmergencyMode, setIsEmergencyMode] = useState<boolean>(false);
  const [cookingVibe, setCookingVibe] = useState<string>("quick");

  // Solution criteria last cooking impact state
  const [lastCookingImpact, setLastCookingImpact] = useState<{
    recipeName: string;
    grams: number;
    moneySaved: number;
    co2Saved: number;
    acHours: number;
    portions: number;
  } | null>(null);

  // Progressive disclosure visibility state map
  const [visibleNutrition, setVisibleNutrition] = useState<Record<string, boolean>>({});
  const [visibleShelfLife, setVisibleShelfLife] = useState<Record<string, boolean>>({});

  // Track state of user selections & analyses
  const [selectedPreset, setSelectedPreset] = useState<PresetKitchenImg | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [unclearError, setUnclearError] = useState<string | null>(null);

  // Active recipes list (initialize to null for clean Step A linear onboarding)
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResult | null>(null);

  // Extra UX layout states
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [completedCooking, setCompletedCooking] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState<boolean>(true);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [activeRegion, setActiveRegion] = useState<string>("Semua");

  const regions = [
    { value: "Semua", label: "Semua Nusantara", icon: "🇮🇩" },
    { value: "Jawa", label: "Khas Jawa", icon: "🍲" },
    { value: "Sumatra", label: "Khas Sumatra", icon: "🌶️" },
    { value: "Bali", label: "Khas Nusa/Bali", icon: "🥥" },
    { value: "Sulawesi", label: "Khas Sulawesi/Timur", icon: "🐟" }
  ];

  const recipesList = analysisResult?.recipes || [];
  const filteredRecipes = activeRegion === "Semua"
    ? recipesList
    : recipesList.filter(rec => {
        const d = (rec.daerah || "").toLowerCase();
        const act = activeRegion.toLowerCase();
        return d.includes(act) || act.includes(d);
      });

  // Custom chat box history
  const [chatInput, setChatInput] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    return [
      {
        id: "welcome-1",
        sender: "assistant",
        text: "Halo kak! Saya asisten dapur ramahmu yang siap membantu mengubah potensi bahan makanan sisa menjadi masakan lezat bernilai gizi tinggi! Silakan coba kirim foto, ketik sisa makananmu, atau tanyakan tips penyimpanan cerdas di sini ya! 🌱",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      }
    ];
  });

  // Save totals in localStorage
  useEffect(() => {
    localStorage.setItem("wastenot_saved_weight", totalSavedWeight.toString());
  }, [totalSavedWeight]);

  useEffect(() => {
    localStorage.setItem("wastenot_recipes_made", totalRecipesMade.toString());
  }, [totalRecipesMade]);

  // Handle preset clicks
  const handleSelectPreset = (preset: PresetKitchenImg) => {
    setSelectedPreset(preset);
  };

  const handleClearPreset = () => {
    setSelectedPreset(null);
  };

  // Perform API call to evaluate ingredients
  const handleAnalyzeIngredients = async (inputs: {
    image: string | null;
    textIngredients: string | null;
    regionFilter: string;
    isEmergencyMode: boolean;
    cookingVibe: string;
  }) => {
    setIsLoading(true);
    setUnclearError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: inputs.image,
          textIngredients: inputs.textIngredients,
          regionFilter: inputs.regionFilter,
          isEmergencyMode: inputs.isEmergencyMode,
          cookingVibe: inputs.cookingVibe,
          lang: language,
        })
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || "Gagal menghubungi server untuk menganalisis.");
      }

      const data = await response.json();

      if (data.unclearPhotoError) {
        setUnclearError(data.unclearPhotoError);
        setIsLoading(false);
        return;
      }

      setAnalysisResult({
        detectedIngredients: data.detectedIngredients || [],
        recipes: data.recipes || [],
        pesan_sapaan: data.pesan_sapaan || "Yuk kita olah bahan sisa berharga ini menjadi hidangan spesial!",
        ingredients_info: data.ingredients_info || []
      });

      // Sound feedback for delightful micro-moment!
      playDing();

      // Reset selection and disclosure state maps
      setVisibleNutrition({});
      setVisibleShelfLife({});
      setSelectedRecipe(null);

      // Also append notifications in chat as if Assistant replied with enthusiasm
      const newAssistantMsg: ChatMessage = {
        id: `scan-${Date.now()}`,
        sender: "assistant",
        text: `${data.pesan_sapaan}\n\n*Saya telah mendeteksi bahan:* **${(data.detectedIngredients || []).join(", ")}**.\nSaya menyarankan masakan di bawah ini. Ayo segera selamatkan makanan ini! 🌿`,
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        analysis: data
      };

      setChatHistory(prev => [...prev, newAssistantMsg]);

    } catch (err: any) {
      console.error(err);
      alert(`Terjadi kesalahan: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Chat message submit
  const handleSendChat = async (overrideText?: string) => {
    const textToSend = overrideText || chatInput;
    if (!textToSend.trim() || isChatLoading) return;

    // Clear input immediately if not preset starter
    if (!overrideText) {
      setChatInput("");
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    };

    setChatHistory(prev => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: textToSend,
          history: chatHistory.slice(-6), // context of last 6 messages
          currentIngredients: analysisResult?.detectedIngredients || [],
          lang: language,
        })
      });

      if (!response.ok) {
        throw new Error("Gagal memperoleh saran chat.");
      }

      const data = await response.json();

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "assistant",
        text: data.text || "Mohon maaf, saya sedang kesulitan mengurai info ini. Yuk dicari lagi!",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      };

      setChatHistory(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: "assistant",
        text: "Waduh, koneksi asisten terputus sejenak. Pastikan GEMINI_API_KEY Anda sudah terkonfigurasi dengan benar di Secrets panel ya kak!",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      };
      setChatHistory(prev => [...prev, errMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Increment saved weight of food waste
  const handleSaveRecipeWeight = (grams: number, recipeName: string) => {
    const nextSavedWeight = totalSavedWeight + grams;
    const nextRecipesMade = totalRecipesMade + 1;

    setTotalSavedWeight(nextSavedWeight);
    setTotalRecipesMade(nextRecipesMade);

    if (currentUser) {
      const userDocRef = doc(db, "users", currentUser.uid);
      setDoc(userDocRef, {
        cookingStats: {
          kgSaved: nextSavedWeight,
          recipesCooked: nextRecipesMade
        }
      }, { merge: true }).catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
      });
    }

    // Calculate dynamic solution values for impacts
    const moneySavedMin = Math.round(grams * 48);
    const moneySavedMax = Math.round(grams * 72);
    // Bind base savings to Rp 12.000 - Rp 18.000 for standard weights
    const moneySaved = Math.max(12000, Math.min(18000, Math.round((moneySavedMin + moneySavedMax) / 2)));
    const co2Saved = Number((grams / 1000 * 1.2).toFixed(1)) || 0.3;
    const acHours = Math.round(co2Saved * 6.6) || 2;
    const portions = Math.max(1, Math.round(grams / 250));

    // Update state to trigger beautiful CountUp visual card
    setLastCookingImpact({
      recipeName: recipeName,
      grams: grams,
      moneySaved: moneySaved,
      co2Saved: co2Saved,
      acHours: acHours,
      portions: portions
    });

    // Cute Indonesian system feedback in the chat
    const logMsg: ChatMessage = {
      id: `save-${Date.now()}`,
      sender: "assistant",
      text: `Misi penyelamatan berhasil! Kamu baru saja menyelesaikan resep **${recipeName}** dan sukses menebus kembali **~${grams} gram** bahan pangan agar tidak berakhir di pembuangan sampah! Luar biasa peduli lingkungan koki Nusantara kita! 🌟`,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    };
    setChatHistory(prev => [...prev, logMsg]);
  };

  // Reset counters helper
  const handleResetCounters = () => {
    if (confirm("Apakah kamu yakin ingin menyetel ulang rekor penyelamatan makananmu?")) {
      setTotalSavedWeight(12800);
      setTotalRecipesMade(14);
    }
  };

  // Conversation Starter Questions
  const starters = [
    "Bagaimana cara menyimpan bawang putih agar tidak bertunas?",
    "Tips mendinginkan sisa nasi semalam agar aman dimasak esok pagi?",
    "Bagaimana memanfaatkan sisa kol atau wortel?"
  ];

  const kgValueGlobal = (totalSavedWeight / 1000).toFixed(2);

  const renderNavbar = () => {
    const t = translations[language];
    const userHasPhoto = !!currentUser?.photoURL;
    const userInitial = currentUser?.displayName?.charAt(0).toUpperCase() || (currentUser?.email?.charAt(0).toUpperCase() || "P");

    return (
      <nav id="top-navbar-zone" className={`fixed top-0 inset-x-0 h-16 bg-white/95 dark:bg-[#1a2e1a]/95 backdrop-blur-md border-b border-[#e8f5e9]/55 dark:border-emerald-905/30 z-50 flex items-center justify-between px-4 sm:px-12 transition-shadow duration-300 ${scrolled ? "shadow-[0_4px_16px_rgba(26,107,60,0.08)]" : "shadow-[0_1px_3px_rgba(0,0,0,0.02)]"}`}>
        {/* Left: WasteNot logo */}
        <button 
          id="btn-nav-logo"
          type="button"
          onClick={() => {
            setView("hero");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }} 
          className="flex items-center gap-2 cursor-pointer text-left bg-transparent border-0"
        >
          <CookingPot className="w-6 h-6 text-[#1a6b3c] dark:text-emerald-400" />
          <span className="font-extrabold text-[#1a6b3c] dark:text-emerald-400 text-xl tracking-tight">WasteNot</span>
        </button>
        
        {/* Center: Beranda | Resepku | Dampakku */}
        <div className="flex items-center gap-2 md:gap-4 h-full relative">
          <div className="relative flex items-center h-full">
            <button 
              id="btn-nav-home"
              type="button"
              onClick={() => {
                setView("hero");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`text-[11px] sm:text-xs md:text-sm font-black transition-colors cursor-pointer px-1 py-1 h-full flex items-center relative ${view === "hero" ? "text-[#1a6b3c] dark:text-emerald-400" : "text-slate-500 hover:text-[#1a6b3c]"}`}
            >
              🏠 {t.navHome}
              {view === "hero" && (
                <motion.div layoutId="navUnderline" className="absolute bottom-0 inset-x-0 h-0.5 bg-[#1a6b3c] dark:bg-emerald-400 animate-fade-in" />
              )}
            </button>
          </div>
          <span className="text-slate-300 dark:text-slate-700 text-xs text-center hidden sm:inline">|</span>
          <div className="relative flex items-center h-full">
            <button 
              id="btn-nav-recipes"
              type="button"
              onClick={() => {
                setView("recipes");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }} 
              className={`text-[11px] sm:text-xs md:text-sm font-black transition-colors cursor-pointer px-1 py-1 h-full flex items-center relative ${view === "recipes" ? "text-[#1a6b3c] dark:text-emerald-400" : "text-slate-500 hover:text-[#1a6b3c]"}`}
            >
              📖 {t.navRecipes}
              {view === "recipes" && (
                <motion.div layoutId="navUnderline" className="absolute bottom-0 inset-x-0 h-0.5 bg-[#1a6b3c] dark:bg-emerald-400 animate-fade-in" />
              )}
            </button>
          </div>
          <span className="text-slate-300 dark:text-slate-700 text-xs text-center hidden sm:inline">|</span>
          <div className="relative flex items-center h-full">
            <button 
              id="btn-nav-impact"
              type="button"
              onClick={() => {
                setView("dashboard");
                setTimeout(() => {
                  const el = document.getElementById("dampak-container") || document.getElementById("dashboard-root");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }} 
              className={`text-[11px] sm:text-xs md:text-sm font-black transition-colors cursor-pointer px-1 py-1 h-full flex items-center relative ${view === "dashboard" && lastCookingImpact ? "text-[#1a6b3c] dark:text-emerald-400" : "text-slate-500 hover:text-[#1a6b3c]"}`}
            >
              🌿 {t.navImpact}
              {view === "dashboard" && lastCookingImpact && (
                <motion.div layoutId="navUnderline" className="absolute bottom-0 inset-x-0 h-0.5 bg-[#1a6b3c] dark:bg-emerald-400 animate-fade-in" />
              )}
            </button>
          </div>
        </div>

        {/* Right: Toggles + Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3.5">
          {/* Dark Mode toggle */}
          <button
            id="toggle-darkmode"
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-yellow-400 flex items-center justify-center cursor-pointer transition-all hover:scale-105"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Language toggle flag */}
          <button
            id="toggle-language"
            type="button"
            onClick={() => setLanguage(language === "id" ? "en" : "id")}
            className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-full bg-emerald-50 text-[#1a6b3c] dark:bg-[#112d1c] dark:text-emerald-400 hover:bg-emerald-100 font-extrabold text-[10px] sm:text-[11px] cursor-pointer transition-all select-none hover:scale-105"
            title={language === "id" ? "Change to English" : "Ubah ke Bahasa Indonesia"}
          >
            {language === "id" ? "🇮🇩 ID" : "🇬🇧 EN"}
          </button>

          {/* Google profile photo / fallback with dropdown click */}
          <div className="relative">
            <button
              id="profile-dropdown-trigger"
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-emerald-100 hover:border-[#1a6b3c] focus:outline-none overflow-hidden cursor-pointer transition-all active:scale-95 flex items-center justify-center bg-emerald-50 dark:bg-[#112d1c]"
            >
              {userHasPhoto ? (
                <img 
                  src={currentUser?.photoURL!}
                  alt="Google Profile" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-[#1a6b3c] dark:bg-emerald-600 text-white flex items-center justify-center font-extrabold text-sm">
                  {userInitial}
                </div>
              )}
            </button>

            {/* Nav Dropdown */}
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 mt-3.5 w-56 bg-white dark:bg-[#112d1c] border border-emerald-100/50 dark:border-emerald-900/30 rounded-2xl shadow-[0_10px_30px_-5px_rgba(26,107,60,0.12)] py-2.5 z-55 text-left overflow-hidden">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-emerald-900/20 flex flex-col space-y-0.5 truncate">
                    <div className="font-extrabold text-xs text-slate-850 dark:text-slate-100 flex items-center gap-1.5 truncate">
                      <span className="text-sm">👤</span>
                      <span className="truncate">{currentUser?.displayName || "Pengguna"}</span>
                    </div>
                    {currentUser?.email && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 truncate pl-5 block">
                        📧 {currentUser.email}
                      </span>
                    )}
                  </div>
                  
                  {/* Link back to profile */}
                  <button
                    id="btn-dropdown-impact"
                    type="button"
                    onClick={() => {
                      setView("dashboard");
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-5 py-2 text-xs font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer mt-1"
                  >
                    🌿 {t.navProfileImpact}
                  </button>

                  <div className="h-[1px] bg-slate-100 dark:bg-emerald-900/25 my-1" />

                  <button
                    id="btn-dropdown-signout"
                    type="button"
                    onClick={async () => {
                      setDropdownOpen(false);
                      try {
                        await signOut(auth);
                      } catch (e) {
                        console.error("Sign out failed", e);
                      }
                    }}
                    className="w-full text-left px-5 py-2 text-xs font-black text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    🚪 {t.navSignOut}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>
    );
  };

  // CHECK AUTHENTICATION LOADERS / VIEWS
  if (authLoading) {
    return (
      <div className="w-full min-h-screen bg-[#FAFDF6] flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="text-white w-14 h-14 bg-[#1a6b3c] rounded-3xl flex items-center justify-center shadow-lg mb-4"
        >
          <CookingPot className="w-8 h-8" />
        </motion.div>
        <p className="text-emerald-950 font-serif italic font-bold text-lg animate-pulse">Menyiapkan dapur WasteNot...</p>
        <p className="text-xs text-slate-400 mt-1">Mengamankan misi penyelamatan makanan kamu</p>
      </div>
    );
  }

  if (!currentUser) {
    const handleGoogleSignIn = async () => {
      setIsLoggingIn(true);
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (e) {
        console.error("Google login failed", e);
      } finally {
        setIsLoggingIn(false);
      }
    };

    const t = translations[language];

    const floatingEmojis = [
      { emoji: "🥦", delay: 0, x: "12%", top: "18%" },
      { emoji: "🥕", delay: 1.5, x: "82%", top: "28%" },
      { emoji: "🍳", delay: 3, x: "18%", top: "72%" },
      { emoji: "🌿", delay: 4.5, x: "78%", top: "82%" },
    ];

    return (
      <div className="w-full min-h-screen flex flex-col lg:flex-row bg-[#FAFDF6] overflow-hidden animate-fade-in">
        
        {/* LEFT PANE (60% width, orders second on mobile - collapses below right) */}
        <div className="order-2 lg:order-1 lg:w-[60%] bg-[#1a6b3c] text-white p-8 sm:p-16 flex flex-col justify-between relative overflow-hidden min-h-[360px] lg:min-h-screen">
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="leaf-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M20 0 C30 10, 30 20, 20 40 C10 20, 10 10, 20 0 Z" fill="none" stroke="white" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#leaf-grid)" />
            </svg>
          </div>

          {/* Top Logo / decorative text */}
          <div className="flex items-center space-x-2 relative z-10">
            <CookingPot className="w-5 h-5 text-emerald-300" />
            <span className="font-extrabold text-[11px] uppercase tracking-widest text-emerald-200">
              {language === "en" ? "GLOBAL ENVIRONMENTAL MISSION" : "MISI PENYELAMATAN LINGKUNGAN"}
            </span>
          </div>

          {/* Core content */}
          <div className="my-auto py-12 lg:py-0 space-y-8 relative z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif italic font-bold leading-tight tracking-tight max-w-xl">
              {t.loginStories}
            </h2>
            
            <div className="space-y-4 max-w-sm">
              <div className="flex items-center space-x-3 bg-white/5 backdrop-blur-3xs p-3.5 rounded-2xl hover:bg-white/10 transition-all duration-300">
                <span className="text-xl text-emerald-350">✓</span>
                <p className="text-sm sm:text-base font-extrabold">{t.loginProp1}</p>
              </div>
              <div className="flex items-center space-x-3 bg-white/5 backdrop-blur-3xs p-3.5 rounded-2xl hover:bg-white/10 transition-all duration-300">
                <span className="text-xl text-emerald-350">✓</span>
                <p className="text-sm sm:text-base font-extrabold">{t.loginProp2}</p>
              </div>
              <div className="flex items-center space-x-3 bg-white/5 backdrop-blur-3xs p-3.5 rounded-2xl hover:bg-white/10 transition-all duration-300">
                <span className="text-xl text-emerald-350">✓</span>
                <p className="text-sm sm:text-base font-extrabold">{t.loginProp3}</p>
              </div>
            </div>
          </div>

          {/* Real-time ticker counter */}
          <div className="relative z-10 border-t border-white/10 pt-6 mt-4">
            <p className="text-xs text-emerald-300 font-semibold tracking-wider block mb-1 uppercase">
              {language === "en" ? "REAL-TIME IMPACT ACCUMULATOR" : "AKUMULASI DAMPAK REAL-TIME"}
            </p>
            <div className="text-sm sm:text-base leading-relaxed flex flex-wrap items-center gap-1.5 font-bold">
              <span>{t.loginCounterLabel}</span>
              <span className="font-mono text-lg sm:text-xl text-yellow-300 px-3 py-0.5 bg-yellow-400/10 rounded-lg shadow-sm border border-yellow-400/25 animate-pulse min-w-[124px] text-center">
                {Math.round(foodWastedToday).toLocaleString("id-ID")}
              </span>
              <span>kg {language === "en" ? "of food" : "makanan"}</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANE (40% width, cream background - orders first on mobile) */}
        <div className="order-1 lg:order-2 lg:w-[40%] bg-[#FAFDF6] p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative min-h-[500px] lg:min-h-screen">
          
          {/* Subtle background emojis */}
          {floatingEmojis.map((f, idx) => (
            <motion.span
              key={idx}
              initial={{ y: 0 }}
              animate={{ y: [-15, 15, -15], rotate: [0, 5, -5, 0] }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: f.delay
              }}
              style={{ left: f.x, top: f.top }}
              className="absolute text-4xl select-none opacity-20 pointer-events-none"
            >
              {f.emoji}
            </motion.span>
          ))}

          {/* Top Header toolbar */}
          <div className="flex items-center justify-between w-full relative z-20">
            {/* Logo small */}
            <div className="flex items-center space-x-2">
              <CookingPot className="w-5 h-5 text-[#1a6b3c]" />
              <span className="font-black text-xs text-[#1a6b3c] tracking-wider uppercase">WasteNot</span>
            </div>

            {/* Language toggle flag in login pane */}
            <button
              type="button"
              onClick={() => setLanguage(language === "id" ? "en" : "id")}
              className="px-3 py-1.5 rounded-full bg-emerald-50 text-[#1a6b3c] font-black text-[11px] cursor-pointer shadow-xs transition-transform hover:scale-105 select-none"
              title={language === "id" ? "Switch to English" : "Ubah ke Bahasa Indonesia"}
            >
              {language === "id" ? "🇮🇩 ID" : "🇬🇧 EN"}
            </button>
          </div>

          {/* Center Column Login container */}
          <div className="my-auto max-w-sm w-full mx-auto space-y-8 relative z-20">
            
            {/* Main Brand Seal */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-[#1a6b3c] rounded-[22px] flex items-center justify-center text-white shadow-lg shadow-[#1a6b3c]/20 hover:scale-105 transition-all">
                <CookingPot className="w-9 h-9" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-3xl sm:text-4xl font-serif italic text-[#1a6b3c] tracking-tight font-black">
                  {t.welcome}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-extrabold max-w-[280px] mx-auto leading-relaxed">
                  {t.loginSubtext}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="w-full h-[1px] bg-slate-200/50" />

            {/* Google pill trigger */}
            <div className="space-y-4">
              <motion.button
                onClick={handleGoogleSignIn}
                disabled={isLoggingIn}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                className="w-full bg-black hover:bg-slate-900 text-white font-black text-sm py-4 px-6 rounded-full flex items-center justify-center gap-3 transition-colors shadow-md hover:shadow-lg cursor-pointer min-h-[56px]"
              >
                {isLoggingIn ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin flex-shrink-0" />
                ) : (
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.76 12.27c0-.83-.07-1.63-.2-2.4H12v4.54h6.6c-.28 1.48-1.12 2.74-2.38 3.58v2.98h3.84c2.25-2.07 3.7-5.11 3.7-8.7z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.84-2.98c-1.07.72-2.44 1.15-4.09 1.15-3.15 0-5.81-2.13-6.76-5H1.32v3.08C3.32 20.21 7.37 24 12 24z" />
                    <path fill="#FBBC05" d="M5.24 14.26c-.24-.72-.38-1.49-.38-2.28c0-.79.14-1.56.38-2.28V6.62H1.32c-.81 1.62-1.27 3.44-1.27 5.38s.46 3.76 1.27 5.38l3.92-3.12z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.32 3.79 1.32 7.62l3.92 3.12c.95-2.87 3.61-5 6.76-5z" />
                  </svg>
                )}
                <span>{isLoggingIn ? t.googleBtnLoading : t.googleBtn}</span>
              </motion.button>

              <p className="text-[10px] text-slate-400 font-extrabold text-center uppercase tracking-wider">
                {t.freeNoCard}
              </p>
            </div>

          </div>

          {/* Static bottom bar */}
          <div className="text-center text-[10px] text-slate-400 relative z-20">
            <p>&copy; {new Date().getFullYear()} WasteNot AI. All rights reserved.</p>
          </div>

        </div>

      </div>
    );
  }

  if (onboardingStep > 0) {
    const handleNextOnboarding = () => {
      if (onboardingStep === 1) {
        if (!selectedOnboardingRole) {
          alert(translations[language].selectRoleAlert);
          return;
        }
        setOnboardingStep(2);
      }
    };

    const handleCompleteOnboarding = async () => {
      if (!currentUser || !selectedOnboardingRole) return;
      
      // 1. BUTTON FIX: Add console.log to verify button click is registered
      console.log("BUKA DAPURKU button clicked, navigating to main app...");
      
      // 3. FALLBACK: Save to localStorage first so the user is immediately onboarded & unblocked
      localStorage.setItem("wastenot_onboarded", "true");
      localStorage.setItem("wastenot_role", selectedOnboardingRole);
      
      setTotalSavedWeight(0);
      setTotalRecipesMade(0);
      
      // Navigate to the main app instantly by resetting onboarding step and setting main view
      setOnboardingStep(0);
      setView("hero");
      
      // 2. FIRESTORE FIX: Run save to Firestore in the background. DO NOT wait (await) for it to complete.
      // If it fails, users are already safely in the main app.
      const saveFirestoreProfile = async () => {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          await setDoc(userDocRef, {
            uid: currentUser.uid,
            displayName: currentUser.displayName || "Pengguna WasteNot",
            email: currentUser.email || "",
            photoURL: currentUser.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80",
            selectedRole: selectedOnboardingRole,
            role: selectedOnboardingRole, // save both 'selectedRole' and 'role'
            firstLogin: false,
            createdAt: new Date().toISOString(),
            cookingStats: {
              kgSaved: 0,
              recipesCooked: 0
            }
          });
          console.log("Onboarding data successfully saved to Firestore in background.");
        } catch (error) {
          console.error("Firestore save failed in background, but user is not blocked:", error);
        }
      };
      
      // Trigger Firestore save without await
      saveFirestoreProfile();
    };

    const t = translations[language];

    // Helper to extract first name
    const rawName = currentUser?.displayName || "Sobat";
    const firstName = rawName.split(" ")[0];

    // Role-based custom quotes
    let activeQuote = t.quoteStudent;
    if (selectedOnboardingRole === "Anak kos") activeQuote = t.quoteKos;
    if (selectedOnboardingRole === "Orang tua") activeQuote = t.quoteParent;
    if (selectedOnboardingRole === "Profesional") activeQuote = t.quotePro;

    return (
      <div className="w-full min-h-screen bg-[#FAFDF6] flex flex-col items-center justify-center p-6 animate-fade-in">
        
        {/* Floating language switcher at onboarding top */}
        <div className="absolute top-6 right-6 z-20">
          <button
            type="button"
            onClick={() => setLanguage(language === "id" ? "en" : "id")}
            className="px-3 py-1.5 rounded-full bg-white border border-slate-100 text-[#1a6b3c] font-black text-xs cursor-pointer shadow-xs transition-transform hover:scale-105 select-none"
          >
            {language === "id" ? "🇮🇩 ID" : "🇬🇧 EN"}
          </button>
        </div>

        <div className="w-full max-w-lg bg-white p-6 sm:p-10 rounded-[2.5rem] border border-emerald-100/60 shadow-[0_12px_45px_rgba(26,107,60,0.06)] flex flex-col items-center text-center">
          
          {onboardingStep === 1 ? (
            /* ================= STEP 1 ================= */
            <div className="space-y-6 w-full flex flex-col items-center">
              
              {/* Progress counter */}
              <div className="flex items-center gap-2 pr-12 pl-12 relative animate-fade-in">
                <span className="text-[#1a6b3c] text-xl">●</span>
                <span className="text-slate-200 text-xl">○</span>
              </div>

              {/* Title & guidance */}
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-slate-800 tracking-tight leading-tight">
                  {t.onboardingTitle}
                </h2>
                <p className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">
                  {t.onboardingSubtext}
                </p>
              </div>

              {/* Grid 4 cards */}
              <div className="grid grid-cols-2 gap-4 w-full pt-2">
                {[
                  { id: "Mahasiswa", label: t.roleStudentTitle, emoji: "🧑‍🎓", desc: t.roleStudentDesc },
                  { id: "Orang tua", label: t.roleParentTitle, emoji: "👨‍👩‍👧", desc: t.roleParentDesc },
                  { id: "Anak kos", label: t.roleKosTitle, emoji: "🏃", desc: t.roleKosDesc },
                  { id: "Profesional", label: t.roleProTitle, emoji: "👨‍💼", desc: t.roleProDesc }
                ].map((card) => {
                  const isSelected = selectedOnboardingRole === card.id;
                  return (
                    <motion.button
                      key={card.id}
                      type="button"
                      whileHover={{ scale: isSelected ? 1.02 : 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedOnboardingRole(card.id as any)}
                      className={`p-4 rounded-[24px] border text-center transition-all duration-350 flex flex-col items-center justify-center space-y-1 cursor-pointer min-h-[120px] ${
                        isSelected 
                          ? "bg-[#1a6b3c] border-[#1a6b3c] text-white shadow-md shadow-[#1a6b3c]/20" 
                          : "bg-emerald-50/20 border-emerald-100/40 text-[#1a6b3c] hover:bg-emerald-50/50"
                      }`}
                    >
                      <span className="text-3xl mb-1">{card.emoji}</span>
                      <span className="font-extrabold text-xs sm:text-sm">{card.label}</span>
                      <span className={`text-[9px] leading-tight ${isSelected ? "text-emerald-100" : "text-slate-550 font-medium"}`}>{card.desc}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* "LANJUTKAN →" button */}
              <div className="w-full pt-4">
                <button
                  type="button"
                  onClick={handleNextOnboarding}
                  className={`w-full font-extrabold text-sm py-4 px-6 rounded-full flex items-center justify-center gap-2 transition-all shadow-md active:translate-y-[1px] cursor-pointer ${
                    selectedOnboardingRole 
                      ? "bg-[#1a6b3c] hover:bg-[#14522e] text-white hover:shadow-lg" 
                      : "bg-slate-200 text-slate-450 border border-slate-200 shadow-none cursor-not-allowed"
                  }`}
                  disabled={!selectedOnboardingRole}
                >
                  <span>{t.btnContinue}</span>
                </button>
              </div>

            </div>
          ) : (
            /* ================= STEP 2 ================= */
            <div className="space-y-6 w-full flex flex-col items-center">
              
              {/* Progress counter */}
              <div className="flex items-center gap-2 pr-12 pl-12 relative animate-pulse">
                <span className="text-slate-200 text-xl">○</span>
                <span className="text-[#1a6b3c] text-xl">●</span>
              </div>

              {/* Mint Circle Sprout Illustration */}
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-4xl shadow-sm text-emerald-800"
              >
                🌱
              </motion.div>

              {/* Quote */}
              <blockquote className="max-w-xs sm:max-w-sm border-l-2 border-emerald-100 pl-4 py-1 text-left">
                <p className="text-sm font-serif italic text-slate-650 leading-relaxed font-bold">
                  "{activeQuote}"
                </p>
                <cite className="text-[10px] text-slate-400 font-extrabold block mt-1 uppercase tracking-wider">
                  — {t.readyToCook} ({selectedOnboardingRole})
                </cite>
              </blockquote>

              {/* Welcome text */}
              <div className="space-y-1.5">
                <h2 className="text-xl sm:text-2xl font-black text-[#1a6b3c] leading-tight flex items-center justify-center gap-1.5">
                  {language === "en" ? `Welcome, ${firstName}! 🌿` : `Selamat datang, ${firstName}! 🌿`}
                </h2>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider max-w-sm leading-relaxed">
                  {language === "en" ? "Ready to make incredible dishes out of leftover items!" : "Misi penyelamatan makanan nusantara dimulai dari sekarang!"}
                </p>
              </div>

              {/* "BUKA DAPURKU →" button */}
              <div className="w-full pt-4">
                <button
                  type="button"
                  onClick={handleCompleteOnboarding}
                  className="w-full bg-[#1a6b3c] hover:bg-[#14522e] text-white font-extrabold text-sm py-4 px-6 rounded-full flex items-center justify-center gap-2 transition-all shadow-md active:translate-y-[1px] hover:shadow-lg cursor-pointer"
                >
                  <span>{t.btnOpenKitchen}</span>
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    );
  }

  // VIEW 1: HERO PAGE / LANDING
  if (view === "hero") {
    const t = translations[language];

    return (
      <div className="w-full min-h-screen bg-[#FAFDF6] text-slate-800 font-sans flex flex-col relative pt-16 animate-fade-in">
        {/* GLOBAL NAVBAR */}
        {renderNavbar()}
 
        <main className="max-w-5xl mx-auto w-full flex flex-col items-center text-center py-12 space-y-12">
          {/* Centered App Brand Hero Logo Container & Initial Brand Accent */}
          <div className="space-y-6 flex flex-col items-center">
            <div className="w-20 h-20 bg-[#1a6b3c] rounded-3xl flex items-center justify-center text-white shadow-sm hover:scale-105 transition-all">
              <CookingPot className="w-11 h-11" />
            </div>
 
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif italic text-[#1a6b3c] tracking-tight max-w-3xl leading-tight font-bold">
                Ubah Sisa Jadi Sajian
              </h1>
              
              <p className="text-base sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
                Foto bahan kulkasmu atau ketik manual bahan dapur yang tersisa. AI langsung membuat resep masakan khas Indonesia dalam hitungan detik.
              </p>
            </div>

            {/* TRUST SIGNALS: Below the hero headline */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <div className="flex items-center gap-2">
                {/* Overlapping Avatars */}
                <div className="flex -space-x-2">
                  <img
                    className="w-8 h-8 rounded-full border-2 border-white object-cover"
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80"
                    alt="Keluarga Indonesia 1"
                    referrerPolicy="no-referrer"
                  />
                  <img
                    className="w-8 h-8 rounded-full border-2 border-white object-cover"
                    src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&h=100&q=80"
                    alt="Keluarga Indonesia 2"
                    referrerPolicy="no-referrer"
                  />
                  <img
                    className="w-8 h-8 rounded-full border-2 border-white object-cover"
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80"
                    alt="Keluarga Indonesia 3"
                    referrerPolicy="no-referrer"
                  />
                  <img
                    className="w-8 h-8 rounded-full border-2 border-white object-cover"
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80"
                    alt="Keluarga Indonesia 4"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="text-xs text-slate-500 font-medium">Dipercaya 500+ keluarga Indonesia</span>
              </div>

              {/* Google Gemini Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-[#1a6b3c] text-xs font-semibold rounded-full border border-[#e8f5e9]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Built with Google Gemini AI</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            {/* CTA Accent Button using f5c842 */}
            <button
              onClick={handleMulaiSekarang}
              className="bg-[#f5c842] hover:bg-[#e0b430] text-slate-900 font-extrabold text-lg px-10 py-4.5 rounded-2xl transition-all duration-200 shadow-md cursor-pointer transform hover:scale-[1.02] ring-2 ring-amber-300/50 flex items-center justify-center gap-2 min-h-[48px]"
            >
              <span>Mulai Sekarang</span>
              <span>🍲</span>
            </button>
            <p className="text-xs text-slate-400 font-medium">
              20 juta ton food waste Indonesia per tahun. Kita bisa ubah itu bersama.
            </p>

            {/* Smooth scroll down arrow */}
            <button
              onClick={handleMulaiSekarang}
              className="text-slate-400 hover:text-[#1a6b3c] font-black text-xl animate-bounce pt-4 flex flex-col items-center gap-1 cursor-pointer"
            >
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400">Scroll ke Bawah</span>
              <span>↓</span>
            </button>
          </div>

          {/* 3-Column Food Photo Grid showing real Indonesian dishes */}
          <div className="w-full max-w-4xl pt-8">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
              Menu hasil kreasi penyelamat bahan pangan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-[20px] overflow-hidden border border-[#e8f5e9] shadow-[0_8px_24px_rgba(0,0,0,0.10)] hover:-translate-y-[6px] transition-all duration-300 ease-in-out relative">
                <span className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-xs tracking-wide z-10">
                  ✓ Bisa dibuat dari sisa
                </span>
                <div className="aspect-[4/3] bg-slate-50 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&h=450&q=80"
                    alt="Bayam Tumis"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-4 border-t border-[#e8f5e9] text-left">
                  <p className="text-sm font-bold text-slate-800">Tumis Bayam Bawang Putih</p>
                  <p className="text-xs text-slate-500 mt-0.5">Alternatif sayuran layu agar tetap bergizi</p>
                </div>
              </div>

              <div className="bg-white rounded-[20px] overflow-hidden border border-[#e8f5e9] shadow-[0_8px_24px_rgba(0,0,0,0.10)] hover:-translate-y-[6px] transition-all duration-300 ease-in-out relative">
                <span className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-xs tracking-wide z-10">
                  ✓ Bisa dibuat dari sisa
                </span>
                <div className="aspect-[4/3] bg-slate-50 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&h=450&q=80"
                    alt="Orak-arik Telur"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-4 border-t border-[#e8f5e9] text-left">
                  <p className="text-sm font-bold text-slate-800">Orak-Arik Telur & Kol</p>
                  <p className="text-xs text-slate-500 mt-0.5">Campuran orak-arik cepat lauk praktis</p>
                </div>
              </div>

              <div className="bg-white rounded-[20px] overflow-hidden border border-[#e8f5e9] shadow-[0_8px_24px_rgba(0,0,0,0.10)] hover:-translate-y-[6px] transition-all duration-300 ease-in-out relative">
                <span className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-xs tracking-wide z-10">
                  ✓ Bisa dibuat dari sisa
                </span>
                <div className="aspect-[4/3] bg-slate-50 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&h=450&q=80"
                    alt="Nasi Goreng"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-4 border-t border-[#e8f5e9] text-left">
                  <p className="text-sm font-bold text-slate-800">Nasi Goreng Sosis Kulkas</p>
                  <p className="text-xs text-slate-500 mt-0.5">Memanfaatkan sisa nasi dingin semalam</p>
                </div>
              </div>
            </div>
          </div>

          {/* PROBLEM CRITERIA: 1. Food Waste Crisis Banner */}
          <div id="crisis-section" className="w-full max-w-4xl bg-[#e8f5e9]/30 rounded-[2rem] border border-[#e8f5e9] p-8 md:p-12 text-center space-y-6 scroll-mt-20">
            <div className="space-y-4 flex flex-col items-center">
              <span className="text-[11px] font-black text-red-650 bg-red-100 border border-red-200 px-3.5 py-1.5 rounded-full inline-flex items-center gap-2 uppercase tracking-wide">
                NASIONAL DARURAT FOOD WASTE <span className="blink-dot w-2 h-2 bg-red-650 rounded-full inline-block" />
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif italic font-bold text-[#1a6b3c] tracking-tight leading-tight max-w-2xl mt-2">
                Indonesia Buang Rp551 Triliun Makanan Per Tahun
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
                Setiap sayur, daging, dan nasi yang kita buang memperparah krisis ekonomi dan berkontribusi langsung pada pemanasan global.
              </p>
            </div>

            {/* Real-time ticker counter */}
            <div style={{ backgroundColor: "#FFF5F5", borderColor: "#FFCDD2" }} className="border rounded-2xl p-5 text-center text-xs sm:text-sm font-black text-red-950 mt-4 leading-relaxed shadow-xs max-w-2xl mx-auto">
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <span className="inline-flex items-center gap-1">
                  <span className="animate-pulse">🔴</span>
                  <span>Sejak kamu buka halaman ini, Indonesia sudah membuang</span>
                </span>
                <span style={{ color: "#C62828" }} className="font-extrabold text-lg sm:text-2xl px-3 py-1 bg-white border border-[#FFCDD2] rounded-xl shadow-xs mx-1 tabular-nums">
                  {Math.round(foodWastedSinceOpen).toLocaleString("id-ID")} kg
                </span>
                <span>sisa makanan! Ini darurat dan terus bertambah setiap detik! 😭</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-left">
              <div className="bg-white rounded-2xl p-5 border border-[#e8f5e9] shadow-inner flex flex-col justify-between">
                <div>
                  <span className="text-2xl">⏳</span>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#1a6b3c] tracking-tight mt-2">23-48 Juta Ton</p>
                </div>
                <p className="text-xs text-[#1a6b3c] font-bold mt-2 leading-relaxed">
                  Total timbunan sampah makanan di Indonesia per tahun dari hulu ke hilir.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-[#e8f5e9] shadow-inner flex flex-col justify-between">
                <div>
                  <span className="text-2xl">🍽️</span>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#1a6b3c] tracking-tight mt-2">115-184 kg</p>
                </div>
                <p className="text-xs text-[#1a6b3c] font-bold mt-2 leading-relaxed">
                  Sampah makanan yang dibuang rata-rata oleh satu orang Indonesia dalam setahun.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-[#e8f5e9] shadow-inner flex flex-col justify-between">
                <div>
                  <span className="text-2xl">🌍</span>
                  <p className="text-[#1a6b3c] text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">7.29%</p>
                </div>
                <p className="text-xs text-[#1a6b3c] font-bold mt-2 leading-relaxed">
                  Kontribusi akumulasi sampah pangan terhadap total emisi gas rumah kaca nasional.
                </p>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Sumber: Bappenas 2021 · UNEP 2025
            </p>
          </div>

          {/* HOW IT WORKS: 3-step section */}
          <div className="w-full max-w-4xl py-12 border-t border-[#e8f5e9] flex flex-col items-center">
            <h2 className="text-3xl font-serif italic font-bold text-[#1a6b3c] mb-8 text-center">
              {t.howTitle}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full relative">
              {/* Dotted connecting line between the 3 icons */}
              <div className="hidden md:block absolute top-6 left-[16%] right-[16%] h-[2px] border-t border-dashed border-emerald-300/40 z-0" />

              <div className="flex flex-col items-center text-center space-y-3 relative z-10">
                <div className="w-12 h-12 rounded-full bg-[#e8f5e9] text-[#1a6b3c] flex items-center justify-center font-bold">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="text-xs font-black text-emerald-400 font-mono tracking-wider">
                  01
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{t.howStep1Title}</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    {t.howStep1Desc}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center space-y-3 relative z-10">
                <div className="w-12 h-12 rounded-full bg-[#e8f5e9] text-[#1a6b3c] flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="text-xs font-black text-emerald-400 font-mono tracking-wider">
                  02
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{t.howStep2Title}</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    {t.howStep2Desc}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center space-y-3 relative z-10">
                <div className="w-12 h-12 rounded-full bg-[#1a6b3c] text-white flex items-center justify-center font-bold shadow-sm">
                  <Leaf className="w-5 h-5" />
                </div>
                <div className="text-xs font-black text-emerald-400 font-mono tracking-wider">
                  03
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{t.howStep3Title}</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    {t.howStep3Desc}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="text-center py-8 text-xs text-slate-400 border-t border-[#e8f5e9] max-w-5xl mx-auto w-full flex flex-col items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-[#1a6b3c] font-bold px-3 py-1 rounded-full border border-[#e8f5e9] text-[11px]">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-6.887 4.114-4.68 0-8.5-3.82-8.5-8.5s3.82-8.5 8.5-8.5c2.25 0 4.185.83 5.615 2.185l3.19-3.19C18.645 1.135 15.685 0 12.24 0 5.516 0 0 5.516 0 12.24s5.516 12.24 12.24 12.24c6.91 0 11.53-4.86 11.53-11.74 0-.79-.07-1.55-.22-2.25l-11.31-.005z"/>
            </svg>
            <span>#JuaraVibeCoding 2026 · Google for Developers</span>
          </div>
          <div>
            &copy; {new Date().getFullYear()} WasteNot Indonesia. Seluruh hak cipta dilindungi.
          </div>
        </footer>
      </div>
    );
  }

  // VIEW 3: SAVED RECIPES (navRecipes / Resepku)
  if (view === "recipes") {
    const t = translations[language];

    return (
      <div id="recipes-root" className="w-full min-h-screen bg-[#FAFDF6] text-slate-800 font-sans flex flex-col pb-20 relative pt-16 animate-fade-in">
        {/* GLOBAL NAVBAR */}
        {renderNavbar()}

        <main className="max-w-5xl mx-auto w-full px-4 sm:px-12 py-10 space-y-8 flex-1">
          {/* Header */}
          <div className="space-y-2 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-serif italic text-[#1a6b3c] font-black tracking-tight flex items-center justify-center gap-2">
              📖 {t.navRecipes}
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              {language === "en" 
                ? "Manage your saved eco-friendly kitchen creations!" 
                : "Kelola aneka resep ramah lingkungan terselamatkan di dapurmu!"}
            </p>
          </div>

          {/* Recipes List Grid */}
          {savedRecipes.length === 0 ? (
            <div className="bg-white border border-[#e8f5e9] rounded-3xl p-12 text-center space-y-4 max-w-xl mx-auto shadow-3xs">
              <span className="text-5xl block animate-pulse">🍳</span>
              <p className="text-slate-650 font-bold text-sm tracking-wide">
                {t.emptyRecipes}
              </p>
              <button
                onClick={() => setView("dashboard")}
                className="text-xs font-black text-white bg-[#1a6b3c] hover:bg-[#14522e] min-h-[44px] px-6 py-2.5 rounded-full shadow-2xs cursor-pointer transition-all uppercase tracking-wider"
              >
                {language === "en" ? "Let's Go!" : "Mulai Resep Pertama!"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {savedRecipes.map((recipe) => (
                <div 
                  key={recipe.id} 
                  className="bg-white rounded-3xl border border-[#e8f5e9] shadow-2xs p-6 space-y-5 flex flex-col justify-between hover:border-emerald-300 transition-colors duration-300"
                >
                  <div className="space-y-4">
                    {/* Tag badge / Date */}
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black tracking-widest uppercase text-[#1a6b3c] bg-emerald-50 px-2 rounded border border-emerald-100">
                        {recipe.daerah} Style
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">
                        📅 {recipe.dateSaved}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight leading-snug">
                      {recipe.nama.replace(/\[.*\]/g, "")}
                    </h3>

                    {/* Leftover ingredients label list */}
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-450 uppercase tracking-widest">
                        {language === "en" ? "Rescued:" : "Terselamatkan:"}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {recipe.bahan_dipakai.map((b, idx) => (
                          <span key={idx} className="text-[10px] font-bold text-[#1a6b3c] bg-emerald-50/60 px-2 py-0.5 rounded-lg">
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Estimated waste prevention */}
                    <div className="bg-[#fcfdfa] border border-[#f0f9eb] p-2.5 rounded-xl text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                      <span>🌿</span>
                      <span>
                        {language === "en" 
                          ? `Saved ${recipe.estimasi_waste}g edible items` 
                          : `Menyelamatkan ${recipe.estimasi_waste}g bahan makanan`}
                      </span>
                    </div>
                  </div>

                  {/* Actions footer row */}
                  <div className="flex gap-2 pt-2 border-t border-slate-50">
                    <button
                      onClick={() => generateRecipePDF(recipe)}
                      className="flex-1 border border-[#1a6b3c] hover:bg-emerald-50 text-[#1a6b3c] font-black text-xs min-h-[40px] px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {t.btnDownloadPdf}
                    </button>
                    <button
                      onClick={() => handleDeleteRecipe(recipe.id)}
                      className="border border-red-200 hover:bg-red-50 text-red-650 font-extrabold text-xs min-h-[40px] px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                      title={t.btnDelete}
                    >
                      {t.btnDelete}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <footer className="text-center py-8 text-xs text-slate-400 border-t border-[#e8f5e9] max-w-5xl mx-auto w-full flex flex-col items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-[#1a6b3c] font-bold px-3 py-1 rounded-full border border-[#e8f5e9] text-[11px]">
            <span>#JuaraVibeCoding 2026</span>
          </div>
          <div>
            &copy; {new Date().getFullYear()} WasteNot Indonesia. Seluruh hak cipta dilindungi.
          </div>
        </footer>
      </div>
    );
  }

  // VIEW 2: MAIN DASHBOARD
  return (
    <div id="dashboard-root" className="w-full min-h-screen bg-[#FAFDF6] text-slate-800 font-sans flex flex-col pb-20 relative pt-16">
      {/* GLOBAL NAVBAR */}
      {renderNavbar()}

      {/* Brand Header */}
      <Header totalSavedWeight={totalSavedWeight} totalRecipesMade={totalRecipesMade} />

      {/* Hero Impact Number Section */}
      <section className="bg-white border-b border-[#e8f5e9] py-10 px-4 text-center animate-fade-in">
        <div className="max-w-4xl mx-auto space-y-2 flex flex-col items-center font-sans">
          {(() => {
            const t = translations[language];
            const hours = new Date().getHours();
            let timeGreeting = t.greetingMorning;
            if (hours >= 12 && hours < 15) {
              timeGreeting = t.greetingAfternoon;
            } else if (hours >= 15 && hours < 18) {
              timeGreeting = t.greetingEvening;
            } else if (hours >= 18 || hours < 5) {
              timeGreeting = t.greetingNight;
            }

            let roleSubtext = t.subtextDefault;
            if (selectedOnboardingRole === "Mahasiswa") roleSubtext = t.subtextStudent;
            if (selectedOnboardingRole === "Anak kos") roleSubtext = t.subtextKos;
            if (selectedOnboardingRole === "Orang tua") roleSubtext = t.subtextParent;
            if (selectedOnboardingRole === "Profesional") roleSubtext = t.subtextPro;

            return (
              <>
                <h2 className="text-xl sm:text-2xl font-serif italic text-[#1a6b3c] font-black mb-1">
                  {timeGreeting}, {firstName}! 👋
                </h2>
                <p className="text-[11px] sm:text-xs font-black text-rose-600 bg-rose-50 border border-rose-100 rounded-full px-3.5 py-1 uppercase tracking-widest">
                  {firstName} {t.dashboardHeroPrefix} {kgValueGlobal} {t.dashboardHeroSuffix || "kg"}
                </p>
                <div className="text-5xl sm:text-6xl md:text-7xl font-black text-[#1a6b3c] tracking-tight">
                  {kgValueGlobal} kg
                </div>
                
                <div className="text-xs sm:text-sm font-black text-emerald-800 bg-emerald-50 border border-[#e8f5e9] px-4 py-2 rounded-full inline-flex items-center gap-1.5 shadow-3xs mt-1">
                  <span>🍽️</span>
                  <span>
                    = <strong>{Math.round(totalSavedWeight * 4)} {language === "en" ? "plates of rice" : "piring nasi"}</strong> {language === "en" ? "successfully rescued!" : "yang berhasil diselamatkan!"}
                  </span>
                </div>

                <p className="text-sm sm:text-base text-slate-500 font-bold max-w-sm mx-auto pt-3">
                  {roleSubtext} <span className="block text-xs text-slate-400 font-medium mt-1">{t.dashboardHeroSubtitle}</span>
                </p>
              </>
            );
          })()}

          {/* Accumulative Personal Impact Tracker Cards */}
          <div className="max-w-4xl mx-auto mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            <div className="bg-white border border-[#e8f5e9] rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-xs hover:border-emerald-300 transition-colors duration-300">
              <span className="text-2xl">💰</span>
              <p className="text-[10px] font-black text-[#1a6b3c] uppercase mt-1.5 tracking-wider">Uang Dihemat</p>
              <p className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                Rp {Math.round(totalSavedWeight * 18.281).toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] font-bold text-emerald-800 mt-1 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md">
                = uang jajan {Math.max(1, Math.round((totalSavedWeight * 18.281) / 30000))} hari 💰
              </p>
              <p className="text-[9px] text-slate-400 mt-2">Potensi anggaran terselamatkan</p>
            </div>

            <div className="bg-white border border-[#e8f5e9] rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-xs hover:border-emerald-300 transition-colors duration-300">
              <span className="text-2xl">🌿</span>
              <p className="text-[10px] font-black text-[#1a6b3c] uppercase mt-1.5 tracking-wider">Metrik Karbon</p>
              <p className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                {(totalSavedWeight / 1000 * 0.328).toFixed(1)} kg CO₂
              </p>
              <p className="text-[10px] font-bold text-emerald-800 mt-1 bg-[#f0fdf4] border border-emerald-100 px-2.5 py-1 rounded-md">
                = {Math.max(1, Math.round(totalSavedWeight * 0.328 / 0.5))} jam perjalanan motor 🛵
              </p>
              <p className="text-[9px] text-slate-400 mt-2">Emisi gas rumah kaca dicegah</p>
            </div>

            <div className="bg-white border border-[#e8f5e9] rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-xs hover:border-emerald-300 transition-colors duration-300">
              <span className="text-2xl">🌳</span>
              <p className="text-[10px] font-black text-[#1a6b3c] uppercase mt-1.5 tracking-wider">Equiv. Pohon</p>
              <p className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                {(totalSavedWeight / 1000 * 0.031).toFixed(2)} Pohon
              </p>
              <p className="text-[9px] text-slate-400 mt-2.5">Setara penyerapan udara bersih</p>
            </div>
          </div>
        </div>
      </section>

      {/* Completed cooking banner alert */}
      {completedCooking && (
        <div className="mx-4 sm:mx-auto max-w-4xl mt-6">
          <div className="bg-emerald-600 text-white rounded-2xl p-4 shadow-md flex items-center justify-between border border-emerald-500 animate-bounce">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🎉</span>
              <span className="text-xs sm:text-sm font-black">
                Mantap! Kamu baru selamatkan bumi hari ini!
              </span>
            </div>
            <button 
              onClick={() => setCompletedCooking(false)}
              className="text-white hover:text-[#f5c842] font-black text-xs px-2.5 py-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Step progress-indicator dots at the top of the dashboard */}
      <div className="max-w-4xl mx-auto w-full px-4 mt-8">
        <div className="flex items-center justify-between px-4 sm:px-8 py-3 bg-white rounded-2xl border border-[#e8f5e9] shadow-xs">
          <div className={`flex items-center space-x-2 transition-all duration-350 transform ${!analysisResult ? 'scale-105' : 'scale-95'}`}>
            <div className={`w-3 h-3 rounded-full flex items-center justify-center transition-all duration-350 ${!analysisResult ? 'bg-[#1a6b3c] ring-4 ring-[#1a6b3c]/20' : 'bg-emerald-300'}`} />
            <span className={`text-[11px] sm:text-xs font-black transition-colors duration-350 ${!analysisResult ? 'text-[#1a6b3c]' : 'text-slate-400'}`}>
              📷 Upload
            </span>
          </div>
          <div className="h-[2px] w-6 sm:w-16 bg-slate-150 transition-colors duration-350" />
          <div className={`flex items-center space-x-2 transition-all duration-350 transform ${analysisResult && !selectedRecipe ? 'scale-105' : 'scale-95'}`}>
            <div className={`w-3 h-3 rounded-full flex items-center justify-center transition-all duration-350 ${analysisResult && !selectedRecipe ? 'bg-[#1a6b3c] ring-4 ring-[#1a6b3c]/20' : analysisResult ? 'bg-emerald-300' : 'bg-slate-200'}`} />
            <span className={`text-[11px] sm:text-xs font-black transition-colors duration-350 ${analysisResult && !selectedRecipe ? 'text-[#1a6b3c]' : 'text-slate-400'}`}>
              🔍 Analisa
            </span>
          </div>
          <div className="h-[2px] w-6 sm:w-16 bg-slate-150 transition-colors duration-350" />
          <div className={`flex items-center space-x-2 transition-all duration-350 transform ${selectedRecipe ? 'scale-105' : 'scale-95'}`}>
            <div className={`w-3 h-3 rounded-full flex items-center justify-center transition-all duration-350 ${selectedRecipe ? 'bg-[#1a6b3c] ring-4 ring-[#1a6b3c]/20' : 'bg-slate-200'}`} />
            <span className={`text-[11px] sm:text-xs font-black transition-colors duration-350 ${selectedRecipe ? 'text-[#1a6b3c]' : 'text-slate-400'}`}>
              🍳 Masak
            </span>
          </div>
        </div>
      </div>

      {/* Tutorial at the top */}
      <div className="max-w-4xl mx-auto w-full px-4 mt-4">
        <details className="bg-emerald-50/50 rounded-2xl border border-[#e8f5e9] p-1.5 overflow-hidden group">
          <summary className="p-3 text-xs font-black text-[#1a6b3c] flex items-center justify-between cursor-pointer list-none">
            <div className="flex items-center gap-1.5">
              <span>📖</span>
              <span>Cara pakai WasteNot (30 detik tutorial)</span>
            </div>
            <span className="transition-transform group-open:rotate-180">▼</span>
          </summary>
          <div className="p-3.5 pt-1.5 text-xs text-slate-600 space-y-2 border-t border-[#e8f5e9]/70 leading-relaxed font-medium">
            <p>1. <strong>Foto bahan kulkasmu</strong> atau ketik manual bahan dapur yang tersedia di rumah.</p>
            <p>2. Atur <strong>Vibe Masak</strong> dan aktifkan <strong>Mode Darurat Kulkas</strong> jika banyak sayuran layu.</p>
            <p>3. Tekan <strong>Analisa Bahan Seketika</strong> untuk mendeteksi bahan gizi ringkas dan saran resep lokal!</p>
          </div>
        </details>
      </div>

      {/* Floating results card when cooking completed */}
      <AnimatePresence mode="wait">
        {lastCookingImpact && (
          <div className="max-w-4xl mx-auto w-full px-4 mt-6">
            <DampakNyataCard 
              impact={lastCookingImpact} 
              onClose={() => setLastCookingImpact(null)} 
            />
          </div>
        )}
      </AnimatePresence>

      {/* Photo validation scanning/clarity alerts */}
      <AnimatePresence>
        {unclearError && (
          <div className="max-w-4xl mx-auto w-full px-4 mt-4">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 shadow-xs"
            >
              <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-black text-amber-900">Bahan Kurang Jelas Terdeteksi</h4>
                <p className="text-xs text-amber-800 mt-0.5 font-medium">
                  {unclearError}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MAIN RENDER ENGINE BY STEPS */}
      <main className="max-w-4xl mx-auto px-4 w-full mt-6">
        
        {/* ================= STEP A: UPLOAD ZONE (Only Visible before submission) ================= */}
        {!analysisResult && (
          <div className="space-y-6 w-full animate-fade-in pb-12">
            <div className="relative">
              {/* Floating micro-tooltip on first visit */}
              {showTooltip && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-[#1a6b3c] text-white text-[11px] font-black py-2 px-3.5 rounded-xl shadow-md z-20 flex items-center space-x-1.5 animate-bounce border border-emerald-500">
                  <span>👇 Klik di sini untuk mulai</span>
                  <button onClick={() => setShowTooltip(false)} className="hover:text-[#f5c842] font-black font-mono ml-2">✕</button>
                </div>
              )}

              {/* Uploader Input Core */}
              <Uploader 
                onAnalyze={handleAnalyzeIngredients}
                isLoading={isLoading}
                selectedPresetImage={selectedPreset ? selectedPreset.imageUrl : null}
                selectedPresetIngredients={selectedPreset ? selectedPreset.ingredients : null}
                onClearPreset={handleClearPreset}
                isEmergencyMode={isEmergencyMode}
                setIsEmergencyMode={setIsEmergencyMode}
                cookingVibe={cookingVibe}
                setCookingVibe={setCookingVibe}
                firstName={firstName}
              />
            </div>

            {/* Collapsible Simulator / Preset block to decrease cognitive load */}
            <details className="bg-white rounded-2xl border border-[#e8f5e9] p-1 overflow-hidden group">
              <summary className="p-4 text-xs sm:text-sm font-black text-slate-700 hover:text-[#1a6b3c] flex items-center justify-between cursor-pointer list-none">
                <div className="flex items-center gap-1.5">
                  <span>💡</span>
                  <span>Tidak punya bahan sisa di rumah? Cobalah ini</span>
                </div>
                <span className="transition-transform group-open:rotate-180">▼</span>
              </summary>
              <div className="p-4 pt-0 border-t border-slate-50/50">
                <KitchenPresets 
                  onSelectPreset={handleSelectPreset}
                  selectedPresetId={selectedPreset ? selectedPreset.id : null}
                />
              </div>
            </details>

            {/* Empty State visual illustration */}
            <div className="p-8 text-center bg-white rounded-3xl border border-[#e8f5e9] space-y-4 shadow-xs">
              <div className="text-4xl text-center">
                🥦🥕🍳
              </div>
              <p className="text-sm font-black text-[#1a6b3c]">
                Foto kulkasmu &rarr; resep siap dalam 10 detik
              </p>
            </div>
          </div>
        )}

        {/* ================= STEP B: DETECTED LIST (Only Visible after submission & before selecting recipe) ================= */}
        {analysisResult && !selectedRecipe && (
          <div className="space-y-8 w-full animate-fade-in pb-12">
            
            {/* Ingredients Database section */}
            <div className="bg-white p-5 sm:p-7 rounded-3xl border border-[#e8f5e9] shadow-xs space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🌱</span>
                  <h3 className="text-base font-black text-slate-800">
                    Bahan pangan terdeteksi AI
                  </h3>
                </div>
                <span className="bg-[#e8f5e9] text-[#1a6b3c] text-[10px] px-3 py-1 rounded-full font-black self-start">
                  {analysisResult.detectedIngredients.length} Bahan Teridentifikasi
                </span>
              </div>

              {/* Animated Pop-in items one by one */}
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="flex flex-wrap gap-2.5"
              >
                {analysisResult.detectedIngredients.map((item, idx) => {
                  const matchingInfo = analysisResult.ingredients_info?.find(
                    info => info.nama.toLowerCase() === item.toLowerCase() || item.toLowerCase().includes(info.nama.toLowerCase()) || info.nama.toLowerCase().includes(item.toLowerCase())
                  );
                  const icon = matchingInfo?.icon || "🥬";
                  return (
                    <motion.div 
                      key={idx} 
                      variants={itemVariants}
                      className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-emerald-50/70 border border-emerald-100/55 rounded-xl text-xs font-black text-slate-800 shadow-xs"
                    >
                      <span className="text-base">{icon}</span>
                      <span>{item}</span>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* AI Sapaan response block */}
              <div className="bg-slate-50 border-l-4 border-[#1a6b3c] p-4 rounded-xl text-xs font-semibold italic text-slate-700 leading-relaxed">
                "{analysisResult.pesan_sapaan}"
              </div>

              {/* Progressive Disclosure dropdown triggers for nutrition ringkas */}
              {analysisResult.ingredients_info && (
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest pl-1">Informasi Nilai Gizi & Sanitasi:</h4>
                  <div className="grid grid-cols-1 gap-2.5">
                    {analysisResult.ingredients_info.map((info, idx) => {
                      const isNutritionVisible = !!visibleNutrition[info.nama];
                      const isShelfLifeVisible = !!visibleShelfLife[info.nama];
                      return (
                        <div key={idx} className="bg-slate-50/40 rounded-2xl p-3.5 border border-[#e8f5e9] space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-lg">{info.icon}</span>
                              <span className="font-bold text-xs text-slate-850 uppercase">{info.nama}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              <button 
                                onClick={() => setVisibleNutrition(prev => ({ ...prev, [info.nama]: !prev[info.nama] }))}
                                className="text-[#1a6b3c] hover:bg-emerald-50 border border-slate-200 bg-white text-[10px] px-2 py-1.5 rounded-lg font-black flex items-center gap-0.5 cursor-pointer"
                              >
                                {isNutritionVisible ? "▲ Tutup Detail Gizi" : "▼ Detail Gizi"}
                              </button>
                              <button 
                                onClick={() => setVisibleShelfLife(prev => ({ ...prev, [info.nama]: !prev[info.nama] }))}
                                className="text-[#1a6b3c] hover:bg-emerald-50 border border-slate-200 bg-white text-[10px] px-2 py-1.5 rounded-lg font-black flex items-center gap-0.5 cursor-pointer"
                              >
                                {isShelfLifeVisible ? "▲ Tutup Ketahanan" : "▼ Masa Simpan"}
                              </button>
                            </div>
                          </div>

                          {/* Detail nutrition visible expansion state */}
                          {isNutritionVisible && (
                            <div className="grid grid-cols-4 gap-2.5 bg-white p-3 rounded-xl border border-slate-100 text-[11px]">
                              <div className="bg-slate-50 p-2 rounded-xl text-center flex flex-col items-center">
                                <span className="text-slate-400 text-[9px] font-bold">Energi</span>
                                <span className="font-extrabold text-slate-700">{info.kalori} kkal</span>
                              </div>
                              <div className="bg-[#e8f5e9]/40 p-2 rounded-xl text-center flex flex-col items-center">
                                <span className="text-[#1a6b3c] text-[9px] font-bold">Protein</span>
                                <span className="font-extrabold text-[#1a6b3c]">{info.protein}g</span>
                              </div>
                              <div className="bg-slate-50 p-2 rounded-xl text-center flex flex-col items-center">
                                <span className="text-slate-400 text-[9px] font-bold">Lemak</span>
                                <span className="font-extrabold text-slate-700">{info.lemak}g</span>
                              </div>
                              <div className="bg-slate-50 p-2 rounded-xl text-center flex flex-col items-center">
                                <span className="text-slate-400 text-[9px] font-bold">Karbo</span>
                                <span className="font-extrabold text-slate-700">{info.karbohidrat}g</span>
                              </div>
                            </div>
                          )}

                          {/* Shelf life detail visible expansion state */}
                          {isShelfLifeVisible && (
                            <div className="bg-amber-50/70 border border-amber-100 p-2.5 rounded-xl text-[11px] text-slate-700 flex items-center gap-1.5 font-medium">
                              <span>⏳</span>
                              <span>
                                Perkiraan masa mendingin sebelum terbuang: <strong>{info.shelf_life}</strong>. Olah segera ya pahlawan!
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Recipes recommendations based on region filtering */}
            <div className="space-y-5">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-800">Rekomendasi Menu Nusantara Anti-Mubazir</h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">Pilih salah satu kreasi menu sehat di bawah untuk mulai beraksi di dapur!</p>
              </div>

              {/* Regional selection filter pill indicators */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex-shrink-0">Filter Masakan:</span>
                {regions.map((reg) => {
                  const isSelected = activeRegion === reg.value;
                  return (
                    <button
                      key={reg.value}
                      onClick={() => setActiveRegion(reg.value)}
                      className={`py-2 px-3.5 rounded-full text-xs font-black border flex items-center space-x-1.5 transition-all duration-200 cursor-pointer flex-shrink-0 ${
                        isSelected
                          ? "bg-[#1a6b3c] border-[#1a6b3c] text-white shadow-xs"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-[#e8f5e9]/10"
                      }`}
                    >
                      <span>{reg.icon}</span>
                      <span>{reg.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Filtered Recipes list cards (Single Column on mobile, grid layout on desktop) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                {filteredRecipes.map((rec, i) => (
                  <div 
                    key={i}
                    className="bg-white rounded-3xl border border-[#e8f5e9] shadow-xs p-5.5 relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <span className="absolute top-0 right-0 py-1.5 px-3 uppercase tracking-wider text-[9px] font-black bg-emerald-50 text-[#1a6b3c] rounded-bl-2xl">
                      {rec.daerah} Style
                    </span>

                    <div className="space-y-4">
                      <h4 className="text-base font-black text-slate-850 leading-snug pr-12">
                        {rec.nama.replace(/\[.*\]/, "")}
                      </h4>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Bahan yang Diselamatkan :</p>
                        <div className="flex flex-wrap gap-1">
                          {rec.bahan_dipakai.map((b, bIdx) => (
                            <span key={bIdx} className="text-[9px] font-black text-[#1a6b3c] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-50 mt-5 space-y-3">
                      <div className="text-[11px] text-[#1a6b3c] font-bold flex items-center gap-1">
                        <span>🥬</span>
                        <span>Mencegah pembuangan ~{rec.estimasi_waste} gram bahan</span>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedRecipe(rec);
                          window.scrollTo({ top: 120, behavior: 'smooth' });
                        }}
                        className="w-full text-xs font-black text-white bg-[#1a6b3c] hover:bg-[#14522e] py-3 rounded-xl transition-all shadow-xs cursor-pointer text-center"
                      >
                        Mulai Masak Menu Ini →
                      </button>
                    </div>
                  </div>
                ))}
                
                {filteredRecipes.length === 0 && (
                  <div className="col-span-1 md:col-span-2 text-center py-10 text-slate-400 text-xs font-bold leading-relaxed">
                    Tidak ada resep yang terdaftar untuk filter ini. Silakan coba filter lainnya!
                  </div>
                )}
              </div>
            </div>

            {/* Back to upload and restart scan */}
            <div className="text-center pt-8 border-t border-slate-100">
              <button
                onClick={() => {
                  setAnalysisResult(null);
                  setSelectedPreset(null);
                }}
                className="text-xs font-black text-slate-400 hover:text-red-650 min-h-[44px] px-6 py-2 border border-slate-200 rounded-full bg-white shadow-2xs hover:border-red-250 hover:bg-red-50/10 cursor-pointer"
              >
                ← Mulai Ulang & Reset Deteksi Foto
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP C: ACTIVE SELECTED RECIPE steps page ================= */}
        {analysisResult && selectedRecipe && (
          <div className="space-y-6 w-full animate-fade-in pb-12">
            
            {/* Nav option to return in Step B */}
            <button
              onClick={() => setSelectedRecipe(null)}
              className="text-[#1a6b3c] hover:text-[#14522e] text-xs font-black flex items-center gap-1 min-h-[48px] px-3 border border-slate-200 bg-white rounded-full shadow-2xs cursor-pointer"
            >
              ← Kembali ke Semua Kreasi Resep
            </button>

            {/* Content Display Card */}
            <div className="bg-white rounded-3xl border border-[#e8f5e9] shadow-xs p-6 sm:p-8 space-y-6">
              <div className="flex items-start justify-between border-b border-slate-50 pb-4.5 gap-2">
                <div>
                  <span className="text-[10px] font-black tracking-widest uppercase text-[#1a6b3c] bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                    {selectedRecipe.daerah} Style
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight mt-2.5 leading-snug">
                    {selectedRecipe.nama.replace(/\[.*\]/, "")}
                  </h2>
                </div>
                <span className="text-2xl sm:text-3xl bg-emerald-50 p-3.5 rounded-2xl flex-shrink-0 text-[#1a6b3c]">🍲</span>
              </div>

              {/* Ingredients utilized list */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-slate-450 uppercase tracking-widest pl-1">Bahan Pangan Terselamatkan:</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedRecipe.bahan_dipakai.map((b, idx) => (
                    <span key={idx} className="text-xs font-bold text-[#1a6b3c] bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100/50">
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              {/* Linear instructional lists */}
              <div className="space-y-3.5">
                <p className="text-[10px] font-black text-slate-450 uppercase tracking-widest pl-1">Langkah Memasak Terperinci:</p>
                <ul className="space-y-4.5">
                  {selectedRecipe.langkah.map((stepMsg, sIdx) => (
                    <li key={sIdx} className="flex gap-3.5 items-start">
                      <span className="flex-shrink-0 w-6.5 h-6.5 rounded-full bg-emerald-50 border border-emerald-100 text-[#1a6b3c] flex items-center justify-center font-black text-xs shadow-3xs">
                        {sIdx + 1}
                      </span>
                      <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-semibold pt-0.5">
                        {stepMsg}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Completion button */}
              <div className="pt-6 border-t border-slate-50 space-y-4 mt-8">
                <div className="bg-emerald-50/50 border border-emerald-100/60 p-4 rounded-2xl flex gap-3 items-center">
                  <span className="text-2xl">🌍</span>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    Satu porsi masakan bergizi ini mencegah <strong className="text-[#1a6b3c]">{selectedRecipe.estimasi_waste} gram</strong> bahan pangan busuk percuma, mengurangi kontribusi emisi karbon rumah kaca!
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => generateRecipePDF(selectedRecipe)}
                    className="flex-1 text-[#1a6b3c] border border-[#1a6b3c] bg-transparent hover:bg-emerald-50/50 text-xs sm:text-sm font-black py-3.5 rounded-xl shadow-2xs transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 uppercase tracking-wider"
                  >
                    <span>{translations[language].btnSavePdf}</span>
                  </button>
                  <button
                    onClick={() => handleSaveRecipeToMyRecipes(selectedRecipe)}
                    className="flex-1 text-[#1a6b3c] border border-[#1a6b3c] bg-transparent hover:bg-emerald-50/50 text-xs sm:text-sm font-black py-3.5 rounded-xl shadow-2xs transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 uppercase tracking-wider"
                  >
                    <span>➕ {language === "en" ? "Save to My Recipes" : "Simpan ke Resepku"}</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    handleSaveRecipeWeight(selectedRecipe.estimasi_waste, selectedRecipe.nama);
                    setCompletedCooking(true);
                    setSelectedRecipe(null);
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}
                  className="w-full text-white bg-[#1a6b3c] hover:bg-[#14522e] text-xs sm:text-sm font-black py-4 rounded-xl shadow-xs transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 uppercase tracking-wider"
                >
                  <span>🎉 Selesai Memasak! Cek Dampak Nyataku</span>
                </button>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Quick Stats Restart/Reset panel at the bottom for easy management */}
      <div className="max-w-4xl mx-auto w-full px-4 mb-14">
        <div className="bg-white rounded-2xl p-4.5 border border-[#e8f5e9] shadow-3xs flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
              Statistik Rekor Penyelamatan
            </p>
            <p className="text-xs font-black text-slate-700 mt-1">Sengaja atur dari nol untuk demonstrasi?</p>
          </div>
          <button
            onClick={handleResetCounters}
            className="py-2 px-3.5 rounded-xl border border-red-150 bg-red-50 hover:bg-red-100/50 text-red-700 font-black text-xs flex items-center space-x-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ================= STEP D: FLOATING COLLAPSIBLE AI CHAT DRAWER PANEL ================= */}
      {/* Reduced cognitive load floating button position & collapsible chat dialog */}
      <div className="fixed bottom-18 sm:bottom-6 right-6 z-40 flex flex-col items-end">
        
        {/* Chat bubble collapsible window */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="bg-white rounded-3xl border border-[#e8f5e9] shadow-2xl flex flex-col p-4 w-[310px] sm:w-[380px] h-[410px] mb-3 overflow-hidden text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">💬</span>
                  <div>
                    <h3 className="text-xs font-black text-slate-800 leading-none">Tanya WasteNot AI</h3>
                    <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">Asisten Penyimpanan & Resep</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1"
                >
                  ✕
                </button>
              </div>

              {/* Chat messages bubble render scrollable list */}
              <div className="flex-1 overflow-y-auto py-3 space-y-3.5 flex flex-col scrollbar-thin">
                {chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={`max-w-[85%] rounded-2xl p-3 text-[11px] leading-relaxed shadow-3xs ${
                      msg.sender === "user"
                        ? "bg-[#1a6b3c] text-white self-end rounded-tr-none"
                        : "bg-slate-50 text-slate-700 border border-[#e8f5e9] self-start rounded-tl-none"
                    }`}
                  >
                    <div className="space-y-1 whitespace-pre-wrap">
                      {msg.text.split("\n").map((line, lIdx) => {
                        const boldRegex = /\*\*(.*?)\*\*/g;
                        let match;
                        const parts: React.ReactNode[] = [];
                        let lastIdx = 0;

                        while ((match = boldRegex.exec(line)) !== null) {
                          if (match.index > lastIdx) {
                            parts.push(line.substring(lastIdx, match.index));
                          }
                          parts.push(<strong key={match.index} className="font-extrabold text-[#1a6b3c]">{match[1]}</strong>);
                          lastIdx = boldRegex.lastIndex;
                        }
                        if (lastIdx < line.length) {
                          parts.push(line.substring(lastIdx));
                        }
                        return <p key={lIdx}>{parts.length > 0 ? parts : line}</p>;
                      })}
                    </div>
                    <span className={`block text-[8px] mt-1 text-right ${msg.sender === "user" ? "text-emerald-100" : "text-slate-400"}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                ))}

                {isChatLoading && (
                  <div className="self-start bg-slate-50 border border-[#e8f5e9] rounded-2xl rounded-tl-none p-3 flex items-center space-x-1.5 text-[10px] text-slate-500 italic">
                    <div className="w-1 h-1 bg-[#1a6b3c] rounded-full animate-bounce" />
                    <div className="w-1 h-1 bg-[#1a6b3c] rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1 h-1 bg-[#1a6b3c] rounded-full animate-bounce [animation-delay:0.4s]" />
                    <span>Gemini AI sedang menulis...</span>
                  </div>
                )}
              </div>

              {/* Conversation presets triggers */}
              <div className="pt-2 border-t border-slate-50 flex-shrink-0 space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-0.5">Pertanyaan cepat:</span>
                <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                  {starters.map((starter, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => handleSendChat(starter)}
                      disabled={isChatLoading}
                      className="text-[9px] font-extrabold py-1 px-2 border border-slate-200 bg-slate-50 text-[#1a6b3c] rounded-lg cursor-pointer whitespace-nowrap active:scale-98"
                    >
                      {starter.slice(0, 30)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat inputs */}
              <div className="flex gap-1.5 items-center flex-shrink-0 pt-2 border-t border-slate-100">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendChat();
                  }}
                  disabled={isChatLoading}
                  placeholder="Tulis pesan Anda..."
                  className="flex-1 text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1a6b3c] focus:bg-white text-slate-800"
                />
                <button
                  onClick={() => handleSendChat()}
                  disabled={isChatLoading || !chatInput.trim()}
                  className="p-2.5 bg-[#1a6b3c] hover:bg-[#14522e] disabled:bg-slate-200 text-white rounded-xl active:translate-y-[1px] transition-all cursor-pointer flex-shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Bubble Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="bg-[#1a6b3c] hover:bg-[#14522e] text-white font-extrabold text-xs sm:text-sm h-12 sm:h-14 px-4 sm:px-5 rounded-full shadow-2xl flex items-center space-x-1.5 transition-all duration-200 border border-emerald-500/10 cursor-pointer hover:scale-105"
        >
          <MessageSquare className="w-5 h-5 text-white animate-pulse" />
          <span>{isChatOpen ? "Sembunyikan ✕" : "Tanya WasteNot AI 💬"}</span>
        </button>

      </div>

      {/* Bottom Sticky bar stats on mobile device viewports (under sm: screen range) */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-[#e8f5e9] p-3 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] z-30 flex sm:hidden items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-emerald-50 text-[#1a6b3c] rounded-xl text-xs">🌱</div>
          <div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Penyelamatan</p>
            <p className="text-sm font-black text-[#1a6b3c] mt-0.5">
              {kgValueGlobal} kg Penyelamatan
            </p>
          </div>
        </div>
        <button 
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="bg-[#1a6b3c] text-white py-2 px-3.5 rounded-xl text-xs font-black shadow-sm"
        >
          Lihat Rekor ✨
        </button>
      </div>

      {/* Footer view */}
      <footer className="text-center py-10 text-xs text-slate-400 border-t border-[#e8f5e9] max-w-4xl mx-auto w-full flex flex-col items-center justify-center gap-2">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-[#1a6b3c] font-bold px-3 py-1 rounded-full border border-[#e8f5e9] text-[11px]">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-6.887 4.114-4.68 0-8.5-3.82-8.5-8.5s3.82-8.5 8.5-8.5c2.25 0 4.185.83 5.615 2.185l3.19-3.19C18.645 1.135 15.685 0 12.24 0 5.516 0 0 5.516 0 12.24s5.516 12.24 12.24 12.24c6.91 0 11.53-4.86 11.53-11.74 0-.79-.07-1.55-.22-2.25l-11.31-.005z"/>
          </svg>
          <span>#JuaraVibeCoding 2026 · Google for Developers</span>
        </div>
        <div>
          &copy; {new Date().getFullYear()} WasteNot Indonesia. Seluruh hak cipta dilindungi.
        </div>
      </footer>

      {toastMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/90 text-white font-extrabold text-xs sm:text-sm py-3 px-6 rounded-full shadow-lg border border-slate-700/65 backdrop-blur-md flex items-center gap-1.5 animate-bounce">
          <span>{toastMsg}</span>
        </div>
      )}

    </div>
  );
}
