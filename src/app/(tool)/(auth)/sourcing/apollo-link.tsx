"use client";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {useEffect, useState} from "react";

export const ApolloLink = ({
  onLink,
  companyInfo,
}: {
  onLink: (organization: any) => void;
  companyInfo: {
    name: string;
    website_url: string;
  };
}) => {
  const [searchResults, setSearchResults] = useState<any[]>();

  const searchForCompany = async () => {
    try {
      const url = `/api/search-organization`;
      const options = {
        method: "POST",
        body: JSON.stringify({organizationName: companyInfo.name}),
      };

      const response = await fetch(url, options);
      const data = await response.json();
      setSearchResults(data.organizations);
    } catch (error) {
      console.log("Failed to search for company:", error);
    }
  };

  const matchedSearchResult =
    searchResults &&
    searchResults.find(
      (organization: any) =>
        organization.website_url &&
        new URL(organization.website_url).hostname ===
          new URL(companyInfo.website_url).hostname
    );

  useEffect(() => {
    if (matchedSearchResult) {
      onLink(matchedSearchResult);
    } else {
      searchForCompany();
    }
  }, [matchedSearchResult]);

  const [searchValue, setSearchValue] = useState("");

  const manualSearch = async () => {
    const url = `/api/search-organization`;
    const options = {
      method: "POST",
      body: JSON.stringify({organizationName: searchValue}),
    };

    const response = await fetch(url, options);
    const data = await response.json();
    setSearchResults(data.organizations);
  };

  return (
    <div className="flex flex-col gap-2">
      {searchResults && searchResults.length > 0 ? (
        <>
          {matchedSearchResult ? (
            <div className=" flex flex-col gap-2  max-h-[400px] overflow-scroll">
              <h1>Matched Search Result</h1>
              <div className="flex gap-2 items-center hover:bg-muted-foreground/20 p-2 rounded-md w-full relative z-20 cursor-pointer">
                <div className="w-6 h-6 rounded-full bg-muted">
                  <img
                    src={matchedSearchResult.logo_url}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold">{matchedSearchResult.name}</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              <h1>All Results</h1>
              <div className=" flex flex-col gap-2  max-h-[300px] overflow-scroll">
                {searchResults &&
                  searchResults.map((result, index) => (
                    <div
                      key={result.id || `result-${index}`}
                      className="relative"
                    >
                      <button
                        onClick={() => {
                          onLink(result);
                        }}
                        className="flex gap-2 items-center hover:bg-muted-foreground/20 p-2 rounded-md w-full relative z-20 cursor-pointer"
                      >
                        <div className="w-6 h-6 rounded-full bg-muted">
                          <img
                            src={result.logo_url}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold">{result.name}</span>
                        </div>
                      </button>
                      <Link
                        target="_blank"
                        href={result.website_url || result.linkedin_url || ""}
                        className="absolute top-1/2 -translate-y-1/2 right-0 z-40 text-[12px] hover:underline hover:text-blue-500"
                      >
                        Open website
                      </Link>
                    </div>
                  ))}
              </div>
              <Input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search for company"
              />
              <Button onClick={manualSearch}>Search</Button>
            </>
          )}
        </>
      ) : (
        <div className="w-full text-center flex flex-col gap-2 border p-6">
          <p className="text-lg font-bold">No results found</p>
          <p className="text-sm">
            No data was found on the company from Apollo.
          </p>
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search for company"
          />
          <Button onClick={manualSearch}>Search</Button>
        </div>
      )}
    </div>
  );
};
