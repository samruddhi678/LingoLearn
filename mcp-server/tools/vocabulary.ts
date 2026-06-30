import { saveWord, getSavedWords, toggleWordMastery } from "./firebase.js";

export async function saveVocabulary(args: {
  username: string;
  id: string;
  word: string;
  translation: string;
  pronunciation: string;
  partOfSpeech: string;
  explanation: string;
  exampleOriginal: string;
  exampleTranslation: string;
}) {
  const { username, ...wordData } = args;
  if (!username) throw new Error("Missing username");
  if (!wordData.id) throw new Error("Missing vocabulary word id");
  if (!wordData.word) throw new Error("Missing vocabulary word");
  if (!wordData.translation) throw new Error("Missing vocabulary translation");

  await saveWord(username, wordData);
  return { success: true, message: `Vocabulary word "${wordData.word}" saved successfully for user ${username}.` };
}

export async function getVocabulary(args: { username: string }) {
  const { username } = args;
  if (!username) throw new Error("Missing username");

  const words = await getSavedWords(username);
  return { username, vocabulary: words };
}

export async function markVocabularyMastered(args: { username: string; wordId: string }) {
  const { username, wordId } = args;
  if (!username) throw new Error("Missing username");
  if (!wordId) throw new Error("Missing wordId");

  await toggleWordMastery(username, wordId);
  return { success: true, message: `Vocabulary word ${wordId} mastery status toggled successfully for user ${username}.` };
}
