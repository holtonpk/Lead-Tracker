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
} from "firebase/firestore";
import React from "react";
import {db} from "@/config/firebase";
import {Button} from "@/components/ui/button";
import {Icons} from "@/components/icons";
import {Card, CardContent, CardFooter, CardHeader} from "@/components/ui/card";
import {CircleCheck, Star, StarOff} from "lucide-react";
import {Avatar} from "@/components/ui/avatar";
import {AvatarImage} from "@/components/ui/avatar";
import {getFaviconUrl} from "@/lib/utils";
import {LinkButton} from "@/components/ui/link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {ChevronDown, ChevronUp} from "lucide-react";
import {useAuth} from "@/context/user-auth";
import {Controller, useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Label} from "@/components/ui/label";

type AI_Lead = {
  name: string;
  industry: string;
  description: string;
  total_funding_amount: number;
  last_funding_date: string;
  funding_type: string;
  website: string;
  reviewedBy?: ReviewedBy[];
};

type ReviewedBy = {
  userId: string;
  status: "good" | "bad";
};

const Page = () => {
  const [aiLeads, setAiLeads] = useState<AI_Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<AI_Lead | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const leadsRef = collection(db, "test-100");
    const q = query(leadsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData = snapshot.docs.map((doc) => doc.data() as AI_Lead);
      setAiLeads(leadsData);
      setSelectedLead(leadsData[currentIndex]);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < aiLeads.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedLead(aiLeads[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedLead(aiLeads[currentIndex - 1]);
    }
  };

  const [reviewedCount, setReviewedCount] = useState(0);

  const handleRejectLead = async () => {
    if (!selectedLead) return;
    // update the lead
    await updateDoc(doc(db, `test-100/${selectedLead.name}`), {
      reviewedBy: [
        ...(selectedLead.reviewedBy || []),
        {userId: currentUser?.uid, status: "bad"},
      ],
    });
    handleNext();
  };

  const handleApproveLead = async () => {
    if (!selectedLead) return;
    // Add logic to approve lead
    await updateDoc(doc(db, `test-100/${selectedLead.name}`), {
      reviewedBy: [
        ...(selectedLead.reviewedBy || []),
        {userId: currentUser?.uid, status: "good"},
      ],
    });
    handleNext();
  };

  const handleReset = async () => {
    if (!selectedLead) return;
    // update the lead
    await updateDoc(doc(db, `test-100/${selectedLead.name}`), {
      reviewedBy: selectedLead.reviewedBy?.filter(
        (review) => review.userId !== currentUser?.uid
      ),
    });
  };

  const cleanedWebsite = (website: string) => {
    if (!website) return "";
    if (website.startsWith("http")) {
      return website;
    }
    return `https://${website}`;
  };

  const {currentUser} = useAuth()!;

  const isReviewed = selectedLead?.reviewedBy?.some(
    (review) => review.userId === currentUser?.uid
  );

  return (
    <>
      <div className="flex flex-col gap-4  relative h-screen w-screen items-center justify-center">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Icons.spinner className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-4 w-full items-center py-8">
            {aiLeads.filter((lead) =>
              lead.reviewedBy?.some(
                (review) => review.userId === currentUser?.uid
              )
            ).length != aiLeads.length ? (
              <h1 className="text-2xl font-bold">
                Review Leads{" "}
                {
                  aiLeads.filter((lead) =>
                    lead.reviewedBy?.some(
                      (review) => review.userId === currentUser?.uid
                    )
                  ).length
                }{" "}
                / {aiLeads.length}
              </h1>
            ) : (
              <h1 className="text-2xl font-bold text-green-500 flex items-center gap-2">
                All leads reviewed
                <CircleCheck className="h-8 w-8 " />
              </h1>
            )}

            {selectedLead && (
              <Card className="w-[600px] max-w-[90vw] flex flex-col ">
                <CardHeader className="flex flex-row items-center justify-between py-4">
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
                  <span className="text-sm text-muted-foreground">
                    {currentIndex + 1} of {aiLeads.length}
                  </span>
                </CardHeader>

                <CardContent className="space-y-4 py-0">
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
                      <p>
                        ${selectedLead.total_funding_amount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Last Funding Date</p>
                      <p>{selectedLead.last_funding_date}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Funding Type</p>
                      <p>{selectedLead.funding_type}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between py-4">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentIndex === 0}
                    >
                      <Icons.chevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleNext}
                      disabled={currentIndex === aiLeads.length - 1}
                    >
                      <Icons.chevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <LinkButton
                      href={cleanedWebsite(selectedLead.website)}
                      target="_blank"
                      variant="outline"
                    >
                      {/* <Icons.link className="h-4 w-4 mr-2" /> */}
                      View website
                    </LinkButton>
                    {isReviewed ? (
                      <>
                        {selectedLead.reviewedBy?.find(
                          (review) => review.userId === currentUser?.uid
                        )?.status === "good" ? (
                          <p className="bg-green-500/20 text-green-500 px-2 py-1 flex items-center justify-center rounded-md">
                            Good lead
                          </p>
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
                        <Button
                          className="bg-green-500 hover:bg-green-600"
                          variant="default"
                          onClick={handleApproveLead}
                        >
                          Good lead
                        </Button>
                      </>
                    )}
                  </div>
                </CardFooter>
              </Card>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Page;

export const Rating = ({
  setValue,
  value,
}: {
  setValue: React.Dispatch<React.SetStateAction<number>>;
  value: number;
}) => {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const displayValue = hoveredValue !== null ? hoveredValue : value;

  const onValueChange = (newValue: number) => {
    setValue(newValue);
  };

  return (
    <div className="flex items-center relative h-8">
      {[...Array(3)].map((_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onValueChange(index + 1)}
          onMouseEnter={() => setHoveredValue(index + 1)}
          onMouseLeave={() => setHoveredValue(null)}
          className="focus:outline-none"
        >
          <Icons.star
            className={`h-6 w-6 transition-colors  ${
              index < displayValue
                ? "fill-blue-300 text-blue-500"
                : "fill-none text-blue-500"
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const StarRating = ({score}: {score: number}) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3].map((index) =>
        index <= score ? (
          <Star
            key={index}
            className="h-5 w-5 fill-yellow-400 text-yellow-400"
          />
        ) : (
          <Star
            key={index}
            className="h-5 w-5 fill-background text-yellow-400"
          />
        )
      )}
    </div>
  );
};
