export const DRINKS = [
  { id: 'heineken', name: 'Heineken' },
  { id: 'corona', name: 'Corona' },
  { id: 'stella', name: 'Stella Artois' },
  { id: 'budweiser', name: 'Budweiser' },
  { id: 'miller', name: 'Miller Lite' },
  { id: 'margarita', name: 'Margarita' },
  { id: 'martini', name: 'Martini' },
  { id: 'daiquiri', name: 'Daiquiri' },
] as const;
export type DrinkId = typeof DRINKS[number]['id'];
export type DrinkGift = { drinkId: DrinkId; sequence: number } | null;
