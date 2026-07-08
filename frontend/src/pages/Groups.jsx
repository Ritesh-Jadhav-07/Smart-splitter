import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Search, Users, DollarSign, Calendar, Info, X, Check, Loader2, Image } from "lucide-react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import SearchBar from "../components/SearchBar";
import EmptyState from "../components/EmptyState";
import LoadingSkeleton from "../components/LoadingSkeleton";
import Toast from "../components/Toast";

const PRESET_GRADIENTS = [
  { name: "Emerald Sunset", value: "gradient:from-emerald-400 to-teal-600", classes: "from-emerald-400 to-teal-600" },
  { name: "Sunset Coral", value: "gradient:from-orange-400 to-rose-500", classes: "from-orange-400 to-rose-500" },
  { name: "Ocean Breeze", value: "gradient:from-cyan-400 to-blue-600", classes: "from-cyan-400 to-blue-600" },
  { name: "Indigo Velvet", value: "gradient:from-purple-400 to-indigo-600", classes: "from-purple-400 to-indigo-600" },
  { name: "Fiery Flame", value: "gradient:from-red-500 to-amber-500", classes: "from-red-500 to-amber-500" },
];

export default function Groups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Group statistics (Expenses & Recent Activity)
  const [groupStats, setGroupStats] = useState({});

  // Create Group Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    groupPhoto: PRESET_GRADIENTS[0].value, // Default to first gradient
  });
  const [photoType, setPhotoType] = useState("gradient"); // 'gradient' | 'url'
  const [customPhotoUrl, setCustomPhotoUrl] = useState("");
  const [friends, setFriends] = useState([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState("");

  // Notification Toasts
  const [toasts, setToasts] = useState([]);

  // Toast Helpers
  const addToast = (message, type = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch groups and their corresponding stats
  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await API.get("/groups");
      const fetchedGroups = res.data.data || [];
      setGroups(fetchedGroups);

      // Load expenses/activity in parallel for each group
      const statsMap = {};
      await Promise.all(
        fetchedGroups.map(async (group) => {
          try {
            const expRes = await API.get(`/expenses/group/${group._id}`);
            const expenses = expRes.data.data || [];
            const total = expenses.reduce((sum, exp) => sum + (exp.totalAmount || 0), 0);
            
            let recentActivity = "No recent expenses";
            if (expenses.length > 0) {
              const latest = expenses[0];
              const paidByLabel = latest.paidBy?.[0]?.user?.name || "Someone";
              const formattedDate = new Date(latest.expenseDate || latest.createdAt).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
              });
              recentActivity = `"${latest.title}" - ₹${latest.totalAmount} on ${formattedDate}`;
            }

            statsMap[group._id] = {
              totalExpenses: total,
              recentActivity,
            };
          } catch (err) {
            console.error(`Error loading expenses for group ${group._id}`, err);
            statsMap[group._id] = {
              totalExpenses: 0,
              recentActivity: "No activity details",
            };
          }
        })
      );
      setGroupStats(statsMap);
    } catch (err) {
      console.error("Failed to fetch groups", err);
      addToast("Failed to fetch your groups list.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch friends for the Create Group modal member selection
  const fetchFriends = async () => {
    setFriendsLoading(true);
    try {
      const res = await API.get("/friends/friends");
      setFriends(res.data.data || []);
    } catch (err) {
      console.error(err);
      addToast("Failed to fetch friends for selection.", "error");
    } finally {
      setFriendsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const openCreateModal = () => {
    setFormData({
      name: "",
      description: "",
      groupPhoto: PRESET_GRADIENTS[0].value,
    });
    setPhotoType("gradient");
    setCustomPhotoUrl("");
    setSelectedFriendIds([]);
    setCreateModalOpen(true);
    fetchFriends();
  };

  const handleFriendToggle = (friendId) => {
    setSelectedFriendIds((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast("Group Name is required.", "error");
      return;
    }
    if (selectedFriendIds.length === 0) {
      addToast("Please select at least 1 member to split expenses with.", "error");
      return;
    }

    setCreateLoading(true);
    try {
      const finalPhoto = photoType === "url" ? customPhotoUrl.trim() : formData.groupPhoto;
      
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        groupPhoto: finalPhoto,
        members: selectedFriendIds,
      };

      const res = await API.post("/groups", payload);
      const newGroup = res.data.data;
      addToast("Group created successfully!", "success");
      setCreateModalOpen(false);
      
      // Auto-navigate to Group Details
      navigate(`/groups/${newGroup._id}`);
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to create group.";
      addToast(errMsg, "error");
    } finally {
      setCreateLoading(false);
    }
  };

  // Filtering groups based on search query
  const filteredGroups = useMemo(() => {
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [groups, searchQuery]);

  // Filtering friends inside Create Group modal search
  const filteredFriends = useMemo(() => {
    return friends.filter(
      (f) =>
        f.name.toLowerCase().includes(friendSearchQuery.toLowerCase()) ||
        f.email.toLowerCase().includes(friendSearchQuery.toLowerCase())
    );
  }, [friends, friendSearchQuery]);

  const renderGroupAvatar = (group) => {
    if (group.groupPhoto && !group.groupPhoto.startsWith("gradient:")) {
      return (
        <img
          src={group.groupPhoto}
          alt={group.name}
          className="w-12 h-12 rounded-2xl object-cover border border-slate-200 bg-slate-50 flex-shrink-0"
        />
      );
    }

    let gradientClasses = "from-emerald-500 to-teal-600";
    if (group.groupPhoto && group.groupPhoto.startsWith("gradient:")) {
      const found = PRESET_GRADIENTS.find((p) => p.value === group.groupPhoto);
      if (found) gradientClasses = found.classes;
    }

    const initials = group.name
      ? group.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "G";

    return (
      <div
        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradientClasses} flex items-center justify-center font-bold text-sm text-white shadow-md shadow-slate-200/50 flex-shrink-0`}
      >
        {initials}
      </div>
    );
  };

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
      className="min-h-screen bg-[#f8fafc] text-slate-800"
    >
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* HEADER BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Groups</h1>
            <p className="text-slate-500 text-sm mt-1">Manage, view details, and track shared balances for all your groups.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white text-xs font-bold px-4.5 py-3 shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Create Group
          </button>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="w-full max-w-md mb-6">
          <div className="relative group flex items-center">
            <div className="absolute left-4 text-slate-400 pointer-events-none group-focus-within:text-emerald-600 transition-colors">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search groups by name or description..."
              className="w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-10 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm shadow-slate-100/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* LIST RENDERING */}
        {loading ? (
          <LoadingSkeleton variant="card" count={4} />
        ) : filteredGroups.length === 0 ? (
          <EmptyState
            icon={Users}
            title={searchQuery ? "No matching groups found." : "No groups found."}
            description={
              searchQuery
                ? "Try checking your spelling or search for another term."
                : "Create a group to start tracking bills and splitting expenses with your friends."
            }
            actionLabel={searchQuery ? null : "Create First Group"}
            onAction={searchQuery ? null : openCreateModal}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredGroups.map((group) => {
              const stats = groupStats[group._id] || { totalExpenses: 0, recentActivity: "Loading stats..." };
              return (
                <div
                  key={group._id}
                  onClick={() => navigate(`/groups/${group._id}`)}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-200/20 hover:border-slate-300 hover:shadow-2xl hover:shadow-slate-200/40 hover:-translate-y-[2px] transition-all duration-300 cursor-pointer flex flex-col justify-between group"
                >
                  <div className="flex items-start gap-4">
                    {renderGroupAvatar(group)}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base text-slate-800 group-hover:text-emerald-600 transition-colors truncate">
                        {group.name}
                      </h3>
                      {group.description && (
                        <p className="text-slate-500 text-xs mt-1 line-clamp-1">
                          {group.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-3.5 mt-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-slate-100/70 border border-slate-200/50 px-2 py-0.5 rounded-lg">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {group.members?.length || 0} members
                        </span>
                        
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-slate-100/70 border border-slate-200/50 px-2 py-0.5 rounded-lg">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                          Total: ₹{stats.totalExpenses}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">
                        <span className="text-slate-400 font-normal">Recent: </span>
                        {stats.recentActivity}
                      </span>
                    </div>
                    <div className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><polyline points="9 18 15 12 9 6" /></svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* CREATE GROUP MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center px-4 py-8 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-200 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <h2 className="text-lg font-extrabold text-slate-900">Create New Group</h2>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-5">
              {/* GROUP NAME */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Group Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Roommates 402, Roadtrip 2026"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                />
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="What is this group for?"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm resize-none"
                />
              </div>

              {/* GROUP PHOTO */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Group Avatar Design
                </label>
                
                {/* PHOTO TYPE TOGGLE */}
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setPhotoType("gradient")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      photoType === "gradient"
                        ? "bg-slate-900 border-slate-900 text-white"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Preset Gradients
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoType("url")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      photoType === "url"
                        ? "bg-slate-900 border-slate-900 text-white"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Photo URL
                  </button>
                </div>

                {photoType === "gradient" ? (
                  <div className="flex flex-wrap gap-2.5">
                    {PRESET_GRADIENTS.map((p) => {
                      const isSelected = formData.groupPhoto === p.value;
                      return (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, groupPhoto: p.value })}
                          className={`w-9 h-9 rounded-xl bg-gradient-to-br ${p.classes} border-2 transition-all relative flex items-center justify-center ${
                            isSelected ? "border-slate-800 scale-105 shadow-md shadow-slate-300" : "border-transparent opacity-85 hover:opacity-100"
                          }`}
                          title={p.name}
                        >
                          {isSelected && <Check className="w-4 h-4 text-white drop-shadow-sm" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="w-11 h-11 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0 overflow-hidden">
                      {customPhotoUrl.trim() ? (
                        <img
                          src={customPhotoUrl.trim()}
                          alt="preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "";
                          }}
                        />
                      ) : (
                        <Image className="w-5 h-5" />
                      )}
                    </div>
                    <input
                      type="url"
                      placeholder="https://example.com/photo.jpg"
                      value={customPhotoUrl}
                      onChange={(e) => setCustomPhotoUrl(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                    />
                  </div>
                )}
              </div>

              {/* SELECT INITIAL MEMBERS */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Add Initial Members <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {selectedFriendIds.length} Selected
                  </span>
                </div>

                {/* FRIEND SEARCH */}
                <div className="relative mb-3 flex items-center">
                  <div className="absolute left-3 text-slate-400 pointer-events-none">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Filter friends by name or email..."
                    value={friendSearchQuery}
                    onChange={(e) => setFriendSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                  {friendSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setFriendSearchQuery("")}
                      className="absolute right-3 p-1 rounded-md hover:bg-slate-100 text-slate-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* SELECTABLE FRIENDS LIST */}
                <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-2xl bg-slate-50/50 p-2 space-y-1.5 custom-scrollbar">
                  {friendsLoading ? (
                    <div className="flex items-center justify-center py-6 gap-2 text-slate-400 text-xs font-semibold">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      Loading friends...
                    </div>
                  ) : filteredFriends.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs font-medium">
                      {friendSearchQuery ? "No matching friends found." : "No friends found in your list."}
                    </div>
                  ) : (
                    filteredFriends.map((friend) => {
                      const isSelected = selectedFriendIds.includes(friend._id);
                      return (
                        <button
                          key={friend._id}
                          type="button"
                          onClick={() => handleFriendToggle(friend._id)}
                          className={`w-full p-2.5 rounded-xl border flex items-center justify-between gap-3 text-left transition-all ${
                            isSelected
                              ? "bg-emerald-50/60 border-emerald-200 text-emerald-800 shadow-sm"
                              : "bg-white border-slate-200/60 hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {friend.profilePhoto ? (
                              <img
                                src={friend.profilePhoto}
                                alt={friend.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 bg-white"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-500">
                                {friend.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate">{friend.name}</p>
                              <p className="text-[10px] text-slate-400 truncate">{friend.email}</p>
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                              isSelected
                                ? "bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-600/10"
                                : "bg-white border-slate-300"
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  disabled={createLoading}
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4.5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4.5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center gap-1.5"
                >
                  {createLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
