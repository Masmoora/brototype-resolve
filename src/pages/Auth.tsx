import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText } from "lucide-react";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"student" | "staff">("student");
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      navigate("/");
    }

    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;

    const { error } = await signUp(email, password, fullName, selectedRole);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Account created successfully! You can now login.",
      });
      setIsSignUp(false);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-auth-purple p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <div className="bg-white p-3 rounded-lg">
            <FileText className="h-8 w-8 text-auth-purple" />
          </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-auth-orange text-center mb-8">
          {isSignUp ? "Sign Up" : "Sign In"}
        </h1>
        
        <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-6">
          {isSignUp && (
            <div className="space-y-2">
              <Input
                name="fullName"
                type="text"
                placeholder="Full Name"
                className="h-12 bg-white text-foreground placeholder:text-muted-foreground rounded-lg"
                required
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Input
              name="email"
              type="email"
              placeholder="Email"
              className="h-12 bg-white text-foreground placeholder:text-muted-foreground rounded-lg"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Input
              name="password"
              type="password"
              placeholder="Password"
              className="h-12 bg-white text-foreground placeholder:text-muted-foreground rounded-lg"
              required
              minLength={6}
            />
          </div>

          {isSignUp && (
            <div className="space-y-2">
              <Select value={selectedRole} onValueChange={(value: "student" | "staff") => setSelectedRole(value)}>
                <SelectTrigger className="h-12 bg-white text-foreground rounded-lg">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {!isSignUp && (
            <div className="text-center">
              <button type="button" className="text-white text-sm underline hover:no-underline">
                Forgot Password?
              </button>
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full h-12 bg-auth-orange hover:bg-auth-orange/90 text-white font-semibold rounded-lg text-base"
            disabled={isLoading}
          >
            {isLoading ? (isSignUp ? "Creating account..." : "Signing in...") : (isSignUp ? "Sign Up" : "Sign In")}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-white">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-white font-semibold underline hover:no-underline"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
