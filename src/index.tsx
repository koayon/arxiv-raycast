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
      new URLSearchParams({
        search_query: searchText.length === 0 ? "Attention Is All You Need Noam" : searchText,
        sortBy: "relevance",
        sortOrder: "descending",
      }),
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
          <SearchListItem
            key={searchResult.id[0]}
            id={searchResult.id[0]}
            published={searchResult.published[0]}
            title={searchResult.title[0]}
            category={searchResult.category[0]}
          />
        ))}
      </List.Section>
    </List>
  );
}

function SearchListItem({ id, published, title, category }: SearchResult) {
  return <List.Item title={title} subtitle={category} />;
}

async function parseResponse(response: Response): Promise<SearchResult[]> {
  const parser = new xml2js.Parser({ explicitArray: true, mergeAttrs: true });

  // Read the body content as a string
  const xml = await response.text();

  // Parse the XML string
  return parser.parseStringPromise(xml).then((result: any) => {
    return result.feed.entry.map((entry: any) => {
      return {
        id: entry.id,
        published: entry.published,
        title: entry.title,
        // summary: entry.summary,
        category: entry.category,
      };
    });
  });
}

interface SearchResult {
  id: string;
  published: string;
  title: string;
  // summary: string;
  category: string;
  // pdf_link: string;
  // authors: string[];
}
