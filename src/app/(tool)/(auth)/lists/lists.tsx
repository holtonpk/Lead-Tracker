"use client";
import {CreateNewList} from "@/app/(tool)/(auth)/lists/buttons/new-list";
import {AddToList} from "@/app/(tool)/(auth)/lists/buttons/add-to-list";
import {RemoveFromList} from "@/app/(tool)/(auth)/lists/buttons/remove-from-list";
import {ExpandedLead} from "@/app/(tool)/(auth)/lists/expanded-lead";
import {FilterStatus} from "@/app/(tool)/(auth)/lists/filter-status";
import {LeadRow} from "@/app/(tool)/(auth)/lists/lead-row";
import Navbar from "@/app/(tool)/(auth)/navbar/navbar";
import {Icons} from "@/components/icons";
import {Button} from "@/components/ui/button";
import {toast} from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {Lead, SourceType, List as ListType, TagColors} from "@/config/data";
import {db} from "@/config/firebase";
import {useAuth} from "@/context/user-auth";
import {zodResolver} from "@hookform/resolvers/zod";
import {AnimatePresence, motion} from "framer-motion";
import Link from "next/link";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from "firebase/firestore";
import {useEffect, useState} from "react";
import {Controller, useForm} from "react-hook-form";
import * as z from "zod";
import {convertTimestampToDate} from "@/lib/utils";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Lists = ({
  isLoadingLists,
  setIsLoadingLists,
  LeadLists,
  setLeadLists,
  displayedLeadList,
  setDisplayedLeadList,
  tab,
  setTab,
}: {
  isLoadingLists: boolean;
  setIsLoadingLists: React.Dispatch<React.SetStateAction<boolean>>;
  LeadLists: ListType[];
  setLeadLists: React.Dispatch<React.SetStateAction<ListType[]>>;
  displayedLeadList: string;
  setDisplayedLeadList: React.Dispatch<React.SetStateAction<string>>;
  tab: string;
  setTab: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const [isLoading, setIsLoading] = useState(true);

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
      // setFilteredLeads(leadsData);
      setFullLeads(leadsData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [displayedLeadList]);
  const [usersData, setUsersData] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsersData = async () => {
      const users = await getDocs(collection(db, "users"));
      setUsersData(users.docs.map((doc) => doc.data()));
    };
    fetchUsersData();
  }, []);

  // const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [fullLeads, setFullLeads] = useState<Lead[]>([]);

  const [selectedLeadId, setSelectedLeadId] = useState<string | undefined>();
  const [groupSelectedLeads, setGroupSelectedLeads] = useState<
    Lead[] | undefined
  >();

  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);

  useEffect(() => {
    setGroupSelectedLeads(undefined);
  }, [displayedLeadList]);

  const [search, setSearch] = useState("");

  const [filterType, setFilterType] = useState<keyof Lead>("score");
  const [isDesc, setIsDesc] = useState<boolean>(true);

  const filteredLeads = fullLeads
    .filter((lead) => {
      if (search.length >= 3) {
        return lead.name
          .toLocaleUpperCase()
          .includes(search.toLocaleUpperCase());
      }
      return true; // Keep all leads if search is not active
    })
    .slice() // Prevents mutation
    .sort((a: Lead, b: Lead) => {
      if (filterType === "contacts") {
        const aContacts =
          a.contacts?.reduce(
            (sum, contact) => sum + contact.contactPoints.length,
            0
          ) || 0;
        const bContacts =
          b.contacts?.reduce(
            (sum, contact) => sum + contact.contactPoints.length,
            0
          ) || 0;
        return isDesc ? bContacts - aContacts : aContacts - bContacts;
      }

      if (filterType === "tasks") {
        const getEarliestTaskDate = (lead: Lead) => {
          return (
            lead.tasks
              ?.filter((task) => !task.isCompleted) // Only consider incomplete tasks
              .map((task) =>
                convertTimestampToDate(task.date as Timestamp).getTime()
              )
              .sort((a, b) => a - b)[0] || 0
          ); // Get the earliest task date (or 0 if none)
        };

        const aTaskDate = getEarliestTaskDate(a);
        const bTaskDate = getEarliestTaskDate(b);

        return isDesc ? bTaskDate - aTaskDate : aTaskDate - bTaskDate;
      }

      const aValue = a[filterType];
      const bValue = b[filterType];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return isDesc ? bValue - aValue : aValue - bValue;
      } else if (typeof aValue === "string" && typeof bValue === "string") {
        return isDesc
          ? bValue.localeCompare(aValue)
          : aValue.localeCompare(bValue);
      }
      return 0; // Default case if types are mixed or unknown
    });

  const [scoreFilter, setScoreFilter] = useState<number | undefined>();

  return (
    <>
      {isLoading && filteredLeads == undefined ? (
        <>
          <Icons.spinner className="mx-auto h-6 w-6 animate-spin" />
        </>
      ) : (
        <div className="flex flex-col max-h-screen smax-h-[calc(100vh-32px)]   border  h-fit  relative     ">
          <h1 className="text-2xl font-bold px-4 pt-4">
            {LeadLists.find((list) => list.id == displayedLeadList)?.name} (
            {fullLeads.length})
          </h1>
          <div className="border border-t-0 shadow-lg rounded-b-md absolute items-center gap-4 top-0 right-0 p-3 py-2 rounded-r-none text-sm flex">
            <h1 className="font-bold text-lg">Scoring Criteria 👉</h1>
            <div className="flex gap-1 items-center">
              <Icons.star className="h-4 w-4 fill-blue-300 text-blue-500" />
              <p className="text-muted-foreground">
                Shown interest in social media
              </p>
            </div>
            <div className="flex gap-1 items-center">
              <Icons.star className="h-4 w-4 fill-blue-300 text-blue-500" />
              <p className="text-muted-foreground">
                Underperforming on social media
              </p>
            </div>
            <div className="flex gap-1 items-center">
              <Icons.star className="h-4 w-4 fill-blue-300 text-blue-500" />
              <p className="text-muted-foreground">Good niche for shortform</p>
            </div>
          </div>
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
                  {/* <AddToList companies={groupSelectedLeads}>
                    <Button variant={"outline"}>
                      <ListPlus className=" h-4 w-4" />
                      Add to list
                    </Button>
                  </AddToList> */}
                  {displayedLeadList != "1" && (
                    <RemoveFromList
                      companies={groupSelectedLeads}
                      listId={displayedLeadList}
                      onSuccess={() => setGroupSelectedLeads(undefined)}
                    >
                      <Button variant={"destructive"}>
                        <Icons.trash />
                        delete from list
                      </Button>
                    </RemoveFromList>
                  )}
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="search"
              />
            </div>
            {/* <FilterStatus
                selectedStatus={selectedStatus}
                setSelectedStatus={setSelectedStatus}
              /> */}
            <AddNewCompany text={"add new lead"} />
          </div>

          <div className="w-full border-y relative bg-muted/30 h-10  grid grid-cols-[200px_1fr_1fr_1fr_1fr_150px_1fr_36px] px-4 py-2 pl-[40px] font-bold ">
            <button
              onClick={() => {
                if (
                  groupSelectedLeads &&
                  groupSelectedLeads.length == filteredLeads.length
                ) {
                  setGroupSelectedLeads(undefined);
                } else {
                  setGroupSelectedLeads(filteredLeads);
                }
              }}
              className={`h-5 w-5 rounded-sm transition-all  absolute left-4 top-1/2 -translate-y-1/2 z-20 border-2  flex items-center justify-center
              
            ${
              groupSelectedLeads &&
              groupSelectedLeads.length == filteredLeads.length
                ? "bg-primary border-primary"
                : "border-muted-foreground hover:bg-muted-foreground"
            }
              
              `}
            >
              {groupSelectedLeads &&
                groupSelectedLeads.length == filteredLeads.length && (
                  <Icons.check className="h-6 w-6 text-background" />
                )}
            </button>

            <RowHead
              label="Name"
              field="name"
              isDesc={isDesc}
              setIsDesc={setIsDesc}
              setFilterType={setFilterType}
              filterType={filterType}
            />
            <RowHead
              label="Website"
              field="website"
              isDesc={isDesc}
              setIsDesc={setIsDesc}
              setFilterType={setFilterType}
              filterType={filterType}
            />
            <RowHead
              label="Next Action"
              field="tasks"
              isDesc={isDesc}
              setIsDesc={setIsDesc}
              setFilterType={setFilterType}
              filterType={filterType}
            />
            <RowHead
              label="Contact Points"
              field="contacts"
              isDesc={isDesc}
              setIsDesc={setIsDesc}
              setFilterType={setFilterType}
              filterType={filterType}
            />
            <RowHead
              label="Score"
              field="score"
              isDesc={isDesc}
              setIsDesc={setIsDesc}
              setFilterType={setFilterType}
              filterType={filterType}
            />
            <RowHead
              label="Added By"
              field="createdBy"
              isDesc={isDesc}
              setIsDesc={setIsDesc}
              setFilterType={setFilterType}
              filterType={filterType}
            />
            <RowHead
              label="Source"
              field="source"
              isDesc={isDesc}
              setIsDesc={setIsDesc}
              setFilterType={setFilterType}
              filterType={filterType}
            />
          </div>
          {filteredLeads.length > 0 ? (
            <div className="flex flex-col w-full divide-y rounded-b-md h-fit  max-h-[calc(100vh-48px)] overflow-scroll">
              {filteredLeads.map((lead, i) => (
                <LeadRow
                  lead={lead}
                  key={i}
                  setSelectedLead={setSelectedLeadId}
                  selectedLead={selectedLeadId}
                  groupSelectedLeads={groupSelectedLeads}
                  setGroupSelectedLeads={setGroupSelectedLeads}
                  displayedLeadList={displayedLeadList}
                  usersData={usersData}
                />
              ))}
            </div>
          ) : (
            <div className="w-full py-10 flex items-center justify-center font-bold text-xl">
              This list is empty
            </div>
          )}
        </div>
      )}
      <AnimatePresence>
        {selectedLeadId &&
          // First find the lead
          (() => {
            const selectedLead = fullLeads.find(
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
    </>
  );
};

export default Lists;

const RowHead = ({
  label,
  field,
  filterType,
  isDesc,
  setIsDesc,
  setFilterType,
}: {
  label: string;
  field: keyof Lead;
  filterType: keyof Lead;
  isDesc: boolean;
  setIsDesc: React.Dispatch<React.SetStateAction<boolean>>;
  setFilterType: React.Dispatch<React.SetStateAction<keyof Lead>>;
}) => {
  return (
    <button
      onClick={() => {
        setIsDesc((prev) => !prev);
        setFilterType(field);
      }}
      className="pl-4 items-center gap-1 grid grid-cols-[1fr_12px]"
    >
      <span className="whitespace-nowrap overflow-hidden text-ellipsis max-w-fit">
        {label}
      </span>
      {filterType === field && (
        <Icons.chevronDown
          className={`h-3 w-3 min-w-3 transition-transform duration-100 ${
            isDesc ? "rotate-0" : "rotate-180"
          }`}
        />
      )}
    </button>
  );
};

const ContactFormSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  description: z.string().optional(),
  website: z.string().min(1, "Website is required").url("Invalid URL format"), // Ensures it's a valid URL
  linkedIn: z.string().optional(),
  // sourceRef: z.custom<DocumentReference>(
  //   (val) => val instanceof DocumentReference,
  //   {message: "Invalid source reference"}
  // ),
  sourceId: z.string().min(1, "Source is required"),
  score: z.number().min(1).max(5), // Adjust range as needed
});

type ContactFormValue = z.infer<typeof ContactFormSchema>;

const AddNewCompany = ({text}: {text: string}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const {currentUser} = useAuth()!;

  const {
    register,
    handleSubmit,
    control,
    reset,
    getValues,
    setValue,
    formState: {errors},
  } = useForm<ContactFormValue>({
    resolver: zodResolver(ContactFormSchema),
    mode: "onChange",
    defaultValues: {
      companyName: "",
      description: "",
      website: "",
      linkedIn: "",
      sourceId: "",
      // sourceRef: undefined,
      score: 1,
    },
  });

  const SaveData = async (data: ContactFormValue) => {
    if (!currentUser) return;
    setIsLoading(true);
    const id = Math.random().toString(36).substring(2, 15);

    const leadData = {
      id,
      lists: ["1"],
      name: data.companyName,
      website: data.website,
      linkedin: data.linkedIn,
      description: data.description,
      sourceId: data.sourceId,
      score: data.score,
      createdBy: currentUser?.firstName,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      ...(selectedOrganization?.id && {
        organization_id: selectedOrganization.id,
      }),
    };

    await setDoc(doc(db, `companies/${id}`), leadData);

    setIsLoading(false);
    setSelectedOrganization(undefined);
    setSearchResults([]);
    setSearchName("");
    reset();
    setOpen(false);
  };

  const [selectedOrganization, setSelectedOrganization] = useState<any>();

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [openSearchResults, setOpenSearchResults] = useState(false);

  const [searchLoading, setSearchLoading] = useState(false);

  const searchForCompany = async () => {
    setSearchLoading(true);
    try {
      const url = `/api/search-organization`;
      const options = {
        method: "POST",
        body: JSON.stringify({organizationName: searchName}),
      };

      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      setSearchResults([
        ...(data.accounts || []),
        ...(data.organizations || []),
      ]);
      setOpenSearchResults(true);
    } catch (error) {
      console.log("Failed to search for company:", error);
      toast.error("Failed to search for company. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  };

  const selectOrganization = (organization: any) => {
    setValue("linkedIn", organization.linkedin_url);
    setValue("website", organization.website_url);
    setValue("companyName", organization.name);
    setSelectedOrganization(organization);
    setOpenSearchResults(false);
  };

  const useBlank = () => {
    setValue("linkedIn", "");
    setValue("website", "");
    setValue("companyName", searchName);
    setSelectedOrganization({
      name: searchName,
      logo_url: undefined,
      linkedin_url: "",
      website_url: "",
      noData: true,
    });
    setOpenSearchResults(false);
  };

  const [searchName, setSearchName] = useState("");

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
          <DialogTitle>
            {!selectedOrganization ? "Add a new company" : "Add a new company"}
          </DialogTitle>
          <DialogDescription>
            {!selectedOrganization
              ? "First search for the company you want to add. This will help us collect more data on the company. If you don't see it, add without data."
              : "Add a new company to the list"}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={
            !selectedOrganization
              ? (e) => e.preventDefault()
              : handleSubmit(SaveData)
          }
          className="grid gap-4"
        >
          {!selectedOrganization?.noData && (
            <div className="grid gap-1 relative ">
              <div className="relative w-full">
                {selectedOrganization ? (
                  <div className="flex gap-1 items-center">
                    <div className="flex gap-2 p-2 border rounded-sm w-full">
                      {selectedOrganization.logo_url && (
                        <img
                          src={selectedOrganization.logo_url}
                          className="w-6 h-6 rounded-sm"
                        />
                      )}
                      <span>{selectedOrganization.name}</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <Input
                      placeholder="Search for company"
                      autoFocus
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          searchForCompany();
                        }
                      }}
                    />
                    {searchName &&
                      (!searchResults || searchResults.length <= 0) && (
                        <Button
                          type="button"
                          size="sm"
                          className="absolute right-0 top-1/2 -translate-y-1/2"
                          onClick={searchForCompany}
                        >
                          {searchLoading ? (
                            <>
                              <Icons.spinner className="h-4 w-4 animate-spin" />
                              Searching...
                            </>
                          ) : (
                            <>
                              <Icons.search className={`h-4 w-4 `} />
                              Search
                            </>
                          )}
                        </Button>
                      )}
                  </>
                )}
                {searchResults.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setOpenSearchResults(!openSearchResults)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 items-center"
                  >
                    <span className="text-sm">
                      {openSearchResults ? "hide results" : "view results"}
                    </span>
                    <Icons.chevronDown
                      className={`h-6 w-6 ${
                        openSearchResults ? "rotate-180" : ""
                      } transition-transform duration-100`}
                    />
                  </button>
                )}

                <DropdownMenu
                  open={openSearchResults}
                  onOpenChange={setOpenSearchResults}
                >
                  <DropdownMenuTrigger asChild>
                    <div className="w-full h-0  relative bottom-0"></div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    sideOffset={2}
                    className="w-[450px] max-h-fit h-[200px] overflow-scroll relative  pt-2"
                  >
                    {searchResults.length > 0 ? (
                      <>
                        <DropdownMenuLabel>Search results</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <div className="flex-grow flex flex-col gap-2 h-fit">
                          {searchResults.map((result) => (
                            <div key={result.id} className="relative">
                              <DropdownMenuItem
                                typeof="button"
                                onClick={() => {
                                  selectOrganization(result);
                                }}
                                key={result.id}
                                className="flex gap-2 items-center hover:bg-muted-foreground/20 p-2 rounded-md w-full relative z-20 cursor-pointer"
                              >
                                <div className="w-6 h-6 rounded-full bg-muted">
                                  <img
                                    src={result.logo_url}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold">
                                    {result.name}
                                  </span>
                                </div>
                              </DropdownMenuItem>
                              <Link
                                target="_blank"
                                href={result.linkedin_url}
                                className="absolute top-1/2 -translate-y-1/2 right-0 z-40 text-[12px] hover:underline hover:text-blue-500"
                              >
                                Open LinkedIn
                              </Link>
                            </div>
                          ))}
                          <Button
                            type="button"
                            onClick={useBlank}
                            variant={"secondary"}
                          >
                            {/* <Icons.add /> */}
                            Don&apos;t see it (add without data)
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex-grow flex h-20 flex-col gap-2 items-center justify-center">
                        <span className="text-sm">No results found</span>
                        <Button
                          type="button"
                          onClick={useBlank}
                          variant={"secondary"}
                        >
                          {/* <Icons.add /> */}
                          Add without data
                        </Button>
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}

          {selectedOrganization && (
            <>
              <div className="grid gap-1">
                <label className="font-bold">Name</label>
                <Input
                  placeholder="Company Name"
                  {...register("companyName")}
                />
                {errors.companyName && (
                  <p className="text-red-500 text-sm">
                    {errors.companyName.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1">
                  <label className="font-bold">Website</label>
                  <Input
                    placeholder="Company Website"
                    {...register("website")}
                  />
                  {errors.website && (
                    <p className="text-red-500 text-sm">
                      {errors.website.message}
                    </p>
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
                  <Input
                    placeholder="Company LinkedIn"
                    {...register("linkedIn")}
                  />
                </div>
                <div className="grid gap-1">
                  <label className="font-bold">Source</label>
                  <Controller
                    name="sourceId"
                    control={control}
                    render={({field}) => (
                      <SourceSelector
                        onChange={field.onChange}
                        value={field.value}
                      />
                    )}
                  />
                  {errors.sourceId && (
                    <p className="text-red-500 text-sm">
                      {errors.sourceId.message}
                    </p>
                  )}
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
                <Button
                  type="button"
                  onClick={() => {
                    setSelectedOrganization(undefined);
                    setSearchResults([]);
                    setSearchName("");
                    reset();
                  }}
                  className="mr-auto"
                  variant={"secondary"}
                >
                  Reset
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create
                </Button>
              </DialogFooter>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const SourceSelector = ({
  onChange,
  value,
}: {
  onChange: (val: string) => void; // Change to string ID
  value?: string; // Change to string ID
}) => {
  const [sources, setSources] = useState<SourceType[]>([]);
  const [newSource, setNewSource] = useState("");

  const [newColor, setNewColor] = useState(TagColors[0]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "sources"), (snapshot) => {
      const fetchedSources = snapshot.docs.map((doc) => ({
        label: doc.data().label,
        color: doc.data().color,
        id: doc.id,
      }));
      setSources(fetchedSources);
    });

    return () => unsubscribe();
  }, []);

  const [open, setOpen] = useState(false);

  const addSource = async () => {
    if (!newSource.trim()) return;

    try {
      await addDoc(collection(db, "sources"), {
        label: newSource,
        color: newColor,
      });
      setNewSource("");
      setNewColor(TagColors[0]);
      setOpen(false);
    } catch (error) {
      console.error("Error adding source:", error);
    }
  };

  return (
    <div>
      <Select onValueChange={onChange} value={value}>
        <SelectTrigger>
          <SelectValue placeholder="Select a source" />
        </SelectTrigger>
        <SelectContent>
          {sources.map((source) => (
            <SelectItem key={source.id} value={source.id}>
              <div className="flex gap-1 items-center">
                <div
                  style={{background: source.color}}
                  className="h-2 w-2 rounded-full"
                ></div>
                {source.label}
              </div>
            </SelectItem>
          ))}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" variant="ghost">
                <Icons.add />
                New source
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Source</DialogTitle>
              </DialogHeader>
              <Input
                type="text"
                placeholder="New source name"
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
              />
              <div className="gap-1 grid">
                <h1>Tag color</h1>
                <div className="flex gap-1">
                  {TagColors.map((color) => (
                    <button
                      key={color}
                      style={{background: color}}
                      className={`h-6 w-6 rounded-full border ${
                        newColor === color
                          ? "border-primary"
                          : "border-muted hover:border-primary/50"
                      }`}
                      onClick={() => setNewColor(color)}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={addSource}>Add</Button>
            </DialogContent>
          </Dialog>
        </SelectContent>
      </Select>
    </div>
  );
};

export const Rating = ({
  setValue,
  value,
}: {
  setValue: React.Dispatch<React.SetStateAction<number>>;
  value: number;
}) => {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null); // Hovered score

  const displayValue = hoveredValue !== null ? hoveredValue : value; // Show hovered or actual score

  const onValueChange = (newValue: number) => {
    setValue(newValue); // Update score
  };

  return (
    <div className="flex items-center relative h-8">
      {[...Array(3)].map((_, index) => (
        <button
          key={index}
          onClick={() => onValueChange(index + 1)} // Set score on click
          onMouseEnter={() => setHoveredValue(index + 1)} // Show hovered score
          onMouseLeave={() => setHoveredValue(null)} // Revert to actual score
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

const DummySearch = {
  breadcrumbs: [
    {
      label: "Company Name",
      signal_field_name: "q_organization_name",
      value: "learn.xyz",
      display_name: "learn.xyz",
    },
  ],
  partial_results_only: false,
  has_join: false,
  disable_eu_prospecting: false,
  partial_results_limit: 10000,
  pagination: {
    page: 1,
    per_page: 10,
    total_entries: 3,
    total_pages: 1,
  },
  accounts: [
    {
      id: "67cd5ca62137a70015871dd9",
      name: "Learn.xyz",
      website_url: "http://www.learn.xyz",
      linkedin_url: "http://www.linkedin.com/company/learn-xyz",
      twitter_url: "https://twitter.com/learndotxyz",
      linkedin_uid: "75049353",
      founded_year: 2021,
      logo_url:
        "https://zenprospect-production.s3.amazonaws.com/uploads/pictures/67c61a4144fbf90001a1621f/picture",
      primary_domain: "learn.xyz",
      owned_by_organization_id: null,
      organization_revenue_printed: null,
      organization_revenue: 0,
      organization_raw_address:
        "40 boardman pl, san francisco, california 94103, us",
      organization_city: "San Francisco",
      organization_street_address: "40 Boardman Pl",
      organization_state: "California",
      organization_country: "United States",
      organization_postal_code: "94103-4729",
      suggest_location_enrichment: false,
      raw_address: "40 boardman pl, san francisco, california 94103, us",
      street_address: "40 Boardman Pl",
      city: "San Francisco",
      state: "California",
      country: "United States",
      postal_code: "94103-4729",
      domain: "learn.xyz",
      team_id: "67b938090531e300192f004c",
      organization_id: "61ad0c00392e1a0001efad42",
      account_stage_id: "67b938090531e300192f0057",
      source: "deployment",
      original_source: "deployment",
      creator_id: "67b9380d0531e300192f01f6",
      owner_id: "67b9380d0531e300192f01f6",
      created_at: "2025-03-09T09:17:26.172Z",
      phone_status: "no_status",
      account_playbook_statuses: [],
      existence_level: "full",
      label_ids: [],
      typed_custom_fields: {},
      custom_field_errors: {},
      modality: "account",
      source_display_name: "Requested from Apollo",
      crm_record_url: null,
      contact_emailer_campaign_ids: [],
      contact_campaign_status_tally: {},
      num_contacts: 3,
      last_activity_date: null,
      intent_strength: null,
      show_intent: true,
      intent_signal_account: null,
    },
  ],
  organizations: [
    {
      id: "5f48b21f05caff000162f5bb",
      name: "OMR Silicon Valley Update - by Learn.xyz",
      linkedin_url: "http://www.linkedin.com/company/omr-silicon-valley-update",
      linkedin_uid: "65504404",
      founded_year: 2020,
      logo_url:
        "https://zenprospect-production.s3.amazonaws.com/uploads/pictures/6700ef7055f6a0000198822d/picture",
      owned_by_organization_id: null,
      organization_revenue_printed: null,
      organization_revenue: 0,
      intent_strength: null,
      show_intent: true,
      has_intent_signal_account: false,
      intent_signal_account: null,
    },
    {
      id: "65a1994479b83c059a13bdfc",
      name: "House of AI - by Learn.xyz",
      linkedin_url: "http://www.linkedin.com/company/house-of-ai-by-learn-xyz",
      linkedin_uid: "101107429",
      logo_url:
        "https://zenprospect-production.s3.amazonaws.com/uploads/pictures/674f017c553f1d0001241fbd/picture",
      owned_by_organization_id: null,
      organization_revenue_printed: null,
      organization_revenue: 0,
      intent_strength: null,
      show_intent: true,
      has_intent_signal_account: false,
      intent_signal_account: null,
    },
  ],
  model_ids: [
    "67cd5ca62137a70015871dd9",
    "65a1994479b83c059a13bdfc",
    "5f48b21f05caff000162f5bb",
  ],
  num_fetch_result: null,
  derived_params: null,
};
