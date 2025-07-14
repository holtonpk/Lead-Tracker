"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {Icons, LinkedInLogo} from "@/components/icons";
import {Button} from "@/components/ui/button";
import {toast} from "sonner";
import {useToast} from "@/hooks/use-toast";
import {ApolloLink} from "./apollo-link";
import {ShimmerButton} from "@/components/ui/shimmer-button";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";

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
  Lead,
  SourceType,
  List as ListType,
  TagColors,
  People,
  RolesData,
  ContactPoint,
  Contact,
  ContactTypeData,
} from "@/config/data";
import {db} from "@/config/firebase";

import Link from "next/link";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  deleteField,
} from "firebase/firestore";
import {useEffect, useState} from "react";
import {LeadData} from "./page";

export const AddGoodLead = ({
  companyInfo,
  apolloData,
  selectedLead,
}: {
  companyInfo: {
    name: string;
    website_url: string;
  };
  apolloData: any | undefined;
  selectedLead: LeadData;
}) => {
  const addApolloData = async (data: any) => {
    // add the apollo data to the lead
    await updateDoc(doc(db, `crunchbase-data/${companyInfo.name}`), {
      apolloData: data,
    });
  };

  return (
    <div>
      {apolloData ? (
        <AddContacts
          setSelectedOrganization={selectedLead.apolloData}
          companyInfo={companyInfo}
          selectedOrganization={selectedLead.apolloData}
          selectedLead={selectedLead}
        />
      ) : (
        <ApolloLink onLink={addApolloData} companyInfo={companyInfo} />
      )}
    </div>
  );
};

