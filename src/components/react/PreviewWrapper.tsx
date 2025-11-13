// src/components/react/PreviewWrapper.tsx
import { useEffect, useState } from 'preact/hooks';
import { Header } from './Header';
import { Footer } from './Footer';
import { getSingleEntry } from '../../contentstack-sdk/fetchContent';
import ContentstackLivePreview from '@contentstack/live-preview-utils';
import { Stack } from '../../contentstack-sdk/utils';
import '../../styles/main.scss';

interface Page { title?: string; body?: string; url?: string; }
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

  useEffect(() => {
    // Initialiser le Live Preview
    ContentstackLivePreview.init({ 
      enable: true,
      stackSdk: Stack as any,
      ssr: false,
      clientUrlParams: {
        host: 'app.contentstack.com'
      }
    });
    console.log('✅ Live Preview initialisé');

    // Récupérer l'URL depuis les paramètres
    const params = new URLSearchParams(window.location.search);
    const previewUrl = params.get('url') || '/';
    setCurrentUrl(previewUrl);

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
        
        console.log('✅ Données récupérées:', { header, footer, page });
        setData({ header, footer, page });
      } catch (error) {
        console.error('❌ Erreur lors du chargement:', error);
        setError('Impossible de charger le contenu.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData(previewUrl);

    // Écouter les changements en temps réel
    const handleChange = () => {
      console.log('🔄 Changement détecté dans Contentstack');
      fetchData(currentUrl);
    };

    ContentstackLivePreview.onEntryChange(handleChange);

    return () => {
      // Cleanup si nécessaire
    };
  }, [currentUrl]);

  const title = data.page?.title || 'Chargement...';
  const content = data.page?.body || '<p>Aucun contenu disponible</p>';

  return (
    <div>
      <div style={{
        background: '#ffeb3b',
        padding: '8px',
        textAlign: 'center',
        fontWeight: 'bold',
        borderBottom: '2px solid #ffc107'
      }}>
        🔍 MODE PREVIEW ACTIF - URL: {currentUrl}
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
          <main className="container mx-auto p-4">
            <h1 className="text-4xl font-bold mb-6">{title}</h1>
            <div className="prose" dangerouslySetInnerHTML={{ __html: content }} />
          </main>
          <Footer data={data.footer} />
        </>
      )}
    </div>
  );
}