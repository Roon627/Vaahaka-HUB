"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Language = "en" | "dv";

const LANG_KEY = "ihusaas:lang";

export const DICTIONARY = {
  // Navigation
  drift: { en: "Drift", dv: "އޮޔާދިޔުން" },
  map: { en: "Map", dv: "ޗާޓު" },
  mood: { en: "Mood", dv: "އިޙްސާސް" },
  surpriseMe: { en: "Surprise me", dv: "ހައިރާންކޮށްލާ" },
  writeALetter: { en: "Write a letter", dv: "ސިޓީއެއް ލިޔުމަށް" },
  write: { en: "Write", dv: "ލިޔުމަށް" },
  menu: { en: "Menu", dv: "މެނޫ" },
  highTide: { en: "High tide", dv: "ބޮޑުދިޔަ" },
  newLetter: { en: "new letter", dv: "އާ ސިޓީ" },
  newLetters: { en: "new letters", dv: "އާ ސިޓީ" },
  read: { en: "read", dv: "ކިޔާލަން" },
  showing: { en: "showing", dv: "ދައްކަނީ" },
  peopleOnShore: { en: "people on the shore", dv: "މީހުން އައްސޭރީގައި" },
  personOnShore: { en: "person on the shore", dv: "މީހަކު އައްސޭރީގައި" },

  // Hero Section
  heroTitle: { en: "Say it to the sea.", dv: "ކަނޑަށް ބުނެލާ." },
  heroSubtitle: {
    en: "A quiet, anonymous sanctuary for Maldivians to write down what they are carrying. No names, no accounts. Only the sea listens.",
    dv: "ހިތުގައިވާ އުދާސްތައް ބަންޑުންކޮށްލަން ހިމޭން، ނަންނޭނގޭ މަންޒިލެއް. ނަމެއް ނެތް، އެކައުންޓެއް ނެތް. ހަމައެކަނި ކަނޑު އަޑުއަހާނީ.",
  },
  anonFree: { en: "Anonymous & free", dv: "ނަންނޭނގޭ އަދި ހިލޭ" },
  newSinceLastVisit: { en: "new since your last visit", dv: "އެންމެ ފަހުން ޒިޔާރަތްކުރި ފަހުން އައި އާ ސިޓީ" },

  // Hero Notepad
  notepadPlace: { en: "A PLACE FOR YOUR WORDS", dv: "ހިތުގެ ބަސްތަކަށް ޖާގައެއް" },
  notepadDear: { en: "Dear sea,", dv: "ލޮބުވެތި ކަނޑަށް،" },
  notepadBody: {
    en: "I don't need all the answers. Just somewhere to begin.",
    dv: "ހުރިހާ ޖަވާބެއް ބޭނުމެއް ނޫން. ހަމައެކަނި ފަށާނެ ތަނެއް.",
  },
  notepadSign: { en: "With love, someone.", dv: "ލޯތްބާއެކު، މީހަކު." },
  notepadReadWhole: { en: "Read the whole letter →", dv: "ސިޓީ އެއްކޮށް ކިޔާލުމަށް →" },
  notepadTearHint: { en: "Drag or click to tear", dv: "ސިޓީ ވީދާލަން ކަނާތަށް ދަމާލާ" },
  nextPage: { en: "Next page →", dv: "ދެން އޮތް ސިޓީ →" },

  // Feed Section
  washedAshore: { en: "Washed ashore", dv: "އައްސޭރިއަށް ބީވި ސިޓީތައް" },
  washedAshoreDesc: {
    en: "Real thoughts released from across the islands. Tap any letter to read.",
    dv: "ރަށްތަކުން ދޫކޮށްލާފައިވާ ހަގީގީ އިޙްސާސްތައް. ކިޔާލުމަށް ސިޓީއަކަށް ފިއްތާލާ.",
  },
  allFeelings: { en: "All feelings", dv: "ހުރިހާ އިޙްސާސްތައް" },
  allIslands: { en: "All islands", dv: "ހުރިހާ ރަށްތައް" },
  tideWashedAshore: {
    en: "The tide washed ashore",
    dv: "ދިޔަވަރުން އައްސޭރިއަށް ގެނެސްދީފި",
  },
  sinceLastVisit: { en: "Since your last visit", dv: "އެންމެ ފަހުން ޒިޔާރަތްކުރި ފަހުން" },
  tideSubtitle: {
    en: "Quiet thoughts released from across the islands while you were away.",
    dv: "ތިބާ ނެތް ވަގުތު ރަށްތަކުން ކަނޑަށް ދޫކޮށްލި ހިމޭން އިޙްސާސްތައް.",
  },
  showingNewArrivals: { en: "Showing new arrivals ✓", dv: "އާ ސިޓީތައް ދައްކަނީ ✓" },
  showNewArrivalsBtn: { en: "View new arrivals", dv: "އާ ސިޓީތައް ބަލާލަން" },
  showAllLetters: { en: "Show all letters", dv: "ހުރިހާ ސިޓީތައް" },
  calmShoreline: { en: "You have reached the calm of the shoreline.", dv: "އައްސޭރީގެ ހިމޭންކަމާ ހަމައަށް ތިބާ ފޯރައިފި." },

  // Card items
  openLetter: { en: "Open letter →", dv: "ސިޓީ ކިޔާލުމަށް →" },
  readLetter: { en: "Read letter →", dv: "ސިޓީ ކިޔާލުމަށް →" },
  iFeltThis: { en: "I felt this", dv: "މިކަން އިޙްސާސްވި" },
  newArrivalBadge: { en: "New arrival", dv: "އާ ސިޓީ" },

  // Reader Modal
  notesFromTheSea: { en: "Notes from the sea", dv: "ކަނޑުން އައި ބަސްތައް" },
  noNotesYet: {
    en: "No notes yet. Be the first to say something kind.",
    dv: "އަދި އެއްވެސް ބަހެއް ނެތް. ފުރަތަމަ ހެޔޮ ބަސް ބުނާ މީހަކަށް ވާށެވެ.",
  },
  leaveNotePlaceholder: {
    en: "Leave a kind, anonymous note…",
    dv: "ހެޔޮ، ނަންނޭނގޭ ބަހެއް ލިޔެލާ…",
  },
  kindWordsNotice: {
    en: "Kind words only. Rude or harsh wording (Dhivehi or English), links and phone numbers are blocked.",
    dv: "ހެޔޮ ބަސްތައް އެކަނި. ހުތުރު ނުވަތަ ހަރުކަށި ބަސްތައް، ލިންކުތައް އަދި ފޯނު ނަންބަރުތައް ބްލޮކްވާނެއެވެ.",
  },
  send: { en: "Send", dv: "ފޮނުވާ" },
  sending: { en: "Sending…", dv: "ފޮނުވަނީ…" },
  reportNote: { en: "report", dv: "ރިޕޯޓް" },
  previousLetter: { en: "← Previous", dv: "← ކުރީގެ ސިޓީ" },
  nextLetter: { en: "Next letter →", dv: "ދެން އޮތް ސިޓީ →" },
  felt: { en: "Felt", dv: "އިޙްސާސްވި" },
  heart: { en: "Heart", dv: "ހިތް" },
  listening: { en: "Listening", dv: "އަޑުއަހަނީ" },

  // Quick Kind Notes
  quickAlone: { en: "You're not alone 🫂", dv: "ތިބާއާއެކު ވާކަން ހަނދާންކުރޭ 🫂" },
  quickStrength: { en: "Sending you strength 🕯️", dv: "ހިތްވަރު ދެން 🕯️" },
  quickThanks: { en: "Thank you for sharing this 🤍", dv: "ހިއްސާކުރީތީ ޝުކުރިއްޔާ 🤍" },
  quickFelt: { en: "I felt this too", dv: "މިކަން އަހަންނަށްވެސް އިޙްސާސްވި" },
  quickMatter: { en: "You matter 🫶", dv: "ތިބާ މުހިންމު 🫶" },
  quickGentle: { en: "Be gentle with yourself 🌊", dv: "އަމިއްލަ ނަފްސަށް އޯގާތެރިވާތި 🌊" },

  // Map Page
  mapTitle: { en: "The Archipelago of Whispers.", dv: "އަތޮޅުތަކުގެ އަޑު." },
  mapSubtitle: {
    en: "Follow the ocean currents carrying sealed letters across 20 atolls. Tap any shore to listen to its voices.",
    dv: "އަތޮޅުތަކުގެ މެދުގައި ކަނޑުގެ އޮއިވަރުން ދަތުރުކުރާ ސިޓީތައް. ކޮންމެ އައްސޭރިއެއްގެ އަޑުވެސް އަހާލާ.",
  },
  atollsAndIslands: { en: "26 atolls · 1,192 islands", dv: "26 އަތޮޅު · 1،192 ރަށް" },
  driftWithCurrent: { en: "Drift with current", dv: "ކަނޑުގެ އޮއިވަރާއެކު ދަތުރުކުރޭ ⛵" },
  driftingWithCurrentPause: { en: "Drifting with currents (pause)", dv: "އޮއިވަރާއެކު ދަތުރުކުރަނީ (ހުއްޓާލުމަށް ފިއްތާ)" },
  resetView: { en: "Reset view", dv: "އަލުން ފަށާ ↺" },
  shoreLetters: { en: "Letters Resting on this Shore", dv: "މި އައްސޭރިއަށް ބީވި ސިޓީތައް" },
  tapToRead: { en: "tap to read", dv: "ކިޔާލަން ފިއްތާ" },
  readAllFrom: { en: "Read all from", dv: "ހުރިހާ ސިޓީއެއް ކިޔާލުމަށް" },
  writeToAtoll: { en: "Write to", dv: "ސިޓީއެއް ލިޔުމަށް" },
  quietLagoon: {
    en: "A quiet lagoon. No letters have washed ashore on this atoll yet.",
    dv: "ހިމޭން ވިލެއް. އަދި މި އަތޮޅަށް އެއްވެސް ސިޓީއެއް ބީވެފައެއް ނުވެއެވެ.",
  },
  archipelagoDirectory: { en: "Archipelago Directory", dv: "އަތޮޅުތަކުގެ ދަފްތަރު" },
  searchAtollPlaceholder: {
    en: "Search by English or Thaana name (e.g. Baa, މާލެ)...",
    dv: "އަތޮޅުގެ ނަން ޖައްސަވާ (މިސާލަކަށް: ބ. އަތޮޅު، މާލެ)...",
  },
  islandTrail: { en: "Island Trail", dv: "އަތޮޅުތަކުގެ ދަތުރު" },
  shoresExplored: { en: "shores explored", dv: "އައްސޭރި ބެލިއްޖެ" },
  northwards: { en: "← Northwards", dv: "← އުތުރަށް" },
  southwards: { en: "Southwards →", dv: "ދެކުނަށް →" },
  startVoyage: { en: "Start voyage ⛵", dv: "ދަތުރު ފަށާ ⛵" },
  pauseVoyage: { en: "Pause voyage", dv: "ދަތުރު ހުއްޓާލާ" },

  // Moods
  howDoesItFeel: { en: "How does it feel?", dv: "އިޙްސާސްވަނީ ކިހިނެއް؟" },
  pickAMood: {
    en: "Pick a mood and the sea brings matching letters ashore.",
    dv: "އިޙްސާސެއް އިޚްތިޔާރުކުރައްވާ. ކަނޑުން އެފަދަ ސިޓީތައް ގެނެސްދޭނެއެވެ.",
  },

  // About Menu
  sanctuaryMenu: { en: "Ihusaas Sanctuary Menu", dv: "އިޙްސާސް ހިމޭން މަންޒިލް" },
  sanctuaryTagline: { en: "A quiet sanctuary for words left to the sea.", dv: "ކަނޑަށް ދޫކޮށްލާ ހިތުގެ ބަސްތަކަށް ހިމޭން މަންޒިލެއް." },
  ambientSounds: { en: "Ambient sounds", dv: "ކަނޑުގެ އަޑުތައް" },
  ambientDesc: { en: "Ocean wash and tactile paper tears", dv: "ރާޅުޖަހާ އަޑާއި ކަރުދާސް ވީދޭ އަޑު" },
  soundOn: { en: "Sound: On", dv: "އަޑު: ޖައްސާފައި" },
  soundOff: { en: "Sound: Off", dv: "އަޑު: ކަނޑާލާފައި" },
  contactCreator: { en: "Contact the creator", dv: "ހެދި ފަރާތަށް މެސެޖެއް" },
  contactDesc: { en: "Send a quiet note, idea, or issue to Harun", dv: "ޚިޔާލެއް ނުވަތަ މައްސަލައެއް ހާރޫން އަށް ފޮނުވާލުމަށް" },
  needSupport: { en: "Need support right now?", dv: "އެހީތެރިކަމެއް ބޭނުންވޭތޯ؟" },
  supportDesc: { en: "Free 24h helplines in the Maldives (1677, 1412, 911)", dv: "ރާއްޖޭގެ 24 ގަޑިއިރުގެ ހިލޭ ހެލްޕްލައިންތައް (1677، 1412، 911)" },
  ourPromise: { en: "Our Promise", dv: "އަހަރެމެންގެ ވަޢުދު" },
  promiseDesc: {
    en: "No accounts. No algorithms. No tracking. You release letters into the sea anonymously, and strangers respond only with quiet kindness.",
    dv: "އެކައުންޓެއް ނެތް. އެލްގޮރިޒަމެއް ނެތް. ޓްރެކްކުރުމެއް ނެތް. ތިބާ ސިޓީ ކަނޑަށް ދޫކޮށްލަނީ ނަންނޭނގޭ ގޮތުގައެވެ. އަދި ބީރައްޓެހިން ޖަވާބުދޭނީ ހަމައެކަނި އޯގާތެރިކަމާއެކުގައެވެ.",
  },
  promiseSign: { en: "— Ihusaas (Say it to the sea)", dv: "— އިޙްސާސް (ކަނޑަށް ބުނެލާ)" },
  languageSetting: { en: "Language / ބަސް", dv: "ބަސް / Language" },
};

export type TranslationKey = keyof typeof DICTIONARY;

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  toggleLang: () => {},
  t: (key: TranslationKey) => DICTIONARY[key]?.en ?? key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    // Default to English while the switch is disabled for further refinement
    setLangState("en");
    if (typeof document !== "undefined") {
      document.documentElement.lang = "en";
      document.documentElement.dir = "ltr";
    }
  }, []);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_KEY, l);
      document.documentElement.lang = l;
      document.documentElement.dir = l === "dv" ? "rtl" : "ltr";
    } catch {
      /* ignore */
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "en" ? "dv" : "en");
  }, [lang, setLang]);

  const t = useCallback(
    (key: TranslationKey): string => {
      const entry = DICTIONARY[key];
      if (!entry) return key;
      return entry[lang] ?? entry.en ?? key;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
