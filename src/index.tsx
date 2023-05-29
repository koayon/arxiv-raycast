import { ActionPanel, Action, List, Detail, Icon, Color } from "@raycast/api";
import { useFetch, Response } from "@raycast/utils";
import { useState } from "react";
import { URLSearchParams } from "node:url";
import xml2js from "xml2js";
import { add, formatDistanceToNow } from "date-fns";
import natural from "natural";

const DEFAULT_TEXT = "";
const MAX_RESULTS = 30;

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [category, setCategory] = useState(ArxivCategory.All);

  let { data, isLoading } = useFetch(
    "http://export.arxiv.org/api/query?" + constructSearchQuery(searchText || DEFAULT_TEXT, MAX_RESULTS),
    {
      parseResponse: parseResponse,
    }
  );

  data = data?.sort(compareSearchResults(searchText || DEFAULT_TEXT));

  const filteredData = data?.filter((entry: SearchResult) => {
    return category == "" || category == "phys" || entry.category.includes(category);
  });

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search arXiv papers by title, author, or abstract"
      throttle={true}
      searchBarAccessory={
        <List.Dropdown
          tooltip="Select Page"
          defaultValue={ArxivCategory.All}
          storeValue
          onChange={(newValue) => setCategory(newValue as ArxivCategory)}
        >
          {Object.entries(ArxivCategory).map(([name, value]) => (
            <List.Dropdown.Item key={name} title={name} value={value} />
          ))}
        </List.Dropdown>
      }
    >
      <List.Section title="Results" subtitle={filteredData?.length + ""}>
        {filteredData?.map((searchResult: SearchResult) => (
          <SearchListItem
            key={searchResult.id ? searchResult.id[0] : ""}
            id={searchResult.id ? searchResult.id[0] : ""}
            published={searchResult.published}
            title={searchResult.title ? searchResult.title[0] : ""}
            authors={searchResult.authors}
            category={searchResult.category ? searchResult.category : ""}
            first_category={searchResult.category ? searchResult.category.split(".")[0] : ""}
            pdf_link={searchResult.link || ""}
          />
        ))}
      </List.Section>
    </List>
  );
}

function constructSearchQuery(text: string, maxResults: number) {
  return new URLSearchParams({
    search_query: text,
    sortBy: "relevance",
    sortOrder: "descending",
    max_results: maxResults.toString(),
  });
}

function compareSearchResults(textToCompare: string) {
  return (a: SearchResult, b: SearchResult) => {
    const aTitle = a.title ? a.title[0] : "";
    const bTitle = b.title ? b.title[0] : "";

    const aTitleSimilarity = natural.DiceCoefficient(aTitle, textToCompare);
    const bTitleSimiarlity = natural.DiceCoefficient(bTitle, textToCompare);

    return bTitleSimiarlity - aTitleSimilarity;
  };
}

enum ArxivCategory {
  All = "",
  Physics = "phys",
  // Physics is split into multiple subcategories
  Mathematics = "math",
  ComputerScience = "cs",
  QuantitativeBiology = "q-bio",
  QuantitativeFinance = "q-fin",
  Statistics = "stat",
  ElectricalEngineeringAndSystemsScience = "eess",
  Economics = "econ",
}

enum ArxivCategoryColour {
  "physics" = Color.Blue,
  "math" = Color.Green,
  "cs" = Color.Red,
  "q-bio" = Color.Yellow,
  "q-fin" = Color.Purple,
  "stat" = Color.Orange,
  "eess" = Color.Purple,
  "econ" = Color.Magenta,
}

interface SearchListItemProps {
  id: string;
  published: string;
  title: string;
  authors: string[];
  category: string;
  first_category: string;
  pdf_link: string;
}

function SearchListItem({ id, published, title, authors, category, first_category, pdf_link }: SearchListItemProps) {
  const date = new Date(published);
  const timeAgo = formatDistanceToNow(date, { addSuffix: true });
  const accessories = [{ tag: timeAgo }];

  const authorsString = authors ? authors.join(", ") : "";
  const multipleAuthors = authorsString.split(",").length > 1;
  const addToAuthor = multipleAuthors ? " et al." : "";
  const primaryAuthor = authorsString.split(",")[0] + addToAuthor;

  const categoryColour = ArxivCategoryColour[first_category as keyof typeof ArxivCategoryColour];

  return (
    <List.Item
      id={id}
      icon={{ source: Icon.Circle, tintColor: categoryColour }}
      title={title}
      subtitle={primaryAuthor}
      // subtitle={category}
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

  // Parse the XML string
  return parser.parseStringPromise(xml).then((result: any) => {
    if (result.feed.entry) {
      return result.feed.entry.map((entry: any) => {
        let pdfLink = "";
        let categories = "";
        let published = "";

        // Check link is not undefined
        if (entry.link) {
          const pdfLinkElement = entry.link.find(
            (link: any) =>
              link && link.rel && link.rel[0] === "related" && link.type && link.type[0] === "application/pdf"
          );
          if (pdfLinkElement && pdfLinkElement.href) {
            pdfLink = pdfLinkElement.href[0];
          }
        }

        // Check category is not undefined
        if (entry.category) {
          if (Array.isArray(entry.category)) {
            categories = entry.category.map((category: any) => category.term).join(", ");
          } else {
            categories = entry.category.term;
          }
        }

        // Check published is not undefined
        if (entry.published) {
          published = entry.published[0];
        } else {
          published = "";
        }

        return {
          id: entry.id,
          published: published,
          title: entry.title,
          authors: entry.author.map((a: any) => a.name),
          category: categories,
          link: pdfLink,
        };
      });
    } else {
      return [];
    }
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
