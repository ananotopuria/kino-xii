// Personalized flags belong to the account that fetched or changed them.
export const comingSoonKey = (userId: number | null) => ["movies", "coming-soon", userId] as const;
export const movieKey = (slug: string, userId: number | null) => ["movie", slug, userId] as const;
