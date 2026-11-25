import RestaurantMenu from '@/components/menu/RestaurantMenu';

export default async function RestaurantPage({ params }) {
    const { slug } = await params;
    return <RestaurantMenu slug={slug} />;
}
