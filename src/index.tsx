import { ApolloClient, InMemoryCache, useQuery } from "@apollo/client"
import React from "react"
import { createRoot } from "react-dom/client"

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
    const { loading, error, data } = useQuery(GET_ANIME_LIST, {
        variables: { userName: "rinsuki" },
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
                                    if (season.entries.length <= 2 && tier === 2) {
                                        tier = 1
                                    }
                                    if (
                                        lastTier !== tier &&
                                        lastTierCount % tierToCount(lastTier)
                                    ) {
                                        tier = lastTier
                                    }
                                    // 最後のtier更新
                                    if (lastTier === tier) {
                                        lastTierCount++
                                    } else {
                                        lastTier = tier
                                        lastTierCount = 1
                                    }
                                    return (
                                        <a
                                            key={entry.id}
                                            target="_blank"
                                            href={`https://anilist.co/anime/${entry.id}`}
                                            style={
                                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                                                {
                                                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                                                    "--tier": tierToCss(tier).toString(),
                                                } as any
                                            }
                                            rel="noreferrer"
                                        >
                                            <img
                                                className="cover-image"
                                                src={entry.coverImage!.extraLarge!}
                                                loading="lazy"
                                            />
                                        </a>
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

const app = document.createElement("div")
app.id = "app"
document.body.appendChild(app)
createRoot(app).render(<App />)

window.addEventListener("resize", () => {
    app.style.setProperty("--vh", `${window.innerHeight}px`)
})
