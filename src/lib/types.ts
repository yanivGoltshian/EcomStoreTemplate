export type Product = {
  id: number;
  name: string;
  model: string;
  price: number;
  regularPrice: number;
  salePrice: number;
  onSale: boolean;
  image: string;
  categoryIds: number[];
  inStock: boolean;
  description: string;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  parent: number;
  count: number;
  icon: string;
  isTop: boolean;
};

export type NavSub = { id: number; name: string; count: number; href?: string };

export type NavItem = {
  id: number;
  name: string;
  slug: string;
  icon: string;
  count: number;
  subs: NavSub[];
  href?: string;
  thumb?: string;
};

export type PromoTile = {
  id: string;
  title: string;
  image: string;
  categoryId: number;
};

export type HomeSection = {
  id: string;
  title: string;
  icon: string;
  categoryId: number;
  limit: number;
  layout: "carousel" | "grid";
};

export type Hero = {
  image: string;
  alt: string;
  href: string;
};

export type DealFace = {
  id: string;
  productId?: number;
  title: string;
  image: string;
  originalPrice?: number;
  dealPrice: number;
  href: string;
};

export type DealsCube = {
  enabled: boolean;
  intervalMs?: number;
  faces: DealFace[];
};

export type Homepage = {
  announcement: string;
  topbarPhone: string;
  hero: Hero;
  promoTiles: PromoTile[];
  sections: HomeSection[];
  dealsCube?: DealsCube;
};

export type OpeningHours = {
  days: string[];
  opens: string;
  closes: string;
};

export type SiteReview = {
  author: string;
  text: string;
  rating?: number;
  source?: string;
};

export type SiteAddress = {
  street: string;
  streetEn: string;
  city: string;
  cityEn: string;
  postalCode: string;
  country: string;
  full: string;
};

export type Site = {
  name: string;
  nameEn: string;
  legalName: string;
  vatId?: string;
  tagline: string;
  lang: string;
  dir: "rtl" | "ltr";
  locale: string;
  description?: string;
  keywords?: string[];
  adminHost?: string;
  url: string;
  deployUrl: string;
  ogImage: string;
  googleSiteVerification?: string;
  phone: string;
  phoneRaw: string;
  whatsapp: string;
  whatsappDisplay: string;
  email: string;
  facebook: string;
  instagram: string;
  googleReviewUrl?: string;
  reviews?: SiteReview[];
  address: SiteAddress;
  hours: string;
  openingHours: OpeningHours[];
  theme?: { primary: string };
  logo?: { image: string; alt: string };
  favicon?: string;
  analytics?: { googleAnalyticsId?: string };
};

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  links?: { href: string; label: string }[];
};

export type LegalContentPage = {
  title: string;
  intro?: string;
  updated: string;
  sections: LegalSection[];
};

export type AboutValue = {
  icon: string;
  title: string;
  text: string;
};

export type AboutPageContent = {
  title: string;
  intro: string[];
  visit: {
    addressLead: string;
    phoneLead: string;
  };
  values: AboutValue[];
};

export type ContactPageContent = {
  title: string;
  lead: string;
};

export type ContentPages = {
  privacy: LegalContentPage;
  terms: LegalContentPage;
  returns: LegalContentPage;
  accessibility: LegalContentPage;
  about: AboutPageContent;
  contact: ContactPageContent;
};

export type Coupon = {
  id: number;
  code: string;
  title: string;
  type: "percent" | "fixed";
  value: number;
  scope: "all" | "category" | "products";
  categoryId?: number;
  productIds?: number[];
  minSubtotal?: number;
  startsAt?: string;
  endsAt?: string;
  active: boolean;
  visibility: "public" | "hidden";
  stackable?: boolean;
  terms?: string;
};
