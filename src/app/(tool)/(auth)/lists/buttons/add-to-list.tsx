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
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import {Lead, List, TagColors} from "@/config/data";
import {getFaviconUrl} from "@/lib/utils";
import {Icons} from "@/components/icons";

export const AddToList = ({
  children,
  companies,
  onSuccess,
}: {
  children: React.ReactNode;
  companies: Lead[];
  onSuccess?: any;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const [selectedLists, setSelectedLists] = useState<string[]>([]);

  const [allLists, setAllLists] = useState<List[]>([]);

  const toggleSelected = (listId: string) => {
    if (selectedLists.includes(listId)) {
      setSelectedLists(selectedLists.filter((id) => id !== listId));
    } else {
      setSelectedLists([...selectedLists, listId]);
    }
  };

  useEffect(() => {
    const clientIdeaDataQuery = query(collection(db, "lists"));

    const unsubscribe = onSnapshot(clientIdeaDataQuery, (querySnapshot) => {
      const listsData: List[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        listsData.push(data as List);
      });
      setAllLists(listsData);
    });

    return () => unsubscribe();
  }, []);

  const addToList = async () => {
    setIsLoading(true);
    console.log("seleecteed lll", selectedLists);
    console.log("seleecteed ccccc", companies);
    try {
      // Iterate over each selected list
      for (const list of selectedLists) {
        // Ensure companies exist and map over them
        const updatePromises = (companies ?? []).map(async (company) => {
          await updateDoc(doc(db, `companies-fixed/${company.id}`), {
            lists: arrayUnion(list), // Add id to the "lists" array
          });
        });

        // Only await if there are promises to resolve
        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
        }
      }

      console.log("Lists successfully added to companies!");
    } catch (error) {
      console.error("Error adding lists to companies:", error);
    }
    setIsLoading(false);
    setOpen(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to list</DialogTitle>
          <DialogDescription>
            Select the lists you would like to the selected to
          </DialogDescription>
        </DialogHeader>

        {allLists && (
          <div className="grid gap-1">
            <div className="flex w-full justify-between">
              <h1>Select Lists ({selectedLists.length})</h1>
              <button
                onClick={() => {
                  if (selectedLists.length == allLists.length) {
                    setSelectedLists([]);
                  } else {
                    setSelectedLists(allLists.map((company) => company.id));
                  }
                }}
              >
                {selectedLists.length < allLists.length
                  ? "Select all"
                  : "Deselect all"}
              </button>
            </div>
            <div className="flex flex-col max-h-[200px] overflow-scroll gap-1 border rounded-md p-1 divide-y">
              {allLists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => toggleSelected(list.id)}
                  className="w-full flex items-center gap-1 p-2"
                >
                  <div
                    className={`h-5 rounded-sm w-5   z-20 border-2 border-primary flex justify-center items-center
          
        ${selectedLists.includes(list.id) ? "bg-primary" : ""}
          `}
                  >
                    {selectedLists.includes(list.id) && (
                      <Icons.check className="h-6 w-6 text-background" />
                    )}
                  </div>
                  <div
                    className={`flex gap-1 items-center flex-grow rounded-md 
                      ${
                        selectedLists.includes(list.id)
                          ? "opacity-100"
                          : "opacity-60"
                      }`}
                  >
                    <div
                      style={{background: list.color}}
                      className="h-4 w-4  border  rounded-md"
                    />
                    {list.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button onClick={addToList}>
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Adding
              </>
            ) : (
              "Add"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
