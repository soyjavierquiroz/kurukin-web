import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useYourls } from '../hooks/useYourls';

export function LinkRedirector() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { expandLink } = useYourls();

  useEffect(() => {
    let isMounted = true;

    const resolveAndRedirect = async () => {
      if (!slug) {
        navigate('/', { replace: true });
        return;
      }

      try {
        const longUrl = await expandLink(slug);
        window.location.replace(longUrl);
      } catch {
        if (isMounted) {
          navigate('/', { replace: true });
        }
      }
    };

    void resolveAndRedirect();

    return () => {
      isMounted = false;
    };
  }, [slug, expandLink, navigate]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-900">
      <div
        className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400"
        role="status"
        aria-label="Redirigiendo enlace"
      />
    </div>
  );
}
