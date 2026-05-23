import { useRef, useState, useEffect } from "react";
import { UserProfile } from "@/services/authService";
import { Shield, Download, Loader2, QrCode, User, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { QRCodeSVG } from "qrcode.react";
import { getQRUrl } from "@/config/networkConfig";

interface GenerateIDCardProps {
  user: UserProfile;
}

const designationLabels: Record<string, string> = {
  LSO: "Leading Security Officer",
  JSO: "Junior Security Officer",
  SSO: "Senior Security Officer",
  CSO: "Chief Security Officer",
};

const GenerateIDCard = ({ user }: GenerateIDCardProps) => {
  const designation = user.designation
    ? (designationLabels[user.designation] || user.designation)
    : user.role.replace(/_/g, " ");
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [showQR, setShowQR] = useState(true);
  const [activatingQR, setActivatingQR] = useState(false);
  const [qrActivated, setQRActivated] = useState(user.qrActivated || false);
  
  // Check if user is a security officer
  const isSecurityOfficer = user.role?.toUpperCase().includes("SECURITY_OFFICER") || false;

  // Update activation status when user changes
  useEffect(() => {
    setQRActivated(user.qrActivated || false);
  }, [user.qrActivated]);

  const idCode = `SL-${user.designation || "SO"}-${String(user.id).padStart(4, "0")}`;
  const serialCode = `AFL-${user.designation || "SO"}-${String(user.id).padStart(4, "0")}-${user.nicNumber?.slice(-4) || "0000"}`;
  const validUntil = `Dec ${new Date().getFullYear() + 1}`;
  const verifyUrl = getQRUrl(`/verify?name=${encodeURIComponent(user.fullName)}&id=${user.id}`);

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [90, 140] });
      pdf.addImage(imgData, "PNG", 0, 0, 90, 140);
      pdf.save(`ID_Card_${user.fullName.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  const handleActivateQR = async () => {
    if (!isSecurityOfficer) {
      toast.error("Only security officers can activate QR codes");
      return;
    }

    setActivatingQR(true);
    try {
      // Call API to activate QR code for this user
      const response = await fetch(`/api/auth/activate-qr/${user.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to activate QR code");
      }

      setQRActivated(true);
      toast.success("QR Code activated successfully", {
        description: "Your ID card QR code is now active for scanning and verification",
      });
    } catch (error) {
      console.error("QR activation failed:", error);
      toast.error("Failed to activate QR code", {
        description: "Please try again or contact support",
      });
    } finally {
      setActivatingQR(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-base font-bold text-foreground flex items-center gap-2">
        <Shield className="w-4 h-4 text-primary" />
        Employee ID Card
      </h3>
      <div className="max-w-sm mx-auto">
        <div ref={cardRef} className="bg-white rounded-xl border-2 border-amber-300/50 overflow-hidden shadow-lg">
          {/* Header */}
          <div className="bg-amber-500 px-5 py-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-[hsl(0,0%,10%)]" />
              <span className="font-bold text-[hsl(0,0%,10%)] text-sm tracking-wide" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                ACE FRONT LINE SECURITY
              </span>
            </div>
            <p className="text-[10px] text-[hsl(0,0%,10%)]/80 tracking-wider mt-0.5">SECURITY SOLUTIONS (PVT) LTD</p>
          </div>

          {/* Body */}
          <div className="p-5 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full overflow-hidden ring-3 ring-amber-400/30 mb-3 bg-gray-100 flex items-center justify-center">
              {user.photoUrl ? (
                <img src={user.photoUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <h4 className="text-lg font-bold text-[hsl(220,20%,14%)]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{user.fullName}</h4>
            <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider mt-1">{designation}</span>
            <div className="mt-3 w-full space-y-1.5 text-xs text-left">
              <div className="flex justify-between"><span className="text-gray-500">ID</span><span className="font-mono font-semibold text-[hsl(220,20%,14%)]">{idCode}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">NIC</span><span className="font-medium text-[hsl(220,20%,14%)]">{user.nicNumber || "—"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Blood Group</span><span className="font-medium text-[hsl(220,20%,14%)]">{user.bloodGroup || "—"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Valid Until</span><span className="font-medium text-[hsl(220,20%,14%)]">{validUntil}</span></div>
            </div>
            {/* QR Code - Only show for Security Officers */}
            {isSecurityOfficer ? (
              <>
                {showQR && (
                  <div className="mt-4 p-2 bg-white rounded-lg border border-gray-200">
                    <QRCodeSVG value={verifyUrl} size={100} level="M" />
                  </div>
                )}
                {qrActivated && (
                  <div className="mt-3 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-semibold text-green-700 dark:text-green-300">QR Activated</span>
                  </div>
                )}
              </>
            ) : (
              <div className="mt-4 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">QR Available for Security Officers Only</span>
              </div>
            )}
            {/* Serial Code */}
            <div className="mt-2 w-full border-t border-gray-200 pt-2">
              <p className="text-[9px] text-gray-400 uppercase tracking-wider">Serial No.</p>
              <p className="font-mono font-bold text-sm text-[hsl(220,20%,14%)] tracking-widest">{serialCode}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-5 py-2 text-center border-t border-gray-200">
            <p className="text-[9px] text-gray-500">If found, return to Ace Front Line Security office or call +94 11 234 5678</p>
          </div>
        </div>

        <div className="flex justify-center gap-3 mt-4 flex-wrap">
          {isSecurityOfficer && (
            <Button
              variant={showQR ? "default" : "outline"}
              onClick={() => setShowQR(!showQR)}
            >
              <QrCode className="w-4 h-4 mr-2" />
              {showQR ? "Hide QR" : "Show QR"}
            </Button>
          )}
          {isSecurityOfficer && (
            <Button 
              onClick={handleActivateQR}
              disabled={activatingQR || qrActivated}
              className={qrActivated ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}
            >
              {activatingQR ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Activating...
                </>
              ) : qrActivated ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  QR Activated
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4 mr-2" />
                  Activate QR
                </>
              )}
            </Button>
          )}
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleDownloadPDF} disabled={downloading}>
            {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {downloading ? "Generating PDF..." : "Download as PDF"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GenerateIDCard;
