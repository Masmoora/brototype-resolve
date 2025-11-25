import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Navbar } from "@/components/Navbar";
import { ArrowLeft } from "lucide-react";

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  created_at: string;
  student_profile: {
    full_name: string;
  };
}

export default function StaffComplaints() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchComplaints();
    }
  }, [user]);

  const fetchComplaints = async () => {
    const { data, error } = await supabase
      .from("complaints")
      .select(`
        *,
        student_profile:profiles!complaints_student_id_fkey(full_name)
      `)
      .eq("assigned_to", user?.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setComplaints(data as any);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-6">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/staff/home")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Assigned Complaints</h1>
          <p className="text-muted-foreground">Manage and resolve complaints</p>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Loading complaints...</p>
        ) : complaints.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No complaints assigned yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {complaints.map((complaint) => (
              <Card
                key={complaint.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/complaint/${complaint.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{complaint.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Student: {complaint.student_profile?.full_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(complaint.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusBadge status={complaint.status as "pending" | "in_progress" | "resolved"} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-2 mb-2">
                    {complaint.description}
                  </p>
                  <div className="flex gap-2 text-sm">
                    <span className="px-3 py-1 bg-secondary rounded-full">
                      {complaint.category}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
