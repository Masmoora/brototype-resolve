import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Complaint = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "pending" | "in_progress" | "resolved";
  created_at: string;
  student_profile: {
    full_name: string;
  } | null;
};

export default function StaffDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignedComplaints();
  }, [user]);

  const fetchAssignedComplaints = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .eq("assigned_to", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch student profiles separately
      if (data && data.length > 0) {
        const studentIds = data.map(c => c.student_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", studentIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        const complaintsWithProfiles = data.map(c => ({
          ...c,
          student_profile: profileMap.get(c.student_id) || null
        })) as any;
        
        setComplaints(complaintsWithProfiles);
      } else {
        setComplaints([]);
      }
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Assigned Complaints</h2>
          <p className="text-muted-foreground mt-1">Review and resolve complaints assigned to you</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading complaints...</p>
          </div>
        ) : complaints.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No complaints assigned to you yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {complaints.map((complaint) => (
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
                  <div className="mt-4 flex items-center text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    View details & update
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
