const adjectives = [
  "Swift",
  "Brave",
  "Clever",
  "Mighty",
  "Noble",
  "Quick",
  "Wise",
  "Epic",
  "Grand",
];
const nouns = [
  "Panda",
  "Tiger",
  "Eagle",
  "Dragon",
  "Phoenix",
  "Wolf",
  "Bear",
  "Lion",
  "Hawk",
];

export const generateUserName = () => {
  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 99) + 1;

  return `${randomAdjective}${randomNoun}${randomNumber}`;
};
