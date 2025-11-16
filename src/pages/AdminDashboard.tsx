import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileText, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Complaint = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "pending" | "in_progress" | "resolved";
  created_at: string;
  assigned_to: string | null;
  student_profile: {
    full_name: string;
  } | null;
};

type StaffMember = {
  id: string;
  full_name: string;
  email: string;
};

type User = {
  id: string;
  full_name: string;
  email: string;
  role: "student" | "staff" | "admin";
};

export default function AdminDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all complaints
      const { data: complaintsData, error: complaintsError } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });

      if (complaintsError) throw complaintsError;
      
      // Fetch student profiles
      if (complaintsData && complaintsData.length > 0) {
        const studentIds = complaintsData.map(c => c.student_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", studentIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        const complaintsWithProfiles = complaintsData.map(c => ({
          ...c,
          student_profile: profileMap.get(c.student_id) || null
        })) as any;
        
        setComplaints(complaintsWithProfiles);
      } else {
        setComplaints([]);
      }

      // Fetch staff members
      const { data: staffData, error: staffError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "staff");

      if (staffError) throw staffError;
      
      if (staffData && staffData.length > 0) {
        const staffIds = staffData.map(s => s.user_id);
        const { data: staffProfiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", staffIds);
        
        setStaffMembers(staffProfiles || []);
      }

      // Fetch all users with their roles
      const { data: allProfilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email");
      
      const { data: allRolesData } = await supabase
        .from("user_roles")
        .select("user_id, role");
      
      const roleMap = new Map(allRolesData?.map(r => [r.user_id, r.role]) || []);
      const usersWithRoles = allProfilesData?.map(p => ({
        ...p,
        role: roleMap.get(p.id) || "student"
      })) as User[];
      
      setAllUsers(usersWithRoles || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignStaff = async (complaintId: string, staffId: string) => {
    try {
      const { error } = await supabase
        .from("complaints")
        .update({ 
          assigned_to: staffId,
          status: "in_progress"
        })
        .eq("id", complaintId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Complaint assigned successfully",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePromoteToStaff = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: "staff" })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User promoted to staff",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDemoteToStudent = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: "student" })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Staff demoted to student",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const unassignedComplaints = complaints.filter(c => !c.assigned_to);
  const assignedComplaints = complaints.filter(c => c.assigned_to);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Admin Dashboard</h2>
          <p className="text-muted-foreground mt-1">Manage complaints and assign to staff</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{complaints.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unassignedComplaints.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{staffMembers.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="unassigned" className="w-full">
          <TabsList>
            <TabsTrigger value="unassigned">
              Unassigned ({unassignedComplaints.length})
            </TabsTrigger>
            <TabsTrigger value="assigned">
              Assigned ({assignedComplaints.length})
            </TabsTrigger>
            <TabsTrigger value="staff">
              Staff Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="unassigned" className="mt-6">
            {unassignedComplaints.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">No unassigned complaints</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {unassignedComplaints.map((complaint) => (
                  <Card key={complaint.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{complaint.title}</CardTitle>
                          <CardDescription className="mt-1">
                            From: {complaint.student_profile?.full_name || "Unknown"} • {new Date(complaint.created_at).toLocaleDateString()} • {complaint.category}
                          </CardDescription>
                        </div>
                        <StatusBadge status={complaint.status} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{complaint.description}</p>
                      <div className="flex gap-2 items-center">
                        <Select onValueChange={(value) => handleAssignStaff(complaint.id, value)}>
                          <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Assign to staff" />
                          </SelectTrigger>
                          <SelectContent>
                            {staffMembers.map((staff) => (
                              <SelectItem key={staff.id} value={staff.id}>
                                {staff.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/complaint/${complaint.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="assigned" className="mt-6">
            {assignedComplaints.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">No assigned complaints</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {assignedComplaints.map((complaint) => (
                  <Card
                    key={complaint.id}
                    className="hover:shadow-medium transition-shadow cursor-pointer"
                    onClick={() => navigate(`/complaint/${complaint.id}`)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{complaint.title}</CardTitle>
                          <CardDescription className="mt-1">
                            From: {complaint.student_profile?.full_name || "Unknown"} • {new Date(complaint.created_at).toLocaleDateString()} • {complaint.category}
                          </CardDescription>
                        </div>
                        <StatusBadge status={complaint.status} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">{complaint.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="staff" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Current Staff</CardTitle>
                  <CardDescription>Users with staff role</CardDescription>
                </CardHeader>
                <CardContent>
                  {staffMembers.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No staff members yet</p>
                  ) : (
                    <div className="space-y-3">
                      {staffMembers.map((staff) => (
                        <div key={staff.id} className="flex items-center justify-between p-3 border border-border rounded-md">
                          <div>
                            <p className="font-medium">{staff.full_name}</p>
                            <p className="text-sm text-muted-foreground">{staff.email}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDemoteToStudent(staff.id)}
                          >
                            Demote
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>All Users</CardTitle>
                  <CardDescription>Promote students to staff</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {allUsers
                      .filter(user => user.role === "student")
                      .map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 border border-border rounded-md">
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handlePromoteToStaff(user.id)}
                          >
                            Promote to Staff
                          </Button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
