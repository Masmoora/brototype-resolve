import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  FolderKanban, 
  UserCog, 
  Bell, 
  LogOut,
  GraduationCap,
  UserCheck
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export function AdminSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  
  const navItems = [
    { 
      title: "Dashboard", 
      icon: LayoutDashboard, 
      path: "/admin/dashboard" 
    },
    { 
      title: "Users", 
      icon: Users, 
      path: "/admin/users",
      subItems: [
        { title: "Students", path: "/admin/users?type=students" },
        { title: "Staff", path: "/admin/users?type=staff" }
      ]
    },
    { 
      title: "Complaints", 
      icon: FileText, 
      path: "/admin/complaints",
      subItems: [
        { title: "All Complaints", path: "/admin/complaints" },
        { title: "Assign Complaints", path: "/admin/complaints/assign" }
      ]
    },
    { 
      title: "Categories", 
      icon: FolderKanban, 
      path: "/admin/categories" 
    },
    { 
      title: "Staff Management", 
      icon: UserCog, 
      path: "/admin/staff" 
    },
    { 
      title: "Notifications", 
      icon: Bell, 
      path: "/admin/notifications" 
    }
  ];

  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-primary">BroDesk</h1>
        <p className="text-sm text-muted-foreground mt-1">Admin Panel</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <div key={item.path}>
            <Link
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.title}</span>
            </Link>
            
            {item.subItems && (
              <div className="ml-8 mt-1 space-y-1">
                {item.subItems.map((subItem) => (
                  <Link
                    key={subItem.path}
                    to={subItem.path}
                    className={cn(
                      "block px-4 py-2 text-sm rounded-lg transition-colors",
                      location.pathname + location.search === subItem.path
                        ? "text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    {subItem.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      
      <div className="p-4 border-t border-border">
        <Button
          onClick={signOut}
          variant="ghost"
          className="w-full justify-start gap-3"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  );
}
