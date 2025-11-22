import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileText, MessageSquare, AlertCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

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
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

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

  // Filter complaints based on search and filters
  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = 
      searchQuery === "" ||
      complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.student_profile?.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || complaint.status === statusFilter;
    const matchesStaff = staffFilter === "all" || complaint.assigned_to === staffFilter;
    
    return matchesSearch && matchesStatus && matchesStaff;
  });

  // Sort complaints
  const sortedComplaints = [...filteredComplaints].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "oldest":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "student":
        const nameA = a.student_profile?.full_name || "";
        const nameB = b.student_profile?.full_name || "";
        return nameA.localeCompare(nameB);
      case "title":
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const unassignedComplaints = sortedComplaints.filter(c => !c.assigned_to);
  const assignedComplaints = sortedComplaints.filter(c => c.assigned_to);

  // Analytics calculations
  const pendingCount = complaints.filter(c => c.status === "pending").length;
  const inProgressCount = complaints.filter(c => c.status === "in_progress").length;
  const resolvedCount = complaints.filter(c => c.status === "resolved").length;
  const unassignedCount = complaints.filter(c => !c.assigned_to).length;

  // Status chart data
  const statusChartData = [
    { name: "Pending", value: pendingCount, color: "hsl(var(--pending))" },
    { name: "In Progress", value: inProgressCount, color: "hsl(var(--in-progress))" },
    { name: "Resolved", value: resolvedCount, color: "hsl(var(--resolved))" },
  ];

  // Category chart data
  const categoryData = complaints.reduce((acc, complaint) => {
    const category = complaint.category;
    const existing = acc.find(item => item.name === category);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: category, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // Last 7 days data
  const last7DaysData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateString = date.toISOString().split('T')[0];
    const count = complaints.filter(c => c.created_at.startsWith(dateString)).length;
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      complaints: count
    };
  });

  // Overdue complaints (pending for more than 3 days without assignment)
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const overdueComplaints = complaints.filter(c => 
    c.status === "pending" && 
    !c.assigned_to && 
    new Date(c.created_at) < threeDaysAgo
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Admin Dashboard</h2>
          <p className="text-muted-foreground mt-1">Manage complaints and assign to staff</p>
        </div>

        {/* Notification Area */}
        {(unassignedCount > 0 || overdueComplaints.length > 0) && (
          <div className="mb-6 space-y-3">
            {unassignedCount > 0 && (
              <Card className="border-l-4 border-l-pending bg-card">
                <CardContent className="flex items-center gap-3 py-4">
                  <AlertCircle className="h-5 w-5 text-pending" />
                  <div>
                    <p className="font-medium text-foreground">
                      {unassignedCount} complaint{unassignedCount !== 1 ? 's' : ''} pending assignment
                    </p>
                    <p className="text-sm text-muted-foreground">
                      These complaints need to be assigned to staff members
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            {overdueComplaints.length > 0 && (
              <Card className="border-l-4 border-l-destructive bg-card">
                <CardContent className="flex items-center gap-3 py-4">
                  <Clock className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-medium text-foreground">
                      {overdueComplaints.length} complaint{overdueComplaints.length !== 1 ? 's' : ''} overdue
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Pending for more than 3 days without assignment
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Search by title or student name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Select value={staffFilter} onValueChange={setStaffFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {staffMembers.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="student">Student Name</SelectItem>
                  <SelectItem value="title">Title (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-foreground mb-4">Analytics Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Last 7 Days Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Complaints Last 7 Days</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={last7DaysData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      stroke="hsl(var(--border))"
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      stroke="hsl(var(--border))"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="complaints" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px' }}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryData.slice(0, 5).map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-foreground capitalize">{category.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${(category.value / complaints.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-foreground w-8 text-right">
                          {category.value}
                        </span>
                      </div>
                    </div>
                  ))}
                  {categoryData.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
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
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{complaint.description}</p>
                      <div className="flex gap-2 items-center">
                        <Select onValueChange={(value) => handleAssignStaff(complaint.id, value)}>
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Quick assign..." />
                          </SelectTrigger>
                          <SelectContent className="bg-popover z-50">
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
                {assignedComplaints.map((complaint) => {
                  const assignedStaff = staffMembers.find(s => s.id === complaint.assigned_to);
                  return (
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
                              From: {complaint.student_profile?.full_name || "Unknown"} • 
                              Assigned to: {assignedStaff?.full_name || "Unknown"} • 
                              {new Date(complaint.created_at).toLocaleDateString()} • 
                              {complaint.category}
                            </CardDescription>
                          </div>
                          <StatusBadge status={complaint.status} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">{complaint.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
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
