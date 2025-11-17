import { useEffect, useState } from 'preact/hooks';
import { Header } from './Header';
import { Footer } from './Footer';
import { getSingleEntry } from '../../contentstack-sdk/fetchContent';
import ContentstackLivePreview from '@contentstack/live-preview-utils';
import { Stack } from '../../contentstack-sdk/utils';
import '../../styles/main.scss';

interface Page { title?: string; body?: string; url?: string; uid?: string; }
interface HeaderFooter { [key: string]: any; }
interface DataState { 
  header: HeaderFooter | null; 
  footer: HeaderFooter | null; 
  page: Page | null; 
}

export default function PreviewWrapper() {
  const [data, setData] = useState<DataState>({ 
    header: null, 
    footer: null, 
    page: null 
  });
  const [currentUrl, setCurrentUrl] = useState('/');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLivePreviewReady, setIsLivePreviewReady] = useState(false);

  useEffect(() => {
    // 1. Récupérer l'URL depuis les paramètres
    const params = new URLSearchParams(window.location.search);
    const previewUrl = params.get('url') || '/';
    setCurrentUrl(previewUrl);

    // 2. Initialiser le Live Preview AVANT de fetcher
    async function initLivePreview() {
      try {
        await ContentstackLivePreview.init({ 
          enable: true,
          stackSdk: Stack,
          ssr: false,
          stackDetails: {
            apiKey: import.meta.env.PUBLIC_CONTENTSTACK_API_KEY,
            environment: import.meta.env.PUBLIC_CONTENTSTACK_ENVIRONMENT,
          },
          clientUrlParams: {
            host: 'app.contentstack.com'
          },
          editButton: {
            enable: true,
          }
        });
        console.log('✅ Live Preview initialisé avec succès');
        setIsLivePreviewReady(true);
      } catch (err) {
        console.error('❌ Erreur init Live Preview:', err);
        setError('Échec initialisation Live Preview');
      }
    }

    initLivePreview();
  }, []);

  // 3. Fetcher les données une fois le Live Preview prêt
  useEffect(() => {
    if (!isLivePreviewReady) return;

    async function fetchData(url: string) {
      setIsLoading(true);
      setError(null);
      try {
        console.log('🔄 Fetching data for URL:', url);
        
        const [header, footer, page] = await Promise.all([
          getSingleEntry('header'),
          getSingleEntry('footer'),
          getSingleEntry('page', { url })
        ]);
        
        console.log('✅ Données récupérées et enrichies:', { header, footer, page });
        setData({ header, footer, page });
      } catch (error) {
        console.error('❌ Erreur lors du chargement:', error);
        setError('Impossible de charger le contenu.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData(currentUrl);

    // 4. Écouter les changements en temps réel
    const unsubscribe = ContentstackLivePreview.onEntryChange(() => {
      console.log('🔄 Changement détecté dans Contentstack');
      fetchData(currentUrl);
    });

    return () => {
      (unsubscribe as unknown as (() => void) | undefined)?.();
    };
  }, [isLivePreviewReady, currentUrl]);

  const title = data.page?.title || 'Chargement...';
  const content = data.page?.body || '<p>Aucun contenu disponible</p>';

  return (
    <div>
      <div style={{
        background: isLivePreviewReady ? '#4caf50' : '#ffeb3b',
        padding: '8px',
        textAlign: 'center',
        fontWeight: 'bold',
        borderBottom: '2px solid',
        color: 'white'
      }}>
        {isLivePreviewReady 
          ? `✅ LIVE PREVIEW ACTIF - URL: ${currentUrl}`
          : '⏳ Initialisation du Live Preview...'}
      </div>
      
      {isLoading ? (
        <main className="p-4">
          <p>⏳ Chargement du contenu...</p>
        </main>
      ) : error ? (
        <main className="p-4">
          <p style={{ color: 'red' }}>❌ {error}</p>
        </main>
      ) : (
        <>
          <Header data={data.header} />
          <main 
            className="container mx-auto p-4"
            data-cslp={data.page ? JSON.stringify(data.page) : undefined}
          >
            <h1 
              className="text-4xl font-bold mb-6"
              data-cslp={data.page?.uid ? `${data.page.uid}.title` : undefined}
            >
              {title}
            </h1>
            <div 
              className="prose" 
              dangerouslySetInnerHTML={{ __html: content }}
              data-cslp={data.page?.uid ? `${data.page.uid}.body` : undefined}
            />
          </main>
          <Footer data={data.footer} />
        </>
      )}
    </div>
  );
}