// src/contexts/ContentContext.tsx
import { createContext } from 'preact';
import { useContext, useState, useEffect } from 'preact/hooks';
import { Stack } from '../contentstack-sdk/utils';
import { getSingleEntry } from '../contentstack-sdk/fetchContent';

interface ContentData {
    header: any;
    footer: any;
    page: any;
}

interface ContentContextValue {
    data: ContentData | null;
    isLoading: boolean;
    error: string | null;
}

const ContentContext = createContext<ContentContextValue | null>(null);

interface ContentProviderProps {
    children: any;
    initialData?: ContentData | null;
    isPreview?: boolean;
    currentUrl?: string;
}

export function ContentProvider({
    children,
    initialData = null,
    isPreview = false,
    currentUrl = '/'
}: ContentProviderProps) {
    const [data, setData] = useState<ContentData | null>(initialData);
    const [isLoading, setIsLoading] = useState(isPreview && !initialData);
    const [error, setError] = useState<string | null>(null);
    const [isLivePreviewReady, setIsLivePreviewReady] = useState(!isPreview);

    // Initialiser Live Preview en mode preview uniquement
    useEffect(() => {
        if (!isPreview) return;

        async function initLivePreview() {
            try {
                console.log('📦 Chargement dynamique du SDK Live Preview...');
                const { default: ContentstackLivePreview } = await import('@contentstack/live-preview-utils');

                console.log('🔧 Initialisation de Visual Builder...');
                await ContentstackLivePreview.init({
                    ssr: false,
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

        initLivePreview();
    }, [isPreview]);

    // Fetcher les données en mode preview une fois Live Preview prêt
    useEffect(() => {
        if (!isPreview || !isLivePreviewReady) return;

        async function fetchData() {
            setIsLoading(true);
            setError(null);

            try {
                console.log('🔄 Fetching data for URL:', currentUrl);

                const [headerPromise, footerPromise, pagePromise] = await Promise.allSettled([
                    getSingleEntry('header'),
                    getSingleEntry('footer'),
                    getSingleEntry('page', { url: currentUrl })
                ]);

                const newData: ContentData = {
                    header: null,
                    footer: null,
                    page: null,
                };

                if (headerPromise.status === "fulfilled") {
                    console.log('✅ Header chargé:', headerPromise.value);
                    newData.header = headerPromise.value;
                } else {
                    console.error('❌ Erreur header:', headerPromise.reason);
                }

                if (footerPromise.status === "fulfilled") {
                    console.log('✅ Footer chargé:', footerPromise.value);
                    newData.footer = footerPromise.value;
                } else {
                    console.error('❌ Erreur footer:', footerPromise.reason);
                }

                if (pagePromise.status === "fulfilled") {
                    console.log('✅ Page chargée:', pagePromise.value);
                    newData.page = pagePromise.value;
                } else {
                    console.error('❌ Erreur page:', pagePromise.reason);
                }

                setData(newData);
            } catch (error) {
                console.error('❌ Erreur lors du chargement:', error);
                setError('Impossible de charger le contenu.');
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [isPreview, isLivePreviewReady, currentUrl]);

    const contextValue: ContentContextValue = {
        data,
        isLoading,
        error
    };

    return (
        <ContentContext.Provider value={contextValue}>
            {children}
        </ContentContext.Provider>
    );
}

// Hook pour accéder au contexte
export function useContent() {
    return useContext(ContentContext);
}