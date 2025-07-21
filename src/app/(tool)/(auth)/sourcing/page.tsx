"use client";
import {useEffect, useState} from "react";
import {
  getDocs,
  collection,
  query,
  where,
  or,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  setDoc,
  onSnapshot,
  deleteField,
} from "firebase/firestore";
import React from "react";
import {db} from "@/config/firebase";
import {Button} from "@/components/ui/button";
import {Icons} from "@/components/icons";
import {Card, CardContent, CardFooter, CardHeader} from "@/components/ui/card";
import {CircleCheck, CircleX, Star, StarOff} from "lucide-react";
import {Avatar} from "@/components/ui/avatar";
import {AvatarImage} from "@/components/ui/avatar";
import {getFaviconUrl} from "@/lib/utils";
import {LinkButton} from "@/components/ui/link";

import {useAuth} from "@/context/user-auth";

import {AddGoodLead} from "./add-lead";
import {Contact, Lead, People} from "@/config/data";

export type LeadData = {
  id: string;
  name: string;
  industry: string;
  description: string;
  funding: number;
  lastFundingDate: string;
  fundingType: string;
  website: string;
  reviewedBy?: ReviewedBy[];
  cold1Review?: boolean;
  apolloData?: any;
  contacts?: Contact[];
  people?: People[];
};

type ReviewedBy = {
  userId: string;
  status: "good" | "bad";
};

