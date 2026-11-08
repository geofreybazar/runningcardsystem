import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Brand from "./Brand.jsx";
import NavItems from "./NavItems.jsx";
import UserMenu from "./UserMenu.jsx";

/** The pages this role may open, grouped, with the user menu at the bottom. */
function AppSidebar({ items }) {
  const groups = [...new Set(items.map((n) => n.group))];
  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <Brand />
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g}>
            <SidebarGroupLabel>{g}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <NavItems items={items.filter((n) => n.group === g)} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenu />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export default AppSidebar;
