/** Opens the "Send us a note" sheet from anywhere (the Nav hosts it). */
export const SUGGEST_EVENT = "ihusaas:suggest";
export const openSuggest = () => { if (typeof window !== "undefined") window.dispatchEvent(new Event(SUGGEST_EVENT)); };
