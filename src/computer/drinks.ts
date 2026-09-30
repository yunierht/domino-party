export const DRINKS = [
  // Keep existing IDs for in-memory invitations across Fast Refresh.
  { id: 'heineken', name: 'Nubo' },
  { id: 'corona', name: 'Duna' },
  { id: 'stella', name: 'Orbe' },
  { id: 'miller', name: 'Milo' },
  { id: 'margarita', name: 'Margarita' },
  { id: 'daiquiri', name: 'Daiquiri' },
] as const;
export type DrinkId = typeof DRINKS[number]['id'];
export type DrinkGift = { drinkId: DrinkId; sequence: number } | null;

export function isDrinkId(value: unknown): value is DrinkId {
  return DRINKS.some(drink => drink.id === value);
}

/** Retired invitations disappear safely; no substitute beverage is chosen. */
export function normalizeDrinkGift(value: unknown): DrinkGift {
  if (!value || typeof value !== 'object') return null;
  const gift = value as Partial<NonNullable<DrinkGift>>;
  return isDrinkId(gift.drinkId) && typeof gift.sequence === 'number' && Number.isFinite(gift.sequence)
    ? value as NonNullable<DrinkGift> : null;
}
