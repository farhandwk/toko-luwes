export const PRODUCT_CATEGORIES = [
    "Makanan",
    "Minuman",
    "Rumah Tangga",
    "Rokok",
    "Gerabah",
    "Elektronik"
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];