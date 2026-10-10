import type en from "@messages/en.json";
import type { Locale } from "./config";

export type Messages = typeof en;

const loaders: Record<Locale, () => Promise<Messages>> = {
  ar: () => import("@messages/ar.json").then((m) => m.default as Messages),
  fr: () => import("@messages/fr.json").then((m) => m.default as Messages),
  en: () => import("@messages/en.json").then((m) => m.default as Messages),
};

export function getMessages(locale: Locale): Promise<Messages> {
  return loaders[locale]();
}

type Vars = Record<string, string | number>;

/** Looks up a dotted key ("story.reactions.relate") and fills {placeholders}. Missing keys return the key. */
export function translate(messages: Messages, key: string, vars?: Vars): string {
  let node: unknown = messages;
  for (const part of key.split(".")) {
    if (node && typeof node === "object" && part in node) node = (node as Record<string, unknown>)[part];
    else return key;
  }
  if (typeof node !== "string") return key;
  return vars ? node.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m)) : node;
}
