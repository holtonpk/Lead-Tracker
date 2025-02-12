import {AddToList} from "@/app/(tool)/(auth)/lists/buttons/add-to-list";
import {DeleteLead} from "@/app/(tool)/(auth)/lists/buttons/delete-lead";
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

  return (
    <>
      <motion.button
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        exit={{opacity: 0}}
        transition={{duration: 0.3}}
        onClick={() => setSelectedLeadId(undefined)}
        className="fixed top-0 left-0 w-screen h-screen bg-black/60 z-30"
      ></motion.button>
      <motion.div
        initial={{translateX: "100%"}}
        animate={{translateX: 0}}
        exit={{translateX: "100%"}}
        transition={{duration: 0.3}}
        className=" fixed h-screen    border rounded-md  z-40 w-[80vw] max-w-[600px] right-0 top-0  p-2 flex flex-col  bg-muted"
      >
        <div className="flex flex-col items-start max-h-[175px] h-fit border overflow-hidden shadow-sm rounded-md  bg-background p-2 px-4 gap-2 w-full ">
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
                href={lead.website}
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
            <CompanyOptions lead={lead}></CompanyOptions>
          </div>
        </div>

        <Tabs
          defaultValue="flow"
          className="w-full overflow-hidden max-h-[calc(100vh-191px)]  mt-4 pb-4 "
        >
          <TabsList className="grid grid-cols-3 w-full bg-muted-foreground/20 border">
            <TabsTrigger value="flow">Flow</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          <TabsContent
            value="flow"
            className="overflow-scroll max-h-[calc(100vh-230px)] relative shadow-lg bg-background rounded-md border"
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
