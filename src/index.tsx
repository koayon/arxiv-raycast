import { ActionPanel, Action, List, Detail, Icon } from "@raycast/api";
import { useFetch, Response } from "@raycast/utils";
import { useState } from "react";
import { URLSearchParams } from "node:url";
import xml2js from "xml2js";
import { add, formatDistanceToNow } from "date-fns";
import natural from "natural";

const defaultText = "Toy Model Universality Bilal";
// const defaultText = "Attention Is All You Need Vaswani";
let maxResults = 10;

export default function Command() {
  const [searchText, setSearchText] = useState("");

  let { data, isLoading } = useFetch(
    "http://export.arxiv.org/api/query?" +
      // send the search query to the API
      new URLSearchParams({
        search_query: searchText.length === 0 ? defaultText : searchText,
        sortBy: "relevance",
        sortOrder: "descending",
        // start: "0",
        max_results: maxResults.toString(),
      }),
    {
      parseResponse: parseResponse,
    }
  );

  // console.log(data?.length)

  // data = data?.filter((entry: SearchResult) => entry.title);

  // console.log(data?.length)

  // Order data by similarity to search query
  data = data?.sort((a: SearchResult, b: SearchResult) => {
    let textToCompare = searchText.length === 0 ? defaultText : searchText;
    const aTitle = a.title ? a.title[0] : "";
    const bTitle = b.title ? b.title[0] : "";
    const aAuthors = a.authors ? a.authors.join(", ") : "";
    const bAuthors = b.authors ? b.authors.join(", ") : "";

    const aTitleSimilarity = natural.DiceCoefficient(aTitle, textToCompare);
    const bTitleSimiarlity = natural.DiceCoefficient(bTitle, textToCompare);

    return bTitleSimiarlity - aTitleSimilarity;
  });

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search arXiv papers by title, author, or abstract"
      throttle={true}
    >
      <List.Section title="Results" subtitle={data?.length + ""}>
        {data?.map((searchResult: SearchResult) => (
          <SearchListItem
            key={searchResult.id ? searchResult.id[0] : ""}
            id={searchResult.id ? searchResult.id[0] : ""}
            published={searchResult.published}
            title={searchResult.title ? searchResult.title[0] : ""}
            authors={searchResult.authors}
            // category={searchResult.category[0]}
            pdf_link={searchResult.link || ""}
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
  authors: string[];
  // category: string;
  pdf_link: string;
}

function SearchListItem({ id, published, title, authors, pdf_link }: SearchListItemProps) {
  const date = new Date(published);
  const timeAgo = formatDistanceToNow(date, { addSuffix: true });
  const accessories = [{ tag: timeAgo }];

  const authorsString = authors ? authors.join(", ") : "";
  const multipleAuthors = authorsString.split(",").length > 1;
  const addToAuthor = multipleAuthors ? " et al." : "";
  const primaryAuthor = authorsString.split(",")[0] + addToAuthor;

  return (
    <List.Item
      title={title}
      subtitle={primaryAuthor}
      actions={
        <ActionPanel>
          <Action.OpenInBrowser title="Open PDF" url={pdf_link} icon={{ source: Icon.Link }} />
          <Action.CopyToClipboard title="Copy Authors" content={authorsString} icon={{ source: Icon.Redo }} />
        </ActionPanel>
      }
      accessories={accessories}
    />
  );
}

async function parseResponse(response: Response): Promise<SearchResult[]> {
  const parser = new xml2js.Parser({ explicitArray: true, mergeAttrs: true });

  // Read the body content as a string
  const xml = await response.text();

  console.log(xml);

  // Parse the XML string
  return parser.parseStringPromise(xml).then((result: any) => {
    return result.feed.entry.map((entry: any) => {
      let pdfLink = "";
      let categories = "";
      let published = "";

      // Check if link is not undefined
      if (entry.link) {
        const pdfLinkElement = entry.link.find(
          (link: any) => link.rel[0] === "related" && link.type[0] === "application/pdf"
        );
        if (pdfLinkElement) {
          pdfLink = pdfLinkElement.href[0];
        }
      }

      // Check if category is not undefined
      if (entry.category) {
        if (Array.isArray(entry.category)) {
          categories = entry.category.map((category: any) => category.term).join(", ");
        } else {
          categories = entry.category.term;
        }
      }

      // Check if published is not undefined
      if (entry.published) {
        published = entry.published[0];
      } else {
        published = "";
      }

      return {
        id: entry.id,
        published: published,
        // published: "2023-02-06T18:59:20Z",
        title: entry.title,
        authors: entry.author.map((a: any) => a.name),
        category: categories,
        link: pdfLink,
        // link: "https://www.google.com"
      };
    });
  });
}

interface SearchResult {
  id: string;
  published: string;
  title: string;
  authors: string[];
  category: string;
  link: string;
}
