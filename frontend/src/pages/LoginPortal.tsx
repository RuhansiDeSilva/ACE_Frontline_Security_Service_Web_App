import { useState } from "react";
import { Shield, Lock, Eye, EyeOff, ArrowLeft, UserCog, Building2, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { extractUserRole } from "@/lib/roleUtils";
import logo from "../assets/images.jpg";

type LoginMode = "select" | "staff" | "client";

export default function LoginPortal() {
  const [mode, setMode] = useState<LoginMode>("select");
  const [staffUsername, setStaffUsername] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [clientUsername, setClientUsername] = useState("");
  const [clientPassword, setClientPassword] = useState("");
  const [showStaffPw, setShowStaffPw] = useState(false);
  const [showClientPw, setShowClientPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Staff login mapping
  const staffDashboardRoutes: Record<string, string> = {
    AREA_MANAGER: "/area-manager",
    SECURITY_OFFICER: "/security-officer",
    ACCOUNT_EXECUTIVE: "/account-executive",
    ACCOUNTANT: "/account-executive",
    OPERATION_MANAGER: "/operational-manager",
    EXECUTIVE_OFFICER: "/executive-officer",
    DIRECTOR: "/director",
    CHAIRMAN: "/chairman",
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffUsername || !staffPassword) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      console.log("Attempting staff login with username:", staffUsername);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: staffUsername, password: staffPassword }),
      });

      console.log("Response status:", res.status, res.statusText);
      
      const raw = await res.text();
      console.log("Raw response:", raw);
      
      let apiResponse: any = null;
      try {
        apiResponse = raw ? JSON.parse(raw) : null;
      } catch (parseErr) {
        console.error("Failed to parse response", parseErr);
        throw new Error(`Server returned invalid JSON: ${raw.substring(0, 100)}`);
      }

      console.log("Parsed response:", apiResponse);

      if (!res.ok) {
        const message = apiResponse?.message || res.statusText;
        throw new Error(`Login error (${res.status}): ${message}`);
      }
      if (!apiResponse?.success) {
        throw new Error(apiResponse?.message || "Invalid credentials");
      }

      const { token, refreshToken, userId, role, username, fullName } = apiResponse.data;
      const normalizedRole = extractUserRole(role);

      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("userId", String(userId));
      localStorage.setItem("userRole", normalizedRole);
      localStorage.setItem("userType", "staff");
      localStorage.setItem("role", normalizedRole);
      const assignedArea = apiResponse.data?.assignedArea || "";
      const basicSalary = apiResponse.data?.basicSalary || 0;
      const designation = apiResponse.data?.designation || "";
      localStorage.setItem("user", JSON.stringify({
        userId: userId,
        username: username,
        fullName: fullName,
        role: normalizedRole,
        userType: "staff",
        assignedArea: assignedArea,
        basicSalary: basicSalary,
        designation: designation,
      }));

      toast({ title: "Login successful", description: "Welcome!" });
      
      console.log("User role:", role, "normalized:", normalizedRole);
      const route = staffDashboardRoutes[normalizedRole] || "/profile";
      console.log("Redirecting to:", route);
      
      navigate(route);    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      console.error("Login error:", err);
      toast({ title: "Login Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientUsername || !clientPassword) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      console.log("Attempting client login with username:", clientUsername);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: clientUsername, password: clientPassword }),
      });

      console.log("Response status:", res.status, res.statusText);
      
      const raw = await res.text();
      console.log("Raw response:", raw);
      
      let apiResponse: any = null;
      try {
        apiResponse = raw ? JSON.parse(raw) : null;
      } catch (parseErr) {
        console.error("Failed to parse response", parseErr);
        throw new Error(`Server returned invalid JSON: ${raw.substring(0, 100)}`);
      }

      console.log("Parsed response:", apiResponse);

      if (!res.ok) {
        const message = apiResponse?.message || res.statusText;
        throw new Error(`Login error (${res.status}): ${message}`);
      }
      if (!apiResponse?.success) {
        throw new Error(apiResponse?.message || "Invalid credentials");
      }

      const loginData = apiResponse.data;
      localStorage.setItem("token", loginData.token);
      localStorage.setItem("refreshToken", loginData.refreshToken);
      localStorage.setItem("userId", String(loginData.userId));
      localStorage.setItem("userType", "client");
      localStorage.setItem("user", JSON.stringify({
        userId: loginData.userId,
        username: loginData.username,
        fullName: loginData.fullName,
        userType: "client",
      }));

      toast({ title: "Login successful", description: `Welcome, ${loginData.fullName}` });
      console.log("Client login successful, redirecting to /client/dashboard");
      navigate("/client/dashboard", { replace: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      console.error("Login error:", err);
      toast({ title: "Login Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          {/* Logo removed */}
          <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
          <p className="text-gray-600">Select your login type to continue</p>
        </div>
        {mode === "select" && (
          <div className="flex flex-col gap-4">
            <Button onClick={() => setMode("staff")} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Staff Login
            </Button>
            <Button onClick={() => setMode("client")} className="bg-gray-200 hover:bg-gray-300 text-gray-800">
              Client Login
            </Button>
            <Link to="/" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="mr-2" /> Back to Home
            </Link>
          </div>
        )}
        {mode === "staff" && (
          <form onSubmit={handleStaffLogin} className="space-y-4">
            <Input
              type="text"
              placeholder="Username"
              value={staffUsername}
              onChange={(e) => setStaffUsername(e.target.value)}
              className="w-full"
            />
            <div className="relative">
              <Input
                type={showStaffPw ? "text" : "password"}
                placeholder="Password"
                value={staffPassword}
                onChange={(e) => setStaffPassword(e.target.value)}
                className="w-full"
              />
              <button
                type="button"
                onClick={() => setShowStaffPw(!showStaffPw)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showStaffPw ? <EyeOff /> : <Eye />}
              </button>
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              Sign In
            </Button>
            <Button onClick={() => setMode("select")} className="w-full text-gray-500 hover:text-gray-700">
              <ArrowLeft className="mr-2" /> Back
            </Button>
          </form>
        )}
        {mode === "client" && (
          <form onSubmit={handleClientLogin} className="space-y-4">
            <Input
              type="text"
              placeholder="Username"
              value={clientUsername}
              onChange={(e) => setClientUsername(e.target.value)}
              className="w-full"
            />
            <div className="relative">
              <Input
                type={showClientPw ? "text" : "password"}
                placeholder="Password"
                value={clientPassword}
                onChange={(e) => setClientPassword(e.target.value)}
                className="w-full"
              />
              <button
                type="button"
                onClick={() => setShowClientPw(!showClientPw)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showClientPw ? <EyeOff /> : <Eye />}
              </button>
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              Sign In
            </Button>
            <Button onClick={() => setMode("select")} className="w-full text-gray-500 hover:text-gray-700">
              <ArrowLeft className="mr-2" /> Back
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
