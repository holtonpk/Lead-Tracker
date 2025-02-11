import {useState, useEffect} from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {db} from "@/config/firebase";
import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  getDoc,
} from "firebase/firestore";
import {Lead} from "@/config/data";
import {getFaviconUrl} from "@/lib/utils";
import {Icons} from "@/components/icons";
import {get} from "http";

export const CreateNewList = ({
  children,
  companies,
}: {
  children: React.ReactNode;
  companies?: Lead[];
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(
    companies?.map((company) => company.id) || []
  );

  const [allCompanies, setAllCompanies] = useState<Lead[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createList = async () => {
    setIsLoading(true);

    const listId = Math.random().toString(36).substring(2, 15);
    const docRef = doc(db, "lists", listId);
    await setDoc(docRef, {
      name: name,
      description: description,
      id: listId,
    });

    selectedCompanies.forEach(async (companyId) => {
      const docRef = doc(db, "companies", companyId);
      const docSnap = await getDoc(docRef);
      const data = docSnap.data();
      const listOld = (data && data.lists) || [];
      await setDoc(
        docRef,
        {
          lists: [...listOld, listId],
        },
        {merge: true}
      );
    });

    setIsLoading(false);
    setOpen(false);
  };

  const toggleSelected = (companyId: string) => {
    if (selectedCompanies.includes(companyId)) {
      setSelectedCompanies(selectedCompanies.filter((id) => id !== companyId));
    } else {
      setSelectedCompanies([...selectedCompanies, companyId]);
    }
  };

  useEffect(() => {
    const clientIdeaDataQuery = query(collection(db, "companies"));

    const unsubscribe = onSnapshot(clientIdeaDataQuery, (querySnapshot) => {
      const leadsData: Lead[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        leadsData.push(data as Lead);
      });
      setAllCompanies(leadsData);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new list</DialogTitle>
          <DialogDescription>
            List allow you to group leads together for better organization.
          </DialogDescription>
        </DialogHeader>

        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="List name"
        />

        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
        />
        {allCompanies && (
          <div className="grid gap-1">
            <div className="flex w-full justify-between">
              <h1>Companies to add ({selectedCompanies.length})</h1>
              <button
                onClick={() => {
                  if (selectedCompanies.length == allCompanies.length) {
                    setSelectedCompanies([]);
                  } else {
                    setSelectedCompanies(
                      allCompanies.map((company) => company.id)
                    );
                  }
                }}
              >
                {selectedCompanies.length < allCompanies.length
                  ? "Select all"
                  : "Deselect all"}
              </button>
            </div>
            <div className="flex flex-col max-h-[200px] overflow-scroll gap-1 border rounded-md p-1 divide-y">
              {allCompanies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => toggleSelected(company.id)}
                  className="w-full flex items-center gap-1 p-2"
                >
                  <div
                    className={`h-5 rounded-sm w-5   z-20 border-2 border-primary flex justify-center items-center
          
        ${selectedCompanies.includes(company.id) ? "bg-primary" : ""}
          `}
                  >
                    {selectedCompanies.includes(company.id) && (
                      <Icons.check className="h-6 w-6 text-background" />
                    )}
                  </div>
                  <div
                    className={`flex gap-1 items-center flex-grow rounded-md text-lg
                      ${
                        selectedCompanies.includes(company.id)
                          ? "opacity-100"
                          : "opacity-60"
                      }`}
                  >
                    <img
                      src={getFaviconUrl(company.website)}
                      className="h-8 w-8 rounded-full border bg-white"
                    />
                    {company.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button onClick={createList}>
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