const AddContacts = ({
  setSelectedOrganization,
  companyInfo,
  selectedOrganization,
  selectedLead,
}: {
  setSelectedOrganization: (organization: any) => void;
  selectedOrganization: any;
  companyInfo: {
    name: string;
    website_url: string;
  };
  selectedLead: LeadData;
}) => {
  const updateContacts = async (person: People) => {
    // this should add of the person is not already in contacts and remove if they are

    const isAlreadyInContacts = selectedLead.contacts?.some(
      (contact) => contact.id === person.id
    );

    if (isAlreadyInContacts) {
      const updatedContacts = selectedLead.contacts?.filter(
        (contact) => contact.id !== person.id
      );
      await updateDoc(doc(db, `crunchbase-data/${companyInfo.name}`), {
        contacts: updatedContacts,
      });
    } else {
      // Convert person to Contact data type
      const newContact: Contact = {
        id: person.id,
        name: person.name,
        role: person.title,
        photo_url: person.photo_url,
        contactPoints: [
          ...(person.linkedin_url
            ? [
                {
                  type: "linkedIn" as const,
                  value: person.linkedin_url,
                  id: Math.random().toString(),
                },
              ]
            : []),
          ...(person.email && person.email_status === "verified"
            ? [
                {
                  type: "email" as const,
                  value: person.email,
                  id: Math.random().toString(),
                },
              ]
            : []),
        ].filter(Boolean),
      };

      const updatedContacts = [...(selectedLead.contacts || []), newContact];
      await updateDoc(doc(db, `crunchbase-data/${companyInfo.name}`), {
        contacts: updatedContacts,
      });
      addToGoodContacts(updatedContacts);
    }

    // await updateDoc(doc(db, `companies/${lead.id}`), {
    //   contacts: updatedContacts,
    // });
  };

  const addToGoodContacts = async (contacts: Contact[]) => {
    // add the contacts to the lead
    await updateDoc(doc(db, `crunchbase-data/${companyInfo.name}`), {
      contacts: arrayUnion(...contacts),
    });
  };

  const removeSelectedOrganization = async () => {
    // delete the apollo data field
    await updateDoc(doc(db, `crunchbase-data/${companyInfo.name}`), {
      apolloData: deleteField(),
    });
  };

  // this will be true if selectedLead.goodContacts is the same as contacts

  return (
    <div className="flex flex-col gap-2">
      {selectedOrganization && (
        <div className=" flex flex-col gap-2  max-h-[400px] overflow-scroll">
          <div className="p-2 bg-muted flex items-center">
            <Button
              size={"icon"}
              variant={"ghost"}
              onClick={removeSelectedOrganization}
            >
              <Icons.close />
            </Button>
            <div className="flex gap-2 items-center">
              <div className="h-8 w-8 rounded-full relative overflow-hidden">
                <img
                  src={selectedOrganization.logo_url}
                  alt={selectedOrganization.name}
                  className="object-cover"
                />
              </div>
              <h1>{selectedOrganization.name}</h1>
            </div>
          </div>
          {selectedLead.people ? (
            <div className="flex flex-col divide-y  overflow-y-auto border rounded-md">
              {selectedLead.people?.map((person, i) => (
                <PersonRow
                  person={person}
                  key={i}
                  lead={selectedOrganization}
                  contacts={selectedLead.contacts || []}
                  addToContacts={updateContacts}
                />
              ))}
            </div>
          ) : (
            <div className="w-fit mx-auto flex-col flex items-center  border rounded-md py-12  bg-muted/50 px-10 gap-2">
              <h1 className="text-2xl ">No Contacts</h1>
              <p className="text-muted-foreground max-w-sm text-center">
                Add a contact manually or scrape contacts. Scraping will charge
                credits.
              </p>
              <div className="grid grid-cols-2 gap-2 items-center">
                <NewContactButton leadId={selectedOrganization.id}>
                  <Button variant={"outline"}>
                    <Icons.add />
                    Add manually
                  </Button>
                </NewContactButton>
                <ScrapeContacts
                  leadId={selectedOrganization.id}
                  leadUrl={selectedOrganization.website_url}
                  lead={selectedOrganization}
                  selectedLead={selectedLead}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const ScrapeContacts = ({
  leadId,
  leadUrl,
  lead,
  selectedLead,
}: {
  leadId: string;
  leadUrl: string;
  lead: Lead;
  selectedLead: LeadData;
}) => {
  const [loading, setLoading] = useState(false);
  const [contactData, setContactData] = useState<any>();

  //   Do not include www., the @ symbol, or similar.
  const cleanedUrl = leadUrl
    .replace("www.", "")
    .replace("@", "")
    .replace("https://", "")
    .replace("http://", "");

  const scrapeContacts = async () => {
    setLoading(true);
    try {
      const queryString = lead?.organization_id
        ? `organization_ids[]=${lead.organization_id}`
        : `q_organization_domains_list[]=${cleanedUrl}`;

      const url = `/api/search-people`;
      const options = {
        method: "POST",
        body: JSON.stringify({queryString}),
      };
      const response = await fetch(url, options);
      const data = await response.json();
      if (data.error) {
        toast.error("Error scraping contacts", {
          description: `Error: ${data.error}`,
        });
        setLoading(false);
        return;
      }
      console.log("data", data);
      console.log("contacts", data.people);
      if (data.people.length > 0) {
        addContactsToLead([...data.people, ...(data.contacts || [])]);
      } else {
        toast.error("No contacts found", {
          description: `No contacts found for ${cleanedUrl}`,
        });
      }

      setLoading(false);
    } catch (error) {
      console.log("error", error);
      console.error(error);
      toast.error("Error scraping contacts", {
        description: `Error: ${error}`,
      });
      setLoading(false);
    }
  };

  const addContactsToLead = async (people: People[]) => {
    await updateDoc(doc(db, `crunchbase-data/${selectedLead.name}`), {
      people: arrayUnion(...people),
    });

    console.log("contacts", people);
  };

  return (
    <ShimmerButton
      onClick={scrapeContacts}
      //   onClick={() => addContactsToLead(peopleData)}
      disabled={loading}
    >
      {loading ? (
        <Icons.loader className="w-4 h-4 animate-spin" />
      ) : (
        "Find People"
      )}
    </ShimmerButton>
  );
};
export const NewContactButton = ({
  leadId,
  children,
  onSuccess,
}: {
  leadId: string;
  children: React.ReactNode;
  onSuccess?: any;
}) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {toast} = useToast();

  const saveContact = async () => {
    if (!leadId || !name || !role || contactPoints.length === 0) {
      toast({
        title: "A is empty",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Batch the Firestore operations
      const docRef = doc(db, "companies-fixed", leadId);

      // Use arrayUnion instead of fetching + updating
      await updateDoc(docRef, {
        updatedAt: serverTimestamp(),
        contacts: arrayUnion({
          id: crypto.randomUUID(), // Add unique ID for future updates/deletions
          name,
          role,
          contactPoints: contactPoints.filter(
            (point) => point.value && point.type && point.id
          ), // Only save valid contact points
        } as Contact),
      });

      toast({
        title: "Success",
        description: "Contact saved successfully",
      });

      // Reset form
      setName("");
      setRole("");
      setContactPoints([
        {value: "", type: "", id: Math.random().toLocaleString()},
      ]);
      setOpen(false);
    } catch (error) {
      console.error("Error saving contact:", error);
      toast({
        title: "Error",
        description: "Failed to save contact. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [name, setName] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [contactPoints, setContactPoints] = useState<ContactPoint[]>([
    {
      value: "",
      type: "",
      id: Math.random().toLocaleString(),
    },
  ]);

  const updateContactPoint = (
    index: number,
    updatedPoint: Partial<ContactPoint>
  ) => {
    setContactPoints((prev) =>
      prev.map((point, i) =>
        i === index ? {...point, ...updatedPoint} : point
      )
    );
  };

  const deleteContactRow = (index: number) => {
    setContactPoints((prev) => prev.filter((_, i) => i !== index));
  };

  const addContactPoint = () => {
    setContactPoints([
      ...contactPoints,
      {
        value: "",
        type: "",
        id: Math.random().toLocaleString(),
      },
    ]);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New contact</DialogTitle>
          <DialogDescription>
            Add or edit contact for this lead
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <h1 className="font-bold">Contact Name</h1>
            <Input
              placeholder="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-1">
          <h1 className="font-bold">Role</h1>
          <Select onValueChange={setRole} value={role}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select their role" />
            </SelectTrigger>
            <SelectContent>
              {RolesData.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1">
          <h1 className="font-bold">Contact Points</h1>
          <div className="gap-2 flex flex-col border p-2 rounded-md">
            {contactPoints.map((point, i) => (
              <ContactPointRow
                key={i} // Changed from Math.random() to index for stable keys
                index={i}
                point={point}
                updateContactPoint={updateContactPoint}
                deleteContactRow={deleteContactRow}
              />
            ))}

            <Button
              onClick={addContactPoint}
              variant="secondary"
              className="col-span-2"
            >
              <Icons.add className="" />
              add another contact point
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={saveContact}>
            {isLoading && <Icons.spinner className="h-4 w-4 animate-spin" />}
            Create contact
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const PersonRow = ({
  person,
  lead,
  addToContacts,
  contacts,
}: {
  person: People;
  lead: Lead;
  addToContacts: (person: People) => void;
  contacts: Contact[];
}) => {
  const isAlreadyInContacts = contacts?.some(
    (contact) => contact.id === person.id
  );

  return (
    <div className="flex items-center p-2 ">
      <Link
        href={person.linkedin_url}
        target="_blank"
        className=" hover:underline  flex items-center gap-2"
      >
        <Avatar className="size-6">
          <AvatarImage src={person.photo_url} />
          <AvatarFallback>
            {person.name
              .split(" ")
              .map((name) => name[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <div className="flex gap-1 items-center">
            <h1 className="font-bold">{person.name}</h1>
            {person.linkedin_url && <LinkedInLogo className="w-4 h-4" />}
            {person.email_status === "verified" && person.email && (
              <Icons.mail className="w-4 h-4" />
            )}
          </div>
          <h1 className="text-sm text-muted-foreground">{person.title}</h1>
        </div>
      </Link>

      <div className="flex gap-1 ml-auto items-center">
        {!isAlreadyInContacts ? (
          <Button
            onClick={() => addToContacts(person)}
            variant={"outline"}
            size={"sm"}
          >
            <Icons.add />
            add
          </Button>
        ) : (
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-1 rounded-md">
              <Icons.check className="size-4" />
              added
            </div>
            <Button
              onClick={() => addToContacts(person)}
              variant={"ghost"}
              size={"icon"}
            >
              <Icons.close />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const ContactPointRow = ({
  index,
  point,
  updateContactPoint,
  deleteContactRow,
}: {
  index: number;
  point: ContactPoint;
  updateContactPoint: (
    index: number,
    updatedPoint: Partial<ContactPoint>
  ) => void;
  deleteContactRow: (index: number) => void;
}) => {
  const valuePlaceHolder =
    point.type == "email"
      ? "example@email.com"
      : point.type == "phone"
      ? "ex. (123) 456-7890"
      : point.type == "linkedIn"
      ? "LinkedIn profile url"
      : point.type == "instagram"
      ? "Instagram profile url"
      : point.type == "x"
      ? "X profile url"
      : point.type == "url"
      ? "url"
      : "enter value";

  return (
    <div className="flex gap-1 items-center relative rounded-md">
      <div className="grid grid-cols-2 w-full">
        <Select
          value={point.type}
          onValueChange={(newType) =>
            updateContactPoint(index, {type: newType})
          }
        >
          <SelectTrigger className="w-full rounded-r-none border-r-0 focus:ring-0">
            <SelectValue placeholder="Contact Type" />
          </SelectTrigger>
          <SelectContent>
            {ContactTypeData.map((type) => {
              const Icon = type.icon;
              return (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex gap-1 items-center">
                    <Icon className="h-4 w-4" />
                    {type.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Input
          className="bg-muted-foreground/20 rounded-l-none focus-visible:ring-0"
          placeholder={valuePlaceHolder}
          value={point.value}
          onChange={(e) => updateContactPoint(index, {value: e.target.value})}
        />
      </div>
      <Button
        onClick={() => deleteContactRow(index)}
        variant="ghost"
        size="sm"
        className="p-1 h-fit"
      >
        <Icons.close />
      </Button>
    </div>
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

const DummyData = {
  breadcrumbs: [
    {
      label: "Company Name",
      signal_field_name: "q_organization_name",
      value: "(Re)vive",
      display_name: "(Re)vive",
    },
  ],
  partial_results_only: false,
  has_join: false,
  disable_eu_prospecting: false,
  partial_results_limit: 10000,
  pagination: {page: 1, per_page: 10, total_entries: 1854, total_pages: 186},
  accounts: [],
  organizations: [
    {
      id: "5d3673a9f651251f08a211b8",
      name: "Revive",
      website_url: "http://www.revivemedia.us",
      blog_url: null,
      angellist_url: null,
      linkedin_url: "http://www.linkedin.com/company/revive-media",
      twitter_url: null,
      facebook_url: null,
      primary_phone: {},
      languages: [],
      alexa_ranking: null,
      phone: null,
      linkedin_uid: "19093728",
      founded_year: 2019,
      publicly_traded_symbol: null,
      publicly_traded_exchange: null,
      logo_url:
        "https://zenprospect-production.s3.amazonaws.com/uploads/pictures/685e49b71c5e6800016580e2/picture",
      crunchbase_url: null,
      primary_domain: "revivemedia.us",
      owned_by_organization_id: null,
      organization_revenue_printed: null,
      organization_revenue: 0,
      intent_strength: null,
      show_intent: true,
      has_intent_signal_account: false,
      intent_signal_account: null,
      organization_headcount_six_month_growth: 0.08928571428571429,
      organization_headcount_twelve_month_growth: 0.2978723404255319,
      organization_headcount_twenty_four_month_growth: 0.4186046511627907,
    },
    {
      id: "64132f0a83a2a400d80dd80e",
      name: "REVIVE SOFTWARE SYSTEMS INC",
      website_url: "http://www.reviveinc.us",
      blog_url: null,
      angellist_url: null,
      linkedin_url: "http://www.linkedin.com/company/revive-software-systems",
      twitter_url: null,
      facebook_url: null,
      primary_phone: {
        number: "+1 945-244-8354",
        source: "Owler",
        sanitized_number: "+19452448354",
      },
      languages: [],
      alexa_ranking: null,
      phone: "+1 945-244-8354",
      linkedin_uid: "90519773",
      founded_year: null,
      publicly_traded_symbol: null,
      publicly_traded_exchange: null,
      logo_url:
        "https://zenprospect-production.s3.amazonaws.com/uploads/pictures/6850463afdfdab00018e719b/picture",
      crunchbase_url: null,
      primary_domain: "reviveinc.us",
      sanitized_phone: "+19452448354",
      owned_by_organization_id: null,
      organization_revenue_printed: null,
      organization_revenue: 0,
      intent_strength: null,
      show_intent: true,
      has_intent_signal_account: false,
      intent_signal_account: null,
      organization_headcount_six_month_growth: 0.4,
      organization_headcount_twelve_month_growth: 0.75,
      organization_headcount_twenty_four_month_growth: 1.8,
    },
    {
      id: "64e46f709a598e00d634999c",
      name: "Revive Renovation",
      website_url: "http://www.reviverenovation.ae",
      blog_url: null,
      angellist_url: null,
      linkedin_url: "http://www.linkedin.com/company/revive-renovation",
      twitter_url: null,
      facebook_url: "https://www.facebook.com/profile.php",
      primary_phone: {
        number: "+971 50 917 3848",
        source: "Scraped",
        sanitized_number: "+971509173848",
      },
      languages: [],
      alexa_ranking: null,
      phone: "+971 50 917 3848",
      linkedin_uid: "99867136",
      founded_year: null,
      publicly_traded_symbol: null,
      publicly_traded_exchange: null,
      logo_url:
        "https://zenprospect-production.s3.amazonaws.com/uploads/pictures/684d52ce03029000016f038c/picture",
      crunchbase_url: null,
      primary_domain: "reviverenovation.ae",
      sanitized_phone: "+971509173848",
      owned_by_organization_id: null,
      organization_revenue_printed: null,
      organization_revenue: 0,
      intent_strength: null,
      show_intent: true,
      has_intent_signal_account: false,
      intent_signal_account: null,
      organization_headcount_six_month_growth: 0,
      organization_headcount_twelve_month_growth: 0,
      organization_headcount_twenty_four_month_growth: null,
    },
    {
      id: "57c508dca6da986a3f7657bc",
      name: "ReviveMed",
      website_url: "http://www.revivemed.io",
      blog_url: null,
      angellist_url: "http://angel.co/revivemed",
      linkedin_url: "http://www.linkedin.com/company/revivemed-inc-",
      twitter_url: "https://twitter.com/revive_med",
      facebook_url: "https://facebook.com/revivemedtechnologies",
      primary_phone: {
        number: "+1 617-955-6425",
        source: "Account",
        sanitized_number: "+16179556425",
      },
      languages: ["English"],
      alexa_ranking: null,
      phone: "+1 617-955-6425",
      linkedin_uid: "10839466",
      founded_year: 2018,
      publicly_traded_symbol: null,
      publicly_traded_exchange: null,
      logo_url:
        "https://zenprospect-production.s3.amazonaws.com/uploads/pictures/684aee6f21f9b50001b49a9d/picture",
      crunchbase_url: null,
      primary_domain: "revivemed.io",
      sanitized_phone: "+16179556425",
      owned_by_organization_id: null,
      organization_revenue_printed: null,
      organization_revenue: 0,
      intent_strength: null,
      show_intent: true,
      has_intent_signal_account: false,
      intent_signal_account: null,
      organization_headcount_six_month_growth: 0,
      organization_headcount_twelve_month_growth: -0.1111111111111111,
      organization_headcount_twenty_four_month_growth: 0,
    },
    {
      id: "5b83f04af874f7595a22f95c",
      name: "Revive | B-Corp Certified",
      website_url: "http://www.byrevive.com",
      blog_url: null,
      angellist_url: "http://angel.co/hemster",
      linkedin_url: "http://www.linkedin.com/company/byrevive",
      twitter_url: null,
      facebook_url: null,
      primary_phone: {
        number: "+1 949-351-8301",
        source: "Account",
        sanitized_number: "+19493518301",
      },
      languages: [],
      alexa_ranking: null,
      phone: "+1 949-351-8301",
      linkedin_uid: "18503194",
      founded_year: 2022,
      publicly_traded_symbol: null,
      publicly_traded_exchange: null,
      logo_url:
        "https://zenprospect-production.s3.amazonaws.com/uploads/pictures/685ec53856e8470001496004/picture",
      crunchbase_url: null,
      primary_domain: "byrevive.com",
      sanitized_phone: "+19493518301",
      owned_by_organization_id: null,
      organization_revenue_printed: null,
      organization_revenue: 0,
      intent_strength: null,
      show_intent: true,
      has_intent_signal_account: false,
      intent_signal_account: null,
      organization_headcount_six_month_growth: 0.25,
      organization_headcount_twelve_month_growth: 0.1904761904761905,
      organization_headcount_twenty_four_month_growth: 0.08695652173913043,
    },
    {
      id: "6049f0cd95a7350001c944a0",
      name: "Re-vive",
      website_url: "http://www.re-vive.com",
      blog_url: null,
      angellist_url: null,
      linkedin_url: "http://www.linkedin.com/company/revivetoday",
      twitter_url: null,
      facebook_url: "https://facebook.com/aBIaInc",
      primary_phone: {
        number: "+1 972-370-3222",
        source: "Owler",
        sanitized_number: "+19723703222",
      },
      languages: ["English"],
      alexa_ranking: null,
      phone: "+1 972-370-3222",
      linkedin_uid: "40696645",
      founded_year: null,
      publicly_traded_symbol: null,
      publicly_traded_exchange: null,
      logo_url:
        "https://zenprospect-production.s3.amazonaws.com/uploads/pictures/685118b1e495150001e0ef5d/picture",
      crunchbase_url: null,
      primary_domain: "re-vive.com",
      sanitized_phone: "+19723703222",
      owned_by_organization_id: null,
      organization_revenue_printed: "19.3M",
      organization_revenue: 19296000,
      intent_strength: null,
      show_intent: true,
      has_intent_signal_account: false,
      intent_signal_account: null,
      organization_headcount_six_month_growth: 0.08,
      organization_headcount_twelve_month_growth: 0.1739130434782609,
      organization_headcount_twenty_four_month_growth: 0.35,
    },
    {
      id: "54a13b7b69702dac846a8201",
      name: "Revive",
      website_url: "http://www.revive.be",
      blog_url: null,
      angellist_url: null,
      linkedin_url: "http://www.linkedin.com/company/re-vive",
      twitter_url: "https://twitter.com/ReviveNV",
      facebook_url: "https://www.facebook.com/ReviveNV",
      primary_phone: {},
      languages: [],
      alexa_ranking: null,
      phone: null,
      linkedin_uid: "2580789",
      founded_year: 2009,
      publicly_traded_symbol: null,
      publicly_traded_exchange: null,
      logo_url:
        "https://zenprospect-production.s3.amazonaws.com/uploads/pictures/685ab6b72d0c3300015c814d/picture",
      crunchbase_url: null,
      primary_domain: "revive.be",
      owned_by_organization_id: null,
      organization_revenue_printed: null,
      organization_revenue: 0,
      intent_strength: null,
      show_intent: true,
      has_intent_signal_account: false,
      intent_signal_account: null,
      organization_headcount_six_month_growth: 0.02040816326530612,
      organization_headcount_twelve_month_growth: 0.1111111111111111,
      organization_headcount_twenty_four_month_growth: 0,
    },
    {
      id: "5d341ddaa3ae6184ddf15e8c",
      name: "Revive Superfoods",
      website_url: "http://www.revivesuperfoods.com",
      blog_url: null,
      angellist_url: null,
      linkedin_url: "http://www.linkedin.com/company/reviveorganics",
      twitter_url: "https://twitter.com/revivesuperfood",
      facebook_url: "https://www.facebook.com/revivesuperfoods/",
      primary_phone: {
        number: "+1 833-987-7611",
        source: "Scraped",
        sanitized_number: "+18339877611",
      },
      languages: [],
      alexa_ranking: 645161,
      phone: "+1 833-987-7611",
      linkedin_uid: "33282522",
      founded_year: 2018,
      publicly_traded_symbol: null,
      publicly_traded_exchange: null,
      logo_url:
        "https://zenprospect-production.s3.amazonaws.com/uploads/pictures/685e33a19912040001e5d1d1/picture",
      crunchbase_url: null,
      primary_domain: "revivesuperfoods.com",
      sanitized_phone: "+18339877611",
      owned_by_organization_id: null,
      organization_revenue_printed: null,
      organization_revenue: 0,
      intent_strength: null,
      show_intent: true,
      has_intent_signal_account: false,
      intent_signal_account: null,
      organization_headcount_six_month_growth: 0.08,
      organization_headcount_twelve_month_growth: -0.03571428571428571,
      organization_headcount_twenty_four_month_growth: -0.2058823529411765,
    },
    {
      id: "5da125bcb98bf70001e65cb7",
      name: "RE-VIVE",
      website_url: "http://www.revivespaces.co.uk",
      blog_url: null,
      angellist_url: null,
      linkedin_url: "http://www.linkedin.com/company/revivespaces",
      twitter_url: null,
      facebook_url: "https://www.facebook.com/ReViveAgency/",
      primary_phone: {
        number: "+44 7875 757444",
        source: "Scraped",
        sanitized_number: "+447875757444",
      },
      languages: [],
      alexa_ranking: null,
      phone: "+44 7875 757444",
      linkedin_uid: "19127467",
      founded_year: 2014,
      publicly_traded_symbol: null,
      publicly_traded_exchange: null,
      logo_url:
        "https://zenprospect-production.s3.amazonaws.com/uploads/pictures/6714233fb928a80001d52f1c/picture",
      crunchbase_url: null,
      primary_domain: "revivespaces.co.uk",
      sanitized_phone: "+447875757444",
      owned_by_organization_id: null,
      organization_revenue_printed: null,
      organization_revenue: 0,
      intent_strength: null,
      show_intent: true,
      has_intent_signal_account: false,
      intent_signal_account: null,
      organization_headcount_six_month_growth: null,
      organization_headcount_twelve_month_growth: null,
      organization_headcount_twenty_four_month_growth: null,
    },
    {
      id: "5fcaa67cdc8f7f00011b93ee",
      name: "Revive",
      website_url: "http://www.revive.health",
      blog_url: null,
      angellist_url: null,
      linkedin_url: "http://www.linkedin.com/company/revive-healthcare",
      twitter_url: "https://twitter.com/ReviveHealth_",
      facebook_url: "https://facebook.com/revivehealth2023/",
      primary_phone: {
        number: "+1 888-220-6650",
        source: "Owler",
        sanitized_number: "+18882206650",
      },
      languages: [],
      alexa_ranking: null,
      phone: "+1 888-220-6650",
      linkedin_uid: "54313388",
      founded_year: 2020,
      publicly_traded_symbol: null,
      publicly_traded_exchange: null,
      logo_url:
        "https://zenprospect-production.s3.amazonaws.com/uploads/pictures/685c03e192d5eb0001290ecd/picture",
      crunchbase_url: null,
      primary_domain: "revive.health",
      sanitized_phone: "+18882206650",
      owned_by_organization_id: "5a9d65baa6da98d977f39b57",
      owned_by_organization: {
        id: "5a9d65baa6da98d977f39b57",
        name: "Eir Partners",
        website_url: "http://www.eirpartners.com",
      },
      organization_revenue_printed: "4.5M",
      organization_revenue: 4500000,
      intent_strength: null,
      show_intent: true,
      has_intent_signal_account: false,
      intent_signal_account: null,
      organization_headcount_six_month_growth: 0.05405405405405406,
      organization_headcount_twelve_month_growth: 0.2580645161290323,
      organization_headcount_twenty_four_month_growth: 0.8571428571428571,
    },
  ],
  model_ids: [
    "6049f0cd95a7350001c944a0",
    "5da125bcb98bf70001e65cb7",
    "5b83f04af874f7595a22f95c",
    "54a13b7b69702dac846a8201",
    "57c508dca6da986a3f7657bc",
    "5fcaa67cdc8f7f00011b93ee",
    "5d341ddaa3ae6184ddf15e8c",
    "5d3673a9f651251f08a211b8",
    "64e46f709a598e00d634999c",
    "64132f0a83a2a400d80dd80e",
  ],
  num_fetch_result: null,
  derived_params: null,
};
