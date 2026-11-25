export function slugify(text) {
    return String(text || '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48) || 'restaurant';
}

/** Returns a slug not yet used by any document of `Model`. */
export async function uniqueSlug(Model, text) {
    const base = slugify(text);
    let slug = base;
    for (let i = 2; await Model.exists({ slug }); i++) slug = `${base}-${i}`;
    return slug;
}
