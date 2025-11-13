// src/contentstack-sdk/fetchContent.ts
import { Stack } from "./utils";

type SingleEntryOptions = {
  uid?: string;
  url?: string;
};

export async function getSingleEntry(
  contentType: string,
  options?: SingleEntryOptions
) {
    if (options?.uid) {
        const result = await Stack.ContentType(contentType)
            .Entry(options.uid)
            .toJSON()
            .fetch();
        return result || null;
    }

    const query = Stack.ContentType(contentType).Query();

    if (options?.url) {
        query.where('url', options.url);
    }

    const result = await query
        .toJSON()
        .find();

    return result?.[0]?.[0] || null;
}

// Fonction utile pour récupérer toutes les entrées d'un content type
export async function getAllEntries(contentType: string) {
    const result = await Stack.ContentType(contentType)
        .Query()
        .toJSON()
        .find();
    
    return result?.[0] || [];
}