export interface BouquetColor {
  id: string;
  name: string;
  hexCode: string;
  description: string;
}

export interface FlowerType {
  id: string;
  name: string;
  image: string;
  category: string;
  available: boolean;
}

// NOTE: mock data removed. Keep these exported names so components compile.
export const initialBouquetColors: BouquetColor[] = [];
export const initialFlowerTypes: FlowerType[] = [];
