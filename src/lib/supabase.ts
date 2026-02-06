
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('Missing Supabase Credentials');
    } else {
        console.warn("Supabase Credentials missing - Storage features will fail if used.");
    }
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '');
export const SUPABASE_BUCKET_NAME = 'projects';

/**
 * recursively deletes files in a folder from Supabase storage
 */
export async function deleteFolderRecursively(folderPath: string) {
    if (!folderPath || folderPath === '/') return; // Safety check

    try {
        const { data: list, error: listError } = await supabase.storage
            .from(SUPABASE_BUCKET_NAME)
            .list(folderPath);

        if (listError) throw listError;
        if (!list || list.length === 0) return;

        const filesToDelete: string[] = [];
        const subfolders: string[] = [];

        // Identify files vs folders
        // Supabase storage list returns objects. If it has an 'id', it's usually a file. 
        // If it strictly has metadata indicating it's a folder (or no metadata but is a prefix), it's a folder.
        // However, list() behavior can vary. Generally items without `id` or with specific metadata are placeholders.
        // For standard Supabase storage:
        for (const item of list) {
            if (item.id) {
                // It's a file
                filesToDelete.push(`${folderPath}/${item.name}`);
            } else {
                // It's likely a folder/prefix
                subfolders.push(`${folderPath}/${item.name}`);
            }
        }

        // Delete files in this folder
        if (filesToDelete.length > 0) {
            const { error: deleteError } = await supabase.storage
                .from(SUPABASE_BUCKET_NAME)
                .remove(filesToDelete);

            if (deleteError) console.error("Error deleting files:", deleteError);
        }

        // Recurse for subfolders
        await Promise.all(subfolders.map(sub => deleteFolderRecursively(sub)));

    } catch (error) {
        console.error(`Failed to delete folder ${folderPath}:`, error);
    }
}
