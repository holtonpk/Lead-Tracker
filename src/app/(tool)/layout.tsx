import React from "react";
import {AuthProvider} from "@/context/user-auth";

const MainLayout = ({children}: {children: React.ReactNode}) => {
  return <AuthProvider>{children}</AuthProvider>;
};

export default MainLayout;
