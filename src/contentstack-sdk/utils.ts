import Contentstack from "contentstack";

// Détection robuste du mode preview
const isPreview = typeof window !== 'undefined' && (
  window.location.search.includes('preview=true') ||
  window.location.search.includes('content_type_uid') ||
  window.parent !== window
);

export const Stack = Contentstack.Stack({
    api_key: import.meta.env.PUBLIC_CONTENTSTACK_API_KEY,
    // Utiliser TOUJOURS le preview token en mode preview
    delivery_token: isPreview 
        ? import.meta.env.PUBLIC_CONTENTSTACK_PREVIEW_TOKEN!
        : import.meta.env.PUBLIC_CONTENTSTACK_DELIVERY_TOKEN!,
    environment: import.meta.env.PUBLIC_CONTENTSTACK_ENVIRONMENT,
    region: (import.meta.env.PUBLIC_CONTENTSTACK_REGION || "EU") as Contentstack.Region,
    live_preview: isPreview ? {
        enable: true,
        host: 'api.contentstack.io',
        management_token: import.meta.env.PUBLIC_CONTENTSTACK_MANAGEMENT_TOKEN, // Requis !
    } : undefined,
});

// Cache conditionnel : désactivé uniquement en preview
if (isPreview) {
    Stack.setCachePolicy(Contentstack.CachePolicy.IGNORE_CACHE);
} else {
    Stack.setCachePolicy(Contentstack.CachePolicy.NETWORK_ELSE_CACHE);
}

console.log('🔑 Contentstack initialisé:', {
    api_key: import.meta.env.PUBLIC_CONTENTSTACK_API_KEY?.substring(0, 8) + '...',
    mode: isPreview ? 'PREVIEW 🔴' : 'PRODUCTION 🟢',
    environment: import.meta.env.PUBLIC_CONTENTSTACK_ENVIRONMENT,
    region: import.meta.env.PUBLIC_CONTENTSTACK_REGION,
    live_preview: isPreview
});

export { isPreview };