// src/utils/helpers.js

// format moods for signature
export function normalizeMoods(moods = []) {
  return moods
    .map((m) => m.toLowerCase().trim())
    .sort()
    .join(",")
}
