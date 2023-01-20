import { gql } from "./__generated__/gql"

export const GET_ANIME_LIST = gql(/* GraphQL */ `
    query GetAnimeList($userName: String!) {
        MediaListCollection(
            userName: $userName
            type: ANIME
            status_in: [COMPLETED, REPEATING, CURRENT]
        ) {
            user {
                name
                avatar {
                    large
                }
            }
            lists {
                entries {
                    status
                    score(format: POINT_10_DECIMAL)
                    media {
                        id
                        idMal
                        title {
                            native
                        }
                        seasonYear
                        season
                        coverImage {
                            extraLarge
                        }
                        startDate {
                            year
                        }
                    }
                }
            }
        }
    }
`)
