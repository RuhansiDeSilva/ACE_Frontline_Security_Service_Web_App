import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, User, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import ProfileNavbar from "@/components/profile/ProfileNavbar";
import { authService, UserProfile, UpdatePersonalInfoRequest } from "@/services/authService";

const EditProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields (matching backend UpdatePersonalInfoRequest)
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [residentialAddress, setResidentialAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await authService.getMyProfile();
        setUser(profile);
        setEmail(profile.email || "");
        setMobileNumber(profile.mobileNumber || "");
        setResidentialAddress(profile.residentialAddress || "");
        setEmergencyContact(profile.emergencyContact || "");
      } catch (err: any) {
        console.error("Failed to load profile:", err);
        if (err?.message?.includes("401") || err?.message?.includes("Unauthorized")) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }
        toast({ title: "Error", description: "Failed to load profile.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: UpdatePersonalInfoRequest = {
        email,
        mobileNumber,
        residentialAddress,
        emergencyContact,
      };
      const updated = await authService.updatePersonalInfo(data);
      setUser(updated);
      toast({ title: "Profile Updated", description: "Your personal information has been saved successfully." });
      navigate(-1);
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      toast({ title: "Update Failed", description: err?.message || "Could not save changes.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-destructive font-medium">Could not load profile</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <ProfileNavbar user={user} onProfileClick={() => navigate(-1)} />
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-2">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <User className="w-5 h-5 text-primary" />
              Edit Profile
            </h1>
          </div>

          {/* Read-only Account Info */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-base font-bold text-foreground mb-1">Account Information</h3>
            <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
              <Lock className="w-3 h-3" /> These fields are set by an administrator and cannot be changed here.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Username</Label>
                <Input value={user.username || ""} disabled className="bg-muted/50 cursor-not-allowed" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Role</Label>
                <Input value={user.role?.replace(/_/g, " ") || ""} disabled className="bg-muted/50 cursor-not-allowed" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Full Name</Label>
                <Input value={user.fullName || ""} disabled className="bg-muted/50 cursor-not-allowed" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">NIC Number</Label>
                <Input value={user.nicNumber || ""} disabled className="bg-muted/50 cursor-not-allowed" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Date of Birth</Label>
                <Input value={user.dateOfBirth || "—"} disabled className="bg-muted/50 cursor-not-allowed" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Sex</Label>
                <Input value={user.sex || "—"} disabled className="bg-muted/50 cursor-not-allowed" />
              </div>
            </div>
          </div>

          {/* Editable Personal Info (matches backend) */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-base font-bold text-foreground mb-4">Personal Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Mobile Number</Label>
                <Input
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="07X-XXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label>Emergency Contact</Label>
                <Input
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="Emergency contact number"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Residential Address</Label>
                <Textarea
                  value={residentialAddress}
                  onChange={(e) => setResidentialAddress(e.target.value)}
                  placeholder="Your residential address"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pb-6">
            <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
