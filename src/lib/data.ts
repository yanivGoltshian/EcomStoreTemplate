import productsData from "@/data/products.json";
import categoriesData from "@/data/categories.json";
import navData from "@/data/nav.json";
import descendantsData from "@/data/descendants.json";
import homepageData from "@/data/homepage.json";
import siteData from "@/data/site.json";
import pagesData from "@/data/pages.json";
import type { Product, Category, NavItem, Homepage, Site, ContentPages } from "./types";

export const products = productsData as Product[];
export const categories = categoriesData as Category[];
export const nav = navData as NavItem[];
export const homepage = homepageData as Homepage;
export const site = siteData as Site;
export const pages = pagesData as ContentPages;

export const waLink = `https://wa.me/${site.whatsapp}`;
export const telLink = `tel:${site.phoneRaw}`;
export const wazeLink = `https://waze.com/ul?q=${encodeURIComponent(
  site.address.full
)}&navigate=yes`;

const descendants = descendantsData as Record<string, number[]>;
const productById = new Map(products.map((p) => [p.id, p]));
const categoryById = new Map(categories.map((c) => [c.id, c]));

export function getProduct(id: number): Product | undefined {
  return productById.get(id);
}

export function getCategory(id: number): Category | undefined {
  return categoryById.get(id);
}

export function getProductsByCategory(catId: number): Product[] {
  const ids = descendants[String(catId)] ?? [catId];
  const set = new Set(ids);
  return products.filter((p) => p.categoryIds.some((c) => set.has(c)));
}

export function getDeals(maxPrice = 149): Product[] {
  return products.filter((p) => p.price > 0 && p.price <= maxPrice);
}

export function formatPrice(price: number): string {
  return "₪" + price.toLocaleString("he-IL");
}
