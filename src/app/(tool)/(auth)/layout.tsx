"use client";
import React from "react";
import {useAuth} from "@/context/user-auth";
import RegisterForm from "@/components/auth/register";
import {Icons} from "@/components/icons";
import {ADMIN_USERS} from "@/config/data";
import {Button} from "@/components/ui/button";
const AdminLayout = ({children}: {children: React.ReactNode}) => {
  const {currentUser, logOut} = useAuth()!;

  if (!currentUser)
    return (
      <div className=" items-center justify-center w-screen h-screen flex relative z-20">
        <div className="w-fit ">
          <RegisterForm />
        </div>
      </div>
    );

  if (!ADMIN_USERS.includes(currentUser.uid)) {
    return (
      <div className=" items-center justify-center w-screen h-screen flex flex-col">
        <Icons.checkCircle className="h-10 w-10 text-green-500" />
        <h1 className="mt-4 font-bold font1 text-2xl text-primary">
          Your account has been created{" "}
        </h1>
        <h1 className="mt-2 text-primary">
          you will be notified when your account is approved
        </h1>
        <Button
          onClick={logOut}
          variant={"ghost"}
          className="fixed top-4 right-4 text-primary"
        >
          Logout
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminLayout;
