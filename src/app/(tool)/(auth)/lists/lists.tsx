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
import {ListPlus} from "lucide-react";
import {
  addDoc,
  collection,
  doc,
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
                  <AddToList companies={groupSelectedLeads}>
                    <Button variant={"outline"}>
                      <ListPlus className=" h-4 w-4" />
                      Add to list
                    </Button>
                  </AddToList>
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

          <div className="w-full border-y relative bg-muted/30 h-10  grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_36px] px-4 py-2 pl-[40px] font-bold ">
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
  name: z.string().min(1, "Company name is required"),
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
    formState: {errors},
  } = useForm<ContactFormValue>({
    resolver: zodResolver(ContactFormSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
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
      ...data,
      createdBy: currentUser?.firstName,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    await setDoc(doc(db, `companies/${id}`), leadData);

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
              onClick={() => reset()}
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
