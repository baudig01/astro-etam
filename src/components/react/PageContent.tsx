import {useEffect, useState} from 'preact/hooks';
import {Stack} from '../../contentstack-sdk/utils';
import contentstack, {QueryOperation} from "@contentstack/delivery-sdk";
import type {IStackSdk} from "@contentstack/live-preview-utils";
import {getContentstackEndpoints, getRegionForString} from "@timbenniks/contentstack-endpoints";

interface Block {
    title?: string;
    body?: string;
    block?: {
        image?: {
            url: string;
            title: string;
        };
    };
    $?: any; // Métadonnées Visual Builder
}

interface PageData {
    block?: any;
    body?: string;
    blocks?: Block[];
    $?: any; // Métadonnées Visual Builder
}

interface Props {
    page?: PageData;  // Mode SSR : données déjà fetchées
    url?: string;      // Mode Live Preview : URL à fetcher
}

let contentstackLivePreview;

export default function PageContent({page: initialPage, url}: Props) {
    const [page, setPage] = useState<PageData | null>(initialPage || null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLivePreviewReady, setIsLivePreviewReady] = useState(false);

    // Mode Live Preview : créer le PreviewStack et initialiser le SDK
    useEffect(() => {
        if (!url) return; // Mode SSR : pas besoin d'initialiser

        async function initLivePreview() {
            try {
                const region = getRegionForString(import.meta.env.PUBLIC_IS_PREVIEW as string);
                const endpoints = getContentstackEndpoints(region, true)

                console.log('📦 Chargement dynamique du SDK Live Preview...');
                const {default: ContentstackLivePreview} = await import('@contentstack/live-preview-utils');
                contentstackLivePreview = ContentstackLivePreview;
                console.log('🔧 Initialisation de Visual Builder...');
                await contentstackLivePreview.init({
                    ssr: false,
                    enable: import.meta.env.PUBLIC_IS_PREVIEW === 'true',
                    mode: "builder",
                    stackSdk: Stack.config as IStackSdk,
                    stackDetails: {
                        apiKey: import.meta.env.PUBLIC_CONTENTSTACK_API_KEY as string,
                        environment: import.meta.env.PUBLIC_CONTENTSTACK_ENVIRONMENT as string,
                    },
                    clientUrlParams: {
                        // Setting the client URL parameters for live preview
                        // for internal testing purposes at Contentstack we look for a custom host in the env vars, you do not have to do this.
                        host: endpoints && endpoints.application
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
    }, [url]);

    // Fetcher les données une fois Live Preview prêt
    useEffect(() => {
        if (!url || !isLivePreviewReady) return;

        async function fetchData() {
            setIsLoading(true);
            setError(null);

            try {
                // Récupérer les query params pour le Live Preview
                const params = new URLSearchParams(window.location.search);
                const searchParams = {
                    live_preview: params.get('live_preview'),
                    contentTypeUid: params.get('content_type_uid'),
                    entryUid: params.get('entry_uid'),
                };

                console.log('🔄 Fetching page for URL:', url);

                // IMPORTANT: Passer les query params au Stack pour activer le Live Preview
                if (searchParams.live_preview) {
                    Stack.livePreviewQuery(searchParams);
                    console.log('🔑 Live preview query params set:', searchParams);
                }

                // Fetcher la page par URL
                const result = await Stack.contentType('page')
                    .entry()
                    .query()
                    .where('url', QueryOperation.EQUALS, url!)
                    .find<PageData>();

                console.log('🔍 Result:', result);

                if (result.entries && result.entries.length > 0) {
                    const entry = result.entries[0];

                    // Ajouter les tags éditables pour le Live Preview
                    if (import.meta.env.PUBLIC_IS_PREVIEW === 'true') {
                        contentstack.Utils.addEditableTags(entry, 'page', true);
                    }

                    console.log('✅ Page chargée:', entry);
                    setPage(entry);
                } else {
                    setError('Page non trouvée');
                }
            } catch (err) {
                console.error('❌ Erreur lors du chargement de la page:', err);
                setError('Impossible de charger la page.');
            } finally {
                setIsLoading(false);
            }
        }

        async function setupLivePreview() {

            contentstackLivePreview?.onEntryChange(() => {
                console.log("STACK ENTRY CHANGE")
                fetchData();
            });

            // Fetch initial
            fetchData();
        }

        setupLivePreview();
    }, [url, isLivePreviewReady]);

    // États de chargement en mode Live Preview
    if (url && isLoading) {
        return (
            <main className="container mx-auto p-4">
                <p>⏳ Chargement du contenu...</p>
            </main>
        );
    }

    if (url && error) {
        return (
            <main className="container mx-auto p-4">
                <p style={{color: 'red'}}>❌ {error}</p>
            </main>
        );
    }

    if (!page) {
        return null;
    }

    const {title, body, blocks} = page;

    return (
        <main className="container mx-auto p-4">
            <h1
                className="text-4xl font-bold mb-6"
                {...(page.$?.title ?? {})}
            >
                {title}
            </h1>

            {blocks && blocks.map((block, index) => (
                <div className="block" key={index}>
                    {block.block?.title && (
                        <h2
                            className="title-01"
                            {...(block.block.$?.title ?? {})}
                        >
                            {block.block.title}
                        </h2>
                    )}

                    {block.block?.body && (
                        <div
                            className="prose"
                            dangerouslySetInnerHTML={{__html: block.body}}
                            {...(block.block.$?.body ?? {})}
                        />
                    )}

                    {block.block?.image && (
                        <div className="block__picture" {...(block.block.$?.image ?? {})}>
                            <img
                                className="block__pictureImg"
                                src={block.block.image.url}
                                alt={block.block.image.title}
                            />
                            <span className="block__pictureCaption">
                                {block.block.image.title}
                            </span>
                        </div>
                    )}
                </div>
            ))}

            {body && (
                <div
                    className="prose"
                    dangerouslySetInnerHTML={{__html: body}}
                    {...(page.$?.body ?? {})}
                />
            )}
        </main>
    );
}