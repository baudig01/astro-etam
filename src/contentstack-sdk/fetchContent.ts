// src/contentstack-sdk/fetchContent.ts
import { Stack } from "./utils";
import {QueryOperation} from "@contentstack/delivery-sdk";

type SingleEntryOptions = {
  uid?: string;
  url?: string;
};

export async function getSingleEntry(
  contentType: string,
  options?: SingleEntryOptions
) {
    if (options?.uid) {
        const result = await Stack.contentType(contentType)
            .entry(options.uid)
            .fetch();
        return result || null;
    }

    const query = Stack.contentType(contentType).entry().query();

    if (options?.url) {
        query.where('url', QueryOperation.EQUALS, options.url);
    }

    const result = await query.find();

    // Le nouveau SDK retourne { entries: [...] }
    return result.entries?.[0] || null;
}

// Fonction utile pour récupérer toutes les entrées d'un content type
export async function getAllEntries(contentType: string) {
    const result = await Stack.contentType(contentType)
        .entry()
        .query()
        .find();

    // Le nouveau SDK retourne { entries: [...] }
    return result.entries || [];
}