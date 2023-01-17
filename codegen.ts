/** @type {import("@graphql-codegen/cli").CodegenConfig}*/
const config = {
    schema: "https://graphql.anilist.co",
    documents: "src/queries.ts",
    generates: {
        "src/__generated__/": {
            preset: "client",
            plugins: [],
            presetConfig: {
                gqlTagName: "gql",
            },
        },
    },
    ignoreNoDocuments: true,
}

export default config
