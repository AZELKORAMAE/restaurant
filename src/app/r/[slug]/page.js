import RestaurantMenu from '@/components/menu/RestaurantMenu';
import dbConnect from '@/lib/db';
import Restaurant from '@/models/Restaurant';

/** Title, description and image shown when the menu link is shared (WhatsApp, Instagram…). */
export async function generateMetadata({ params }) {
    const { slug } = await params;
    try {
        await dbConnect();
        const r = await Restaurant.findOne({ slug, status: 'approved' }).select('name description cuisine city coverImage logo').lean();
        if (!r) return { title: 'Menu' };
        const description = r.description || [r.cuisine, r.city].filter(Boolean).join(' · ') || `La carte de ${r.name} en 3D.`;
        const image = r.coverImage || r.logo;
        return {
            title: `${r.name} — Menu`,
            description,
            openGraph: { title: r.name, description, images: image && image.startsWith('http') ? [image] : undefined },
        };
    } catch {
        return { title: 'Menu' };
    }
}

export default async function RestaurantPage({ params }) {
    const { slug } = await params;
    return <RestaurantMenu slug={slug} />;
}
