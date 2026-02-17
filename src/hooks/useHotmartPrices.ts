import { useEffect, useState } from 'react';
import { type PricingScrapedData } from '../components/PricingCard';

type CatalogCountryPrice = {
  total: string;
  currency: string;
  taxRate: number | null;
};

type HotmartCatalogResponse = Record<string, Record<string, CatalogCountryPrice>>;

export function useHotmartPrices(productId: string) {
  const [scrapedData, setScrapedData] = useState<PricingScrapedData>();
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);

  useEffect(() => {
    const loadPrices = async () => {
      try {
        const response = await fetch('https://hotprices.kurukin.com/api/v1/catalog');

        if (!response.ok) {
          return;
        }

        const catalog: HotmartCatalogResponse = await response.json();
        const productCatalog = catalog[productId];

        if (!productCatalog) {
          return;
        }

        const mappedData: PricingScrapedData = Object.fromEntries(
          Object.entries(productCatalog).map(([countryCode, price]) => [countryCode, { total: price.total }]),
        );

        setScrapedData(mappedData);
      } catch (error) {
        console.error('Error loading Hotmart prices:', error);
      } finally {
        setIsLoadingPrices(false);
      }
    };

    loadPrices();
  }, [productId]);

  return { scrapedData, isLoadingPrices };
}

