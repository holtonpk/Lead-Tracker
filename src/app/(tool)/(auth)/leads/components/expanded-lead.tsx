import {ContactDisplay} from "@/app/(tool)/(auth)/leads/components/lead/contact/contact-display";
import {Tasks} from "@/app/(tool)/(auth)/leads/components/lead/tasks/tasks";
import {Icons, LinkedInLogo} from "@/components/icons";
import {Button} from "@/components/ui/button";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Textarea} from "@/components/ui/textarea";
import {Lead} from "@/config/data";
import {db} from "@/config/firebase";
import {doc, updateDoc} from "firebase/firestore";
import {motion} from "framer-motion";
import Link from "next/link";
import {useState} from "react";

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
        className=" fixed h-screen    border rounded-md  z-40 w-[80vw] max-w-[600px] right-0 top-0   flex flex-col  bg-muted"
      >
        <div className="flex flex-col items-center h-[175px] overflow-hidden   bg-background p-2 px-4 gap-2 w-full ">
          <img
            src={getFaviconUrl(lead.website)}
            className="h-10 w-10 rounded-full border bg-white"
          />

          <h1 className="font-bold flex gap-1 items-center text-2xl  text-primary">
            {lead.name}
          </h1>

          <p className="max-w-[500px]  text-primary  text-center">
            {lead.description}
          </p>
          <div className="flex flex-col gap-2 absolute top-4 left-4">
            <div className="flex gap-2 items-center justify-center  text-blue-500 bg-blue-500/10  px-2 py-1 rounded-md">
              Added 2 days ago
            </div>
            <div className="flex gap-2 items-center justify-center  text-purple-500 bg-purple-500/10  px-2 py-1 rounded-md">
              {lead.source}
            </div>
          </div>
          <div className="flex gap-2 absolute items-center top-4 right-4">
            <Link
              href={lead.website}
              target="_blank"
              className="border rounded-[4px] hover:opacity-80 h-fit"
            >
              <Icons.link className="h-6 w-6" />
            </Link>
            {lead.linkedIn && (
              <Link
                href={lead.linkedIn}
                target="_blank"
                className="border rounded-[4px] hover:opacity-80 h-fit"
              >
                <LinkedInLogo className="h-6 w-6" />
              </Link>
            )}
            <Button variant={"outline"} size="sm" className="">
              <Icons.ellipsis className="" />
            </Button>
          </div>
        </div>

        <Tabs
          defaultValue="flow"
          className="w-full px-3 overflow-hidden max-h-[calc(100vh-175px)] "
        >
          <TabsList className="grid grid-cols-3 w-full bg-muted-foreground/20">
            <TabsTrigger value="flow">Flow</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          <TabsContent
            value="flow"
            className="overflow-scroll max-h-[calc(100vh-230px)] relative "
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
