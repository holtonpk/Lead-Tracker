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
} from "firebase/firestore";
import React from "react";
import {db} from "@/config/firebase";
import {Button} from "@/components/ui/button";
import {Icons} from "@/components/icons";
import {Card, CardContent, CardFooter, CardHeader} from "@/components/ui/card";
import {Star, StarOff} from "lucide-react";
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
  ai_score: number;
  ai_explanation: string;
  status: "accepted" | "rejected" | "unreviewed";
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

const MAX_PREVIEW_LENGTH = 100; // About 10 lines worth of text

const TruncatedText = ({text}: {text: string}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = text.length > MAX_PREVIEW_LENGTH;

  const displayText = isExpanded ? text : text.slice(0, MAX_PREVIEW_LENGTH);

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        {displayText}
        {!isExpanded && shouldTruncate && "..."}
      </p>
      {shouldTruncate && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-auto p-0 text-xs text-blue-500 hover:text-blue-600"
        >
          {isExpanded ? "Show less" : "Show full explanation"}
        </Button>
      )}
    </div>
  );
};

const RejectFormSchema = z.object({
  reason: z.string().min(1, "Rejection reason is required"),
});

type RejectFormValue = z.infer<typeof RejectFormSchema>;

const RejectDialog = ({
  company,
  open,
  setOpen,
  onReject,
}: {
  company: AI_Lead;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onReject: (reason: string) => Promise<void>;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm<RejectFormValue>({
    resolver: zodResolver(RejectFormSchema),
  });

  const handleReject = async (data: RejectFormValue) => {
    setIsLoading(true);
    await onReject(data.reason);
    setIsLoading(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Company</DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting {company.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleReject)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              placeholder="Enter rejection reason..."
              {...register("reason")}
            />
            {errors.reason && (
              <p className="text-sm text-red-500">{errors.reason.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={isLoading}>
              {isLoading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Page = () => {
  const [aiLeads, setAiLeads] = useState<AI_Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<AI_Lead | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [openAddNewCompany, setOpenAddNewCompany] = useState(false);
  const [status, setStatus] = useState<"accepted" | "rejected" | "unreviewed">(
    "unreviewed"
  );
  const [openRejectDialog, setOpenRejectDialog] = useState(false);

  useEffect(() => {
    if (selectedLead) {
      setStatus(selectedLead.status);
    }
  }, [selectedLead]);

  useEffect(() => {
    const fetchAiLeads = async () => {
      const leadsRef = collection(db, "ai-sourced-model-1");
      const q = query(
        leadsRef

        // where("isReviewed", "==", false),
      );
      const leads = await getDocs(q);
      const leadsData = leads.docs.map((doc) => doc.data() as AI_Lead);
      setAiLeads(leadsData);
      setSelectedLead(leadsData[0]); // Set first lead as selected
      setIsLoading(false);
    };
    fetchAiLeads();
  }, []);

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

  const handleRejectLead = () => {
    setOpenRejectDialog(true);
  };

  const confirmReject = async (reason: string) => {
    if (!selectedLead) return;

    // Save to tuning collection
    const tuningDoc = {
      companyName: selectedLead.name,
      reason: reason,
      type: "rejection",
      timestamp: serverTimestamp(),
      aiScore: selectedLead.ai_score,
      aiExplanation: selectedLead.ai_explanation,
    };

    await setDoc(
      doc(db, "tuning", `${selectedLead.name}-${Date.now()}`),
      tuningDoc
    );

    // Update the lead status
    await updateDoc(doc(db, `ai-sourced/${selectedLead.name}`), {
      status: "rejected",
    });

    setStatus("rejected");
    setReviewedCount(reviewedCount + 1);
    handleNext();
  };

  const handleApproveLead = async () => {
    if (!selectedLead) return;
    // Add logic to approve lead
    setOpenAddNewCompany(true);
    setReviewedCount(reviewedCount + 1);
  };

  const handleReset = async () => {
    if (!selectedLead) return;
    // update the lead
    await updateDoc(doc(db, `ai-sourced/${selectedLead.name}`), {
      status: null,
    });
    setStatus("unreviewed");
    setReviewedCount(reviewedCount - 1);
  };

  const cleanedWebsite = (website: string) => {
    if (!website) return "";
    if (website.startsWith("http")) {
      return website;
    }
    return `https://${website}`;
  };

  return (
    <>
      <div className="flex flex-col gap-4  relative h-screen w-screen items-center justify-center">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Icons.spinner className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-4 w-full items-center py-8">
            <h1 className="text-2xl font-bold">
              {aiLeads.length - reviewedCount} AI Companies to Review
            </h1>
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
                  <div>
                    <p className="text-sm font-semibold">AI Score</p>
                    <div className="flex items-center gap-2">
                      <StarRating score={selectedLead.ai_score} />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-2">AI Explanation</p>
                    <TruncatedText text={selectedLead.ai_explanation} />
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
                      <Icons.link className="h-4 w-4 mr-2" />
                      Website
                    </LinkButton>
                    {status !== "unreviewed" ? (
                      <>
                        {status === "accepted" ? (
                          <p className="bg-green-500/20 text-green-500 px-2 py-1 flex items-center justify-center rounded-md">
                            Accepted
                          </p>
                        ) : (
                          <p className="bg-red-500/20 text-red-500 px-2 py-1 flex items-center justify-center rounded-md">
                            Rejected
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
                          Reject
                        </Button>
                        <Button
                          className="bg-green-500 hover:bg-green-600"
                          variant="default"
                          onClick={handleApproveLead}
                        >
                          Approve
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
      {selectedLead && (
        <>
          <AddNewCompany
            company={selectedLead}
            open={openAddNewCompany}
            setOpen={setOpenAddNewCompany}
            setStatus={setStatus}
            handleNext={handleNext}
          />
          <RejectDialog
            key={selectedLead.name}
            company={selectedLead}
            open={openRejectDialog}
            setOpen={setOpenRejectDialog}
            onReject={confirmReject}
          />
        </>
      )}
    </>
  );
};

export default Page;

const ContactFormSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  description: z.string().optional(),
  website: z.string().min(1, "Website is required").url("Invalid URL format"), // Ensures it's a valid URL
  linkedIn: z.string().optional(),
  // sourceRef: z.custom<DocumentReference>(
  //   (val) => val instanceof DocumentReference,
  //   {message: "Invalid source reference"}
  // ),
  score: z.number().min(1).max(5), // Adjust range as needed
});

type ContactFormValue = z.infer<typeof ContactFormSchema>;

const AddNewCompany = ({
  company,
  open,
  setOpen,
  setStatus,
  handleNext,
}: {
  company: AI_Lead;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setStatus: React.Dispatch<
    React.SetStateAction<"accepted" | "rejected" | "unreviewed">
  >;
  handleNext: () => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const {currentUser} = useAuth()!;

  const cleanUrl = (url: string) => {
    // make a valid url
    if (!url.startsWith("http")) {
      url = `https://${url}`;
    } else if (!url.startsWith("www.")) {
      url = url.replace("www.", "https://www.");
    }
    return url;
  };

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: {errors},
  } = useForm<ContactFormValue>({
    resolver: zodResolver(ContactFormSchema),
    mode: "onChange",
  });

  // Add this useEffect to reset form values when company changes
  useEffect(() => {
    reset({
      name: company.name,
      description: company.description,
      website: cleanUrl(company.website),
      linkedIn: "",
      score: 1,
    });
  }, [company, reset]);

  const SaveData = async (data: ContactFormValue) => {
    if (!currentUser) return;
    setIsLoading(true);
    const id = Math.random().toString(36).substring(2, 15);
    const leadData = {
      id,
      lists: ["1"],
      ...data,
      sourceId: "oP9CEa1DVZVHAzApduNh",
      createdBy: currentUser?.firstName,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    await setDoc(doc(db, `companies/${id}`), leadData);
    // update the company in the ai-sourced collection
    await updateDoc(doc(db, `ai-sourced/${company.name}`), {
      status: "accepted",
    });
    setStatus("accepted");
    setIsLoading(false);
    setOpen(false);
    handleNext();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add as a lead</DialogTitle>
          <DialogDescription>Add this company as a lead</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(SaveData)} className="grid gap-4">
          <div className="grid gap-1">
            <label className="font-bold">Name</label>
            <Input placeholder="Company Name" {...register("name")} />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1">
              <label className="font-bold">Website</label>
              <Input placeholder="Company Website" {...register("website")} />
              {errors.website && (
                <p className="text-red-500 text-sm">{errors.website.message}</p>
              )}
            </div>
            <div className="grid gap-1">
              <label className="font-bold">Rating</label>
              <Controller
                name="score"
                control={control}
                render={({field}) => (
                  <Rating value={field.value} setValue={field.onChange} />
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <label className="font-bold">LinkedIn</label>
              <Input placeholder="Company LinkedIn" {...register("linkedIn")} />
            </div>
          </div>

          <div className="grid gap-1">
            <label className="font-bold">Description</label>
            <Textarea
              placeholder="Company Description"
              className="noResize overflow-scroll"
              {...register("description")}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Rating = ({
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
