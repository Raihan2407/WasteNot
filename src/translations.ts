export interface TranslationSet {
  loginStories: string;
  loginProp1: string;
  loginProp2: string;
  loginProp3: string;
  loginCounterLabel: string;
  welcome: string;
  loginSubtext: string;
  googleBtn: string;
  googleBtnLoading: string;
  freeNoCard: string;
  onboardingTitle: string;
  onboardingSubtext: string;
  roleStudentTitle: string;
  roleStudentDesc: string;
  roleKosTitle: string;
  roleKosDesc: string;
  roleParentTitle: string;
  roleParentDesc: string;
  roleProTitle: string;
  roleProDesc: string;
  btnContinue: string;
  btnOpenKitchen: string;
  quoteStudent: string;
  quoteKos: string;
  quoteParent: string;
  quotePro: string;
  readyToCook: string;
  selectRoleAlert: string;
  navHome: string;
  navRecipes: string;
  navImpact: string;
  navSignOut: string;
  navProfileImpact: string;
  greetingMorning: string;
  greetingAfternoon: string;
  greetingEvening: string;
  greetingNight: string;
  subtextStudent: string;
  subtextKos: string;
  subtextParent: string;
  subtextPro: string;
  subtextDefault: string;
  dashboardTotalRescue: string;
  dashboardHeroPrefix: string;
  dashboardHeroSuffix: string;
  dashboardHeroSubtitle: string;
  dashboardMoneySaved: string;
  dashboardCarbonMetric: string;
  dashboardTreeEquiv: string;
  uploadFridgePhoto: string;
  uploadDragClick: string;
  uploadOrTypeManual: string;
  uploadChooseVibe: string;
  vibeQuick: string;
  vibePro: string;
  vibeHealthy: string;
  vibeFamily: string;
  btnAnalyze: string;
  btnAnalyzing: string;
  bannerCrisis: string;
  bannerStat: string;
  bannerSinceOpen: string;
  bannerSinceSuff: string;
  howTitle: string;
  howStep1Title: string;
  howStep1Desc: string;
  howStep2Title: string;
  howStep2Desc: string;
  howStep3Title: string;
  howStep3Desc: string;
  emergencyInactive: string;
  emergencyActive: string;
  emergencyTapHint: string;
  emergencyAiPri: string;
  emergencyAlertNoName: string;
  emergencyAlertName: string;
  btnSavePdf: string;
  toastPdfSuccess: string;
  toastRecipeSaved: string;
  btnDownloadPdf: string;
  btnDelete: string;
  emptyRecipes: string;
  recipeIngredientsTitle: string;
  recipeStepsTitle: string;
  recipeImpactTitle: string;
  recipeImpactSaves: string;
  recipeImpactCarbon: string;
  recipeImpactTrees: string;
  recipeHeroBadge: string;
}

