import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Shield, Smartphone, MessageSquare, Users, Globe } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("resident");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [language, setLanguage] = useState("en");

  // Redirect if already logged in
  if (user) {
    navigate("/");
    return null;
  }

  const handleSendOTP = async () => {
    if (!phone || phone.length !== 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/otp/send", { phone, role });
      setOtpSent(true);
      toast({
        title: "OTP Sent",
        description: `Verification code sent to +91 ${phone}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the complete 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/otp/verify", { 
        phone, 
        otp: otpCode, 
        role 
      });
      const data = await res.json();
      
      if (data.success) {
        toast({
          title: "Login Successful",
          description: "Welcome to GateSphere!",
        });
        navigate("/");
      }
    } catch (error) {
      toast({
        title: "Invalid OTP",
        description: "Please check the OTP and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-whatsapp rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome to GateSphere</CardTitle>
            <CardDescription>
              Secure society management platform
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="role">Select Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resident">Resident</SelectItem>
                      <SelectItem value="guard">Security Guard</SelectItem>
                      <SelectItem value="admin">Society Admin</SelectItem>
                      <SelectItem value="auditor">Auditor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Mobile Number</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground">
                      +91
                    </span>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="rounded-l-none"
                      disabled={otpSent}
                    />
                  </div>
                </div>

                {!otpSent ? (
                  <Button 
                    onClick={handleSendOTP} 
                    className="w-full bg-whatsapp hover:bg-whatsapp-dark"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send OTP"}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Enter OTP</Label>
                      <div className="flex space-x-2">
                        {otp.map((digit, index) => (
                          <Input
                            key={index}
                            id={`otp-${index}`}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className="w-12 h-12 text-center text-lg font-semibold"
                          />
                        ))}
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleVerifyOTP} 
                      className="w-full bg-primary hover:bg-primary/90"
                      disabled={isLoading}
                    >
                      {isLoading ? "Verifying..." : "Verify & Login"}
                    </Button>
                    
                    <div className="text-center">
                      <Button
                        variant="link"
                        onClick={() => {
                          setOtpSent(false);
                          setOtp(["", "", "", "", "", ""]);
                        }}
                        className="text-sm"
                      >
                        Change Number
                      </Button>
                      <span className="mx-2 text-muted-foreground">•</span>
                      <Button
                        variant="link"
                        onClick={handleSendOTP}
                        className="text-sm"
                        disabled={isLoading}
                      >
                        Resend OTP
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="register" className="space-y-4 mt-6">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Registration is handled by society admin. Please contact your society management for access.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Language Selector */}
            <div className="flex items-center justify-center space-x-2 pt-4 border-t">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm text-muted-foreground">Language:</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">EN</SelectItem>
                  <SelectItem value="hi">हिं</SelectItem>
                  <SelectItem value="gu">ગુ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Side - Hero Section */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-whatsapp to-whatsapp-dark p-8 text-white">
        <div className="flex flex-col justify-center max-w-lg mx-auto text-center">
          <h1 className="text-4xl font-bold mb-6">
            Smart Society Management Made Simple
          </h1>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Visitor Management</h3>
                <p className="text-white/80 text-sm">QR-based entry with instant approvals</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Real-time Communication</h3>
                <p className="text-white/80 text-sm">WhatsApp-style messaging & alerts</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Complete Management</h3>
                <p className="text-white/80 text-sm">Staff, maintenance, payments & more</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
            <p className="text-sm text-white/90">
              "GateSphere has transformed how we manage our society. Everything is now digital and efficient!"
            </p>
            <p className="text-xs text-white/70 mt-2">- Priya Sharma, Greenwood Heights</p>
          </div>
        </div>
      </div>
    </div>
  );
}
