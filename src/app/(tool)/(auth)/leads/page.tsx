"use client";
import React, {useEffect, useState} from "react";
import {Icons} from "@/components/icons";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {AnimatePresence, motion} from "framer-motion";
import {Lead, SourceData} from "@/config/data";
import {ExpandedLead} from "@/app/(tool)/(auth)/leads/components/expanded-lead";
import {LeadRow} from "@/app/(tool)/(auth)/leads/components/lead-row";
import {FilterStatus} from "@/app/(tool)/(auth)/leads/components/filter-status";
import {Icon, List, ListPlus} from "lucide-react";
import {getFaviconUrl} from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {CreateNewList} from "@/app/(tool)/(auth)/leads/components/buttons/new-list";
import {
  getDocs,
  setDoc,
  doc,
  collection,
  where,
  query,
  onSnapshot,
  getDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import {db} from "@/config/firebase";
import {Description} from "@radix-ui/react-dialog";

const Page = () => {
  const [LeadLists, setLeadLists] = useState<
    {name: string; description: string; id: string}[]
  >([]);

  const [isLoadingLists, setIsLoadingLists] = useState(true);

  useEffect(() => {
    const leadListsCollection = collection(db, "lists");

    const unsubscribe = onSnapshot(leadListsCollection, (snapshot) => {
      const leadListsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setLeadLists([
        {name: "Full lead list", id: "1", description: "All leads"},
        ...(leadListsData as {name: string; description: string; id: string}[]),
      ]);
      setIsLoadingLists(false);
    });

    return () => unsubscribe(); // Cleanup function to unsubscribe when the component unmounts
  }, []);

  const [isLoading, setIsLoading] = useState(true);
  const [displayedLeadList, setDisplayedLeadList] = useState<string>("1");

  useEffect(() => {
    const clientIdeaDataQuery = query(
      collection(db, "companies"),
      where("lists", "array-contains", displayedLeadList)
    );

    const unsubscribe = onSnapshot(clientIdeaDataQuery, (querySnapshot) => {
      const leadsData: Lead[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        leadsData.push(data as Lead);
      });
      setLeads(leadsData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [displayedLeadList]);

  const [leads, setLeads] = useState<Lead[]>([]);

  const [selectedLeadId, setSelectedLeadId] = useState<string | undefined>();
  const [groupSelectedLeads, setGroupSelectedLeads] = useState<
    Lead[] | undefined
  >();

  const [totalDisplayed, setTotalDisplayed] = useState();
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);

  return (
    <div
      className={` grid gap-1  max-h-screen overflow-hidden  pb-4s
    
    `}
    >
      <div
        className={`grid grid-cols-[200px_1fr] 
         ${selectedLeadId ? "agrid-cols-[1fr_600px]" : "agrid-cols-1"}
        `}
      >
        <div className="w-full h-screen bg-[#FAFAFA] py-2 px-4 relative">
          <h1 className=" mb-1 font-bold text-sm">Lists</h1>
          {isLoadingLists ? (
            <Icons.loader className="mx-auto h-5 w-5 mt-10 animate-spin" />
          ) : (
            <div className="flex  w-full  flex-col gap-1 items-start">
              {LeadLists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => {
                    setDisplayedLeadList(list.id);
                    // setLeads(list.leads);
                  }}
                  className={` w-full h-fit flex items-start pl-2 rounded-md text-left
            ${
              displayedLeadList == list.id
                ? "bg-muted-foreground/10 "
                : " text-muted-foreground border-[#F7F8FA] hover:bg-muted-foreground/10"
            }
            
            `}
                >
                  <List className="h-4 w-4 mr-2 mt-1" />
                  {list.name}
                </button>
              ))}
              <CreateNewList>
                <button className="w-full h-fit  pl-2 rounded-md hover:bg-muted-foreground/10 flex items-center">
                  <Icons.add className="h-4 w-4 mr-2  text-muted-foreground" />
                  new list
                </button>
              </CreateNewList>
            </div>
          )}
        </div>
        {isLoading && leads == undefined ? (
          <>
            <Icons.spinner className="mx-auto h-6 w-6 animate-spin" />
          </>
        ) : (
          <div className="flex flex-col max-h-screen smax-h-[calc(100vh-32px)]   border  h-fit  relative     ">
            <h1 className="text-2xl font-bold px-4 pt-4">
              {LeadLists.find((list) => list.id == displayedLeadList)?.name} (
              {leads.length})
            </h1>
            <AnimatePresence>
              {groupSelectedLeads && groupSelectedLeads?.length > 0 && (
                <motion.div
                  initial={{bottom: -100, opacity: 0}}
                  animate={{bottom: 8, opacity: 1}}
                  exit={{bottom: -100, opacity: 0}}
                  transition={{duration: 0.2}}
                  className="absolute  left-1/2 -translate-x-1/2 p-4 rounded-md px-4 w-fit h-fit py-2 z-30 bg-background border flex items-center gap-2 shadow-lg"
                >
                  <button
                    onClick={() => setGroupSelectedLeads(undefined)}
                    className="rounded-full text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Icons.close className="h-5 w-5" />
                  </button>
                  <span className=" font-bold">
                    Selected {groupSelectedLeads.length} row(s)
                  </span>
                  <div className="flex gap-1 ml-auto">
                    <CreateNewList companies={groupSelectedLeads}>
                      <Button variant={"outline"}>
                        <Icons.add className=" h-4 w-4" />
                        Create list
                      </Button>
                    </CreateNewList>
                    <Button variant={"outline"}>
                      <ListPlus className=" h-4 w-4" />
                      Add to list
                    </Button>
                    <Button variant={"destructive"}>
                      <Icons.trash />
                      Delete
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex p-2  gap-4 items-center relative px-4">
              <div className="w-[300px] border h-fit rounded-sm bg-muted/60 relative">
                <Icons.search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4" />
                <Input
                  placeholder="search leads"
                  className="pl-8 bg-transparent border-none rounded-sm"
                />
              </div>
              {/* <h1 className="text-lg font-bold">({leads.length}) total</h1> */}
              <FilterStatus
                selectedStatus={selectedStatus}
                setSelectedStatus={setSelectedStatus}
              />
              <AddNewCompany text={"add new lead"} />
            </div>

            <div className="w-full border-y relative bg-muted/30 h-10  grid grid-cols-6 px-4 py-2 pl-[40px] font-bold ">
              <button
                onClick={() => {
                  if (
                    groupSelectedLeads &&
                    groupSelectedLeads.length == leads.length
                  ) {
                    setGroupSelectedLeads(undefined);
                  } else {
                    setGroupSelectedLeads(leads);
                  }
                }}
                className={`h-5 w-5 rounded-sm border-primary  absolute left-4 top-1/2 -translate-y-1/2 z-20 border-2  flex items-center justify-center
              
            ${
              groupSelectedLeads && groupSelectedLeads.length == leads.length
                ? "bg-primary"
                : ""
            }
              
              `}
              >
                {groupSelectedLeads &&
                  groupSelectedLeads.length == leads.length && (
                    <Icons.check className="h-6 w-6 text-background" />
                  )}
              </button>
              <span className="pl-4 flex items-center gap-1 whitespace-nowrap max-w-full overflow-hidden text-ellipsis relative z-10">
                Name
              </span>
              <span className="pl-4 flex items-center  gap-1 whitespace-nowrap max-w-full overflow-hidden text-ellipsis">
                Website
              </span>
              <div className="pl-4  items-center  gap-1 grid grid-cols-[1fr_12px]">
                <span className=" whitespace-nowrap  overflow-hidden text-ellipsis max-w-fit">
                  Sourced
                </span>
                <Icons.chevronUpDown className="h-3 w-3" />
              </div>
              <div className="pl-4  items-center  gap-1 grid grid-cols-[1fr_12px]">
                <span className=" whitespace-nowrap  overflow-hidden text-ellipsis max-w-fit">
                  Contacts
                </span>
                <Icons.chevronUpDown className="h-3 w-3" />
              </div>
              <span className="pl-4 flex items-center  gap-1 whitespace-nowrap max-w-full overflow-hidden text-ellipsis grid-cols-[1fr_12px]">
                <span className=" whitespace-nowrap  overflow-hidden text-ellipsis max-w-fit">
                  Score
                </span>
                <Icons.chevronUpDown className="h-3 w-3 min-w-3" />
              </span>
              <span className="pl-4 flex items-center  gap-1 whitespace-nowrap max-w-full overflow-hidden text-ellipsis">
                Source
                <Icons.chevronUpDown className="h-3 w-3" />
              </span>
            </div>
            <div className="flex flex-col w-full divide-y rounded-b-md h-fit  max-h-[calc(100vh-48px)] overflow-scroll">
              {leads.map((lead, i) => (
                <LeadRow
                  lead={lead}
                  key={i}
                  setSelectedLead={setSelectedLeadId}
                  selectedLead={selectedLeadId}
                  groupSelectedLeads={groupSelectedLeads}
                  setGroupSelectedLeads={setGroupSelectedLeads}
                />
              ))}
            </div>
          </div>
        )}
        <AnimatePresence>
          {selectedLeadId &&
            // First find the lead
            (() => {
              const selectedLead = leads.find(
                (lead) => lead.id === selectedLeadId
              );
              // Only render if we found the lead
              return selectedLead ? (
                <ExpandedLead
                  lead={selectedLead}
                  setSelectedLeadId={setSelectedLeadId}
                />
              ) : null;
            })()}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Page;

const AddNewCompany = ({text}: {text: string}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const SaveData = async () => {
    setIsLoading(true);

    // const querySnapshot = await getDocs(collection(db, "companies"));

    // for (const doc of querySnapshot.docs) {
    //   await updateDoc(doc.ref, {
    //     lists: ["1"],
    //   });
    // }

    setIsLoading(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="ml-auto bg-blue-600">
          <Icons.add />
          {text}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a new company</DialogTitle>
          <DialogDescription>Add a new company to the list</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Company name" />
          <Input placeholder="Company website" />
        </div>
        <Textarea placeholder="Description" />

        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Company LinkedIn" />
          <Select>
            <SelectTrigger className="w-full ">
              <SelectValue placeholder="Select a source" />
            </SelectTrigger>
            <SelectContent>
              {SourceData.map((source) => (
                <SelectItem key={source} value={source}>
                  <div className="flex gap-1 items-center">{source}</div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button onClick={SaveData}>
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// const leadsDummy2 = [
//   {
//     name: "Otter AI",
//     description:
//       "Get transcripts, automated summaries, action items, and chat with Otter to get answers from your meetings.",
//     website: "https://otter.ai/",
//     linkedIn: "https://www.linkedin.com/in/kurtapen/",
//     status: "uncontacted",
//   },
//   {
//     name: "SchoolAi",
//     description:
//       "Powerful, managed, and safe AI-powered tools that bring K12 students, teachers, and school leaders closer together.",
//     website: "https://schoolai.com/",
//     linkedIn: "https://www.linkedin.com/company/getschoolai/people/",
//     status: "pendingResponse",
//   },
//   {
//     name: "Snorkl",
//     description:
//       "Snorkl is a formative assessment tool that lets students capture their thinking and receive instant AI feedback.",
//     website: "https://snorkl.app/plans",
//     linkedIn: "https://www.linkedin.com/company/snorklapp/",
//     status: "negativeResponse",
//   },
//   {
//     name: "Texthelp",
//     description: "Suite of tech tools to help people understand language",
//     website: "https://texthelp.com/products/read-and-write-education/",
//     linkedIn: "https://www.linkedin.com/company/texthelp/",
//     status: "positiveResponse",
//   },
//   {
//     name: "Dreamina",
//     description:
//       "Dreamina is an AI platform that specializes in creating stunning posters, flyers, and logos. Simply enter prompt words to generate eye-catching images. Our Canvas lets you precisely edit content, so it perfectly meets your needs.",
//     website: "https://dreamina.capcut.com/?ref=producthunt",
//     linkedIn: "",
//     status: "callScheduled",
//   },
//   {
//     name: "Ray Browser",
//     description:
//       "Instantly play the best games with no downloads required. Enjoy the smoothest gameplay and keep all your favorite apps at your fingertips with split-screen.",
//     website: "https://playonray.com/",
//     linkedIn: "",
//     status: "closed",
//   },
//   {
//     name: "Cimphony ai",
//     description: "AI tool for business",
//     website: "https://www.cimphony.ai/",
//     linkedIn: "https://www.linkedin.com/company/cimphony-inc/",
//     status: "uncontacted",
//   },
//   {
//     name: "Job Bridge",
//     description:
//       "Get instant, intelligent answers during your interviews. Our AI copilot helps you ace every question and land your dream job.",
//     website: "https://jobbridge.io/",
//     linkedIn: "https://www.linkedin.com/company/job-bridge-io/",
//     status: "uncontacted",
//   },
//   {
//     name: "Truva ai",
//     description:
//       "Truva handles the busywork so your team can focus on what matters most – closing deals.",
//     website: "https://truva.ai/",
//     linkedIn: "https://www.linkedin.com/company/truva-ai/",
//     status: "uncontacted",
//   },
//   {
//     name: "Minvo",
//     description: "Podcast tool",
//     website: "https://minvo.pro/",
//     linkedIn: "https://www.linkedin.com/company/minvovideo/",
//     status: "uncontacted",
//   },
//   {
//     name: "Gigs",
//     description:
//       "Find the jobs that match your goals. Gigs applies to as many positions as you want—for FREE, with no limits!",
//     website: "https://getgigs.co/",
//     linkedIn: "https://www.linkedin.com/company/gogetgigs/",
//     status: "uncontacted",
//   },
// ];

// const leadsDummy1 = [
//   {
//     name: "Otter AI",
//     description:
//       "Get transcripts, automated summaries, action items, and chat with Otter to get answers from your meetings.",
//     website: "https://otter.ai/",
//     linkedIn: "https://www.linkedin.com/in/kurtapen/",
//     score: 0,
//     status: "pendingResponse",
//     source: "Spectrum Equity Portfolio",
//   },
//   {
//     name: "SchoolAi",
//     description:
//       "Powerful, managed, and safe AI-powered tools that bring K12 students, teachers, and school leaders closer together.",
//     website: "https://schoolai.com/",
//     linkedIn: "https://www.linkedin.com/company/getschoolai/people/",
//     notes: "Not a great social presence but huge on LinkedIn",
//     score: 4,
//     status: "pendingResponse",
//     source: "Cult of pedagogy",
//   },
//   {
//     name: "Snorkl",
//     description:
//       "Snorkl is a formative assessment tool that lets students capture their thinking and receive instant AI feedback.",
//     website: "https://snorkl.app/plans",
//     linkedIn: "https://www.linkedin.com/company/snorklapp/",
//     notes: "Active on social, small following",
//     score: 4,
//     status: "pendingResponse",
//     source: "Cult of pedagogy",
//   },
//   {
//     name: "Texthelp",
//     description: "Suite of tech tools to help people understand language",
//     website: "https://texthelp.com/products/read-and-write-education/",
//     linkedIn: "https://www.linkedin.com/company/texthelp/",
//     notes: "Big on YouTube and Twitter. Video content sucks",
//     score: 0,
//     status: "uncontacted",
//     source: "Cult of pedagogy",
//   },
//   {
//     name: "Dreamina",
//     description:
//       "Dreamina is an AI platform that specializes in creating stunning posters, flyers, and logos. Simply enter prompt words to generate eye-catching images. Our Canvas lets you precisely edit content, so it perfectly meets your needs.",
//     website: "https://dreamina.capcut.com/?ref=producthunt",
//     score: 0,
//     status: "pendingResponse",
//     source: "Product Hunt",
//     notes: "Hasn't been active in a while but had good content.",
//   },
//   {
//     name: "Ray Browser",
//     description:
//       "Instantly play the best games with no downloads required. Enjoy the smoothest gameplay and keep all your favorite apps at your fingertips with split-screen.",
//     website: "https://playonray.com/",
//     score: 5,
//     status: "pendingResponse",
//     source: "Swipe labs client",
//     notes:
//       "Current Swipe Labs client, seeing bad performance, only collabs no organic content - very good lead",
//   },
//   {
//     name: "Cimphony AI",
//     description: "AI tool for business",
//     website: "https://www.cimphony.ai/",
//     linkedIn: "https://www.linkedin.com/company/cimphony-inc/",
//     score: 4,
//     status: "callScheduled",
//     source: "Swipe labs client",
//     notes:
//       "Swipe Labs client, No results, similar product to Blaze, use Blaze success as selling point",
//   },
//   {
//     name: "Job Bridge",
//     description:
//       "Get instant, intelligent answers during your interviews. Our AI copilot helps you ace every question and land your dream job.",
//     status: "uncontacted",
//     source: "Swipe labs client",
//     website: "https://jobbridge.io/",
//     linkedIn: "https://www.linkedin.com/company/job-bridge-io/",
//     score: 4,
//     notes: "Likely a swipe labs client, very bad content, goldmine niche",
//   },
//   {
//     name: "Truva ai",
//     description:
//       "Truva handles the busywork so your team can focus on what matters most – closing deals.",
//     status: "pendingResponse",
//     source: "Swipe labs client",
//     website: "https://truva.ai/",
//     linkedIn: "https://www.linkedin.com/company/truva-ai/",
//     score: 4,
//     notes: "Likely a swipe labs client, only collabs, no organic",
//   },
//   {
//     name: "Minvo",
//     description: "Podcast tool",
//     status: "pendingResponse",
//     source: "Swipe labs client",
//     website: "https://minvo.pro/",
//     linkedIn: "https://www.linkedin.com/company/minvovideo/",
//     score: 5,
//     notes: "Likely a swipe labs client, No organic, goldmine niche",
//   },
//   {
//     name: "Gigs",
//     description:
//       "Find the jobs that match your goals. Gigs applies to as many positions as you want—for FREE, with no limits!",
//     status: "pendingResponse",
//     source: "Swipe labs client",
//     website: "https://getgigs.co/",
//     linkedIn: "https://www.linkedin.com/company/gogetgigs/",
//     score: 4,
//     notes: "Likely a swipe labs client, No organic",
//   },
//   {
//     name: "Tavus",
//     description:
//       "Build immersive AI-generated video experiences in your application",
//     status: "uncontacted",
//     source: "Swipe labs client",
//     website: "https://www.tavus.io/",
//     linkedIn: "https://www.linkedin.com/company/tavus-io/",
//     score: 3,
//     notes:
//       "Swipe labs client? from old leads list. last post was in August, good niche",
//   },
//   {
//     name: "Decipad",
//     description:
//       "A new way to create, collaborate and present anything you want using numbers. No code. No spreadsheets. No fuss.",
//     status: "uncontacted",
//     source: "Swipe labs client",
//     website: "https://www.decipad.com/",
//     linkedIn: "https://www.linkedin.com/company/decipad/",
//     score: 0,
//     notes: "$3m seed. no video content, low follower count",
//   },
//   {
//     name: "Lighthouse",
//     description:
//       "Earn a cash back rebate from Lighthouse when you sign a new apartment lease at apartments in our network.",
//     status: "uncontacted",
//     source: "Swipe labs client",
//     website:
//       "https://lighthouse.app/?fbclid=PAZXh0bgNhZW0CMTEAAaYde36E1qKDkTdhlOBdniCW7xb356WfZxhjUXZEA31KJyGkd9IuR7hS-oI_aem_SvHRYb4D0zwL0TlzF1fj_A",
//     linkedIn: "https://www.linkedin.com/company/lighthouseapartments/",
//     score: 4,
//     notes: "Probably one of swipe labs best clients, not a lot of organic",
//   },
//   {
//     name: "Fathom",
//     description:
//       "Fathom records, transcribes, highlights, and summarizes your meetings so you can focus on the conversation.",
//     status: "pendingResponse",
//     source: "Swipe labs client",
//     website:
//       "https://fathom.video/?fbclid=PAZXh0bgNhZW0CMTEAAaY8-CqP56gGnYLNlWcgDnmaEjUn6B_dNzLqDEF50-l9bwShlKMf7lRfzKI_aem_J6I6fVuCc9-5mwWwepJHhw",
//     linkedIn: "https://www.linkedin.com/company/fathom-video/",
//     score: 5,
//     notes:
//       "Really bad content, worked with swipe labs in the past, raised $17m, actively posting bad content. THIS IS A GOOD LEAD",
//   },
//   {
//     name: "Fireflies Ai",
//     description:
//       "Helps your team transcribe, summarize, search, and analyze voice conversations.",
//     status: "uncontacted",
//     source: "Swipe labs client",
//     website: "https://fireflies.ai/",
//     linkedIn: "https://www.linkedin.com/company/fireflies-inc/",
//     score: 4,
//     notes: "Haven't posted in almost a year, former swipe labs client",
//   },
//   {
//     name: "Learn xyz",
//     description:
//       "Replaces dull traditional learning with seamless content creation and engaging learning experiences for your teams.",
//     status: "pendingResponse",
//     source: "Swipe labs client",
//     website:
//       "https://www.learn.xyz/?fbclid=PAZXh0bgNhZW0CMTEAAaYi7LjdRIRxDUKDuC6k7u_cfo5nno_H2HwYcR3juUmgubcpKBXOT9ZSgSc_aem_Cb85SlVwC7irr41uSVIjMw&_branch_match_id=1301321243245778915&utm_source=instagram&utm_campaign=profile&utm_medium=organic&_branch_referrer=H4sIAAAAAAAAAwXBSQ6CMBQA0Nu4FBwQNSEGq4lGUUMdgE3T1lLKUMiHBnTh2X0v67qmXVtWKSjo4fMd06YZl0oXltJtRyXQapMyXqq3d%2FOTKLOZvGTJy0bBfe%2F7NFbuOX%2BHx3DYPU47gxaFawhPa0frmhymhz7m4Sw3j0oaxpvTNrreVwmWmBMqKoLY0sHls0euAphPDH4e86Af%2FUCkAkBpSRjUfSvAQxnUlfgDWiOrb60AAAA%3D",
//     score: 2,
//     notes:
//       "Tried reaching out couldn't get a response. Would be a perfect client, good niche, lots of money.",
//   },
//   {
//     name: "Tool Finder",
//     description:
//       "Tool Finder is a software discovery platform with over 100K+ monthly visitors. Find reviews, filter tools, search instantly, and discover the best tools for smarter work.",
//     status: "uncontacted",
//     source: "Product Hunt",
//     website: "https://toolfinder.co/about",
//     score: 3,
//     notes: "Huge on YouTube and Twitter but no presence elsewhere.",
//   },
//   {
//     name: "Price Snap",
//     description:
//       "PricesSnap helps buyers and sellers discover accurate item prices from a picture. We streamline the pricing process, ensuring you get the best deals and insights on your items effortlessly.",
//     website: "https://pricesnap.io/",
//     status: "uncontacted",
//     source: "Product Hunt",
//     score: 2,
//   },
//   {
//     name: "Riffusion",
//     description: "Your new instrument, create the music you imagine",
//     website: "https://www.riffusion.com/?ref=producthunt",
//     linkedIn: "https://www.linkedin.com/company/riffusion/",
//     status: "uncontacted",
//     source: "Product Hunt",
//     score: 4,
//   },
//   {
//     name: "Waffle",
//     description: "Daily waffles with your friends.",
//     website: "https://www.waffle-app.com/?ref=producthunt",
//     status: "uncontacted",
//     source: "Product Hunt",
//     score: 0,
//     notes: "Keep Eye On",
//   },
//   {
//     name: "JoggAI",
//     description:
//       "Easily create stunning videos with engaging AI Avatars! Automate video creation with maximum creativity using JoggAI.",
//     website: "https://www.jogg.ai/?ref=producthunt",
//     linkedIn: "https://www.linkedin.com/in/constance-tong-38640812a/",
//     status: "uncontacted",
//     source: "Product Hunt",
//     score: 3,
//     notes: "Good Content, No instagram",
//   },
//   {
//     name: "WePost",
//     description:
//       "Simplify your social media workflow. Wepost automates content creation, publishing, and analytics, so you can focus on building your brand.",
//     website: "https://wepost.ai/?ref=producthunt",
//     linkedIn: "https://www.linkedin.com/company/weposthq/people/",
//     status: "uncontacted",
//     source: "Product Hunt",
//     score: 5,
//     notes: "Just like blaze, ass socials",
//   },
//   {
//     name: "News Bang",
//     description:
//       "Better NEWS experience 📖 Grasp Easier, Never Miss Out: Bitesize takeaways from trusted sources, all in one screen 💡 Think Deeper, Inspired More: Sparked by unique queries, get unbiased answers 🎧 Listen Podcast, Ask Anything: Engage further anytime, anywhere",
//     website: "https://www.newsbang.com/?utm_source=producthunt&ref=producthunt",
//     linkedIn: "https://www.linkedin.com/in/newsbang-ai/",
//     status: "uncontacted",
//     source: "Product Hunt",
//     score: 2,
//   },
//   {
//     name: "Shimmer",
//     description:
//       "Meet the #1 ADHD Coaching Platform’s v2.0. We’ve supercharged our original science-backed ADHD Coaching program with AI.",
//     website:
//       "https://www.shimmer.care/producthunt?utm_source=producthunt&utm_medium=launch&utm_content=0123-launch&utm_campaign=shimmer-2-ai&ref=producthunt",
//     status: "uncontacted",
//     source: "Product Hunt",
//     score: 2,
//   },
//   {
//     name: "Recap",
//     description:
//       "Unlock Insights with AI-driven, multi-perspective questions that transform diverse materials into illuminating visuals.",
//     website: "https://recapall.app/?ref=producthunt",
//     status: "uncontacted",
//     source: "Product Hunt",
//     score: 0,
//     notes: "No socials, could do well with organic",
//   },
//   {
//     name: "Humva",
//     description:
//       "Humva provides free customized avatars and thousands of avatar templates for social media videos.",
//     website: "https://humva.com/avatar/home?ref=producthunt",
//     linkedIn: "https://www.linkedin.com/in/jingyi-lin-05826a281/",
//     status: "uncontacted",
//     source: "Product Hunt",
//     score: 2,
//     notes: "Seems like a good social company but has no accounts",
//   },
//   {
//     name: "Lensgo",
//     description:
//       "LensGo is an innovative artificial intelligence tool that has revolutionized digital content creation.",
//     website: "https://lensgo.ai/",
//     linkedIn: "https://www.linkedin.com/in/jingyi-lin-05826a281/",
//     status: "uncontacted",
//     source: "Product Hunt",
//     score: 0,
//     notes: "Joy L, runs it",
//   },
//   {
//     name: "Dry Merge",
//     description:
//       "Pom makes it easy to pick products that are safe for your health.",
//     website: "https://drymerge.com/apps/",
//     linkedIn: "https://www.linkedin.com/in/edward-frazer/",
//     status: "uncontacted",
//     source: "Product Hunt",
//     score: 2,
//     notes: "High promise app, no marketing",
//   },
//   {
//     name: "Pom",
//     description: "An ingredient checker made with transparency in mind.",
//     website: "https://thepom.app/?ref=producthunt",
//     status: "uncontacted",
//     source: "Product Hunt",
//     score: 4,
//     notes: "Needs help for sure",
//   },
//   {
//     name: "Book Read",
//     description: "BookRead is an AI-powered ebook reader app.",
//     website: "https://www.bookread.ai/?ref=producthunt",
//     status: "uncontacted",
//     source: "Product Hunt",
//     score: 2,
//   },
//   {
//     name: "Clip Zap",
//     description:
//       "ClipZap is an AI-powered video tool for automatic clipping, editing, and translation.",
//     website: "https://www.clipzap.ai/about",
//     status: "uncontacted",
//     source: "Product Hunt",
//     score: 2,
//     notes: "Only on twitter, could use socials",
//   },
//   {
//     name: "Artlas",
//     description:
//       "ARTLAS brings art to life with an AI companion that deciphers masterpieces.",
//     website: "https://www.artlas.art/?ref=producthunt",
//     linkedIn:
//       "https://www.linkedin.com/company/artlasart/people/?viewAsMember=true",
//     status: "uncontacted",
//     source: "Product Hunt",
//     score: 3,
//   },
//   {
//     name: "Fuck Subscriptions",
//     description:
//       "Your favorite SaaS tools, stripped down to their essential features.",
//     website: "https://www.fcksubscription.com/?ref=producthunt",
//     status: "uncontacted",
//     source: "Product Hunt",
//     score: 1,
//     notes: "Probably no capital, could do well on socials",
//   },
//   {
//     name: "Mindy",
//     description:
//       "Mindy’s agents plug into your workflow to help grow your business relationships with precision.",
//     website:
//       "https://www.mindy.com/?fbclid=PAZXh0bgNhZW0CMTEAAaZCjPw1Klcna03M0heDufQ-j8ry2pHVQTkntpTUwygYIA5gqBt4ahBnIHw_aem_HdQe1XJV6Lmse6x66lK_kA",
//     linkedIn: "https://www.linkedin.com/company/mindy-ai/people/",
//     status: "uncontacted",
//     source: "swipe labs client",
//     score: 3,
//     notes:
//       "Creating organic inhouse. Circle back to see how their organic is doing.",
//   },
// ];
