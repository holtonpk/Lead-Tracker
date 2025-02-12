"use client";
import Navbar from "@/app/(tool)/(auth)/leads/navbar/navbar";
import {Dashboard} from "@/app/(tool)/(auth)/leads/dashboard/dashboard";
import {List as ListType} from "@/config/data";
import Lists from "./lists/lists";
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
import {db} from "@/config/firebase";
import {useEffect, useState} from "react";

const Page = () => {
  const [displayedLeadList, setDisplayedLeadList] = useState<string>("1");
  const [LeadLists, setLeadLists] = useState<ListType[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(true);

  const [tab, setTab] = useState("dashboard");

  useEffect(() => {
    const leadListsCollection = collection(db, "lists");

    const unsubscribe = onSnapshot(leadListsCollection, (snapshot) => {
      const leadListsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setLeadLists([
        {
          name: "Full lead list",
          id: "1",
          description: "All leads",
          color: "#84cc16",
        },
        ...(leadListsData as {
          name: string;
          description: string;
          id: string;
          color: "";
        }[]),
      ]);
      setIsLoadingLists(false);
    });

    return () => unsubscribe(); // Cleanup function to unsubscribe when the component unmounts
  }, []);

  return (
    <div className={` grid gap-1  max-h-screen overflow-hidden `}>
      <div className={`grid grid-cols-[200px_1fr]`}>
        <Navbar
          isLoadingLists={isLoadingLists}
          LeadLists={LeadLists}
          displayedLeadList={displayedLeadList}
          setDisplayedLeadList={setDisplayedLeadList}
          tab={tab}
          setTab={setTab}
        />
        {tab == "lists" && (
          <Lists
            isLoadingLists={isLoadingLists}
            setIsLoadingLists={setIsLoadingLists}
            LeadLists={LeadLists}
            setLeadLists={setLeadLists}
            displayedLeadList={displayedLeadList}
            setDisplayedLeadList={setDisplayedLeadList}
            tab={tab}
            setTab={setTab}
          />
        )}
        {tab == "dashboard" && <Dashboard />}
      </div>
    </div>
  );
};

export default Page;
