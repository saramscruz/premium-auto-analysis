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
    appPageUrl: "https://www.mercedes-benz.com/en/features/app/",
    salesPageUrl: "https://www.mercedes-benz.com/en/vehicles/c-class/digital-services/",
    appStoreUrl: "https://play.google.com/store/apps/details?id=com.daimler.mm",
    linkedInUrl: "https://www.linkedin.com/company/mercedes-benz/",
    appStoreId: "com.daimler.mm",
    appPageSelector: ".article-text, .content-text, .features-description, main p",
    salesPageSelector: ".article-text, .content-text, main p",
  },
  {
    name: "BMW",
    appPageUrl: "https://www.bmw.com/en/topics/discover-bmw/bmw-connected-drive.html",
    salesPageUrl: "https://www.bmw.com/en/topics/discover-bmw/digital-services/",
    appStoreUrl: "https://play.google.com/store/apps/details?id=com.bmw.connected",
    linkedInUrl: "https://www.linkedin.com/company/bmw/",
    appStoreId: "com.bmw.connected",
    appPageSelector: ".content-text, .article-content, main p",
    salesPageSelector: ".content-text, .article-content, main p",
  },
  {
    name: "Audi",
    appPageUrl: "https://www.audi.com/en/brand/en/digital-services/myaudi-app.html",
    salesPageUrl: "https://www.audi.com/en/brand/en/digital-services/",
    appStoreUrl: "https://play.google.com/store/apps/details?id=com.audi.mobileservices",
    linkedInUrl: "https://www.linkedin.com/company/audi/",
    appStoreId: "com.audi.mobileservices",
    appPageSelector: ".editorial-teaser__text, .nm-md-text, main p",
    salesPageSelector: ".editorial-teaser__text, .nm-md-text, main p",
  },
  {
    name: "Volvo",
    appPageUrl: "https://www.volvocars.com/en-pt/support/app",
    salesPageUrl: "https://www.volvocars.com/en-pt/vehicles/",
    appStoreUrl: "https://play.google.com/store/apps/details?id=com.volvo.cars",
    linkedInUrl: "https://www.linkedin.com/company/volvo-cars/",
    appStoreId: "com.volvo.cars",
    appPageSelector: ".support-article, .article-body, main p",
    salesPageSelector: ".article-text, main p",
  },
  {
    name: "Porsche",
    appPageUrl: "https://www.porsche.com/usa/en/connection/porsche-connect/",
    salesPageUrl: "https://www.porsche.com/usa/en/connection/",
    appStoreUrl: "https://play.google.com/store/apps/details?id=com.porsche.connect",
    linkedInUrl: "https://www.linkedin.com/company/porsche-ag/",
    appStoreId: "com.porsche.connect",
    appPageSelector: ".content-wrapper p, .text-module p, main p",
    salesPageSelector: ".content-wrapper p, .text-module p, main p",
  },
];

export function getBrand(name: string): BrandConfig | undefined {
  return BRANDS.find((b) => b.name === name);
}
