import contentstack from "@contentstack/delivery-sdk";
import { getContentstackEndpoints, getRegionForString } from "@timbenniks/contentstack-endpoints";

const region = getRegionForString(import.meta.env.PUBLIC_IS_PREVIEW as string) || "eu";
const endpoints = getContentstackEndpoints(region, true)
// Détection robuste du mode preview
const isPreview = import.meta.env.PUBLIC_IS_PREVIEW === "true";

console.log("isPreview:", isPreview);
console.log("region:", region);
console.log("endpoints:", endpoints);

export const Stack = contentstack.stack({
    apiKey: import.meta.env.PUBLIC_CONTENTSTACK_API_KEY as string,
    deliveryToken: import.meta.env.PUBLIC_CONTENTSTACK_DELIVERY_TOKEN as string,
    environment: import.meta.env.PUBLIC_CONTENTSTACK_ENVIRONMENT as string,
    region: region ? region : import.meta.env.PUBLIC_CONTENTSTACK_REGION as any,
    host: endpoints && endpoints.contentDelivery,
    live_preview: {
        enable: import.meta.env.PUBLIC_IS_PREVIEW === 'true',
        preview_token: import.meta.env.PUBLIC_CONTENTSTACK_PREVIEW_TOKEN,
        host: endpoints && endpoints.preview
    }
});

console.log('🔑 Contentstack initialisé:', {
    api_key: import.meta.env.PUBLIC_CONTENTSTACK_API_KEY?.substring(0, 8) + '...',
    mode: isPreview ? 'PREVIEW 🔴' : 'PRODUCTION 🟢',
    environment: import.meta.env.PUBLIC_CONTENTSTACK_ENVIRONMENT,
    region: import.meta.env.PUBLIC_CONTENTSTACK_REGION,
    live_preview: isPreview
});

export { isPreview };