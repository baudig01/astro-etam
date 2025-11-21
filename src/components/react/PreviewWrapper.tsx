import {useEffect, useState} from 'preact/hooks';
import {Header} from './Header';
import {Footer} from './Footer';
import PageContent from './PageContent';
import {Stack} from '../../contentstack-sdk/utils';
import {getSingleEntry} from '../../contentstack-sdk/fetchContent';
import '../../styles/main.scss';

interface Page {
    title?: string;
    body?: string;
    url?: string;
    uid?: string;
}

interface HeaderFooter {
    [key: string]: any;
}

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

        // 2. Charger et initialiser le Live Preview dynamiquement
        async function init() {
            try {
                console.log('📦 Chargement dynamique du SDK Live Preview...');
                // Import dynamique pour éviter le conflit Preact Signals pendant le SSR
                const { default: ContentstackLivePreview } = await import('@contentstack/live-preview-utils');

                console.log('🔧 Initialisation de Visual Builder...');

                await ContentstackLivePreview.init({
                    ssr: true,
                    enable: true,
                    mode: "builder",
                    stackSdk: Stack,
                    stackDetails: {
                        apiKey: import.meta.env.PUBLIC_CONTENTSTACK_API_KEY as string,
                        environment: import.meta.env.PUBLIC_CONTENTSTACK_ENVIRONMENT as string,
                    },
                    clientUrlParams: {
                        host: import.meta.env.PUBLIC_CONTENTSTACK_API_HOST
                    },
                    editButton: {
                        enable: true,
                        exclude: ["outsideLivePreviewPortal"]
                    }
                });
                console.log('✅ Live Preview initialisé avec succès');
                setIsLivePreviewReady(true);
            } catch (err) {
                console.error('❌ Erreur init Live Preview:', err);
                setError(String(err));
            }
        }

        init();
    }, []);

    // 3. Fetcher les données une fois le Live Preview prêt
    useEffect(() => {
        console.log("TEST");
        if (!isLivePreviewReady) return;

        async function fetchData(url: string) {
            setIsLoading(true);
            setError(null);
            try {
                console.log('🔄 Fetching data for URL:', url);

                const [headerPromise, footerPromise, pagePromise] = await Promise.allSettled([
                    getSingleEntry('header'),
                    getSingleEntry('footer'),
                    getSingleEntry('page', {url})
                ]);

                console.log('✅ Données récupérées et enrichies:', {headerPromise, footerPromise, pagePromise});
                let data = {
                    header: null,
                    footer: null,
                    page: null,
                }
                if (headerPromise.status === "fulfilled") {
                    console.log('✅ Données récupérées et enrichies pour le header:', headerPromise.value);
                    data.header = headerPromise.value
                } else {
                    console.error('❌ Erreur lors du chargement du header:', headerPromise.reason);
                }
                if (footerPromise.status === "fulfilled") {
                    console.log('✅ Données récupérées et enrichies pour le footer:', footerPromise.value);
                    data.footer = footerPromise.value
                } else {
                    console.error('❌ Erreur lors du chargement du footer:', footerPromise.reason);
                }
                if (pagePromise.status === "fulfilled") {
                    console.log('✅ Données récupérées et enrichies pour le page:', pagePromise.value);
                    data.page = pagePromise.value
                } else {
                    console.error('❌ Erreur lors du chargement du footer:', pagePromise.reason);
                }
                setData(data);
            } catch (error) {
                console.error('❌ Erreur lors du chargement:', error);
                setError('Impossible de charger le contenu.');
            } finally {
                setIsLoading(false);
            }
        }

        fetchData(currentUrl);

    }, [isLivePreviewReady, currentUrl]);

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
                    <p style={{color: 'red'}}>❌ {error}</p>
                </main>
            ) : (
                <>
                    <Header data={data.header}/>
                    {data.page && <PageContent page={data.page} />}
                    <Footer data={data.footer}/>
                </>
            )}
        </div>
    );
}