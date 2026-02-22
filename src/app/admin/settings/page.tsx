"use client";

import { Save, Mail, Globe, Server, User, Key, Lock, Loader2, Plus, Trash2, Unlock, AlertCircle, CheckCircle, Edit, Shield, Code, ToggleLeft, ToggleRight, Info, X, Eye, EyeOff } from "lucide-react";

import Card from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getSmtpSettings, saveSmtpSettings, testSmtpConnection, SmtpConfig, getSmtpAccounts, saveSmtpAccount, deleteSmtpAccount, SmtpAccount, getRecaptchaConfig, saveRecaptchaConfig, getTrackingPixels, saveTrackingPixel, updateTrackingPixel, deleteTrackingPixel, toggleTrackingPixel, RecaptchaConfig, TrackingPixel, getAllSettingsData } from "@/actions/settings";
import { sendDiagnosticTestEmail } from "@/actions/email";
import { getUsers, deleteUser, unlockUser, updateUser, changePassword, AdminUser } from "@/actions/users";
import { createAdminUser } from "@/actions/auth";
import { useToast } from "@/lib/toast";
import { PageContainer, PageHeader } from "@/components/ui/PageContainer";

const VALID_PURPOSES = [
  { id: 'general', name: 'General', description: 'Standard system notifications' },
  { id: 'marketing', name: 'Marketing', description: 'Newsletters and campaigns' },
  { id: 'transactional', name: 'Transactional', description: 'Orders, receipts, invoices' },
  { id: 'notifications', name: 'Notifications', description: 'Alerts and activities' },
  { id: 'password_reset', name: 'Password Reset', description: 'Security codes and resets' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"channels" | "users" | "integrations">("channels");
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // SMTP Accounts State
  const [smtpAccounts, setSmtpAccounts] = useState<SmtpAccount[]>([]);
  const [editingAccount, setEditingAccount] = useState<SmtpAccount | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const [showAddAccount, setShowAddAccount] = useState(false);
  
  // Diagnostics State
  const [diagnosticLog, setDiagnosticLog] = useState<any>(null);
  const [testEmailTo, setTestEmailTo] = useState("");
  const [testLoading, setTestLoading] = useState(false);

  const [newAccount, setNewAccount] = useState({
    name: '',
    host: '',
    port: '',
    username: '',
    password: '',
    secure: false,
    encryption: 'auto' as 'auto' | 'ssl' | 'starttls' | 'none',
    from_name: '',
    reply_to: '',
    purposes: ['general'] as string[],
    is_default: false,
  });

  // Users State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "admin" });
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editingUserData, setEditingUserData] = useState({ name: "", email: "", role: "admin" });
  const [changingPasswordFor, setChangingPasswordFor] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [recaptchaConfig, setRecaptchaConfig] = useState<RecaptchaConfig | null>(null);
  const [recaptchaForm, setRecaptchaForm] = useState({ 
    siteKey: "", 
    secretKey: "", 
    isEnabled: false,
    provider: "google_v2" as RecaptchaConfig['provider']
  });
  const [pixels, setPixels] = useState<TrackingPixel[]>([]);
  const [showAddPixel, setShowAddPixel] = useState(false);
  const [newPixel, setNewPixel] = useState({ name: "", type: "google_analytics", code: "", isEnabled: true });
  const [editingPixel, setEditingPixel] = useState<TrackingPixel | null>(null);
  const [pixelToDelete, setPixelToDelete] = useState<string | null>(null);

  const [initialLoading, setInitialLoading] = useState(true);

  // Optimized Initial Load
  useEffect(() => {
      async function init() {
         try {
           setInitialLoading(true);
           const data = await getAllSettingsData();
           
           if (data.accounts) setSmtpAccounts(data.accounts);
           if (data.users) setUsers(data.users);
           
           if (data.recaptcha) {
             setRecaptchaConfig(data.recaptcha);
             setRecaptchaForm({
               siteKey: data.recaptcha.site_key || "",
               secretKey: data.recaptcha.secret_key || "",
               isEnabled: Boolean(data.recaptcha.is_enabled),
               provider: (data.recaptcha.provider as any) || 'google_v2'
             });
           } else {
             setRecaptchaForm({
               siteKey: "",
               secretKey: "",
               isEnabled: false,
               provider: "google_v2"
             });
           }
           if (data.pixels) setPixels(data.pixels);

         } catch (e) {
           console.error("Critical Error loading settings:", e);
           addToast("Failed to load settings. Please refresh.", "error");
         } finally {
           setInitialLoading(false);
         }
      }
      init();
    }, []);

  // Handle change password query param
  useEffect(() => {
    const changePasswordFor = searchParams.get("changePasswordFor");
    console.log('[SettingsPage] Query param changePasswordFor:', changePasswordFor);
    if (changePasswordFor) {
      console.log('[SettingsPage] Setting active tab to users and changing password for:', changePasswordFor);
      setActiveTab("users");
      setChangingPasswordFor(changePasswordFor);
      // Clean up URL parameter
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete("changePasswordFor");
      const newUrl = `${window.location.pathname}${newSearchParams.toString() ? '?' + newSearchParams.toString() : ''}`;
      console.log('[SettingsPage] Cleaning URL, new URL:', newUrl);
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

   async function loadSmtpAccounts() {
     try {
       const accounts = await getSmtpAccounts();
       setSmtpAccounts(accounts);
     } catch (e) { console.error(e); }
   }

   async function loadUsers() {
    const data = await getUsers();
    setUsers(data);
  }

  async function loadIntegrations() {
    try {
      const [recaptchaData, pixelsData] = await Promise.all([
        getRecaptchaConfig(),
        getTrackingPixels()
      ]);
      
      if (recaptchaData) {
        setRecaptchaConfig(recaptchaData);
        setRecaptchaForm({
          siteKey: recaptchaData.site_key || "",
          secretKey: recaptchaData.secret_key || "",
          isEnabled: Boolean(recaptchaData.is_enabled),
          provider: (recaptchaData.provider as any) || 'google_v2'
        });
      }
      if (pixelsData) setPixels(pixelsData);
    } catch (e) { 
      console.error("Error loading integrations:", e); 
    }
  }

   // Handlers
   const handleRunDiagnostics = async (account: any, recipient: string) => {
      setTestLoading(true);
      setDiagnosticLog(null);
      try {
        const config = {
          id: account.id,
          host: account.host,
          port: String(account.port),
          user: account.username,
          pass: account.password,
          from_name: account.from_name,
          reply_to: account.reply_to,
        };
        const result = await sendDiagnosticTestEmail(config, recipient);
        setDiagnosticLog(result);
        
        if (result.success) {
           addToast("Test email sent successfully!", "success");
        } else {
           addToast("Test failed. Check diagnostics.", "error");
        }
      } catch (e: any) {
        setDiagnosticLog({ success: false, error: e.message, details: e });
         addToast("Critical error running diagnostics", "error");
      } finally {
        setTestLoading(false);
      }
   };

   // SMTP Accounts Handlers
   const handleSaveSmtpAccount = async () => {
     setLoading(true);
     try {
       await saveSmtpAccount(newAccount as any);
        addToast("Channel saved successfully", "success");
       setShowAddAccount(false);
        setNewAccount({
          name: '', host: '', port: '', username: '', password: '', secure: false, encryption: 'auto', from_name: '', reply_to: '', purposes: ['general'], is_default: false,
        });
       await loadSmtpAccounts();
      } catch (error: unknown) {
        addToast("Failed to save: " + (error instanceof Error ? error.message : String(error)), "error");
      } finally {
        setLoading(false);
      }
   };

   const handleEditSmtpAccount = (account: SmtpAccount) => {
     setEditingAccount(account);
     setDiagnosticLog(null); // Reset logs when opening new account
   };

   const handleSaveEditSmtpAccount = async () => {
     if (!editingAccount) return;
     setLoading(true);
     try {
       await saveSmtpAccount(editingAccount);
       addToast("Channel updated successfully", "success");
       setEditingAccount(null);
       await loadSmtpAccounts();
      } catch (error: unknown) {
        addToast("Failed to update: " + (error instanceof Error ? error.message : String(error)), "error");
      } finally {
        setLoading(false);
      }
   };

   const handleDeleteSmtpAccount = (id: string) => {
     setAccountToDelete(id);
   };

   const handleDeleteSmtpAccountConfirm = async () => {
     if (!accountToDelete) return;
     setLoading(true);
     try {
       await deleteSmtpAccount(accountToDelete);
       addToast("Channel deleted successfully", "success");
       setAccountToDelete(null);
       await loadSmtpAccounts();
      } catch (error: unknown) {
        addToast("Failed to delete: " + (error instanceof Error ? error.message : String(error)), "error");
      } finally {
        setLoading(false);
      }
   };

    // User Handlers
    const handleAddUser = async () => {
     if (!newUser.name) {
       addToast("Please enter a name for the user", "error");
       return;
     }
     if (!newUser.email) {
       addToast("Please enter an email address", "error");
       return;
     }
     if (!newUser.email.includes('@')) {
       addToast("Please enter a valid email address", "error");
       return;
     }
     if (!newUser.password) {
       addToast("Please enter a password", "error");
       return;
     }
     if (newUser.password.length < 6) {
       addToast("Password must be at least 6 characters", "error");
       return;
     }

     setLoading(true);
     const res = await createAdminUser(newUser);
     setLoading(false);

     if (res.success) {
       setShowAddUser(false);
       setNewUser({ name: "", email: "", password: "", role: "admin" });
       loadUsers();
       addToast("User created successfully", "success");
     } else {
       addToast(res.error || "Failed to create user", "error");
     }
   };

  const handleDeleteUser = async (id: string) => {
    setUserToDelete(id);
  };

  const handleDeleteUserConfirm = async () => {
    if (!userToDelete) return;
    const result = await deleteUser(userToDelete);
    if (result.success) {
      addToast("User deleted successfully", "success");
      loadUsers();
    } else {
      addToast("Failed to delete user: " + result.error, "error");
    }
    setUserToDelete(null);
  };

  const handleUnlockUser = async (id: string) => {
    await unlockUser(id);
    loadUsers();
  };

  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user);
    setEditingUserData({ name: user.name, email: user.email, role: user.role });
  };

  const handleSaveEditUser = async () => {
    if (!editingUser) return;
    setLoading(true);
    try {
      const res = await updateUser(editingUser.id, editingUserData);
      if (res.success) {
        setEditingUser(null);
        await loadUsers();
        addToast("User updated successfully", "success");
      } else {
        addToast("Failed to update user: " + res.error, "error");
      }
    } catch {
      addToast("Error updating user", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetEmail = async (user: AdminUser) => {
    setLoading(true);
    try {
      const { sendEmail } = await import("@/actions/email");
      const resetLink = `${window.location.origin}/reset-password?token=${user.id}`; // Simplificado para exemplo
      
      const res = await sendEmail(
        user.email,
        "Password Reset Request - SocialBluePro",
        `<h1>Password Reset</h1><p>You requested a password reset. Click below to continue:</p><a href="${resetLink}">Reset My Password</a>`,
        true,
        'password_reset'
      );

      if (res.success) {
        addToast("Reset email sent to " + user.email, "success");
      } else {
        addToast("Failed to send email: " + res.error, "error");
      }
    } catch (e) {
      addToast("Error sending reset email", "error");
    } finally {
      setLoading(false);
    }
  };

    const handleChangePassword = async (userId: string) => {
     if (!newPassword || !confirmPassword) {
       addToast("Please enter and confirm new password", "error");
       return;
     }
     if (newPassword !== confirmPassword) {
       addToast("Passwords do not match", "error");
       return;
     }
     setLoading(true);
     try {
       const res = await changePassword(userId, newPassword);
       if (res.success) {
         setChangingPasswordFor(null);
         setNewPassword("");
         setConfirmPassword("");
         addToast("Password changed successfully", "success");
         loadUsers();
       } else {
         addToast("Failed to change password: " + res.error, "error");
       }
     } catch {
       addToast("Error changing password", "error");
     } finally {
       setLoading(false);
     }
  };

  // Integrations Handlers
  const handleSaveRecaptcha = async () => {
    setLoading(true);
    try {
      await saveRecaptchaConfig(recaptchaForm.siteKey, recaptchaForm.secretKey, recaptchaForm.isEnabled, recaptchaForm.provider);
      addToast("reCAPTCHA settings saved successfully", "success");
      loadIntegrations();
    } catch (error: unknown) {
      addToast("Failed to save reCAPTCHA: " + (error instanceof Error ? error.message : String(error)), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePixel = async () => {
    setLoading(true);
    try {
      await saveTrackingPixel(newPixel as any);
      addToast("Tracking pixel saved successfully", "success");
      loadIntegrations();
      setShowAddPixel(false);
      setNewPixel({ name: "", type: "google_analytics", code: "", isEnabled: true });
    } catch (error: unknown) {
      addToast("Failed to save tracking pixel: " + (error instanceof Error ? error.message : String(error)), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePixel = async () => {
    if (!editingPixel) return;
    setLoading(true);
    try {
      await updateTrackingPixel(editingPixel.id, editingPixel as any);
      addToast("Tracking pixel updated successfully", "success");
      loadIntegrations();
      setEditingPixel(null);
    } catch (error: unknown) {
      addToast("Failed to update tracking pixel: " + (error instanceof Error ? error.message : String(error)), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePixel = (id: string) => {
    setPixelToDelete(id);
  };

  const handleDeletePixelConfirm = async () => {
    if (!pixelToDelete) return;
    setLoading(true);
    try {
      await deleteTrackingPixel(pixelToDelete);
      addToast("Tracking pixel deleted successfully", "success");
      loadIntegrations();
      setPixelToDelete(null);
    } catch (error: unknown) {
      addToast("Failed to delete tracking pixel: " + (error instanceof Error ? error.message : String(error)), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePixel = async (id: string, isEnabled: boolean) => {
    setLoading(true);
    try {
      await toggleTrackingPixel(id, isEnabled);
      addToast(`Pixel ${isEnabled ? 'enabled' : 'disabled'} successfully`, "success");
      loadIntegrations();
    } catch (error: unknown) {
      addToast("Failed to toggle tracking pixel: " + (error instanceof Error ? error.message : String(error)), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditPixel = (pixel: TrackingPixel) => {
    setEditingPixel(pixel);
  };

  const getPixelTypeColor = (type: string) => {
    const colors = {
      google_analytics: "bg-orange-100 text-orange-700",
      google_ads: "bg-blue-100 text-blue-700",
      facebook_pixel: "bg-indigo-100 text-indigo-700",
      tiktok_pixel: "bg-pink-100 text-pink-700",
      custom: "bg-purple-100 text-purple-700",
    };
    return colors[type as keyof typeof colors] || "bg-slate-100 text-slate-700";
  };

  return (
     <PageContainer className="space-y-6 sm:space-y-8 pb-16 sm:pb-20">
       <PageHeader
         title="System Settings"
         description="Configure environment, security, and access."
       />

      <div className="flex gap-2 sm:gap-4 border-b border-slate-200 overflow-x-auto">
         {["channels", "users", "integrations"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as "channels" | "users" | "integrations")}
               className={`pb-2 sm:pb-3 px-1 font-black uppercase text-[10px] sm:text-xs tracking-widest transition-colors flex items-center whitespace-nowrap ${
                 activeTab === tab ? "text-accent border-b-2 border-accent" : "text-slate-400 hover:text-slate-600"
               }`}
            >
              {tab === "channels" ? "Email" : tab === "users" ? "Users" : "Integrations"}
            </button>
          ))}
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">
           
            {/* EMAIL CHANNELS TAB */}
            {activeTab === "channels" && (
              <section className="bg-white p-3 sm:p-4 md:p-6 lg:p-8 rounded-xl sm:rounded-2xl md:rounded-3xl border border-slate-100 shadow-xl space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 sm:gap-3 md:gap-4 text-accent">
                    <Server size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
                    <div>
                      <h2 className="text-sm sm:text-base md:text-lg font-black uppercase tracking-tighter text-slate-900">Email Channels</h2>
                      <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest hidden sm:block">Manage SMTP Servers</p>
                    </div>
                  </div>
 <button 
                     onClick={() => setShowAddAccount(!showAddAccount)} 
                     className="flex items-center gap-1.5 sm:gap-2 bg-slate-900 text-white px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95 w-full sm:w-auto justify-center"
                   >
                     <Plus size={12} className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" /> <span className="sm:hidden">Add</span><span className="hidden sm:inline">Add Channel</span>
                   </button>
                </div>

               {/* Add Account Form */}
               {showAddAccount && (
                 <div className="bg-slate-50 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 space-y-4 sm:space-y-6 animate-slide-down">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Plus size={18} />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">New Channel Configuration</h3>
                  </div>

                   {/* Basic Info */}
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-400 uppercase ml-1">Channel Name</label>
                        <input 
                          placeholder="e.g. Marketing Sender"
                          className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          value={newAccount.name}
                          onChange={e => setNewAccount({...newAccount, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-400 uppercase ml-1">Purposes</label>
                        <div className="flex flex-wrap gap-2 bg-white p-2 rounded-xl border border-slate-200 min-h-[46px]">
                          {VALID_PURPOSES.map(p => (
                             <button
                               key={p.id}
                               onClick={() => {
                                 const active = newAccount.purposes.includes(p.id);
                                 setNewAccount({
                                   ...newAccount,
                                   purposes: active 
                                     ? newAccount.purposes.filter(x => x !== p.id)
                                     : [...newAccount.purposes, p.id]
                                 });
                               }}
                               className={`text-xs uppercase font-black px-2 py-1 rounded-lg transition-colors ${
                                 newAccount.purposes.includes(p.id) ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                               }`}
                             >
                               {p.name}
                             </button>
                          ))}
                        </div>
                      </div>
                   </div>

                   {/* Server Details */}
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                     <div className="sm:col-span-1 md:col-span-3 space-y-1">
                         <label className="text-xs font-black text-slate-400 uppercase ml-1">SMTP Host</label>
                        <input 
                          placeholder="smtp.provider.com"
                          className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          value={newAccount.host}
                          onChange={e => setNewAccount({...newAccount, host: e.target.value})}
                        />
                     </div>
                     <div className="space-y-1">
                         <label className="text-xs font-black text-slate-400 uppercase ml-1">Port</label>
                        <input 
                          placeholder="587"
                          className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          value={newAccount.port}
                          onChange={e => setNewAccount({...newAccount, port: e.target.value})}
                        />
                     </div>
                   </div>

                   {/* Auth & Security */}
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-400 uppercase ml-1">Username / API User</label>
                        <input
                          className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          value={newAccount.username}
                          onChange={e => setNewAccount({...newAccount, username: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-400 uppercase ml-1">Password / API Key</label>
                        <input
                          type="password"
                          className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          value={newAccount.password}
                          onChange={e => setNewAccount({...newAccount, password: e.target.value})}
                        />
                      </div>
                  </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-400 uppercase">Encryption Mode</label>
                        <select
                          className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          value={newAccount.encryption}
                          onChange={e => setNewAccount({...newAccount, encryption: e.target.value as any})}
                        >
                          <option value="auto">Auto (Detect based on port)</option>
                          <option value="starttls">STARTTLS (Port 587)</option>
                          <option value="ssl">SSL/TLS (Port 465)</option>
                          <option value="none">None (Insecure)</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-3 pt-6 px-2">
                        <input 
                          type="checkbox"
                          id="new-default"
                          checked={newAccount.is_default}
                          onChange={e => setNewAccount({...newAccount, is_default: e.target.checked})}
                          className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                        />
                        <label htmlFor="new-default" className="text-sm font-bold text-slate-700 cursor-pointer">Set as Default Channel</label>
                      </div>
                   </div>

                   {/* Sender Identity */}
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                      <div className="space-y-1">
                       <label className="text-xs font-black text-slate-400 uppercase ml-1">Sender Name (Optional)</label>
                       <input 
                         placeholder="e.g. SocialBlue Support"
                         className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                         value={newAccount.from_name}
                         onChange={e => setNewAccount({...newAccount, from_name: e.target.value})}
                       />
                     </div>
                      <div className="space-y-1">
                       <label className="text-xs font-black text-slate-400 uppercase ml-1">Reply-To Email (Optional)</label>
                       <input 
                         placeholder="support@domain.com"
                         className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                         value={newAccount.reply_to}
                         onChange={e => setNewAccount({...newAccount, reply_to: e.target.value})}
                       />
                     </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <button onClick={() => setShowAddAccount(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors text-xs uppercase tracking-widest">Cancel</button>
                    <button onClick={handleSaveSmtpAccount} disabled={loading} className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20">
                      {loading ? "Saving..." : "Save Channel"}
                    </button>
                  </div>
                </div>
              )}

              {/* List of Accounts */}
              <div className="space-y-4">
                {smtpAccounts.length === 0 && !showAddAccount && (
                   <div className="text-center py-8 sm:py-12 bg-slate-50 rounded-2xl sm:rounded-3xl border-2 border-dashed border-slate-200">
                     <Mail size={36} className="mx-auto text-slate-300 mb-3 sm:mb-4 sm:w-12 sm:h-12" />
                     <h3 className="text-slate-900 font-bold mb-1 text-sm sm:text-base">No Email Channels</h3>
                     <p className="text-slate-400 text-xs sm:text-sm mb-4 sm:mb-6">Configure an SMTP server to start sending emails.</p>
                     <button onClick={() => setShowAddAccount(true)} className="text-blue-600 font-black uppercase text-xs tracking-widest hover:underline px-4 py-2">Create Channel</button>
                   </div>
                )}

                 {smtpAccounts.map(account => (
                   <div key={account.id} className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-6 hover:shadow-lg hover:border-slate-300 transition-all">
                      <div className="flex flex-col gap-3 sm:gap-4">
                         <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${account.is_default ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                              <Server size={18} className="sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2 flex-wrap">
                                <span className="truncate">{account.name}</span>
                                {account.is_default && <span className="bg-green-100 text-green-700 text-xs font-black px-2 py-0.5 rounded-md uppercase tracking-wide shrink-0">Default</span>}
                              </h3>
                               <p className="text-xs text-slate-500 font-mono mt-1 truncate">{account.username} • {account.host}:{account.port}</p>
                            </div>
                         </div>

                         <div className="flex items-center gap-2 sm:gap-3 w-full justify-between sm:justify-end pt-2 border-t border-slate-100 sm:border-t-0">
                            <div className="flex flex-wrap gap-1 max-w-[150px] sm:max-w-[200px]">
                              {account.purposes.map(p => (
                                <span key={p} className="text-xs font-black uppercase bg-slate-100 text-slate-500 px-2 py-1 rounded-md tracking-wider">
                                  {p}
                                </span>
                              ))}
                            </div>
                            <div className="hidden sm:block w-px h-8 bg-slate-100 mx-2"></div>
                            <div className="flex gap-1 sm:gap-2">
                               <button onClick={() => handleEditSmtpAccount(account)} className="p-1.5 sm:p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={16} className="sm:w-[18px] sm:h-[18px]" /></button>
                               <button onClick={() => setAccountToDelete(account.id)} className="p-1.5 sm:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" /></button>
                            </div>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
            </section>
          )}

            {/* EDIT ACCOUNT MODAL (With Diagnostics) */}
            {editingAccount && (
              <div className="fixed inset-0 z-[200] flex items-start sm:items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in overflow-y-auto max-h-screen">
                 <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full animate-slide-up my-4 sm:my-auto max-h-[90vh] sm:max-h-none overflow-y-auto sm:overflow-visible">
                    <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-start sm:items-center gap-3">
                      <h3 className="text-base sm:text-lg font-black uppercase tracking-tighter text-slate-900 flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="p-1.5 sm:p-2 bg-blue-50 text-blue-600 rounded-lg flex-shrink-0"><Edit size={18} className="sm:w-5 sm:h-5" /></div>
                        <span className="truncate">Edit: <span className="text-blue-600">{editingAccount.name}</span></span>
                      </h3>
                      <button onClick={() => setEditingAccount(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
                        <X size={20} className="sm:w-6 sm:h-6" />
                      </button>
                    </div>

                     <div className="p-4 sm:p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                      {/* Left: Configuration Form */}
                      <div className="space-y-6">
                          <div className="space-y-4">
                             <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Configuration</h4>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-xs font-black text-slate-400 uppercase">Host</label>
                                  <input value={editingAccount.host} onChange={e => setEditingAccount({...editingAccount, host: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500" />
                                </div>
                                 <div className="space-y-1">
                                   <label className="text-xs font-black text-slate-400 uppercase">Port</label>
                                   <input value={editingAccount.port} onChange={e => setEditingAccount({...editingAccount, port: Number(e.target.value)})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500" />
                                 </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                 <div className="space-y-1">
                                   <label className="text-xs font-black text-slate-400 uppercase">User</label>
                                   <input value={editingAccount.username} onChange={e => setEditingAccount({...editingAccount, username: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500" />
                                 </div>
                                 <div className="space-y-1">
                                   <label className="text-xs font-black text-slate-400 uppercase">Pass</label>
                                   <input type="password" value={editingAccount.password} onChange={e => setEditingAccount({...editingAccount, password: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500" />
                                 </div>
                             </div>
                             <div className="space-y-1">
                               <label className="text-xs font-black text-slate-400 uppercase">Encryption</label>
                               <select value={editingAccount.encryption || 'auto'} onChange={e => setEditingAccount({...editingAccount, encryption: e.target.value as any})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500">
                                 <option value="auto">Auto (Detect)</option>
                                 <option value="ssl">SSL (465)</option>
                                 <option value="starttls">STARTTLS (587)</option>
                                 <option value="none">None</option>
                               </select>
                             </div>
                          </div>
                          
                          <div className="space-y-4">
                             <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Identity</h4>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                               <div className="space-y-1">
                                  <label className="text-xs font-black text-slate-400 uppercase">From Name</label>
                                  <input value={editingAccount.from_name || ''} onChange={e => setEditingAccount({...editingAccount, from_name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500" />
                               </div>
                               <div className="space-y-1">
                                  <label className="text-xs font-black text-slate-400 uppercase">Reply-To</label>
                                  <input value={editingAccount.reply_to || ''} onChange={e => setEditingAccount({...editingAccount, reply_to: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500" />
                               </div>
                             </div>
                          </div>

                          <div className="space-y-4 min-w-0">
                             <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Settings</h4>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                               {VALID_PURPOSES.map(p => (
                                  <div
                                    key={p.id}
                                    onClick={() => {
                                      const active = editingAccount.purposes.includes(p.id);
                                      setEditingAccount({
                                        ...editingAccount,
                                        purposes: active 
                                          ? editingAccount.purposes.filter(x => x !== p.id)
                                          : [...editingAccount.purposes, p.id]
                                      });
                                    }}
                                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col gap-1.5 group relative min-w-0 ${
                                      editingAccount.purposes.includes(p.id)
                                        ? "border-blue-500 bg-blue-50/50"
                                        : "border-slate-100 bg-white hover:border-slate-200"
                                    }`}
                                   >
                                      <div className="flex flex-col gap-1.5 min-w-0">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className={`text-[10px] font-black uppercase tracking-wide truncate ${editingAccount.purposes.includes(p.id) ? "text-blue-600" : "text-slate-600"}`}>
                                            {p.name}
                                          </span>
                                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${editingAccount.purposes.includes(p.id) ? "border-blue-500 bg-blue-500" : "border-slate-200 bg-transparent"}`}>
                                            {editingAccount.purposes.includes(p.id) && <CheckCircle size={10} className="text-white" />}
                                          </div>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium leading-tight">
                                          {p.description}
                                        </p>
                                      </div>
                                   </div>
                               ))}
                             </div>
                            <div className="flex items-center gap-2 pt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <input type="checkbox" id="edit-default" checked={editingAccount.is_default} onChange={e => setEditingAccount({...editingAccount, is_default: e.target.checked})} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                              <label htmlFor="edit-default" className="text-xs font-bold text-slate-700 cursor-pointer">Use as Default Channel</label>
                            </div>
                         </div>

                         <div className="flex gap-3 pt-4">
                            <button 
                              onClick={() => setEditingAccount(null)} 
                              className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={handleSaveEditSmtpAccount}
                              disabled={loading}
                              className="flex-[2] flex items-center justify-center gap-2 bg-blue-600 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/10 active:scale-95 disabled:opacity-50"
                            >
                              {loading ? <Loader2 className="animate-spin" size={14} /> : <><Save size={14} className="sm:w-4 sm:h-4" /> Save Changes</>}
                            </button>
                         </div>
                      </div>

                      {/* Right: Diagnostics Console */}
                      <div className="bg-slate-900 rounded-2xl p-6 text-slate-300 flex flex-col h-full border border-slate-800 shadow-inner">
                         <div className="flex items-center gap-2 mb-6 text-emerald-400">
                           <Code size={20} />
                           <h4 className="text-sm font-black uppercase tracking-widest">Diagnostics Console</h4>
                         </div>
                         
                         <div className="space-y-4 mb-6">
                           <label className="text-xs font-black text-slate-500 uppercase block">Test Recipient</label>
                           <div className="flex gap-2">
                             <input 
                               value={testEmailTo} 
                               onChange={e => setTestEmailTo(e.target.value)} 
                               placeholder="you@example.com"
                               className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-emerald-500 transition-colors"
                             />
                             <button 
                               onClick={() => handleRunDiagnostics(editingAccount, testEmailTo)}
                               disabled={!testEmailTo || testLoading}
                               className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                             >
                               {testLoading ? <Loader2 className="animate-spin" size={16} /> : "Run Test"}
                             </button>
                           </div>
                         </div>

                         <div className="flex-1 bg-black/50 rounded-xl p-4 font-mono text-xs overflow-y-auto border border-slate-800 relative group">
                            {!diagnosticLog ? (
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 opacity-50">
                                <Server size={32} className="mb-2" />
                                <p>Ready to test connection...</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                 <div className={`flex items-center gap-2 font-bold ${diagnosticLog.success ? 'text-emerald-400' : 'text-red-400'}`}>
                                   {diagnosticLog.success ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                   {diagnosticLog.success ? 'SUCCESS' : 'FAILED'}
                                 </div>
                                 {diagnosticLog.messageId && <div><span className="text-slate-500">Message ID:</span> <span className="text-blue-400">{diagnosticLog.messageId}</span></div>}
                                 {diagnosticLog.error && <div><span className="text-slate-500">Error:</span> <span className="text-red-400">{diagnosticLog.error}</span></div>}
                                 
                                 {diagnosticLog.details && (
                                   <div className="mt-4 pt-4 border-t border-slate-800">
<p className="text-xs text-slate-500 uppercase font-black mb-2">Raw Log Output</p>
                                      <pre className="whitespace-pre-wrap break-all text-slate-400 text-xs leading-relaxed">
                                       {JSON.stringify(diagnosticLog.details, null, 2)}
                                     </pre>
                                   </div>
                                 )}
                              </div>
                            )}
                         </div>
                      </div>
                   </div>
                </div>
             </div>
           )}

            {/* Delete SMTP Confirmation Modal */}
            {accountToDelete && (
              <div className="fixed inset-0 z-[200] flex items-start sm:items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto max-h-screen">
                <div 
                  className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" 
                  onClick={() => setAccountToDelete(null)}
                />
                <div className="relative w-full max-w-sm bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 my-4 sm:my-auto">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <Trash2 size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black tracking-tighter uppercase text-slate-900 mb-3 sm:mb-4 text-center">Delete Channel?</h3>
                  <p className="text-slate-500 text-sm mb-4 sm:mb-6 text-center leading-relaxed">Are you sure you want to delete this SMTP channel? This action cannot be undone and emails using this channel will stop working.</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setAccountToDelete(null)}
                      className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteSmtpAccountConfirm}
                      disabled={loading}
                      className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-red-600 text-white font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50"
                    >
                      {loading ? "..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            )}

           {/* USERS TAB */}
           {activeTab === "users" && (
             <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xl space-y-4 sm:space-y-6 md:space-y-8 animate-fade-in">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <div className="flex items-center gap-3 sm:gap-4 text-accent">
                   <User size={20} className="sm:w-6 sm:h-6" />
                   <h2 className="text-base sm:text-lg font-black uppercase tracking-tighter text-slate-900">Admin Users</h2>
                 </div>
                 <button 
                   onClick={() => setShowAddUser(!showAddUser)} 
                   className="flex items-center gap-2 bg-slate-900 text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95 w-full sm:w-auto justify-center"
                 >
                   <Plus size={14} className="sm:w-4 sm:h-4" /> <span className="sm:hidden">Add</span><span className="hidden sm:inline">Add User</span>
                 </button>
               </div>

               {showAddUser && (
                 <div className="bg-slate-50 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl mt-4 sm:mt-6 animate-slide-down border border-slate-200 shadow-inner space-y-4 sm:space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Plus size={18} /></div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">New Administrator</h3>
                  </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                     <div className="space-y-1">
                       <label className="text-xs font-black text-slate-400 uppercase ml-1">Full Name</label>
                       <input 
                         placeholder="John Doe" 
                         value={newUser.name}
                         onChange={e => setNewUser({...newUser, name: e.target.value})}
                         className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-900 text-sm"
                       />
                     </div>
                     <div className="space-y-1">
                       <label className="text-xs font-black text-slate-400 uppercase ml-1">Email Address</label>
                       <input 
                         placeholder="john@socialbluepro.com" 
                         value={newUser.email}
                         onChange={e => setNewUser({...newUser, email: e.target.value})}
                         className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-900 text-sm"
                       />
                     </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-400 uppercase ml-1">Password</label>
                      <div className="relative">
                        <input 
                          type={showNewUserPassword ? "text" : "password"}
                          placeholder="•••••••" 
                          value={newUser.password}
                          onChange={e => setNewUser({...newUser, password: e.target.value})}
                          className="w-full px-4 py-3 pr-12 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-900 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showNewUserPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
<label className="text-xs font-black text-slate-400 uppercase ml-1">Access Level (Role)</label>
                      <select 
                        value={newUser.role}
                        onChange={e => setNewUser({...newUser, role: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-900 text-sm appearance-none cursor-pointer"
                      >
                        <option value="admin">Administrator (Full Access)</option>
                        <option value="editor">Editor (Limited Access)</option>
                        <option value="viewer">Viewer (Read Only)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                     <button onClick={() => setShowAddUser(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors text-xs uppercase tracking-widest">Cancel</button>
                     <button 
                       onClick={handleAddUser}
                       disabled={loading}
                       className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all"
                     >
                       {loading ? <Loader2 className="animate-spin" size={16} /> : "Create User"}
                     </button>
                  </div>
                </div>
              )}

              {/* Desktop Table - hidden on mobile */}
              <div className="hidden lg:block overflow-x-auto mt-6">
                <div className="min-w-[600px] overflow-hidden rounded-xl border border-slate-100">
                  <Table border={false}>
                    <TableHeader backgroundColor="slate-50" textSize="xs">
                      <TableRow hover={false}>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map(user => (
                        <TableRow key={user.id}>
                          <TableCell className="font-bold text-slate-900">{user.name}</TableCell>
                          <TableCell className="text-slate-500">{user.email}</TableCell>
                          <TableCell><span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-xs font-black uppercase">{user.role}</span></TableCell>
                          <TableCell>
                             {user.locked_until && new Date(user.locked_until) > new Date() ? (
                               <span className="bg-red-50 text-red-600 px-2 py-1 rounded-md text-xs font-black uppercase flex items-center gap-1 w-fit"><Lock size={10} /> Locked</span>
                             ) : (
                               <span className="bg-green-50 text-green-600 px-2 py-1 rounded-md text-xs font-black uppercase flex items-center gap-1 w-fit"><CheckCircle size={10} /> Active</span>
                             )}
                          </TableCell>
                          <TableCell className="text-right">
                             <div className="flex justify-end gap-1 sm:gap-2">
                                {user.locked_until && new Date(user.locked_until) > new Date() && (
                                  <button onClick={() => handleUnlockUser(user.id)} className="p-1.5 sm:p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors" title="Unlock User Account"><Unlock size={14} className="sm:w-4 sm:h-4" /></button>
                                )}
                                <button onClick={() => handleSendResetEmail(user)} className="p-1.5 sm:p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Send Password Reset Email"><Mail size={14} className="sm:w-4 sm:h-4" /></button>
                                <button onClick={() => setChangingPasswordFor(user.id)} className="p-1.5 sm:p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Force Password Change"><Key size={14} className="sm:w-4 sm:h-4" /></button>
                                <button onClick={() => handleEditUser(user)} className="p-1.5 sm:p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Edit User Details"><Edit size={14} className="sm:w-4 sm:h-4" /></button>
                                <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 sm:p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete User Account"><Trash2 size={14} className="sm:w-4 sm:h-4" /></button>
                             </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Mobile Cards - visible only on mobile */}
              <div className="lg:hidden mt-6 space-y-3">
                {users.map(user => (
                  <div key={user.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    {/* User Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    
                    {/* Role & Status */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-xs font-black uppercase">{user.role}</span>
                      {user.locked_until && new Date(user.locked_until) > new Date() ? (
                        <span className="bg-red-50 text-red-600 px-2 py-1 rounded-md text-xs font-black uppercase flex items-center gap-1"><Lock size={10} /> Locked</span>
                      ) : (
                        <span className="bg-green-50 text-green-600 px-2 py-1 rounded-md text-xs font-black uppercase flex items-center gap-1"><CheckCircle size={10} /> Active</span>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-400 font-medium">Actions</span>
                      <div className="flex items-center gap-1">
                        {user.locked_until && new Date(user.locked_until) > new Date() && (
                          <button onClick={() => handleUnlockUser(user.id)} className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors" title="Unlock User Account"><Unlock size={16} /></button>
                        )}
                        <button onClick={() => handleSendResetEmail(user)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Send Password Reset Email"><Mail size={16} /></button>
                        <button onClick={() => setChangingPasswordFor(user.id)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Force Password Change"><Key size={16} /></button>
                        <button onClick={() => handleEditUser(user)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Edit User Details"><Edit size={16} /></button>
                        <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete User Account"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

           {/* INTEGRATIONS TAB */}
           {activeTab === "integrations" && (
             <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-fade-in">
               
                {/* Bot Protection Card */}
                <section className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xl">
                  <div className="p-4 sm:p-6 md:p-8 border-b border-slate-50">
                   <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center gap-3 text-slate-800">
                       <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                         <Shield size={20} className="sm:w-6 sm:h-6" />
                       </div>
                       <div>
                         <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">Bot Protection</h2>
                         <p className="text-xs sm:text-xs font-bold text-slate-400 uppercase tracking-widest">reCAPTCHA / Turnstile Configuration</p>
                       </div>
                     </div>
                   </div>
                 </div>

                 <div className="p-4 sm:p-6 md:p-8 bg-slate-50/50 space-y-4 sm:space-y-6 md:space-y-8">
                   {/* Toggle Switch */}
                   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm gap-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-800 uppercase tracking-wide">Enable Protection</span>
                      <span className="text-xs text-slate-500 font-medium mt-1">Protect login and public forms against bots</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={recaptchaForm.isEnabled}
                        onChange={(e) => setRecaptchaForm({...recaptchaForm, isEnabled: e.target.checked})}
                        className="sr-only peer" 
                      />
                      <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                   <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 transition-opacity duration-300 ${!recaptchaForm.isEnabled ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[11px] uppercase font-black text-slate-500 ml-1">Service Provider</label>
                        <div className="relative">
                          <select
                            value={recaptchaForm.provider}
                            onChange={(e) => setRecaptchaForm({...recaptchaForm, provider: e.target.value as any})}
                            className="w-full px-4 py-4 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-700 text-sm appearance-none cursor-pointer"
                          >
                            <option value="google_v2">Google reCAPTCHA v2 (Checkbox)</option>
                            <option value="google_v3">Google reCAPTCHA v3 (Invisible)</option>
                            <option value="cloudflare_turnstile">Cloudflare Turnstile</option>
                            <option value="hcaptcha">hCaptcha</option>
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <Server size={16} />
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <p className="text-xs font-bold text-blue-600 flex items-center gap-2 mb-2">
                          <Info size={14} />
                          CONFIGURATION LINKS
                        </p>
                        <div className="flex flex-wrap gap-3">
                          <a href="https://www.google.com/recaptcha/admin" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:text-blue-700 hover:underline font-black uppercase transition-colors">Google Admin</a>
                          <span className="text-blue-200">|</span>
                          <a href="https://dash.cloudflare.com/?to=/:account/turnstile" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:text-blue-700 hover:underline font-black uppercase transition-colors">Cloudflare Dash</a>
                          <span className="text-blue-200">|</span>
                          <a href="https://dashboard.hcaptcha.com/" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:text-blue-700 hover:underline font-black uppercase transition-colors">hCaptcha Admin</a>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[11px] uppercase font-black text-slate-500 ml-1">Site Key (Public)</label>
                        <div className="relative">
                          <input 
                            value={recaptchaForm.siteKey}
                            onChange={(e) => setRecaptchaForm({...recaptchaForm, siteKey: e.target.value})}
                            placeholder="e.g. 6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                            className="w-full px-4 py-4 pl-11 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono font-medium text-slate-700 text-sm"
                          />
                          <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[11px] uppercase font-black text-slate-500 ml-1">Secret Key (Private)</label>
                        <div className="relative">
                          <input 
                            type="password"
                            value={recaptchaForm.secretKey}
                            onChange={(e) => setRecaptchaForm({...recaptchaForm, secretKey: e.target.value})}
                            placeholder="••••••••••••••••••••••••••••••••"
                            className="w-full px-4 py-4 pl-11 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono font-medium text-slate-700 text-sm"
                          />
                          <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                        </div>
                      </div>
                    </div>
                  </div>

                     <div className="pt-4 border-t border-slate-200 flex justify-end">
                       <button
                         onClick={handleSaveRecaptcha}
                         disabled={loading}
                         className="flex items-center gap-2 bg-indigo-600 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/10 active:scale-95 disabled:opacity-50"
                       >
                         {loading ? <Loader2 className="animate-spin" size={14} /> : <><Save size={14} className="sm:w-4 sm:h-4" /> <span className="sm:hidden">Save</span><span className="hidden sm:inline">Save Protection</span></>}
                       </button>
                     </div>
                </div>
              </section>

                {/* Tracking Pixels Section */}
                <section className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xl">
                  <div className="p-4 sm:p-6 md:p-8 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
                    <div className="flex items-center gap-3 text-slate-800">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                        <Code size={20} className="sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">Tracking Pixels</h2>
                        <p className="text-xs sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Analytics & Conversion Scripts</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setShowAddPixel(true);
                        setNewPixel({ name: "", type: "google_analytics", code: "", isEnabled: true });
                      }}
                      className="flex items-center gap-2 bg-slate-900 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95 w-full sm:w-auto justify-center"
                    >
                      <Plus size={14} className="sm:w-4 sm:h-4" /> <span className="sm:hidden">Add Pixel</span><span className="hidden sm:inline">Add New Pixel</span>
                    </button>
                  </div>

                  <div className="p-4 sm:p-6 md:p-8 bg-slate-50/50 relative">
                   {pixels.length === 0 ? (
                     <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center group hover:border-slate-300 transition-colors">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Code className="text-slate-400" size={32} />
                      </div>
                      <h3 className="text-slate-900 font-bold text-lg mb-1">No pixels configured</h3>
                      <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">Add tracking codes like Google Analytics or Facebook Pixel to monitor your traffic.</p>
                      <button 
                        onClick={() => setShowAddPixel(true)}
                        className="text-blue-600 font-black text-xs uppercase tracking-widest hover:underline"
                      >
                        Create your first pixel
                      </button>
                    </div>
                   ) : (
                      <div className="grid gap-3 sm:gap-4">
                        {pixels.map(pixel => (
                          <div key={pixel.id} className={`group bg-white rounded-lg sm:rounded-xl border ${pixel.is_enabled ? 'border-l-4 border-l-green-500 border-y-slate-100 border-r-slate-100' : 'border-l-4 border-l-slate-300 border-y-slate-100 border-r-slate-100'} p-4 sm:p-5 transition-all hover:shadow-lg hover:-translate-y-0.5 relative`}>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                              <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                                <div className={`p-2.5 sm:p-3 rounded-lg shrink-0 ${pixel.is_enabled ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                  <Code size={18} className="sm:w-5 sm:h-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 flex-wrap">
                                    <span className="truncate">{pixel.name}</span>
                                    {!pixel.is_enabled && <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full shrink-0">DISABLED</span>}
                                  </h3>
                                  <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">{pixel.code}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end pt-2 sm:pt-0 border-t border-slate-100 sm:border-t-0 flex-shrink-0">
                                <span className={`text-xs font-black uppercase tracking-widest px-2 sm:px-3 py-1 rounded-md ${getPixelTypeColor(pixel.type)}`}>
                                  {pixel.type.replace('_', ' ')}
                                </span>
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <button 
                                    onClick={() => handleTogglePixel(pixel.id, !pixel.is_enabled)}
                                    className={`p-2 sm:p-2.5 rounded-lg transition-colors ${pixel.is_enabled ? 'text-slate-400 hover:text-orange-500 hover:bg-orange-50' : 'text-slate-400 hover:text-green-500 hover:bg-green-50'} cursor-pointer`}
                                    title={pixel.is_enabled ? "Disable" : "Enable"}
                                  >
                                    {pixel.is_enabled ? <ToggleRight size={18} className="sm:w-5 sm:h-5" /> : <ToggleLeft size={18} className="sm:w-5 sm:h-5" />}
                                  </button>
                                  <button 
                                    onClick={() => handleEditPixel(pixel)}
                                    className="p-2 sm:p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                    title="Edit"
                                  >
                                    <Edit size={18} className="sm:w-5 sm:h-5" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeletePixel(pixel.id)}
                                    className="p-2 sm:p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    title="Delete"
                                  >
                                    <Trash2 size={18} className="sm:w-5 sm:h-5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                 </div>
               </section>

               {/* Add Pixel Modal */}
               {showAddPixel && (
                 <div className="fixed inset-0 z-[200] flex items-start sm:items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in overflow-y-auto max-h-screen">
                   <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full animate-slide-up my-4 sm:my-auto">
                    <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 mb-6 flex items-center gap-3">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Plus size={20} /></div>
                      Add Tracking Pixel
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <label className="text-[11px] uppercase font-black text-slate-500 ml-1">Pixel Name</label>
                        <input 
                          value={newPixel.name}
                          onChange={(e) => setNewPixel({...newPixel, name: e.target.value})}
                          placeholder="Google Analytics GA4"
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-slate-900 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] uppercase font-black text-slate-500 ml-1">Pixel Type</label>
                        <select
                          value={newPixel.type}
                          onChange={(e) => setNewPixel({...newPixel, type: e.target.value as any})}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-slate-900 text-sm appearance-none cursor-pointer"
                        >
                          <option value="google_analytics">Google Analytics</option>
                          <option value="google_ads">Google Ads</option>
                          <option value="facebook_pixel">Facebook Pixel</option>
                          <option value="tiktok_pixel">TikTok Pixel</option>
                          <option value="custom">Custom HTML/Script</option>
                        </select>
                      </div>
                       <div>
                         <label className="text-[11px] uppercase font-black text-slate-500 ml-1">
                           {newPixel.type === "custom" ? "Custom Script / HTML" : "Pixel Code / ID"}
                         </label>
                         {newPixel.type === "custom" ? (
                           <textarea
                             value={newPixel.code}
                             onChange={(e) => setNewPixel({...newPixel, code: e.target.value})}
                             placeholder="<!-- Paste your custom script here -->&#10;<script>&#10;  // Your tracking code&#10;</script>"
                             rows={6}
                             className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-sm resize-y min-h-[120px]"
                           />
                         ) : (
                           <input
                             value={newPixel.code}
                             onChange={(e) => setNewPixel({...newPixel, code: e.target.value})}
                             placeholder="e.g. G-XXXXXXXXXX"
                             className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono font-medium text-slate-900 text-sm"
                           />
                         )}
                         <p className="text-xs text-slate-400 mt-1 ml-1">
                           {newPixel.type === "custom" 
                             ? "Paste the full script tag or inline JavaScript code." 
                             : "Just the ID (e.g. G-12345) or full script tag if Custom."}
                         </p>
                       </div>
                      <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <input type="checkbox" 
                          id="new-pixel-enable"
                          checked={newPixel.isEnabled}
                          onChange={(e) => setNewPixel({...newPixel, isEnabled: e.target.checked})}
                          className="w-5 h-5 accent-blue-600 cursor-pointer"
                        />
                        <label htmlFor="new-pixel-enable" className="text-sm font-bold text-slate-700 cursor-pointer">Enable immediately</label>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <button 
                          onClick={handleSavePixel}
                          disabled={loading}
                          className="flex-1 bg-slate-900 text-white px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
                        >
                          {loading ? "Adding..." : "Save Pixel"}
                        </button>
                        <button 
                          onClick={() => {
                            setShowAddPixel(false);
                            setNewPixel({ name: "", type: "google_analytics", code: "", isEnabled: true });
                          }}
                          className="flex-1 px-6 py-4 rounded-xl bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

               {/* Edit Pixel Modal */}
               {editingPixel && (
                 <div className="fixed inset-0 z-[200] flex items-start sm:items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in overflow-y-auto max-h-screen">
                   <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full animate-slide-up my-4 sm:my-auto">
                    <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 mb-6 flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Edit size={20} /></div>
                      Edit Tracking Pixel
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <label className="text-[11px] uppercase font-black text-slate-500 ml-1">Pixel Name</label>
                        <input 
                          value={editingPixel.name}
                          onChange={(e) => setEditingPixel({...editingPixel, name: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-slate-900 text-sm"
                        />
                      </div>
                       <div>
                         <label className="text-[11px] uppercase font-black text-slate-500 ml-1">Pixel Type</label>
                         <select
                           value={editingPixel.type}
                           onChange={(e) => setEditingPixel({...editingPixel, type: e.target.value as any})}
                           className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-slate-900 text-sm appearance-none cursor-pointer"
                         >
                           <option value="google_analytics">Google Analytics</option>
                           <option value="google_ads">Google Ads</option>
                           <option value="facebook_pixel">Facebook Pixel</option>
                           <option value="tiktok_pixel">TikTok Pixel</option>
                           <option value="custom">Custom HTML/Script</option>
                         </select>
                       </div>
                       <div>
                         <label className="text-[11px] uppercase font-black text-slate-500 ml-1">
                           {editingPixel.type === "custom" ? "Custom Script / HTML" : "Pixel Code"}
                         </label>
                         {editingPixel.type === "custom" ? (
                           <textarea
                             value={editingPixel.code}
                             onChange={(e) => setEditingPixel({...editingPixel, code: e.target.value})}
                             rows={6}
                             className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-sm resize-y min-h-[120px]"
                           />
                         ) : (
                           <input
                             value={editingPixel.code}
                             onChange={(e) => setEditingPixel({...editingPixel, code: e.target.value})}
                             className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono font-medium text-slate-900 text-sm"
                           />
                         )}
                       </div>
                      <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <input type="checkbox" 
                          id="edit-pixel-enable"
                          checked={editingPixel.is_enabled}
                          onChange={(e) => setEditingPixel({...editingPixel, is_enabled: e.target.checked})}
                          className="w-5 h-5 accent-blue-600 cursor-pointer"
                        />
                        <label htmlFor="edit-pixel-enable" className="text-sm font-bold text-slate-700 cursor-pointer">Pixel Enabled</label>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={handleUpdatePixel}
                          disabled={loading}
                          className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50"
                        >
                          {loading ? "Updating..." : "Save Changes"}
                        </button>
                        <button 
                          onClick={() => setEditingPixel(null)}
                          className="flex-1 px-6 py-4 rounded-xl bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

               {/* Delete Pixel Confirmation Modal */}
               {pixelToDelete && (
                 <div className="fixed inset-0 z-[200] flex items-start sm:items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in overflow-y-auto max-h-screen">
                   <div className="relative w-full max-w-sm bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 animate-scale-in my-4 sm:my-auto">
                     <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                       <Trash2 size={20} className="sm:w-6 sm:h-6" />
                     </div>
                     <h3 className="text-base sm:text-lg font-black uppercase tracking-tighter text-slate-900 mb-2 text-center">Delete Pixel?</h3>
                     <p className="text-slate-500 text-sm mb-6 sm:mb-8 text-center leading-relaxed">Are you sure you want to remove this tracking pixel? This action cannot be undone and tracking will stop immediately.</p>
                     <div className="flex gap-3">
                       <button 
                         onClick={() => setPixelToDelete(null)}
                         className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                       >
                         Cancel
                       </button>
                       <button 
                         onClick={handleDeletePixelConfirm}
                         disabled={loading}
                         className="flex-1 bg-red-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50"
                       >
                         {loading ? "..." : "Delete"}
                       </button>
                     </div>
                   </div>
                 </div>
               )}
            </div>
          )}
        </div>

        {/* Sidebar Status */}
        <div className="space-y-6">
           <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-[60px] -mr-16 -mt-16" />
             <div className="relative z-10">
               <Globe className="text-accent mb-4" size={24} />
               <h3 className="text-xl font-black uppercase tracking-tighter leading-tight mb-4">System <br/> Health</h3>
               <div className="space-y-4">
                 <div className="flex justify-between items-center text-xs border-b border-white/10 pb-2">
                   <span className="text-slate-400">Database</span>
                   <span className="text-accent font-bold">Connected</span>
                 </div>
                 <div className="flex justify-between items-center text-xs border-b border-white/10 pb-2">
                   <span className="text-slate-400">SMTP Relay</span>
                   <span className={smtpAccounts.some(a => a.is_default) ? "text-accent font-bold" : "text-red-400 font-bold"}>
                     {smtpAccounts.some(a => a.is_default) ? "Configured" : "Missing"}
                   </span>
                 </div>
               </div>
             </div>
           </div>
        </div>
       </div>

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 z-[200] flex items-start sm:items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in overflow-y-auto max-h-screen">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full animate-slide-up overflow-hidden my-4 sm:my-auto">
              <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tighter text-slate-900 flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Edit size={18} className="sm:w-5 sm:h-5" /></div>
                  <span className="truncate">Edit: <span className="text-blue-600">{editingUser.name}</span></span>
                </h3>
                <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors shrink-0"><X size={20} className="sm:w-6 sm:h-6" /></button>
              </div>
              
              <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-400 uppercase ml-1">Full Name</label>
                    <input 
                      value={editingUserData.name}
                      onChange={e => setEditingUserData({...editingUserData, name: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-900 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-400 uppercase ml-1">Email Address</label>
                    <input 
                      value={editingUserData.email}
                      onChange={e => setEditingUserData({...editingUserData, email: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-900 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-400 uppercase ml-1">Access Level (Role)</label>
                    <select 
                      value={editingUserData.role}
                      onChange={e => setEditingUserData({...editingUserData, role: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-900 text-sm appearance-none cursor-pointer"
                    >
                      <option value="admin">Administrator (Full Access)</option>
                      <option value="editor">Editor (Limited Access)</option>
                      <option value="viewer">Viewer (Read Only)</option>
                    </select>
                  </div>
                </div>

                 <div className="flex gap-3 pt-4 border-t border-slate-100">
                   <button onClick={() => setEditingUser(null)} className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-xs uppercase tracking-widest">Cancel</button>
                   <button 
                     onClick={handleSaveEditUser}
                     disabled={loading}
                     className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all"
                   >
                     {loading ? <Loader2 className="animate-spin" size={14} /> : "Update"}
                   </button>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal for User */}
        {userToDelete && (
          <div className="fixed inset-0 z-[200] flex items-start sm:items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto max-h-screen">
            <div 
              className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" 
              onClick={() => setUserToDelete(null)}
            />
            <div className="relative w-full max-w-sm bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 my-4 sm:my-auto">
              <h3 className="text-base sm:text-lg font-black tracking-tighter uppercase text-slate-900 mb-3 sm:mb-4">Delete User</h3>
              <p className="text-slate-500 text-sm mb-4 sm:mb-6">Are you sure you want to delete this user? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUserConfirm}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-red-600 text-white font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {changingPasswordFor && (
                <div className="fixed inset-0 z-[200] flex items-start sm:items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in overflow-y-auto max-h-screen">
                  <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-2xl max-w-sm w-full animate-slide-up my-4 sm:my-auto">
                    <h3 className="text-lg sm:text-xl font-black uppercase tracking-tighter text-slate-900 mb-4 sm:mb-6 flex items-center gap-3">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Key size={18} className="sm:w-5 sm:h-5" /></div>
                      Change Password
                    </h3>
                    <div className="space-y-4 sm:space-y-6">
                      <div className="relative">
                        <input 
                          type={showNewPassword ? "text" : "password"}
                          placeholder="New Password" 
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3 pr-12 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-slate-900 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <div className="relative">
                        <input 
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm Password" 
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-3 pr-12 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-slate-900 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                       <div className="flex gap-3 pt-4">
                         <button
                           onClick={() => handleChangePassword(changingPasswordFor)}
                           disabled={loading}
                           className="flex-1 bg-accent text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-black text-xs uppercase tracking-widest hover:bg-green-600 transition-all disabled:opacity-50"
                         >
                           {loading ? "Changing..." : "Change"}
                         </button>
                         <button
                           onClick={() => {
                             setChangingPasswordFor(null);
                             setNewPassword("");
                             setConfirmPassword("");
                           }}
                           className="flex-1 bg-slate-100 text-slate-600 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                         >
                           Cancel
                         </button>
                       </div>
                    </div>
                  </div>
                </div>
        )}

       <style jsx global>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-slide-down {
          animation: slideDown 0.3s ease-out;
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
        .animate-scale-in {
          animation: scaleIn 0.2s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}      </style>

    </PageContainer>
  );
}
