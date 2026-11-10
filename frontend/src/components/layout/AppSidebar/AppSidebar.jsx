import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
} from "@/components/ui/sidebar";
import Brand from "./Brand.jsx";
import NavItems from "./NavItems.jsx";
import SidebarProfile from "./SidebarProfile.jsx";

/** Charcoal navigation: the pages this role may open, grouped by kind of work, with who is signed in at the bottom. */
function AppSidebar({ items }) {
  const groups = [...new Set(items.map((n) => n.group))];
  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader className='border-b border-shell-border'>
        <Brand />
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g}>
            <SidebarGroupLabel className='text-label text-shell-muted'>{g}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <NavItems items={items.filter((n) => n.group === g)} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarProfile />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export default AppSidebar;
