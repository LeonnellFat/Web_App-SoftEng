export type Category = "Birthday Flowers" | "Anniversary" | "Graduation" | "Sympathy" | "Wedding" | "Get Well Soon" | "Thank You" | "Just Because";

export interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  categories: Category[];
  badge?: string;
}

export interface CategoryInfo {
  name: Category;
  description?: string;
  image?: string;
}

// NOTE: mock data removed. Keep the exported symbols but return empty datasets
// so that the application compiles. Replace these with real API calls/data sources.
export const products: Product[] = [];
export const categories: CategoryInfo[] = [];

export function getProductCountByCategory(_category: Category): number {
  return 0;
}

export function getProductsByCategory(_category: Category): Product[] {
  return [];
}
