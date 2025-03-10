import {AddToList} from "@/app/(tool)/(auth)/lists/buttons/add-to-list";
import {ArrowDown} from "lucide-react";
import {DeleteLead} from "@/app/(tool)/(auth)/lists/buttons/delete-lead";
import {toast} from "sonner";
import {RemoveFromList} from "@/app/(tool)/(auth)/lists/buttons/remove-from-list";
import {ContactDisplay} from "@/app/(tool)/(auth)/lists/lead/contact/contact-display";
import {Tasks} from "@/app/(tool)/(auth)/lists/lead/tasks/tasks";
import {Icons, LinkedInLogo} from "@/components/icons";
import {Button} from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Textarea} from "@/components/ui/textarea";
import {Lead, SourceType} from "@/config/data";
import {db} from "@/config/firebase";
import {formatTimeDifference} from "@/lib/utils";
import {doc, getDoc, Timestamp, updateDoc} from "firebase/firestore";
import {motion} from "framer-motion";
import Link from "next/link";
import {useEffect, useState} from "react";
import {useAutoScroll} from "@/components/hooks/use-auto-scroll";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
export const ExpandedLead = ({
  lead,
  setSelectedLeadId,
}: {
  lead: Lead;
  setSelectedLeadId: React.Dispatch<React.SetStateAction<string | undefined>>;
}) => {
  const getFaviconUrl = (url: string) => {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
  };

  const [notes, setNotes] = useState(lead.notes || "");

  const updateField = async (field: string, value: any) => {
    const leadRef = doc(db, "companies", lead.id);
    await updateDoc(leadRef, {
      [field]: value,
    });
  };

  const updateSource = async (value: string) => {
    await updateDoc(doc(db, `companies/${lead.id}`), {
      sourceId: value,
    });
  };

  const [source, setSource] = useState<SourceType | undefined>();

  useEffect(() => {
    const fetchSource = async () => {
      const docSnap = await getDoc(doc(db, `sources/${lead.sourceId}`));
      if (docSnap.exists()) {
        setSource(docSnap.data() as SourceType);
      }
    };
    if (!source && lead.sourceId) {
      fetchSource();
    }
  }, []);

  const updatedCreatedBy = async (name: string) => {
    await updateDoc(doc(db, `companies/${lead.id}`), {
      createdBy: name,
    });
    setSelectedLeadId(undefined);
  };

  const {
    scrollRef,
    isAtBottom,
    autoScrollEnabled,
    scrollToBottom,
    disableAutoScroll,
  } = useAutoScroll({
    smooth: true,
    // content: children,
  });

  return (
    <>
      <motion.button
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        exit={{opacity: 0}}
        transition={{duration: 0.3}}
        onClick={() => setSelectedLeadId(undefined)}
        className="fixed top-0 left-0 w-screen h-screen bg-black/40  z-30 blurBack2"
      ></motion.button>
      <motion.div
        initial={{translateX: "100%"}}
        animate={{translateX: 0}}
        exit={{translateX: "100%"}}
        transition={{duration: 0.3}}
        className=" fixed h-screen    border rounded-md  z-40 w-[80vw] max-w-[600px] right-2 top-2  sp-2 flex flex-col  bg-background"
      >
        <div className="flex flex-col items-start max-h-[175px] h-fit p-4 overflow-hidden  rounded-md   px-4 gap-2 w-full ">
          <div className="flex gap-2 items-center">
            <img
              src={getFaviconUrl(lead.website)}
              className="h-8 w-8 rounded-full border bg-white"
            />

            <div className="flex gap-2 items-center">
              <h1 className="font-bold flex gap-1 items-center text-2xl  text-primary">
                {lead.name}
              </h1>
              -
              <Link
                href={new URL(lead.website).origin}
                target="_blank"
                className=" rounded-[4px] hover:opacity-80 h-fit"
              >
                <Icons.link className="h-6 w-6" />
              </Link>
              {lead.linkedIn && (
                <Link
                  href={lead.linkedIn}
                  target="_blank"
                  className=" rounded-[4px] hover:opacity-80 h-fit"
                >
                  <LinkedInLogo className="h-6 w-6" />
                </Link>
              )}
            </div>
          </div>
          <p className="max-w-[500px]  text-primary  text-left">{lead.id}</p>
          <p className="max-w-[500px]  text-primary  text-left">
            {lead.description}
          </p>
          <div className="flex  gap-2 ">
            <div className="flex gap-1 items-center justify-center border text-[12px] border-primary  px-2 py-1 rounded-md">
              <Icons.clock className="h-4 w-4" />
              Added {formatTimeDifference(lead.createdAt as Timestamp)}
            </div>
            {source ? (
              <div
                style={{
                  color: source.color,

                  borderColor: source.color,
                }}
                className="flex items-center border gap-1 text-[12px] rounded-[8px] px-2 w-fit  pointer-events-none relative "
              >
                {source.label}
              </div>
            ) : (
              <p className="relative">no source provided</p>
            )}
            {/* <SourceSelector onChange={updateSource}></SourceSelector> */}
          </div>
          <div className="flex gap-2 absolute items-center top-4 right-4">
            {!lead.organization_id && <AddOrganization lead={lead} />}
            <CompanyOptions lead={lead}></CompanyOptions>
          </div>
        </div>

        <Tabs
          defaultValue="flow"
          className="w-full overflow-hiddens max-h-[calc(100vh-191px)]  mt-4 pb-4 "
        >
          <TabsList className="grid grid-cols-3 w-[98%] mx-auto bg-muted-foreground/20 border  ">
            <TabsTrigger value="flow">Tasks</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          <TabsContent
            ref={scrollRef}
            value="flow"
            className={`overflow-scroll max-h-[calc(100vh-200px)]  pb-16 relative  bg-background rounded-md `}
          >
            <Tasks lead={lead} />
          </TabsContent>
          <TabsContent value="contacts">
            <ContactDisplay lead={lead} />
          </TabsContent>
          <TabsContent value="notes">
            <div className="flex flex-col   px-2">
              <Textarea
                value={notes}
                onChange={(e) => {
                  updateField("notes", e.target.value);
                  setNotes(e.target.value);
                }}
                placeholder="notes for lead"
              ></Textarea>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </>
  );
};

