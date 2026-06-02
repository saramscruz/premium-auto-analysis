export interface BrandConfig {
  name: string;
  appPageUrl: string;
  salesPageUrl: string;
  appStoreUrl: string;
  linkedInUrl: string;
  appStoreId: string;
  appPageSelector: string;
  salesPageSelector: string;
}

export const BRANDS: BrandConfig[] = [
  {
    name: "Mercedes-Benz",
    appPageUrl: "https://media.mercedes-benz.com/",
    salesPageUrl: "https://www.mercedes-benz.com/en/",
    appStoreUrl: "https://play.google.com/store/apps/details?id=com.daimler.mm",
    linkedInUrl: "https://www.linkedin.com/company/mercedes-benz/",
    appStoreId: "com.daimler.mm",
    appPageSelector: "main p, .content-text, .text-module",
    salesPageSelector: "main p, .content-text",
  },
  {
    name: "BMW",
    appPageUrl: "https://www.press.bmwgroup.com/global",
    salesPageUrl: "https://www.bmw.pt/pt/index.html",
    appStoreUrl: "https://play.google.com/store/apps/details?id=com.bmw.connected",
    linkedInUrl: "https://www.linkedin.com/company/bmw/",
    appStoreId: "com.bmw.connected",
    appPageSelector: "main p, .content-text, .article-content",
    salesPageSelector: "main p, .content-text",
  },
  {
    name: "Audi",
    appPageUrl: "https://www.audi-mediacenter.com/en",
    salesPageUrl: "https://www.audi.com/en/",
    appStoreUrl: "https://play.google.com/store/apps/details?id=com.audi.mobileservices",
    linkedInUrl: "https://www.linkedin.com/company/audi/",
    appStoreId: "com.audi.mobileservices",
    appPageSelector: "main p, .editorial-teaser__text",
    salesPageSelector: "main p, .editorial-teaser__text",
  },
  {
    name: "Volvo",
    appPageUrl: "https://www.volvocars.com/intl/media/",
    salesPageUrl: "https://www.volvocars.com/pt/",
    appStoreUrl: "https://play.google.com/store/apps/details?id=com.volvo.cars",
    linkedInUrl: "https://www.linkedin.com/company/volvo-cars/",
    appStoreId: "com.volvo.cars",
    appPageSelector: "main p, .support-article, .article-body",
    salesPageSelector: "main p, .article-text",
  },
  {
    name: "Porsche",
    appPageUrl: "https://www.porsche.com/international/connect/",
    salesPageUrl: "https://www.porsche.com/international/models/",
    appStoreUrl: "https://play.google.com/store/apps/details?id=com.porsche.connect",
    linkedInUrl: "https://www.linkedin.com/company/porsche-ag/",
    appStoreId: "com.porsche.connect",
    appPageSelector: "main p, .content-wrapper p, .text-module p",
    salesPageSelector: "main p, .content-wrapper p",
  },
];

export function getBrand(name: string): BrandConfig | undefined {
  return BRANDS.find((b) => b.name === name);
}