export const translations: Record<"id" | "en", TranslationSet> = {
  id: {
    loginStories: "Kulkasmu penuh cerita. Biarkan AI yang memasaknya.",
    loginProp1: "Foto bahan → resep dalam 10 detik",
    loginProp2: "Kurangi food waste Indonesia",
    loginProp3: "Gratis selamanya",
    loginCounterLabel: "🌿 Hari ini Indonesia sudah buang",
    welcome: "Selamat datang",
    loginSubtext: "Masuk untuk mulai memasak & selamatkan bumi",
    googleBtn: "Masuk dengan Google →",
    googleBtnLoading: "Menghubungkan ke Google...",
    freeNoCard: "Gratis selamanya · Tanpa kartu kredit",
    onboardingTitle: "Siapa kamu di dapur?",
    onboardingSubtext: "Kami akan personalisasi pengalamanmu",
    roleStudentTitle: "Mahasiswa",
    roleStudentDesc: "Masak hemat & cepat",
    roleKosTitle: "Anak kos",
    roleKosDesc: "Bahan seadanya",
    roleParentTitle: "Orang tua",
    roleParentDesc: "Masak untuk keluarga",
    roleProTitle: "Profesional",
    roleProDesc: "Sehat & efisien",
    btnContinue: "LANJUTKAN →",
    btnOpenKitchen: "BUKA DAPURKU →",
    quoteStudent: "Dari bahan sederhana, lahir masakan luar biasa.",
    quoteKos: "Kreativitas dapur dimulai dari apa yang ada.",
    quoteParent: "Setiap masakan adalah cinta untuk keluarga.",
    quotePro: "Makan sehat adalah investasi terbaik.",
    readyToCook: "Siap memasak",
    selectRoleAlert: "Silakan pilih peran kamu terlebih dahulu!",
    navHome: "Beranda",
    navRecipes: "Resepku",
    navImpact: "Dampakku",
    navSignOut: "Keluar",
    navProfileImpact: "🌿 Profil & Dampakku",
    greetingMorning: "Selamat pagi",
    greetingAfternoon: "Selamat siang",
    greetingEvening: "Selamat sore",
    greetingNight: "Selamat malam",
    subtextStudent: "Masak hemat hari ini, yuk!",
    subtextKos: "Bahan seadanya bisa jadi luar biasa!",
    subtextParent: "Masak sehat porsi keluarga!",
    subtextPro: "Masakan sehat penambah energi kerjamu!",
    subtextDefault: "Ayo kreasikan santapan lezat penyelamat bumi!",
    dashboardTotalRescue: "TOTAL PENYELAMATAN BAHAN PANGANMU",
    dashboardHeroPrefix: "sudah selamatkan",
    dashboardHeroSuffix: "kg!",
    dashboardHeroSubtitle: "Kamu pahlawan penyelamat makanan Indonesia! Pertahankan misimu hari ini. 🌍",
    dashboardMoneySaved: "Uang Dihemat",
    dashboardCarbonMetric: "Metrik Karbon",
    dashboardTreeEquiv: "Equiv. Pohon",
    uploadFridgePhoto: "Foto kulkasmu sekarang",
    uploadDragClick: "Klik atau seret foto bahan kulkasmu di sini",
    uploadOrTypeManual: "atau ketik manual",
    uploadChooseVibe: "Pilih Vibe Masak",
    vibeQuick: "Males masak (< 10m)",
    vibePro: "Masak sungguhan",
    vibeHealthy: "Diet sehat",
    vibeFamily: "Masak keluarga",
    btnAnalyze: "Analisa Bahan Sekarang →",
    btnAnalyzing: "Menganalisa bumbu & resep...",
    bannerCrisis: "NASIONAL DARURAT FOOD WASTE",
    bannerStat: "Indonesia Buang Rp551 Triliun Makanan Per Tahun",
    bannerSinceOpen: "Sejak kamu buka halaman ini, Indonesia sudah membuang",
    bannerSinceSuff: "sisa makanan! Ini darurat dan terus bertambah!",
    howTitle: "Cara Penyelamatan Makanan",
    howStep1Title: "Foto bahan kulkasmu",
    howStep1Desc: "Ambil foto atau ketik sisa sayur, telur, dan daging yang hampir kedaluwarsa.",
    howStep2Title: "AI kenali & analisa",
    howStep2Desc: "Sistem cerdas memindai bahan, menaksir waktu simpan, dan menghitung gizi.",
    howStep3Title: "Masak & selamatkan bumi",
    howStep3Desc: "Pilih salah satu dari resep Nusantara, masak lezat, dan kurangi food waste!",
    emergencyInactive: "Mode Darurat Kulkas NONAKTIF",
    emergencyActive: "Mode Darurat Kulkas AKTIF",
    emergencyTapHint: "Ada sayur layu / bahan mau kedaluwarsa? Sentuh di sini!",
    emergencyAiPri: "🚨 AI akan prioritaskan bahan yang paling cepat rusak!",
    emergencyAlertNoName: "Hei pahlawan, ada bahan expired!",
    emergencyAlertName: "Hei {name}, ada bahan expired!",
    btnSavePdf: "💾 Simpan Resep (PDF)",
    toastPdfSuccess: "✅ Resep PDF berhasil disimpan!",
    toastRecipeSaved: "✅ Resep berhasil disimpan!",
    btnDownloadPdf: "📄 Download PDF",
    btnDelete: "🗑️ Hapus",
    emptyRecipes: "Belum ada resep tersimpan. Mulai masak yuk! 🍳",
    recipeIngredientsTitle: "Bahan yang Digunakan",
    recipeStepsTitle: "Langkah Memasak Terperinci",
    recipeImpactTitle: "Dengan memasak resep ini, kamu berkontribusi:",
    recipeImpactSaves: "Menghemat estimasi",
    recipeImpactCarbon: "Mengurangi",
    recipeImpactTrees: "Setara menanam",
    recipeHeroBadge: "Kamu pahlawan lingkungan! 🌍"
  },
  en: {
    loginStories: "Your fridge has stories. Let AI cook them.",
    loginProp1: "Photo ingredients → recipe in 10 seconds",
    loginProp2: "Reduce Indonesia's food waste",
    loginProp3: "Free forever",
    loginCounterLabel: "🌿 Today Indonesia has wasted",
    welcome: "Welcome",
    loginSubtext: "Sign in to start cooking & save the planet",
    googleBtn: "Sign in with Google →",
    googleBtnLoading: "Connecting with Google...",
    freeNoCard: "Free forever · No credit card required",
    onboardingTitle: "Who are you in the kitchen?",
    onboardingSubtext: "We will personalize your experience",
    roleStudentTitle: "Student",
    roleStudentDesc: "Cook cheap & fast",
    roleKosTitle: "Boarding house",
    roleKosDesc: "Cook with what's available",
    roleParentTitle: "Parent",
    roleParentDesc: "Cook for the family",
    roleProTitle: "Professional",
    roleProDesc: "Healthy & efficient",
    btnContinue: "CONTINUE →",
    btnOpenKitchen: "OPEN MY KITCHEN →",
    quoteStudent: "From simple ingredients, extraordinary cooking is born.",
    quoteKos: "Kitchen creativity starts with what's available.",
    quoteParent: "Every dish is love for the family.",
    quotePro: "Healthy eating is the best investment.",
    readyToCook: "Ready to cook",
    selectRoleAlert: "Please select your kitchen role first!",
    navHome: "Home",
    navRecipes: "My Recipes",
    navImpact: "My Impact",
    navSignOut: "Sign Out",
    navProfileImpact: "🌿 Profile & Impact",
    greetingMorning: "Good morning",
    greetingAfternoon: "Good afternoon",
    greetingEvening: "Good evening",
    greetingNight: "Good night",
    subtextStudent: "Let's cook clean budget today!",
    subtextKos: "Simple leftover items can be extraordinary!",
    subtextParent: "Healthy home cooking for the family!",
    subtextPro: "Nutritious dishes to boost your workday!",
    subtextDefault: "Let's build delightful recipes to rescue the earth!",
    dashboardTotalRescue: "YOUR TOTAL FOOD RESCUE",
    dashboardHeroPrefix: "has saved",
    dashboardHeroSuffix: "kg!",
    dashboardHeroSubtitle: "You're a food waste hero! Keep up your mission today. 🌍",
    dashboardMoneySaved: "Money Saved",
    dashboardCarbonMetric: "Carbon Metric",
    dashboardTreeEquiv: "Tree Equiv.",
    uploadFridgePhoto: "Photo your fridge now",
    uploadDragClick: "Click or drag your ingredient photo here",
    uploadOrTypeManual: "or type manually",
    uploadChooseVibe: "Choose Cooking Vibe",
    vibeQuick: "Quick & easy (< 10m)",
    vibePro: "Serious cooking",
    vibeHealthy: "Healthy diet",
    vibeFamily: "Family cooking",
    btnAnalyze: "Analyze Ingredients Now →",
    btnAnalyzing: "Analyzing flavors & recipes...",
    bannerCrisis: "NATIONAL FOOD WASTE CRISIS",
    bannerStat: "Indonesia Wastes Rp551 Triliun in Food Per Year",
    bannerSinceOpen: "Since you opened this page, Indonesia has wasted",
    bannerSinceSuff: "of food! This is an emergency that keeps growing!",
    howTitle: "How Food Rescue Works",
    howStep1Title: "Photo your fridge ingredients",
    howStep1Desc: "Snap a photo or type wilting greens, left-over eggs, and meats near their expiry date.",
    howStep2Title: "AI identifies & analyzes",
    howStep2Desc: "Smart processor scans foods, estimates safe shelf life, and tallies key nutrients.",
    howStep3Title: "Cook & save the planet",
    howStep3Desc: "Select from authentic Indonesian favorites, serve delicious food, and trim food waste!",
    emergencyInactive: "Emergency Fridge Mode INACTIVE",
    emergencyActive: "Emergency Fridge Mode ACTIVE",
    emergencyTapHint: "Have wilting veggies / expiring ingredients? Tap here!",
    emergencyAiPri: "🚨 AI will prioritize ingredients expiring first!",
    emergencyAlertNoName: "Hey hero, there are expiring ingredients!",
    emergencyAlertName: "Hey {name}, there are expiring ingredients!",
    btnSavePdf: "💾 Save Recipe (PDF)",
    toastPdfSuccess: "✅ Recipe PDF successfully saved!",
    toastRecipeSaved: "✅ Recipe successfully saved!",
    btnDownloadPdf: "📄 Download PDF",
    btnDelete: "🗑️ Delete",
    emptyRecipes: "No saved recipes yet. Let's start cooking! 🍳",
    recipeIngredientsTitle: "Ingredients Used",
    recipeStepsTitle: "Detailed Cooking Directions",
    recipeImpactTitle: "By cooking this recipe, you contribute:",
    recipeImpactSaves: "Estimated savings of",
    recipeImpactCarbon: "Reducing",
    recipeImpactTrees: "Equivalent to planting",
    recipeHeroBadge: "You are an environmental hero! 🌍"
  }
};
