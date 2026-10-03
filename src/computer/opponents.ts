/** Cosmetic opponents share the same offline rules and strategy. */
export const OPPONENTS = [
  { id: 'yuni', name: 'Yuni', es: 'Personalizado', en: 'Custom avatar', image: require('../../assets/computer-opponent-yuni-seated-v2.png'), depthImage: require('../../assets/opponent-depth-yuni-seated-v2.png') },
  { id: 'yoi', name: 'Yoi', es: 'Personalizado', en: 'Custom avatar', image: require('../../assets/computer-opponent-yoi-seated-v2.png'), depthImage: require('../../assets/opponent-depth-yoi-seated-v2.png') },
  { id: 'diego', name: 'Yase', es: 'Personalizado', en: 'Custom avatar', image: require('../../assets/computer-opponent-yase-seated-v1.png'), depthImage: require('../../assets/opponent-depth-yase-seated-v1.png') },
  { id: 'rafael', name: 'Andy', es: 'Personalizado', en: 'Custom avatar', image: require('../../assets/computer-opponent-andy-seated-v1.png'), depthImage: require('../../assets/opponent-depth-andy-seated-v1.png') },
  { id: 'lucia', name: 'Chuchi', es: 'Personalizado', en: 'Custom avatar', image: require('../../assets/computer-opponent-chuchi-seated-v2.png'), depthImage: require('../../assets/opponent-depth-chuchi-seated-v2.png') },
  { id: 'rigo', name: 'Rigo', es: 'Personalizado', en: 'Custom avatar', image: require('../../assets/opponent-rigo-seated-v1.png'), depthImage: require('../../assets/opponent-rigo-seated-v1.png') },
] as const;
export type OpponentId = typeof OPPONENTS[number]['id'];
