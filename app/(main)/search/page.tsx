import { getItems } from "@/data/items";
import { itemFilterSchema } from "@/db/validation";
import { SearchDashboard } from "@/components/search/SearchDashboard";

interface SearchPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const resolvedParams = await searchParams;

    const filters = {
        search:
            typeof resolvedParams.search === "string"
                ? resolvedParams.search
                : undefined,
        minPrice:
            typeof resolvedParams.minPrice === "string"
                ? Number(resolvedParams.minPrice)
                : undefined,
        maxPrice:
            typeof resolvedParams.maxPrice === "string"
                ? Number(resolvedParams.maxPrice)
                : undefined,
        condition:
            typeof resolvedParams.condition === "string"
                ? resolvedParams.condition
                : undefined,
        limit: 12,
        page: 1,
    };

    const safeFilters = itemFilterSchema.parse(filters);

    const { data, pagination } = await getItems(safeFilters);

    return (
        <SearchDashboard
            initialData={data}
            initialPagination={pagination}
            initialFilters={safeFilters}
        />
    );
}
