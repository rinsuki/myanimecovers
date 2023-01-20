import { ApolloClient, InMemoryCache, useQuery } from "@apollo/client"
import React from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider, useParams } from "react-router"
import { createBrowserRouter } from "react-router-dom"

import { CoolThumbnail } from "./cool-thumbnai"
import { GET_ANIME_LIST } from "./queries"

import "./style.scss"

const client = new ApolloClient({
    uri: "https://graphql.anilist.co",
    cache: new InMemoryCache(),
})

const seasonNames = ["WINTER", "SPRING", "SUMMER", "FALL"] as const

function isNotNull<T>(value: T | null | undefined): value is T {
    return value != null
}

type TIER = 1 | 2 | 3

const tierToCss = (tier: TIER) => {
    switch (tier) {
        case 1:
            return 1
        case 2:
            return 1.333
        case 3:
            return 2
    }
}

const tierToCount = (tier: TIER) => {
    switch (tier) {
        case 1:
            return 4
        case 2:
            return 3
        case 3:
            return 2
    }
}

const App: React.FC = props => {
    const params = useParams()
    if (params.userName == null) return <div>userName is null...</div>
    const { loading, error, data } = useQuery(GET_ANIME_LIST, {
        variables: { userName: params.userName },
        client,
    })
    if (loading) return <div>Loading...</div>
    if (error != null) {
        console.error(error)
        return <div>failed to load...</div>
    }
    if (data == null) return <div>failed to load...</div>
    const ids = new Set()
    const entries = (data.MediaListCollection?.lists ?? [])
        .flatMap(list => list?.entries)
        .map(a => {
            if (a == null) return null
            if (a.media == null) return null
            if (a.media.seasonYear == null) {
                console.warn("seasonYear is null", a)
                return null
            }
            if (a.media.season == null) {
                console.warn("season is null", a)
                return null
            }
            if (a.status === "CURRENT" && a.media.seasonYear < new Date().getFullYear() - 2) {
                console.warn("too old watching", a)
                return null
            }
            return {
                ...a,
                score: a.score == null || a.score === 0 ? 5 : a.score,
                scoreOrig: a.score === 0 ? null : a.score,
                ...a.media,
                seasonYear: a.media.seasonYear,
                season: a.media.season,
            }
        })
        .filter(isNotNull)
        .filter(a => {
            if (ids.has(a.id)) return false
            ids.add(a.id)
            return true
        })
        .sort((a, b) => {
            if (a.seasonYear !== b.seasonYear) return b.seasonYear - a.seasonYear
            if (a.season !== b.season)
                return seasonNames.indexOf(b.season) - seasonNames.indexOf(a.season)
            const aScore = a.score ?? 0
            const bScore = b.score ?? 0
            if (aScore !== bScore) return bScore - aScore
            return b.id - a.id
        })
    const entriesPerSeason = entries.reduce<
        {
            year: number
            seasons: {
                name: (typeof seasonNames)[number & keyof typeof seasonNames]
                entries: typeof entries
            }[]
        }[]
    >((prev, curr) => {
        const lastYear = prev.at(-1)
        const shouldAddNewYearArray = lastYear == null || lastYear.year !== curr.seasonYear
        if (shouldAddNewYearArray) {
            prev.push({
                year: curr.seasonYear,
                seasons: [{ name: curr.season, entries: [curr] }],
            })
            return prev
        }
        const lastSeason = lastYear.seasons.at(-1)
        const shouldAddNewSeasonArray = lastSeason == null || lastSeason.name !== curr.media?.season
        if (shouldAddNewSeasonArray) {
            lastYear.seasons.push({ name: curr.season, entries: [curr] })
            return prev
        }
        lastSeason.entries.push(curr)
        return prev
    }, [])
    console.log(entriesPerSeason)
    return (
        <div className="section-wrapper">
            {entriesPerSeason.map(year => (
                <div className="section-year" key={year.year}>
                    <div className="year-wrapper">
                        <h2>{year.year}</h2>
                    </div>
                    {year.seasons.map(season => {
                        let lastTier: TIER = 3
                        let lastTierCount = 0
                        return (
                            <div
                                key={season.name}
                                className={`section-season season-${season.name.toLowerCase()}`}
                            >
                                {season.entries.map(entry => {
                                    let tier: TIER = entry.score >= 9 ? 3 : entry.score >= 8 ? 2 : 1
                                    // 数が少ない時の強制昇格
                                    // スコアがある程度良くない作品が混じっていたら昇格しない
                                    if ((season.entries.at(-1)?.score ?? 5) >= 5) {
                                        // tier 3 まで昇格するのは微妙だった
                                        if (season.entries.length <= 3) {
                                            tier = 2
                                        }
                                    }
                                    // もうちょっとで数のキリが良くなる時の強制昇格
                                    if (
                                        lastTier !== tier &&
                                        lastTierCount % tierToCount(lastTier)
                                    ) {
                                        tier = lastTier
                                    }
                                    let shouldChangeLine = false
                                    // 最後のtier更新
                                    if (lastTier === tier) {
                                        lastTierCount++
                                    } else {
                                        if (lastTier === 2 || tier === 2) shouldChangeLine = true
                                        lastTier = tier
                                        lastTierCount = 1
                                    }
                                    return (
                                        <>
                                            {shouldChangeLine && <br />}
                                            <a
                                                key={entry.id}
                                                target="_blank"
                                                href={`https://anilist.co/anime/${entry.id}`}
                                                title={`${entry.title!.native!}${
                                                    entry.scoreOrig == null
                                                        ? ""
                                                        : ` (${entry.scoreOrig})`
                                                }`}
                                                style={
                                                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                                                    {
                                                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                                                        "--tier": tierToCss(tier).toString(),
                                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                    } as any
                                                }
                                                rel="noreferrer"
                                            >
                                                <CoolThumbnail
                                                    className="cover-image"
                                                    src={entry.coverImage!.extraLarge!}
                                                    lazy
                                                />
                                            </a>
                                        </>
                                    )
                                })}
                            </div>
                        )
                    })}
                </div>
            ))}
        </div>
    )
}

const router = createBrowserRouter([
    {
        path: "/anilist/:userName",
        element: <App />,
    },
    {
        path: "/",
        element: (
            <div style={{ margin: 8 }}>
                <h1>myanimecovers</h1>
                <p>Usage: /anilist/username</p>
            </div>
        ),
    },
])

const app = document.createElement("div")
app.id = "app"
document.body.appendChild(app)
createRoot(app).render(<RouterProvider router={router} />)

window.addEventListener("resize", () => {
    app.style.setProperty("--vh", `${window.innerHeight}px`)
})
