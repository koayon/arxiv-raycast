import { ActionPanel, Action, List, Detail, Icon } from "@raycast/api";
import { useFetch, Response } from "@raycast/utils";
import { useState } from "react";
import { URLSearchParams } from "node:url";
import xml2js from "xml2js";
import { formatDistanceToNow } from 'date-fns';

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
            authors={searchResult.author[0]}
            // category={searchResult.category[0]}
            // pdf_link={searchResult.link || ""}
          />
        ))}
      </List.Section>
    </List>
  );
}

interface SearchListItemProps {
  id: string;
  published: string;
  title: string;
  authors: { [key: string]: string }
  // category: string;
  // pdf_link: string;
}

function SearchListItem({ id, published, title, authors}: SearchListItemProps) {
  const date = new Date(published);
  const timeAgo = formatDistanceToNow(date, { addSuffix: true });
  const accessories = [
    { tag: timeAgo },
  ];
  
  const names = authors.map(author => author.name[0]);

  // const primaryAuthor = authors[0];
  // const authorsString = authors ? authors.join(", ") : "";
  console.log(names)

  return <List.Item title={title} accessories={accessories} />
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
        author: entry.author,
      };
    });
  });
}

interface SearchResult {
  id: string;
  published: string;
  title: string;
  // summary: string;
  // category: string;
  link: string;
  author: [];
}
