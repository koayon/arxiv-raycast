import { ActionPanel, Action, List, Detail } from "@raycast/api";
import { useFetch, Response } from "@raycast/utils";
import { useState } from "react";
import { URLSearchParams } from "node:url";
import xml2js from "xml2js";

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const { data, isLoading } = useFetch(
    "http://export.arxiv.org/api/query?" +
      // send the search query to the API
      new URLSearchParams({ search_query: searchText.length === 0 ? "Attention Is All You Need" : searchText }),
    {
      parseResponse: parseResponse,
    }
  );
  console.log(data);

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search arXiv papers by title, author, or abstract"
      throttle
    >
      <List.Section title="Results" subtitle={data?.length + ""}>
        {data?.map((searchResult: SearchResult) => (
          <SearchListItem title={searchResult.title[0]} />
        ))}
      </List.Section>
      {/* <List.Section title="Results">{typeof data}</List.Section> */}

      {/* //   <List.Item title={data?.map((searchResult) => search} /> */}
    </List>
  );
}

function SearchListItem({ title }: { title: string }) {
  console.log("Title = ");
  console.log(title);
  return <List.Item title={title} />;
}

/** Parse the response from the fetch query into something we can display */
// async function parseFetchResponse(response: Response) {
//   const json = (await response.json()) as
//     | {
//         results: {
//           package: {
//             // name: string;
//             // description?: string;
//             entry: { id: string; published: string; title: string };
//             // publisher?: { username: string };
//             // links: { npm: string };
//           };
//         }[];
//       }
//     | { code: string; message: string };

//   if (!response.ok || "message" in json) {
//     throw new Error("message" in json ? json.message : response.statusText);
//   }

//   return json.results.map((result) => {
//     return {
//       id: result.package.entry.id,
//       published: result.package.entry.published,
//       title: result.package.entry.title,
//     } as SearchResult;
//   });
// }

async function parseResponse(response: Response): Promise<SearchResult[]> {
  const parser = new xml2js.Parser({ explicitArray: true, mergeAttrs: true });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <link href="http://arxiv.org/api/query?search_query%3DAttention%20Is%20All%20You%20Need%26id_list%3D%26start%3D0%26max_results%3D10" rel="self" type="application/atom+xml"/>
  <title type="html">ArXiv Query: search_query=Attention Is All You Need&amp;id_list=&amp;start=0&amp;max_results=10</title>
  <id>http://arxiv.org/api/qaBP58BujiphqhQzL1xZCOG5VHg</id>
  <updated>2023-05-15T00:00:00-04:00</updated>
  <opensearch:totalResults xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/">1824192</opensearch:totalResults>
  <opensearch:startIndex xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/">0</opensearch:startIndex>
  <opensearch:itemsPerPage xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/">10</opensearch:itemsPerPage>
  <entry>
    <id>http://arxiv.org/abs/2107.08000v1</id>
    <updated>2021-07-16T16:39:13Z</updated>
    <published>2021-07-16T16:39:13Z</published>
    <title>All the attention you need: G</title>
  </entry>
</feed>`;
  console.log("response");
  console.log(response);
  return parser.parseStringPromise(xml).then((result: any) => {
    return result.feed.entry.map((entry: any) => {
      return {
        id: entry.id,
        published: entry.published,
        title: entry.title,
      };
    });
  });
}
interface SearchResult {
  id: string;
  published: string;
  title: string;
}
