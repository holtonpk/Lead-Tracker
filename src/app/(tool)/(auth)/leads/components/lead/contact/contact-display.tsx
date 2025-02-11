import React from "react";
import {Lead, ContactTypeData} from "@/config/data";
import {NewContactButton} from "@/app/(tool)/(auth)/leads/components/lead/contact/create-contact";

export const ContactDisplay = ({lead}: {lead: Lead}) => {
  return (
    <div className="flex flex-col   px-2">
      {lead.contacts ? (
        <div className="flex flex-col gap-1 rounded-md">
          <div className="flex gap-2 font-bold items-center justify-between w-full  px-3"></div>
          <div className="flex flex-col border rounded-md overflow-hidden bg-background ">
            <div className="w-full grid grid-cols-3 border-b py-1   divide-x">
              <h1 className="pl-4 font-bold text-primary/60">Name</h1>
              <h1 className="pl-4 font-bold text-primary/60">Role</h1>
              <h1 className="pl-4 font-bold text-primary/60">Type</h1>
              {/* <h1 className="pl-4 font-bold text-primary/60">Status</h1> */}
            </div>
            <div className="flex flex-col divide-y">
              {lead.contacts.map((contact, i) => (
                <div
                  key={i}
                  className="w-full grid grid-cols-3 divide-x items-center py-2 hover:bg-muted"
                >
                  <h1 className="pl-4 font-bold">{contact.name}</h1>
                  <h1 className="pl-4 font-bold">{contact.role}</h1>
                  <div className="flex pl-4  w-full">
                    {contact.contactPoints.map((point, i) => {
                      const Icon = ContactTypeData.find(
                        (cp) => cp.value == point.type
                      )?.icon;

                      return (
                        <div
                          key={i}
                          className="border rounded-full h-6 w-6 flex justify-center items-center bg-background"
                        >
                          {Icon && <Icon className="h-4 w-4 text-primary" />}
                          {/* {ContactTypeData.find((cp)=> cp.value == point.type)?.label} */}
                        </div>
                      );
                    })}
                  </div>
                  {/* <Select defaultValue={contact.status}>
                            <SelectTrigger className="w-[180px] ">
                              <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                            <SelectContent>
                              {LeadStatuses.map((status) => (
                                <SelectItem key={status.id} value={status.id}>
                                  <div
                                    style={{
                                      color: status?.color,
                                    }}
                                    className="flex gap-1 items-center"
                                  >
                                    <div
                                      style={{
                                        backgroundColor: status?.color,
                                        borderColor: status?.color,
                                      }}
                                      className="h-[5px] w-[5px] rounded-full"
                                    ></div>
                                    {status.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select> */}
                </div>
              ))}
            </div>
          </div>
          <NewContactButton text="Add a Contact" leadId={lead.id} />
        </div>
      ) : (
        <div className="w-full flex-col flex items-center  p-2 px-4 gap-2">
          <h1 className="text-2xl font-bold">No Contacts</h1>

          <NewContactButton text="Add a Contact" leadId={lead.id} />
        </div>
      )}
    </div>
  );
};

export default ContactDisplay;
