import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { FileText, Search, FolderKanban, UserCheck, MessageSquare, BarChart3 } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FileText className="h-12 w-12 text-primary" />,
      title: "Complaint Submission",
      description: "Users can easily submit complaints through a user-friendly interface."
    },
    {
      icon: <Search className="h-12 w-12 text-primary" />,
      title: "Complaint Tracking",
      description: "Track the status of complaints in real-time from submission to resolution."
    },
    {
      icon: <FolderKanban className="h-12 w-12 text-primary" />,
      title: "Complaint Categorization",
      description: "Organize complaints by category for better analysis and reporting."
    },
    {
      icon: <UserCheck className="h-12 w-12 text-primary" />,
      title: "Complaint Assignment",
      description: "Assign complaints to specific staff or teams for efficient handling."
    },
    {
      icon: <MessageSquare className="h-12 w-12 text-primary" />,
      title: "Communication Management",
      description: "Communicate with students throughout the complaint resolution process by the staff."
    },
    {
      icon: <BarChart3 className="h-12 w-12 text-primary" />,
      title: "Reporting & Analysis",
      description: "Generate reports and insights on complaint trends and performance."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">BroDesk</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => navigate("/auth")} variant="ghost" className="hover:bg-primary/10">
                Sign In
              </Button>
              <Button onClick={() => navigate("/auth")} className="bg-primary hover:bg-primary/90">
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-accent/5 to-background py-24">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Welcome to <span className="text-primary">BroDesk</span>
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
            BroDesk is a simple and organized platform for students to submit complaints and for staff to resolve them efficiently
          </p>
          <Button 
            onClick={() => navigate("/auth")} 
            size="lg" 
            className="text-lg px-10 py-7 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-foreground mb-16">
          Key Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card/50 backdrop-blur-sm"
            >
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4 p-3 rounded-full bg-primary/10 w-fit mx-auto">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p className="text-sm">© 2025 BroDesk. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
