"use client";
import {Icons} from "@/components/icons";
import {Lead} from "@/config/data";
import {db} from "@/config/firebase";
import {
  onSnapshot,
  collection,
  where,
  query,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import React, {useEffect, useState} from "react";
import {formatTimeDifference, getFaviconUrl, hexToRgba} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {MinusIcon, PlusIcon} from "lucide-react";
import Link from "next/link";
import {LinkButton} from "@/components/ui/link";

export const Apollo = () => {
  const listID = "qd8vimrcyht";

  const [fullLeads, setFullLeads] = useState<Lead[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const clientIdeaDataQuery = query(
      collection(db, "companies-fixed"),
      where("lists", "array-contains", listID)
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
  }, []);

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const [availableLists, setAvailableLists] = useState<any[]>([]);

  const fetchLists = async () => {
    const response = await fetch("/api/get-lists");
    const data = await response.json();
    setAvailableLists(
      data.map((list: any) => ({
        name: list.name,
        id: list._id,
      }))
    );
  };

  useEffect(() => {
    fetchLists();
  }, []);

  return (
    <div className=" h-full w-full grid grid-cols-2 relative z-30 max-h-screen ">
      <div className="col-span-1">
        {isLoading ? (
          <Icons.loader className="mx-auto h-5 w-5  animate-spin col-span-2" />
        ) : (
          <div className="flex flex-col p-4 gap-2 max-h-screen overflow-y-auto">
            {fullLeads.map((lead) => (
              <button
                key={lead.id}
                className={`flex items-center gap-2 p-2 border  rounded-md hover:bg-primary/5 cursor-pointer ${
                  selectedLead?.id === lead.id ? "bg-primary/5" : ""
                }`}
                onClick={() => setSelectedLead(lead)}
              >
                <img
                  src={getFaviconUrl(lead.website)}
                  className="h-6 w-6 rounded-sm border bg-white shadow-sm"
                />
                <h1>{lead.name}</h1>
                <div className="flex items-center gap-2 ml-auto">
                  {lead.apollo_lists?.map((list) => (
                    <div
                      key={list}
                      className="text-sm p-2 text-blue-500 bg-blue-500/10 rounded-md"
                    >
                      {
                        availableLists
                          .find((s) => s.id === list)
                          ?.name.split("(")[0]
                      }
                    </div>
                  ))}
                </div>
                {!lead.apollo_id ? (
                  <div className="text-sm text-red-500 p-2 rounded-md bg-red-500/10 ml-auto">
                    Not in Apollo
                  </div>
                ) : !lead.contacts?.some((contact) => contact.apollo_id) ? (
                  <div className="text-sm text-red-500 p-2 rounded-md bg-red-500/10 ml-auto">
                    No contacts in Apollo
                  </div>
                ) : !lead.apollo_lists?.length ? (
                  <div className="text-sm text-red-500 p-2 rounded-md bg-red-500/10 ml-auto">
                    Not connected to any lists
                  </div>
                ) : (
                  <></>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="col-span-1 p-4 max-h-screen overflow-y-auto">
        {selectedLead && (
          <>
            {selectedLead.apollo_id ? (
              <SelectedLead
                selectedLead={selectedLead}
                availableLists={availableLists}
                setSelectedLead={setSelectedLead}
              />
            ) : (
              <ApolloLink
                selectedLead={selectedLead}
                setSelectedLead={setSelectedLead}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

const ApolloLink = ({
  selectedLead,
  setSelectedLead,
}: {
  selectedLead: Lead;
  setSelectedLead: (lead: Lead) => void;
}) => {
  const [apolloData, setApolloData] = useState<any>(null);

  const searchForCompany = async () => {
    //  get from crunchbase-data/lead.name
    const leadRef = doc(db, "crunchbase-data", selectedLead.name);
    const leadData = await getDoc(leadRef);
    const data = leadData.data();
    setApolloData(data?.apolloData);
  };

  useEffect(() => {
    searchForCompany();
  }, [selectedLead]);

  const addToApollo = async (lead: Lead) => {
    // get lead data from crunchbase-data/lead.name

    const response = await fetch("/api/create-account", {
      method: "POST",
      body: JSON.stringify({
        leadName: apolloData.name,
        leadWebsite: cleanedWebsite(apolloData.website_url),
      }),
    });
    const data = await response.json();
    console.log(data);

    const leadRef = doc(db, "companies-fixed", lead.id);
    updateDoc(leadRef, {
      apollo_id: data.id,
    });
    setSelectedLead({
      ...lead,
      apollo_id: data.id,
    });
  };

  return (
    <div className="flex flex-col gap-2 items-center justify-center h-full">
      <div className="flex flex-col items-center gap-2">
        <img
          src={getFaviconUrl(selectedLead.website)}
          className="h-10 w-10 rounded-sm border bg-white shadow-sm"
        />
        <h1 className="text-2xl font-bold">{selectedLead.name}</h1>
      </div>
      <Button
        variant="outline"
        className=""
        onClick={() => addToApollo(selectedLead)}
      >
        <Icons.add className="w-4 h-4" />
        Add to apollo
      </Button>
    </div>
  );
};

const SelectedLead = ({
  selectedLead,
  availableLists,
  setSelectedLead,
}: {
  selectedLead: Lead;
  availableLists: any[];
  setSelectedLead: (lead: Lead) => void;
}) => {
  const addToList = async (listId: string) => {
    // update the lead in the database
    const leadRef = doc(db, "companies-fixed", selectedLead.id);
    const newApolloLists = [...(selectedLead.apollo_lists || []), listId];
    await updateDoc(leadRef, {
      apollo_lists: newApolloLists,
    });
    setSelectedLead({
      ...selectedLead,
      apollo_lists: newApolloLists,
    });

    // Update all contacts in Apollo with new labelNames
    if (selectedLead.contacts) {
      const labelNames = availableLists
        .filter((l) => newApolloLists.includes(l.id))
        .map((l) => l.name);
      await Promise.all(
        selectedLead.contacts
          .filter((contact: any) => contact.apollo_id)
          .map((contact: any) =>
            fetch("/api/update-contact", {
              method: "PATCH",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify({
                contactId: contact.apollo_id,
                labelNames,
              }),
            })
          )
      );
    }
  };

  const removeFromList = async (listId: string) => {
    const leadRef = doc(db, "companies-fixed", selectedLead.id);
    const newApolloLists =
      selectedLead.apollo_lists?.filter((id) => id !== listId) || [];
    await updateDoc(leadRef, {
      apollo_lists: newApolloLists,
    });
    setSelectedLead({
      ...selectedLead,
      apollo_lists: newApolloLists,
    });
    // Update all contacts in Apollo with new labelNames
    if (selectedLead.contacts) {
      const labelNames = availableLists
        .filter((l) => newApolloLists.includes(l.id))
        .map((l) => l.name);
      await Promise.all(
        selectedLead.contacts
          .filter((contact: any) => contact.apollo_id)
          .map((contact: any) =>
            fetch("/api/update-contact", {
              method: "PATCH",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify({
                contactId: contact.apollo_id,
                labelNames,
              }),
            })
          )
      );
    }
  };

  // Helper to check if a person is already a contact
  const isPersonContact = (person: any) => {
    return selectedLead.contacts?.some(
      (contact: any) => contact.id === person.id
    );
  };

  // Add a person (from people array) to contacts in correct Contact format
  const addPersonToContacts = async (person: any) => {
    // Only add email contact point if email is not the locked placeholder
    const emailContactPoint =
      person.email && person.email !== "email_not_unlocked@domain.com"
        ? [{type: "email", value: person.email, id: `${person.id}-email`}]
        : [];
    const newContact = {
      id: person.id,
      name: person.name,
      role: person.title,
      photo_url: person.photo_url,
      contactPoints: [
        ...emailContactPoint,
        ...(person.linkedin_url
          ? [
              {
                type: "linkedIn",
                value: person.linkedin_url,
                id: `${person.id}-linkedin`,
              },
            ]
          : []),
      ],
    };

    // Add to contacts in Firestore
    const updatedContacts = [...(selectedLead.contacts || []), newContact];
    const leadRef = doc(db, "companies-fixed", selectedLead.id);
    await updateDoc(leadRef, {
      contacts: updatedContacts,
    });
    setSelectedLead({
      ...selectedLead,
      contacts: updatedContacts,
    });
  };

  // Add a contact (from contacts array) to Apollo if missing apollo_id
  const addContactToApollo = async (contact: any) => {
    if (contact.apollo_id) return;
    const response = await fetch("/api/create-contact", {
      method: "POST",
      body: JSON.stringify({
        firstName: contact.name.split(" ")[0],
        lastName: contact.name.split(" ")[1],
        title: contact.role,
        accountId: selectedLead.apollo_id,
        email:
          contact.contactPoints &&
          contact.contactPoints.find((point: any) => point.type === "email")
            ?.value !== "email_not_unlocked@domain.com"
            ? contact.contactPoints.find((point: any) => point.type === "email")
                ?.value
            : undefined,
        labelNames: availableLists
          .filter((l) => selectedLead.apollo_lists?.includes(l.id))
          .map((l) => l.name),
      }),
    });
    const data = await response.json();
    console.log(data);
    // Update contact with apollo_id
    const updatedContacts = (selectedLead.contacts || []).map((c: any) =>
      c.id === contact.id ? {...c, apollo_id: data.id} : c
    );
    const leadRef = doc(db, "companies-fixed", selectedLead.id);
    await updateDoc(leadRef, {
      contacts: updatedContacts,
    });
    setSelectedLead({
      ...selectedLead,
      contacts: updatedContacts,
    });
  };

  // Remove person from contacts
  const removePersonFromContacts = async (person: any) => {
    const updatedContacts = (selectedLead.contacts || []).filter(
      (contact: any) => contact.id !== person.id
    );
    const leadRef = doc(db, "companies-fixed", selectedLead.id);
    await updateDoc(leadRef, {
      contacts: updatedContacts,
    });
    setSelectedLead({
      ...selectedLead,
      contacts: updatedContacts,
    });
    // If the contact has an apollo_id, update labelNames to [] in Apollo
    const contact = (selectedLead.contacts || []).find(
      (c: any) => c.id === person.id
    );
    if (contact && contact.apollo_id) {
      await fetch("/api/update-contact", {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          contactId: contact.apollo_id,
          labelNames: [],
        }),
      });
    }
  };

  return (
    <div className="flex flex-col gap-2 text-primary">
      <div className="flex items-center gap-2">
        <img
          src={getFaviconUrl(selectedLead.website)}
          className="h-10 w-10 rounded-sm border bg-white shadow-sm"
        />
        <h1 className="text-2xl font-bold">{selectedLead.name}</h1>
        {/* a button to open the website in a new tab */}
        <LinkButton
          variant="outline"
          className="ml-auto"
          href={cleanedWebsite(selectedLead.website)}
          target="_blank"
        >
          Open website
        </LinkButton>
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-lg font-bold">Lists</h1>
        {availableLists.map((list) => (
          <button
            onClick={() =>
              selectedLead.apollo_lists?.includes(list.id)
                ? removeFromList(list.id)
                : addToList(list.id)
            }
            key={list.id}
            className={`flex items-center gap-2 p-2 border rounded-md ${
              selectedLead.apollo_lists?.includes(list.id)
                ? "bg-blue-500/10 text-blue-500"
                : "hover:bg-primary/10"
            }`}
          >
            <h1>{list.name}</h1>
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-lg font-bold">Contacts</h1>
        <div className="flex flex-col gap-2">
          {selectedLead.contacts?.map((contact) => (
            <div key={contact.id} className="flex items-center gap-2">
              <div
                key={contact.id}
                className="flex items-center gap-2 border rounded-md p-2 w-full"
              >
                <img
                  src={contact.photo_url}
                  className="h-10 w-10 rounded-sm border bg-white shadow-sm"
                />
                <div className="flex flex-col">
                  <Link
                    href={
                      contact.contactPoints.find(
                        (point) => point.type === "linkedIn"
                      )?.value || ""
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-bold hover:underline"
                  >
                    {contact.name}
                  </Link>
                  <p className="text-sm text-gray-500">{contact.role}</p>
                </div>

                {contact.apollo_id ? (
                  <Button
                    variant="outline"
                    className=" ml-auto bg-red-500 text-white"
                    onClick={() => removePersonFromContacts(contact)}
                  >
                    <Icons.trash className="w-4 h-4" />
                    delete from apollo
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className=" ml-auto"
                    onClick={() => addContactToApollo(contact)}
                  >
                    <Icons.add className="w-4 h-4" />
                    Add to apollo
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-lg font-bold">People</h1>
        <div className="flex flex-col gap-2">
          {selectedLead.people
            ?.filter((person) => !isPersonContact(person))
            .map((person) => (
              <div
                key={person.id}
                className="flex items-center gap-2 border rounded-md p-2"
              >
                <img
                  src={person.photo_url}
                  className="h-10 w-10 rounded-sm border bg-white shadow-sm"
                />
                <div className="flex flex-col">
                  <Link
                    href={person.linkedin_url || ""}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-bold hover:underline"
                  >
                    {person.name}
                  </Link>
                  <p className="text-sm text-gray-500">{person.title}</p>
                </div>
                <Button
                  variant="outline"
                  className=" ml-auto"
                  onClick={() => addPersonToContacts(person)}
                >
                  <Icons.add className="w-4 h-4" />
                  Add
                </Button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

const cleanedWebsite = (website: string) => {
  if (!website) return "";
  if (website.startsWith("http")) {
    return website;
  }
  return `https://${website}`;
};
