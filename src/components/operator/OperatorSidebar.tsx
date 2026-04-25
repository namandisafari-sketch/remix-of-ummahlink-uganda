import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Calendar, Users, CreditCard, Package, Inbox, Building2, ArrowLeft,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const items = [
  { title: "Overview", url: "/operator", icon: LayoutDashboard, end: true },
  { title: "Schedules", url: "/operator/schedules", icon: Calendar },
  { title: "Bookings", url: "/operator/bookings", icon: Users },
  { title: "Payments", url: "/operator/payments", icon: CreditCard },
  { title: "Packages", url: "/operator/packages", icon: Package },
  { title: "Inquiries", url: "/operator/inquiries", icon: Inbox },
  { title: "Profile", url: "/operator/profile", icon: Building2 },
];

export const OperatorSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operator</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = item.end
                  ? location.pathname === item.url
                  : location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.end}
                        className={cn(
                          "transition-colors",
                          active ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50",
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/" className="hover:bg-muted/50">
                    <ArrowLeft className="h-4 w-4" />
                    {!collapsed && <span>Back to App</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
