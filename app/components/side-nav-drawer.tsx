"use client";
import { DrawerButton } from "@/types";
import {
  Banknote,
  Calendar,
  CreditCard,
  LayoutDashboard,
  Settings,
  Star,
  UserCog,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PropsWithChildren, ReactNode, useState } from "react";
import { Button } from "./shadcn/ui/button";
import { Separator } from "./shadcn/ui/separator";

interface SideNavDrawerProps {
  children?: ReactNode;
  title: string;
  drawerButtons: DrawerButton[];
}

const getIcon = (iconName: string | React.ReactNode) => {
  if (typeof iconName === "string") {
    switch (iconName) {
      case "layout-dashboard":
        return <LayoutDashboard className="w-4 h-4 mr-2" />;
      case "users":
        return <Users className="w-4 h-4 mr-2" />;
      case "user-cog":
        return <UserCog className="w-4 h-4 mr-2" />;
      case "calendar":
        return <Calendar className="w-4 h-4 mr-2" />;
      case "credit-card":
        return <CreditCard className="w-4 h-4 mr-2" />;
      case "star":
        return <Star className="w-4 h-4 mr-2" />;
      case "settings":
        return <Settings className="w-4 h-4 mr-2" />;
      case "revenue":
        return <Banknote className="w-4 h-4 mr-2" />;
      default:
        return null;
    }
  }
  return iconName;
};

const SideNavDrawer: React.FC<PropsWithChildren<SideNavDrawerProps>> = ({
  children,
  drawerButtons,
  title,
}) => {
  const [selectedBtn, setSelectedBtn] = useState<string>(drawerButtons[0].id);

  return (
    <div className="flex flex-row h-full overflow-y-hidden">
      <div className="flex w-64 flex-col justify-between overflow-y-hidden border-r bg-background ">
        <div className="flex flex-col ">
          {/* header */}
          <div className="w-full flex items-center h-[47px] max-h-[47px] justify-center py-12">
            <div className="flex items-center justify-center">
              <div>
                <Image src={"/logo.png"} height={32} width={32} alt="logo" />
              </div>

              <div className="flex flex-col">
                <p className="text-md text-foreground px-5 font-bold">
                  Dare.market
                </p>
                <p className="text-md text-foreground px-5"> Admin Portal</p>
              </div>
            </div>
          </div>
          <Separator />
          {/* body */}
          <div className="flex flex-col px-2 py-5 space-y-1 w-full">
            {drawerButtons.length &&
              drawerButtons.map((data, index) => {
                if (data.type === "section") {
                  return (
                    <div
                      key={data.id}
                      className={`${index === 0 ? "pt-0" : "pt-4"} pb-2`}
                    >
                      <h3 className="px-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {data.title}
                      </h3>
                    </div>
                  );
                } else if (data.type === "button" || !data.type) {
                  return (
                    <Link href={data.href} key={data.id} className="">
                      <Button
                        variant={"outline"}
                        size={"sm"}
                        className={`w-full justify-start ${selectedBtn === data.id
                            ? "bg-foreground/10"
                            : "bg-background"
                          }`}
                        onClick={() => setSelectedBtn(data.id)}
                      >
                        {data.icon && getIcon(data.icon)}
                        {data.title}
                      </Button>
                    </Link>
                  );
                } else {
                  return null;
                }
              })}
          </div>
        </div>
      </div>
      <div className="flex flex-col flex-1 w-full overflow-x-hidden max-h-[100vh]">
        {children}
      </div>
    </div>
  );
};

export default SideNavDrawer;
