export interface SpeechVoiceOption {
  name: string;
  lang: string;
}

export function reviewCardSpeechLanguages(direction: string) {
  const [sourceLanguage = "es", targetLanguage = "en"] = direction.split("-");

  return {
    front: targetLanguage,
    answer: sourceLanguage,
  };
}

export function selectSpeechVoice<T extends SpeechVoiceOption>(
  voices: T[],
  language: string,
): T | null {
  const languagePrefix = language.toLowerCase().split("-")[0];
  const matchingVoices = voices.filter(
    (voice) => voice.lang.toLowerCase().split("-")[0] === languagePrefix,
  );

  return (
    matchingVoices.find((voice) =>
      voice.name.toLowerCase().includes("google"),
    ) ??
    matchingVoices[0] ??
    null
  );
}
