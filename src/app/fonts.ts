// Families come from design-system/tokens.json (typography.family). next/font self-hosts them at build time,
// so visitors make no requests to Google.
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Sans_Arabic, Noto_Naskh_Arabic } from "next/font/google";

export const displayLatin = Fraunces({ subsets: ["latin", "latin-ext"], weight: ["500", "600"], variable: "--font-display-latin", display: "swap" });
export const bodyLatin = IBM_Plex_Sans({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"], variable: "--font-body-latin", display: "swap" });
export const displayArabic = Noto_Naskh_Arabic({ subsets: ["arabic"], weight: ["600", "700"], variable: "--font-display-arabic", display: "swap" });
export const bodyArabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500", "600"], variable: "--font-body-arabic", display: "swap" });
export const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-mono-latin", display: "swap" });

export const fontVariables = [displayLatin, bodyLatin, displayArabic, bodyArabic, mono].map((f) => f.variable).join(" ");
