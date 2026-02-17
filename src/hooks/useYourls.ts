import { useCallback, useState } from 'react';

const API_URL = 'https://kuruk.in/yourls-api.php';
const SIGNATURE = '0eb5a147eb';

type YourlsStatus = 'success' | 'fail';

type YourlsShortUrlPayload = {
  keyword?: string;
  shorturl?: string;
  url?: string;
  title?: string;
};

export type YourlsCreateShortLinkResponse = {
  status?: YourlsStatus;
  message?: string;
  statusCode?: number;
  keyword?: string;
  shorturl?: string;
  url?: YourlsShortUrlPayload;
};

type YourlsExpandResponse = {
  status?: YourlsStatus;
  message?: string;
  statusCode?: number;
  longurl?: string;
};

type UseYourlsResult = {
  isLoading: boolean;
  error: string | null;
  createShortLink: (longUrl: string, keyword?: string) => Promise<YourlsCreateShortLinkResponse>;
  expandLink: (keyword: string) => Promise<string>;
};

export function useYourls(): UseYourlsResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createShortLink = useCallback(
    async (longUrl: string, keyword?: string): Promise<YourlsCreateShortLinkResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          signature: SIGNATURE,
          action: 'shorturl',
          format: 'json',
          url: longUrl,
        });

        const sanitizedKeyword = keyword?.trim();
        if (sanitizedKeyword) {
          params.append('keyword', sanitizedKeyword);
        }

        const response = await fetch(`${API_URL}?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`Error HTTP ${response.status} al crear el enlace.`);
        }

        const payload = (await response.json()) as YourlsCreateShortLinkResponse;
        if (payload.status === 'fail') {
          throw new Error(payload.message ?? 'YOURLS rechazó la creación del enlace.');
        }

        return payload;
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : 'Error desconocido al crear el enlace.';
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const expandLink = useCallback(async (keyword: string): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        signature: SIGNATURE,
        action: 'expand',
        format: 'json',
        shorturl: keyword,
      });

      const response = await fetch(`${API_URL}?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status} al expandir el enlace.`);
      }

      const payload = (await response.json()) as YourlsExpandResponse;
      if (payload.status === 'fail' || !payload.longurl) {
        throw new Error(payload.message ?? 'No se encontró la URL original para este slug.');
      }

      return payload.longurl;
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'Error desconocido al expandir el enlace.';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    createShortLink,
    expandLink,
  };
}