const Page = () => {
  const [aiLeads, setAiLeads] = useState<LeadData[]>([]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const selectedLead = aiLeads[currentIndex];

  useEffect(() => {
    const leadsRef = collection(db, "crunchbase-data");
    const q = query(leadsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData = snapshot.docs.map((doc) => doc.data() as LeadData);
      setAiLeads(leadsData);
      // setSelectedLead(leadsData[currentIndex]);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentIndex]);

  const [isAddedToCompanies, setIsAddedToCompanies] = useState(false);

  const [lists, setLists] = useState<string[]>([]);

  useEffect(() => {
    // check to see if the lead is in the companies collection
    if (!selectedLead?.id) {
      setIsAddedToCompanies(false);
      return;
    }

    const companiesRef = collection(db, "companies-fixed");
    const q = query(companiesRef, where("id", "==", selectedLead.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setIsAddedToCompanies(snapshot.docs.length > 0);
      setLists(snapshot.docs[0].data().lists);
    });

    return () => unsubscribe();
  }, [selectedLead]);

  const handleNext = () => {
    if (currentIndex < aiLeads.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const [reviewedCount, setReviewedCount] = useState(0);

  const handleRejectLead = async () => {
    if (!selectedLead) return;
    // update the lead
    await updateDoc(doc(db, `crunchbase-data/${selectedLead.name}`), {
      cold1Review: false,
    });
    handleNext();
  };

  const handleApproveLead = async () => {
    if (!selectedLead) return;
    // Add logic to approve lead
    await updateDoc(doc(db, `crunchbase-data/${selectedLead.name}`), {
      cold1Review: true,
    });

    await addToCompanies();

    // handleNext();
  };

  const addToCompanies = async () => {
    await setDoc(doc(db, `companies-fixed/${selectedLead.id}`), {
      name: selectedLead.name,
      description: selectedLead.description,
      sourceId: "oP9CEa1DVZVHAzApduNh",
      website: selectedLead.website,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      createdBy: "Patrick",
      score: 3,
      contacts: selectedLead.contacts || [],
      people: selectedLead.people || [],
      lists: ["1", "qd8vimrcyht"],
      id: selectedLead.id,
      tasks: [],
      source: "Crunchbase",
    } as Lead);
    setIsAddedToCompanies(true);
  };

  const handleReset = async () => {
    if (!selectedLead) return;
    // update the lead
    // delete the field cold1Review
    await updateDoc(doc(db, `crunchbase-data/${selectedLead.name}`), {
      cold1Review: deleteField(),
    });

    // delete the doc in /companies
    await deleteDoc(doc(db, `companies-fixed/${selectedLead.id}`));
  };

  const cleanedWebsite = (website: string) => {
    if (!website) return "";
    if (website.startsWith("http")) {
      return website;
    }
    return `https://${website}`;
  };

  const {currentUser} = useAuth()!;

  const isReviewed = aiLeads[currentIndex]?.cold1Review !== undefined;

  return (
    <>
      <div className="flex flex-col gap-4  relative h-screen w-screen  justify-center">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Icons.spinner className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-[400px_1fr] gap-4 w-full items-center py-8">
            <div className="border w-full  bg-background h-[100vh] rounded-r-md top-0 left-0">
              <h1 className="h-[40px] p-2 bg-muted">
                Crunchbase list{" "}
                {aiLeads.filter((lead) => lead.cold1Review).length} /{" "}
                {
                  aiLeads.filter((lead) => lead.cold1Review !== undefined)
                    .length
                }{" "}
                / {aiLeads.length} {/* percentage */}{" "}
                {(
                  (aiLeads.filter((lead) => lead.cold1Review !== undefined)
                    .length /
                    aiLeads.length) *
                  100
                ).toFixed(2)}
                %
              </h1>
              <div className="flex flex-col h-[calc(100vh-40px)] overflow-y-auto p-2">
                {aiLeads.map((lead, i) => (
                  <button
                    onClick={() => {
                      setCurrentIndex(i);
                    }}
                    key={lead.name}
                    className={`flex items-center gap-2 group p-2 
                      ${
                        selectedLead?.name === lead.name
                          ? "bg-primary/30  font-bold"
                          : i % 2 === 0
                          ? "bg-muted/50"
                          : ""
                      }
                      
                      `}
                  >
                    <Avatar className="h-6 w-6 rounded-sm border bg-white">
                      {lead.website && (
                        <AvatarImage
                          className="object-cover"
                          src={getFaviconUrl(lead.website)}
                        />
                      )}
                    </Avatar>
                    <h2 className="text-lg group-hover:underline">
                      {lead.name}
                    </h2>

                    {lead.cold1Review !== undefined && (
                      <>
                        {lead.cold1Review ? (
                          <span className="ml-auto">
                            <CircleCheck className="h-4 w-4 text-green-500" />
                          </span>
                        ) : (
                          <span className="ml-auto">
                            <CircleX className="h-4 w-4 text-red-500" />
                          </span>
                        )}
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {selectedLead && (
              <div className="w-full h-screen flex flex-col ">
                <div className="flex flex-row items-center  py-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 rounded-sm border bg-white">
                      {selectedLead.website && (
                        <AvatarImage
                          className="object-cover"
                          src={getFaviconUrl(selectedLead.website)}
                        />
                      )}
                    </Avatar>
                    <h2 className="text-xl font-semibold">
                      {selectedLead.name}
                    </h2>
                  </div>

                  <div className="flex  py-4 ml-auto">
                    <div className="flex gap-2 items-center">
                      <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentIndex === 0}
                      >
                        <Icons.chevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-xl text-muted-foreground">
                        {currentIndex + 1} of {aiLeads.length}
                      </span>
                      <Button
                        variant="outline"
                        onClick={handleNext}
                        disabled={currentIndex === aiLeads.length - 1}
                      >
                        <Icons.chevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <LinkButton
                  href={cleanedWebsite(selectedLead.website)}
                  target="_blank"
                  variant="outline"
                >
                  {/* <Icons.link className="h-4 w-4 mr-2" /> */}
                  View website
                </LinkButton>
                <div className="space-y-4 py-0">
                  <div>
                    <p className="text-sm font-semibold">Industry</p>
                    <p>{selectedLead.industry}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Description</p>
                    <p>{selectedLead.description}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-semibold">Total Funding</p>
                      <p>{selectedLead.funding.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Last Funding Date</p>
                      <p>{selectedLead.lastFundingDate}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Funding Type</p>
                      <p>{selectedLead.fundingType}</p>
                    </div>
                  </div>
                  {selectedLead.cold1Review && (
                    <AddGoodLead
                      companyInfo={{
                        name: selectedLead.name,
                        website_url: cleanedWebsite(selectedLead.website),
                      }}
                      apolloData={selectedLead.apolloData}
                      selectedLead={selectedLead}
                    />
                  )}
                </div>
                <div className=" w-full grid grid-cols-2 gap-8 mt-auto p-4">
                  {isReviewed ? (
                    <>
                      {selectedLead.cold1Review ? (
                        <>
                          <p className="bg-green-500/20 text-green-500 px-2 py-1 flex items-center justify-center rounded-md">
                            Good lead
                          </p>
                          {isAddedToCompanies ? (
                            <p className="bg-blue-500/20 text-blue-500 px-2 py-1 flex items-center justify-center rounded-md">
                              Added to companies and {lists.length} lists
                            </p>
                          ) : (
                            <Button variant="outline" onClick={addToCompanies}>
                              Add to companies
                            </Button>
                          )}
                        </>
                      ) : (
                        <p className="bg-red-500/20 text-red-500 px-2 py-1 flex items-center justify-center rounded-md">
                          Bad lead
                        </p>
                      )}

                      {/* reset the status */}
                      <Button variant="outline" onClick={handleReset}>
                        Reset
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        className="bg-red-500 hover:bg-red-600"
                        variant="default"
                        onClick={handleRejectLead}
                      >
                        Bad lead
                      </Button>
                      {/* <AddGoodLead
                        companyInfo={{
                          name: selectedLead.name,
                          website_url: cleanedWebsite(selectedLead.website),
                        }}
                      > */}
                      <Button
                        onClick={handleApproveLead}
                        className="bg-green-500 hover:bg-green-600"
                        variant="default"
                      >
                        Good lead
                      </Button>
                      {/* </AddGoodLead> */}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Page;
