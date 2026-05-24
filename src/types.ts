/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Recipe {
  nama: string;
  daerah: 'Jawa' | 'Padang' | 'Betawi' | 'Umum';
  bahan_dipakai: string[]; // List of ingredients from the photo/manual list used
  langkah: string[]; // max 5 steps, simple
  estimasi_waste: number; // weight in grams, e.g., 250
}

export interface IngredientInfo {
  nama: string;
  kalori: number; // estimasi kalori per 100g
  protein: number; // estimasi protein per 100g (gram)
  lemak: number; // estimasi lemak per 100g (gram)
  karbohidrat: number; // estimasi karbohidrat per 100g (gram)
  shelf_life: string; // perkiraan lama bertahan di kulkas, misal: "3 - 5 hari"
  icon: string; // emoji icon untuk representasi visual bahan
}

export interface AnalyzeResult {
  detectedIngredients: string[];
  recipes: Recipe[];
  pesan_sapaan: string; // Encouraging greeting mentioning ingredients
  ingredients_info?: IngredientInfo[]; // any parsed nutritional & shelf-life data
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  image?: string; // Base64 or image URL if uploaded
  analysis?: AnalyzeResult; // If this message triggered a recipe generation
}

export interface PresetKitchenImg {
  id: string;
  name: string;
  desc: string;
  imageUrl: string;
  ingredients: string[]; // mock helper list of ingredients in this preset
}

export interface SavedRecipe {
  id: string;
  nama: string;
  daerah: 'Jawa' | 'Padang' | 'Betawi' | 'Umum' | string;
  bahan_dipakai: string[];
  langkah: string[];
  estimasi_waste: number;
  dateSaved: string;
}

