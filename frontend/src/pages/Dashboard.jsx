import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  PlusCircle,
  Users,
  CreditCard,
  ChevronRight,
  X,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Wallet,
  DollarSign,
  ArrowRight,
  Clock,
  UserCheck,
  Check,
  Loader2,
  Utensils,
  Plane,
  ShoppingBag,
  Film,
  Zap,
  HeartPulse,
  GraduationCap,
  Plus,
  HelpCircle,
  Search
} from "lucide-react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import Toast from "../components/Toast";
import ConfirmationModal from "../components/ConfirmationModal";

const PRESET_GRADIENTS = [
  { value: "gradient:emerald-teal", classes: "from-emerald-400 via-teal-500 to-emerald-600" },
  { value: "gradient:blue-indigo", classes: "from-blue-400 via-indigo-500 to-blue-600" },
  { value: "gradient:purple-pink", classes: "from-purple-400 via-pink-500 to-rose-500" },
  { value: "gradient:orange-red", classes: "from-orange-400 via-red-500 to-rose-600" }
];

const CATEGORY_MAP = {
  Food: { icon: Utensils, bg: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  Travel: { icon: Plane, bg: "bg-sky-50 text-sky-600 border-sky-100" },
  Shopping: { icon: ShoppingBag, bg: "bg-rose-50 text-rose-600 border-rose-100" },
  Entertainment: { icon: Film, bg: "bg-indigo-50 text-indigo-600 border-indigo-100" },
  Bills: { icon: Zap, bg: "bg-amber-50 text-amber-600 border-amber-100" },
  Healthcare: { icon: HeartPulse, bg: "bg-red-50 text-red-600 border-red-100" },
  Education: { icon: GraduationCap, bg: "bg-violet-50 text-violet-600 border-violet-100" },
  Other: { icon: DollarSign, bg: "bg-slate-50 text-slate-600 border-slate-100" },
};

const formatCurrency = (value) => {
  const n = Number(value);
  if (Number.isNaN(n)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quick Action Choose Group Modal State
  const [quickAddExpenseOpen, setQuickAddExpenseOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState("");

  // Create Group Modal State
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [createGroupName, setCreateGroupName] = useState("");
  const [createGroupDesc, setCreateGroupDesc] = useState("");
  const [createGroupPhoto, setCreateGroupPhoto] = useState("gradient:emerald-teal");
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [selectedFriendIds, setSelectedFriendIds] = useState([]);
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [createGroupError, setCreateGroupError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
    confirmText: "Confirm",
    type: "danger",
    loading: false
  });

  // Toasts notifications
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load backend summaries
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const userRes = await API.get("/users/current-user");
      setUser(userRes.data.data);

      const res = await API.get("/dashboard");
      const dash = res.data.data || {};

      // Enrich groups and calculate user-wide total expenses
      let totalSpentSum = 0;
      const groupList = dash.groups || [];
      const enrichedGroups = await Promise.all(
        groupList.map(async (g) => {
          try {
            const detailsRes = await API.get(`/groups/${g.groupId}`);
            const details = detailsRes.data.data;

            const expRes = await API.get(`/expenses/group/${g.groupId}`);
            const groupExps = expRes.data.data || [];
            const spent = groupExps.reduce((sum, e) => sum + (e.isDeleted ? 0 : e.totalAmount), 0);
            totalSpentSum += spent;

            let recentActivity = "No recent activity";
            if (groupExps.length > 0) {
              const latest = groupExps.reduce((latest, current) => {
                return new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest;
              }, groupExps[0]);
              recentActivity = `Added "${latest.title}" (₹${latest.totalAmount})`;
            }

            return {
              ...g,
              memberCount: details.members?.length || 0,
              groupPhoto: details.groupPhoto || "",
              recentActivity,
              members: details.members || []
            };
          } catch (err) {
            console.error(`Error enriching group ${g.groupId}`, err);
            return {
              ...g,
              memberCount: 0,
              groupPhoto: "",
              recentActivity: "Error loading statistics",
              members: []
            };
          }
        })
      );

      setDashboardData({
        ...dash,
        groups: enrichedGroups,
        totalExpenses: totalSpentSum
      });
    } catch (err) {
      console.error("Error loading dashboard data", err);
      addToast("Failed to fetch dashboard summaries.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Open Create Group modal and load friends list
  const openCreateGroup = async () => {
    setCreateGroupName("");
    setCreateGroupDesc("");
    setCreateGroupPhoto("gradient:emerald-teal");
    setSelectedFriendIds([]);
    setFriendSearchQuery("");
    setCreateGroupError("");
    setCreateGroupOpen(true);
    setFriendsLoading(true);
    try {
      const res = await API.get("/friends/friends");
      setFriends(res.data.data || []);
    } catch (err) {
      console.error(err);
      addToast("Failed to fetch friends list.", "error");
    } finally {
      setFriendsLoading(false);
    }
  };

  const handleFriendSelectionToggle = (friendId) => {
    setSelectedFriendIds((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const addableFriends = useMemo(() => {
    if (!friends) return [];
    return friends.filter(
      (f) =>
        f.name.toLowerCase().includes(friendSearchQuery.toLowerCase()) ||
        f.email.toLowerCase().includes(friendSearchQuery.toLowerCase())
    );
  }, [friends, friendSearchQuery]);

  // Submit Create Group
  const handleCreateGroupSubmit = async (e) => {
    e.preventDefault();
    setCreateGroupError("");

    const name = createGroupName.trim();
    if (!name) {
      setCreateGroupError("Please enter a group name.");
      return;
    }

    if (selectedFriendIds.length === 0) {
      setCreateGroupError("Select at least 1 friend to form a group.");
      return;
    }

    setCreateLoading(true);
    try {
      const payload = {
        name,
        description: createGroupDesc.trim(),
        groupPhoto: createGroupPhoto,
        members: selectedFriendIds
      };

      const res = await API.post("/groups", payload);
      const newGroup = res.data.data;
      addToast("Group created successfully!", "success");
      setCreateGroupOpen(false);
      navigate(`/groups/${newGroup._id}`);
    } catch (err) {
      console.error(err);
      setCreateGroupError(err.response?.data?.message || "Failed to create group.");
    } finally {
      setCreateLoading(false);
    }
  };

  // Quick Action Add Expense Modal trigger
  const handleAddExpenseClick = () => {
    if (!dashboardData?.groups || dashboardData.groups.length === 0) {
      addToast("Please create a group first to log expenses.", "info");
      return;
    }
    setSelectedGroupId(dashboardData.groups[0].groupId);
    setQuickAddExpenseOpen(true);
  };

  const handleQuickAddExpenseSubmit = (e) => {
    e.preventDefault();
    if (!selectedGroupId) return;
    setQuickAddExpenseOpen(false);
    navigate(`/groups/${selectedGroupId}?addExpense=true`);
  };

  // Direct confirmation accept pending request
  const handleAcceptSettlement = (settlementId) => {
    setConfirmModal({
      isOpen: true,
      title: "Confirm Receipt",
      message: "Are you sure you received this payment? Click confirm to settle the debt.",
      confirmText: "Confirm Receipt",
      type: "info",
      loading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          await API.patch(`/settlements/${settlementId}/accept`);
          addToast("Settlement approved successfully!", "success");
          fetchDashboardData();
        } catch (err) {
          console.error(err);
          addToast(err.response?.data?.message || "Failed to accept settlement.", "error");
        } finally {
          setConfirmModal({ isOpen: false });
        }
      },
      onCancel: () => setConfirmModal((prev) => ({ ...prev, isOpen: false }))
    });
  };

  // Direct confirmation reject pending request
  const handleRejectSettlement = (settlementId) => {
    setConfirmModal({
      isOpen: true,
      title: "Reject Request",
      message: "Are you sure you want to reject this payment record?",
      confirmText: "Reject",
      type: "danger",
      loading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          await API.patch(`/settlements/${settlementId}/reject`);
          addToast("Settlement rejected.", "success");
          fetchDashboardData();
        } catch (err) {
          console.error(err);
          addToast(err.response?.data?.message || "Failed to reject settlement.", "error");
        } finally {
          setConfirmModal({ isOpen: false });
        }
      },
      onCancel: () => setConfirmModal((prev) => ({ ...prev, isOpen: false }))
    });
  };

  // Aggregate user suggestions across all groups
  const suggestionsList = useMemo(() => {
    if (!dashboardData?.groups) return [];
    const list = [];
    dashboardData.groups.forEach((groupObj) => {
      groupObj.suggestions?.forEach((s) => {
        list.push({
          ...s,
          groupId: groupObj.groupId,
          groupName: groupObj.groupName,
          members: groupObj.members
        });
      });
    });
    return list;
  }, [dashboardData]);

  // Helper name resolver
  const resolveUserName = (userId, groupMembers) => {
    if (userId.toString() === user?._id?.toString()) {
      return "You";
    }
    const member = groupMembers?.find(
      (m) => (m.user?._id || m.user)?.toString() === userId.toString()
    );
    return member?.user?.name || "Someone";
  };

  // Group Avatar Renderer
  const renderGroupAvatar = (group) => {
    if (group.groupPhoto && !group.groupPhoto.startsWith("gradient:")) {
      return (
        <img
          src={group.groupPhoto}
          alt={group.groupName || group.name}
          className="w-11 h-11 rounded-2xl object-cover border border-slate-200 bg-slate-50 flex-shrink-0"
        />
      );
    }

    let gradientClasses = "from-emerald-500 to-teal-600";
    if (group.groupPhoto && group.groupPhoto.startsWith("gradient:")) {
      const found = PRESET_GRADIENTS.find((p) => p.value === group.groupPhoto);
      if (found) gradientClasses = found.classes;
    }

    const nameToSplit = group.groupName || group.name || "G";
    const initials = nameToSplit
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return (
      <div
        className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradientClasses} flex items-center justify-center font-bold text-xs text-white shadow shadow-slate-200/50 flex-shrink-0`}
      >
        {initials}
      </div>
    );
  };

  // Category Icon Resolver inside Recent Expenses list
  const renderCategoryIcon = (category) => {
    const data = CATEGORY_MAP[category] || CATEGORY_MAP.Other;
    const IconComp = data.icon;
    return (
      <div className={`p-2.5 rounded-xl border ${data.bg} flex-shrink-0 flex items-center justify-center`}>
        <IconComp className="w-4 h-4" />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col">
        <Navbar />
        <div className="flex-1 flex justify-center items-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-slate-500 text-xs font-semibold">Loading dashboard summaries...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
      className="min-h-screen bg-[#f8fafc] text-slate-800 selection:bg-emerald-500/20 selection:text-emerald-700 overflow-x-hidden relative"
    >
      {/* GLOW DECORATIONS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] pointer-events-none opacity-45 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100 via-sky-100 to-transparent blur-[120px] z-0" />

      <Navbar />

      <main className="relative mx-auto max-w-6xl px-6 py-8 z-10 space-y-8">
        
        {/* HEADER SUMMARY */}
        <div className="flex justify-between items-start gap-6 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-0.5 text-[10px] font-bold text-emerald-700 mb-2 uppercase tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Workspace Status
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Welcome, {user?.name || "User"}
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              View your outstanding debts, log shared receipts, and approve settlement records.
            </p>
          </div>
          <button
            onClick={openCreateGroup}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs px-4.5 py-2.5 shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Group
          </button>
        </div>

        {/* SUMMARY CARDS ROW */}
        {dashboardData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. Total You Owe */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">You Owe</span>
                <span className="text-xl font-black font-mono text-rose-600 mt-1 block">
                  {formatCurrency(dashboardData.totalPayable)}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 flex-shrink-0 flex items-center justify-center">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>

            {/* 2. Total You Are Owed */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">You Are Owed</span>
                <span className="text-xl font-black font-mono text-emerald-600 mt-1 block">
                  {formatCurrency(dashboardData.totalReceivable)}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-500 flex-shrink-0 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            {/* 3. Net Balance */}
            {(() => {
              const net = dashboardData.netBalance || 0;
              const isPositive = net > 0.01;
              const isNegative = net < -0.01;
              const style = isPositive
                ? { bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-600", icon: TrendingUp }
                : isNegative
                ? { bg: "bg-rose-50", border: "border-rose-100", text: "text-rose-600", icon: TrendingDown }
                : { bg: "bg-slate-50", border: "border-slate-100", text: "text-slate-500", icon: DollarSign };
              const IconComp = style.icon;

              return (
                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Balance</span>
                    <span className={`text-xl font-black font-mono mt-1 block ${style.text}`}>
                      {isPositive && "+"}
                      {formatCurrency(net)}
                    </span>
                  </div>
                  <div className={`p-3.5 rounded-xl ${style.bg} border ${style.border} ${style.text} flex-shrink-0 flex items-center justify-center`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                </div>
              );
            })()}

            {/* 4. Total Expenses */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Expenses</span>
                <span className="text-xl font-black font-mono text-slate-800 mt-1 block">
                  {formatCurrency(dashboardData.totalExpenses)}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/50 text-slate-500 flex-shrink-0 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
          </div>
        )}

        {/* MAIN MODULES GRID */}
        {dashboardData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: Quick Actions, Recent Groups, Settlement Suggestions */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* QUICK ACTIONS CARD */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Quick Actions</h3>
                <div className="grid grid-cols-1 gap-2.5">
                  <button
                    onClick={openCreateGroup}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-105 hover:border-emerald-100 hover:bg-emerald-50/20 text-slate-700 text-xs font-bold transition-all text-left w-full group"
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-500 group-hover:scale-105 transition-transform" />
                    <span>Create Group</span>
                  </button>
                  <button
                    onClick={handleAddExpenseClick}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-105 hover:border-emerald-100 hover:bg-emerald-50/20 text-slate-700 text-xs font-bold transition-all text-left w-full group"
                  >
                    <CreditCard className="w-4 h-4 text-indigo-500 group-hover:scale-105 transition-transform" />
                    <span>Add Expense</span>
                  </button>
                  <button
                    onClick={() => navigate("/friends")}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-105 hover:border-emerald-100 hover:bg-emerald-50/20 text-slate-700 text-xs font-bold transition-all text-left w-full group"
                  >
                    <UserCheck className="w-4 h-4 text-sky-500 group-hover:scale-105 transition-transform" />
                    <span>View Friends</span>
                  </button>
                </div>
              </div>

              {/* RECENT GROUPS */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3.5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Your Groups</h3>
                  <button
                    onClick={() => navigate("/groups")}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-wider"
                  >
                    All Groups
                  </button>
                </div>

                {dashboardData.groups?.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-xs text-slate-405 font-medium">
                    No active groups yet.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                    {dashboardData.groups.map((g) => (
                      <div
                        key={g.groupId}
                        onClick={() => navigate(`/groups/${g.groupId}`)}
                        className="p-3 rounded-xl border border-slate-100 hover:border-slate-350 bg-slate-50/30 hover:bg-white transition-all cursor-pointer flex items-center justify-between gap-3 shadow-inner hover:shadow-sm"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {renderGroupAvatar(g)}
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-800 truncate block">
                              {g.groupName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                              {g.memberCount} members
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SUGGESTED SETTLEMENTS */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Suggested Settlements</h3>
                {suggestionsList.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-xs text-slate-405 font-medium">
                    No suggestions. All groups balanced!
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                    {suggestionsList.map((s, idx) => {
                      const fromName = resolveUserName(s.from, s.members);
                      const toName = resolveUserName(s.to, s.members);
                      
                      return (
                        <div
                          key={idx}
                          onClick={() => navigate(`/groups/${s.groupId}`)}
                          className="p-3 rounded-xl border border-slate-100 bg-white hover:border-slate-300 transition-all flex flex-col gap-1.5 cursor-pointer shadow-inner hover:shadow-sm"
                        >
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-700">
                              {fromName} &rarr; <span className="text-emerald-700">{toName}</span>
                            </span>
                            <span className="font-mono text-slate-900">₹{s.amount.toFixed(2)}</span>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                            Group: {s.groupName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT COLUMN: Pending Settlements, Recent Expenses */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* PENDING SETTLEMENTS */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Pending Approvals</h3>
                {dashboardData.pendingSettlements?.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400 font-semibold">
                    No pending settlements require your confirmation.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dashboardData.pendingSettlements.map((s) => {
                      const fromObj = s.from || {};
                      const groupObj = s.group || {};

                      return (
                        <div
                          key={s._id}
                          className="rounded-2xl border border-amber-200 bg-amber-50/10 p-4.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm"
                        >
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex text-[9px] font-extrabold bg-amber-100 border border-amber-200 text-amber-800 px-2 py-0.5 rounded uppercase tracking-wider">
                                Awaiting Confirmation
                              </span>
                              {s.note && (
                                <span className="text-[10px] text-slate-450 italic truncate">
                                  "{s.note}"
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-bold text-slate-705">
                              {fromObj.name} logs paid you &bull; <span className="font-mono text-slate-900 font-extrabold text-sm">₹{s.amount}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                              Group: {groupObj.name}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleAcceptSettlement(s._id)}
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow shadow-emerald-600/10"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleRejectSettlement(s._id)}
                              className="px-3.5 py-2 rounded-xl border border-rose-250 hover:bg-rose-50 text-rose-600 font-bold text-xs transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* RECENT EXPENSES */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Recent Expenses</h3>
                {dashboardData.recentExpenses?.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400 font-semibold">
                    No expenses logged in your groups yet.
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {dashboardData.recentExpenses.map((exp) => {
                      const formattedDate = new Date(exp.expenseDate || exp.createdAt).toLocaleDateString(
                        "en-IN",
                        { month: "short", day: "numeric", year: "numeric" }
                      );
                      const paidByLabel = exp.createdBy?.name || "Someone";
                      const groupLabel = exp.group?.name || "unknown";

                      return (
                        <div
                          key={exp._id}
                          onClick={() => navigate(`/groups/${exp.group?._id || exp.group}`)}
                          className="p-4 rounded-xl border border-slate-100 hover:border-slate-350 bg-white hover:bg-slate-50 transition-all flex items-center justify-between gap-4 cursor-pointer shadow-sm animate-in fade-in"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            {renderCategoryIcon(exp.category)}
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-sm text-slate-800 truncate">
                                {exp.title}
                              </h4>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {groupLabel} &bull; {formattedDate} &bull; Paid by: {paidByLabel}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-slate-900 font-mono text-sm">
                              ₹{exp.totalAmount}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}
      </main>

      {/* QUICK ADD EXPENSE GROUP CHOOSE DIALOG */}
      {quickAddExpenseOpen && dashboardData?.groups && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center px-4 py-8 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white shadow-2xl p-6 animate-in zoom-in-95 duration-200 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4.5">
              <div>
                <h2 className="text-base font-black text-slate-900 font-bold">Select a Group</h2>
                <p className="text-slate-400 text-[10px] font-semibold mt-0.5">Where do you want to add the expense?</p>
              </div>
              <button
                type="button"
                onClick={() => setQuickAddExpenseOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-450 transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleQuickAddExpenseSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Select Active Group
                </label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                >
                  {dashboardData.groups.map((g) => (
                    <option key={g.groupId} value={g.groupId}>
                      {g.groupName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3.5 border-t border-slate-100 pt-3.5 mt-2">
                <button
                  type="button"
                  onClick={() => setQuickAddExpenseOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white text-xs font-bold shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] transition-all"
                >
                  Go to Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE GROUP MODAL */}
      {createGroupOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center px-4 py-8 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-200 my-auto flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4.5 flex-shrink-0">
              <div>
                <h2 className="text-lg font-black text-slate-900 font-bold">Create a Group</h2>
                <p className="text-slate-550 text-[10px] font-semibold mt-0.5">Select friends to start dividing bills.</p>
              </div>
              <button
                type="button"
                onClick={() => setCreateGroupOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createGroupError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700 flex items-center gap-2 flex-shrink-0 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>{createGroupError}</span>
              </div>
            )}

            <form onSubmit={handleCreateGroupSubmit} className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Group Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Trip to Manali, Shared flat bills"
                  value={createGroupName}
                  onChange={(e) => setCreateGroupName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-800 placeholder-slate-405 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Monthly rent, groceries, weekend expenses"
                  value={createGroupDesc}
                  onChange={(e) => setCreateGroupDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-800 placeholder-slate-405 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                />
              </div>

              {/* Gradient style picker */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                  Theme Palette
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {PRESET_GRADIENTS.map((p) => {
                    const isSelected = createGroupPhoto === p.value;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setCreateGroupPhoto(p.value)}
                        className={`h-11 rounded-xl bg-gradient-to-br ${p.classes} flex items-center justify-center transition-all ${
                          isSelected ? "ring-2 ring-emerald-500 ring-offset-2 scale-98 shadow" : "opacity-80 hover:opacity-100 hover:scale-102"
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white drop-shadow" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Friends checklist selection */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Add Friends Checklist <span className="text-rose-500">*</span>
                  </label>
                  {selectedFriendIds.length > 0 && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      {selectedFriendIds.length} Friends Selected
                    </span>
                  )}
                </div>

                <div className="relative mb-3 flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search friends..."
                    value={friendSearchQuery}
                    onChange={(e) => setFriendSearchQuery(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 p-0.5 border border-slate-100 bg-slate-50/50 rounded-2xl custom-scrollbar">
                  {friendsLoading ? (
                    <div className="text-center py-6 text-xs text-slate-400 font-semibold flex items-center justify-center gap-1.5">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      Loading friends...
                    </div>
                  ) : addableFriends.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400 font-medium">
                      No friends found. Add friends first!
                    </div>
                  ) : (
                    addableFriends.map((f) => {
                      const isSelected = selectedFriendIds.includes(f._id);
                      return (
                        <div
                          key={f._id}
                          onClick={() => handleFriendSelectionToggle(f._id)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-left transition-all cursor-pointer ${
                            isSelected
                              ? "bg-emerald-50/60 border-emerald-200 text-emerald-800 shadow-sm"
                              : "bg-white border-slate-100 hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {f.profilePhoto ? (
                              <img
                                src={f.profilePhoto}
                                alt={f.name}
                                className="w-8 h-8 rounded-full object-cover bg-white"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-black text-[9px] text-slate-500">
                                {f.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate">{f.name}</p>
                              <p className="text-[9px] text-slate-400 truncate">{f.email}</p>
                            </div>
                          </div>
                          
                          <div
                            className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all ${
                              isSelected
                                ? "bg-emerald-600 border-emerald-600 text-white shadow"
                                : "bg-white border-slate-300"
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3.5 border-t border-slate-100 pt-4 flex-shrink-0">
                <button
                  type="button"
                  disabled={createLoading}
                  onClick={() => setCreateGroupOpen(false)}
                  className="px-4.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading || selectedFriendIds.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center gap-1.5"
                >
                  {createLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        loading={confirmModal.loading}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.onCancel}
        confirmText={confirmModal.confirmText}
      />

      {/* FLOATING TOASTS */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3.5 max-w-sm w-full">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}