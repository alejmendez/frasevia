import { describe, expect, it } from "vitest";
import { reviewCardSpeechLanguages, selectSpeechVoice } from "./speech";

const voices = [
  { name: "Spanish Voice", lang: "es-ES" },
  { name: "English Voice", lang: "en-US" },
  { name: "Google UK English", lang: "en-GB" },
];

describe("pronunciation voice selection", () => {
  it("uses the target language on the front for the selected direction", () => {
    expect(reviewCardSpeechLanguages("es-en")).toEqual({
      front: "en",
      answer: "es",
    });
    expect(reviewCardSpeechLanguages("en-es")).toEqual({
      front: "es",
      answer: "en",
    });
  });

  it("selects an English voice for English text and prefers Google when available", () => {
    expect(selectSpeechVoice(voices, "en")?.name).toBe("Google UK English");
  });

  it("selects a Spanish voice for Spanish text", () => {
    expect(selectSpeechVoice(voices, "es")?.name).toBe("Spanish Voice");
  });

  it("does not fall back to a voice from another language", () => {
    expect(selectSpeechVoice(voices, "fr")).toBeNull();
  });
});
