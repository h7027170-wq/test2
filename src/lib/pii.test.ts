import { describe, expect, it } from "vitest";
import { findPii, redactPii } from "./pii";
import { passwordStrength } from "./password";
import { nicknameProblem } from "./nickname";
import { matchLocale } from "@/i18n/config";

describe("findPii", () => {
  it.each([
    ["call me on 0555 12 34 56", "phone"],
    ["+213 555 123 456 is my number", "phone"],
    ["write to amel.k@gmail.com", "email"],
    ["follow @amel_dz", "handle"],
    ["see https://example.com/me", "link"],
    ["my name is Karim", "name"],
    ["je m'appelle Lina", "name"],
    ["اسمي ياسين", "name"],
    ["I live at 12 rue Didouche", "address"],
    ["رقمي ٠٥٥٥ ١٢ ٣٤ ٥٦", "phone"],
    ["رقمي ۰۵۵۵۱۲۳۴۵۶", "phone"],
  ])("detects %s", (text, kind) => {
    expect(findPii(text).map((m) => m.kind)).toContain(kind);
  });

  it("ignores ordinary text, years and counts", () => {
    expect(findPii("In 2024 I checked the door 7 times. It was hard.")).toEqual([]);
    expect(findPii("قبل كل امتحان يرجع نفس الإحساس")).toEqual([]);
  });

  it("redacts every match, keeping the original text around it", () => {
    expect(redactPii("call 0555 12 34 56 or amel@x.dz")).toBe("call [removed] or [removed]");
    expect(redactPii("اتصل ٠٥٥٥١٢٣٤٥٦ مساء")).toBe("اتصل [removed] مساء");
  });
});

describe("passwordStrength", () => {
  it("rejects short passwords and ones containing the nickname", () => {
    expect(passwordStrength("short")).toBe(1);
    expect(passwordStrength("quiet-river-2026!", "quiet-river")).toBe(1);
  });
  it("rewards length and variety", () => {
    expect(passwordStrength("calm evening tea")).toBeGreaterThanOrEqual(3);
    expect(passwordStrength("Calm-evening-tea-42")).toBe(4);
  });
});

describe("nicknameProblem", () => {
  it("flags contact lookalikes", () => {
    expect(nicknameProblem("0555123456")).toBe("looks-like-contact");
    expect(nicknameProblem("a@b")).toBe("chars");
    expect(nicknameProblem("نور-الليل")).toBeNull();
  });
});

describe("matchLocale", () => {
  it("picks the best supported language, defaulting to Arabic", () => {
    expect(matchLocale("fr-FR,fr;q=0.9,en;q=0.8")).toBe("fr");
    expect(matchLocale("de-DE,en;q=0.5")).toBe("en");
    expect(matchLocale("de-DE")).toBe("ar");
    expect(matchLocale(undefined)).toBe("ar");
  });
});