const AddOrganization = ({lead}: {lead: Lead}) => {
  const [searchResults, setSearchResults] = useState<any[]>();
  const [searchName, setSearchName] = useState(lead.name);

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const searchForCompany = async () => {
    try {
      setSearchLoading(true);
      setSearchError(null);

      const url = `/api/search-organization`;
      const options = {
        method: "POST",
        body: JSON.stringify({organizationName: searchName}),
      };

      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      setSearchResults([
        ...(data.accounts || []),
        ...(data.organizations || []),
      ]);
    } catch (error) {
      console.error("Search error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to search organization";
      setSearchError(errorMessage);
      setSearchResults([]);
      toast.error(errorMessage);
    } finally {
      setSearchLoading(false);
    }
  };

  const selectOrganization = async (organization: any) => {
    await updateDoc(doc(db, `companies/${lead.id}`), {
      organization_id: organization.id,
    });
    setSearchResults([]);
    setSearchName("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={"outline"} size={"sm"}>
          <Icons.add className="h-4 w-4 " />
          Add Organization
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Search for an organization</DialogTitle>
          <DialogDescription>
            Search for an organization to add to this company.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
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
          {searchName && (!searchResults || searchResults.length <= 0) && (
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
        </div>
        <div className="flex flex-col gap-2 max-h-[400px] overflow-scroll">
          {searchResults && searchResults.length > 0 ? (
            <div className="flex flex-col gap-2">
              {searchResults.map((result) => (
                <div key={result.id} className="relative">
                  <button
                    onClick={() => {
                      selectOrganization(result);
                    }}
                    key={result.id}
                    className="flex gap-2 items-center hover:bg-muted-foreground/20 p-2 rounded-md w-full relative z-20 "
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
                    href={result.linkedin_url}
                    className="absolute top-1/2 -translate-y-1/2 right-0 z-40 text-[12px] hover:underline hover:text-blue-500"
                  >
                    Open LinkedIn
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <>
              {searchResults && searchResults.length === 0 && (
                <div className="flex flex-col gap-2">
                  <p>No results found</p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const CompanyOptions = ({lead}: {lead: Lead}) => {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      {/* <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}> */}
      <DropdownMenuTrigger asChild>
        <Button variant={"outline"} size="sm" className="">
          <Icons.ellipsis className="" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" className="border-border  ">
        <DropdownMenuItem
          // onSelect={() => setOpenMenu(true)}
          className=" gap-2 cursor-pointer focus:bg-primary/20"
          asChild
        >
          <AddToList companies={[lead]} onSuccess={() => setOpen(false)}>
            <button className="cursor-pointer relative flex select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0">
              <Icons.add className="h-4 w-4 " />
              Add to a List
            </button>
          </AddToList>
        </DropdownMenuItem>
        <DropdownMenuItem
          asChild
          // onSelect={() => setShowDeleteDialog(true)}
        >
          <DeleteLead leadId={lead.id} onSuccess={() => setOpen(false)}>
            <button className="w-full text-destructive cursor-pointer hover:bg-destructive/20 focus:text-destructive relative flex select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors  data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0">
              <Icons.trash className="h-4 w-4 " />
              Delete
            </button>
          </DeleteLead>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
