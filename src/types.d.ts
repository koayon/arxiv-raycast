declare module "arxiv-api" {
  export function search(query: SearchQuery): Paper[];

  export interface SearchQuery {
    searchQueryParams: SearchQueryParam[];
    start?: number;
    maxResults?: number;
  }

  export interface SearchQueryParam {
    include: Keyword[];
    exclude?: Keyword[];
  }

  export interface Keyword {
    name: string;
  }

  export interface Paper {
    // Define the properties of a paper here.
    // This is just an example, you should adjust it based on your needs.
    title: string;
    authors: string[];
    abstract: string;
    year: number;
    arxivId: string;
    url: string;
  }
}

declare module "xml2js";
