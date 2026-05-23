import { Link } from "react-router-dom";
import { Shield, Lock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import logoImage from "@/assets/logo.png";

const Login = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg">
        <div className="text-center mb-8">
          <img src={logoImage} alt="Ace Front Line Logo" className="h-24 w-24 mx-auto mb-4 rounded-full shadow-lg" />
          <h1 className="text-4xl font-black text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground text-lg">Select your login type to continue</p>
        </div>

        <div className="bg-slate-900 text-slate-100 dark:bg-slate-100 dark:text-slate-900 p-10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(255,255,255,0.05)] border border-white/5 dark:border-black/5 space-y-6 transition-all duration-300">
          <Button asChild size="xl" className="w-full gap-4 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all shadow-lg hover:shadow-primary/20">
            <Link to="/staff-login">
              <Lock className="h-6 w-6" /> Staff Login
            </Link>
          </Button>

          <Button asChild size="xl" className="w-full gap-4 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all shadow-lg hover:shadow-primary/20">
            <Link to="/client-login">
              <Users className="h-6 w-6" /> Client Login
            </Link>
          </Button>

          <p className="text-center text-sm text-muted-foreground pt-4">
            <Link to="/" className="text-primary hover:text-primary/80 transition-colors font-medium">← Back to Home</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
