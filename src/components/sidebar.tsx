'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  Rocket,
  Package,
  Users,
  Boxes,
  BarChart3,
  Settings,
  Wrench,
  LogOut,
  Truck
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/drones', icon: Rocket, label: 'Drones' },
  { href: '/trucks', icon: Truck, label: 'Trucks' },
  { href: '/orders', icon: Package, label: 'Orders' },
  { href: '/products', icon: Boxes, label: 'Products' },
  { href: '/customers', icon: Users, label: 'Customers' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/ai-tool', icon: Wrench, label: 'AI Maintenance' },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    router.push('/');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r">
      <SidebarHeader className="h-16 flex items-center justify-center p-0 group-data-[collapsible=icon]:h-16 group-data-[collapsible=icon]:justify-center">
        <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-xl group-data-[collapsible=icon]:hidden">
          <Rocket className="w-7 h-7 text-primary" />
          <span>Buildora</span>
        </Link>
        <Link href="/dashboard" className="hidden items-center group-data-[collapsible=icon]:flex">
           <Rocket className="w-8 h-8 text-primary" />
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex-1 p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={isActive(item.href)}
                  tooltip={{ children: item.label, side: 'right', align: 'center' }}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
         <SidebarMenu>
            <SidebarMenuItem>
                <Link href="/settings">
                    <SidebarMenuButton 
                      isActive={isActive('/settings')} 
                      tooltip={{ children: "Settings", side: 'right', align: 'center' }}
                    >
                        <Settings className="h-5 w-5" />
                        <span>Settings</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
            <Separator className="my-1" />
            <div className="flex items-center gap-3 p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:py-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src="https://placehold.co/100x100.png" alt="Admin" data-ai-hint="profile picture" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="font-semibold text-sm">Admin User</span>
                <span className="text-xs text-muted-foreground/80">admin@buildora.com</span>
              </div>
               <Button variant="ghost" size="icon" className="ml-auto group-data-[collapsible=icon]:hidden" onClick={handleLogout}>
                  <LogOut className="h-5 w-5 text-muted-foreground/80" />
              </Button>
            </div>
         </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
