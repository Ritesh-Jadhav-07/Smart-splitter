import React, { useEffect, useMemo, useState } from "react";
import { Users, UserCheck, UserPlus, Inbox, Search, Mail, Loader2 } from "lucide-react";
import API from "../api/axios";

// Import reusable components
import Navbar from "../components/Navbar";
import SearchBar from "../components/SearchBar";
import FriendCard from "../components/FriendCard";
import PendingRequestCard from "../components/PendingRequestCard";
import EmptyState from "../components/EmptyState";
import LoadingSkeleton from "../components/LoadingSkeleton";
import Toast from "../components/Toast";
import ConfirmationModal from "../components/ConfirmationModal";

export default function Friends() {
  // Friends & Requests lists
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [sentRequestIds, setSentRequestIds] = useState([]);
  const [searchInitiated, setSearchInitiated] = useState(false);

  // Actions loading state
  const [actionLoading, setActionLoading] = useState(false);

  // Notifications
  const [toasts, setToasts] = useState([]);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
    confirmText: "Confirm",
    type: "danger",
  });

  // Fetch friends list
  const fetchFriends = async () => {
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

  // Fetch pending requests
  const fetchRequests = async () => {
    setRequestsLoading(true);
    try {
      const res = await API.get("/friends/requests");
      setRequests(res.data.data || []);
    } catch (err) {
      console.error(err);
      addToast("Failed to fetch pending requests.", "error");
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
    fetchRequests();
  }, []);

  // Toast helpers
  const addToast = (message, type = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Search User by Email
  const handleSearch = async (email) => {
    if (!email.trim()) return;
    setSearchLoading(true);
    setSearchInitiated(true);
    setSearchResults(null);
    try {
      const res = await API.get(`/friends/search?email=${encodeURIComponent(email.trim())}`);
      setSearchResults(res.data.data);
    } catch (err) {
      const errMsg = err.response?.data?.message || "User not found";
      addToast(errMsg, "error");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    searchResults(null);
    setSearchInitiated(false);
  };

  // Send Friend Request
  const handleSendRequest = async (receiverId) => {
    setActionLoading(true);
    try {
      const res = await API.post(`/friends/send-request/${receiverId}`);
      setSentRequestIds((prev) => [...prev, receiverId]);

      if (res.status === 200) {
        addToast("Friend request accepted automatically!", "success");
        fetchFriends();
        fetchRequests();
      } else {
        addToast("Friend request sent successfully!", "success");
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to send request";
      addToast(errMsg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Accept Friend Request
  const handleAcceptRequest = async (requestId, senderObj) => {
    try {
      await API.post(`/friends/accept-request/${requestId}`);
      addToast(`You accepted ${senderObj?.name || "the"} friend request!`, "success");
      setRequests((prev) => prev.filter((r) => r._id !== requestId));
      if (senderObj) {
        setFriends((prev) => {
          if (prev.some((f) => f._id === senderObj._id)) return prev;
          return [senderObj, ...prev];
        });
      } else {
        fetchFriends();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to accept request";
      addToast(errMsg, "error");
      throw err;
    }
  };

  // Reject Friend Request with Confirmation
  const handleRejectRequest = (requestId, senderName) => {
    setConfirmModal({
      isOpen: true,
      title: "Decline Friend Request?",
      message: `Are you sure you want to decline the friend request from ${senderName || "this user"}?`,
      type: "danger",
      confirmText: "Decline Request",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await API.post(`/friends/reject-request/${requestId}`);
          addToast("Friend request declined.", "info");
          setRequests((prev) => prev.filter((r) => r._id !== requestId));
        } catch (err) {
          const errMsg = err.response?.data?.message || "Failed to decline request";
          addToast(errMsg, "error");
        } finally {
          setActionLoading(false);
          closeConfirmModal();
        }
      },
      onCancel: () => closeConfirmModal(),
    });
  };

  // Unfriend logic with confirmation modal
  const handleUnfriendClick = (friendObj) => {
    setConfirmModal({
      isOpen: true,
      title: "Remove Friend?",
      message: `Are you sure you want to unfriend ${friendObj.name}? This will remove them from your shared contacts.`,
      type: "danger",
      confirmText: "Unfriend",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await API.delete(`/friends/unfriend/${friendObj._id}`);
          addToast(`${friendObj.name} has been removed from your friends list.`, "info");
          // Remove from local array list state
          setFriends((prev) => prev.filter((f) => f._id !== friendObj._id));
        } catch (err) {
          const errMsg = err.response?.data?.message || "Failed to unfriend user";
          addToast(errMsg, "error");
        } finally {
          setActionLoading(false);
          closeConfirmModal();
        }
      },
      onCancel: () => closeConfirmModal(),
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Derived search relationships
  const searchRelation = useMemo(() => {
    if (!searchResults) return null;
    const searchId = searchResults._id;

    const isFriend = friends.some((f) => f._id === searchId);
    const isPendingReceived = requests.some((r) => r.sender?._id === searchId);
    const isPendingSent = sentRequestIds.includes(searchId);

    return {
      isFriend,
      isPendingReceived,
      isPendingSent,
    };
  }, [searchResults, friends, requests, sentRequestIds]);

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
      className="min-h-screen bg-[#f8fafc] text-slate-800 selection:bg-emerald-500/20 selection:text-emerald-700 overflow-x-hidden relative"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-200 via-sky-100 to-transparent blur-[100px] z-0" />

      <Navbar />

      <main className="relative mx-auto max-w-6xl px-6 py-10 z-10">
        {/* PAGE HEADER */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Connect & split together
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Friends
          </h1>
          <p className="text-slate-500 mt-2 max-w-xl leading-relaxed">
            Search for people by email, manage pending requests, and keep track of your shared contacts.
          </p>
        </div>

        {/* SECTION 1: SEARCH FRIENDS */}
        <section className="mb-10 p-6 rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/30 relative overflow-hidden">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Search className="w-4.5 h-4.5 text-slate-400" />
            Find Friends
          </h2>
          <div className="max-w-xl">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              onClear={handleClearSearch}
              loading={searchLoading}
            />
          </div>

          {/* Search Result Card */}
          {searchResults && (
            <div className="mt-5 border-t border-slate-100 pt-5 animate-in fade-in slide-in-from-top-2 duration-200">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Search Results
              </h3>
              <div className="max-w-md rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 flex items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  {searchResults.profilePhoto ? (
                    <img
                      src={searchResults.profilePhoto}
                      alt={searchResults.name}
                      className="w-11 h-11 rounded-full border border-slate-200 object-cover bg-white"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center font-bold text-xs text-white border border-indigo-200 shadow-inner">
                      {searchResults.name
                        ? searchResults.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                        : "S"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-800 truncate">
                      {searchResults.name}
                    </h4>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {searchResults.email}
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {searchRelation?.isFriend ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-50 text-emerald-700 text-xs font-semibold">
                      <UserCheck className="w-3.5 h-3.5" />
                      Friend
                    </span>
                  ) : searchRelation?.isPendingReceived ? (
                    <button
                      onClick={() => {
                        const request = requests.find((r) => r.sender?._id === searchResults._id);
                        if (request) {
                          handleAcceptRequest(request._id, searchResults);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white font-semibold text-xs shadow-md shadow-emerald-500/10 transition-colors flex items-center gap-1"
                    >
                      Accept Request
                    </button>
                  ) : searchRelation?.isPendingSent ? (
                    <button
                      disabled
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-100/50 text-slate-400 font-semibold text-xs cursor-not-allowed flex items-center gap-1"
                    >
                      Request Sent
                    </button>
                  ) : (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleSendRequest(searchResults._id)}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white font-semibold text-xs shadow-md shadow-emerald-500/10 transition-all flex items-center gap-1.5 h-9 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          Add Friend
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {!searchLoading && searchInitiated && !searchResults && (
            <p className="text-slate-400 text-sm mt-4">No user found matching that email query.</p>
          )}
        </section>

        {/* TWO-COLUMN GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* SECTION 2: PENDING FRIEND REQUESTS */}
          <aside className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-200/30">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Mail className="w-4.5 h-4.5 text-indigo-500" />
              Pending Requests
              {requests.length > 0 && (
                <span className="ml-1.5 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
                  {requests.length}
                </span>
              )}
            </h2>

            {requestsLoading ? (
              <LoadingSkeleton variant="list" count={2} />
            ) : requests.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No pending friend requests."
                description="When someone sends you a request, it will appear here."
              />
            ) : (
              <div className="space-y-3">
                {requests.map((req) => (
                  <PendingRequestCard
                    key={req._id}
                    request={req}
                    onAccept={handleAcceptRequest}
                    onReject={() => handleRejectRequest(req._id, req.sender?.name)}
                  />
                ))}
              </div>
            )}
          </aside>

          {/* SECTION 3: FRIENDS LIST */}
          <section className="lg:col-span-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/30">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-emerald-500" />
              Friends List
              {friends.length > 0 && (
                <span className="ml-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  {friends.length}
                </span>
              )}
            </h2>

            {friendsLoading ? (
              <LoadingSkeleton variant="card" count={4} />
            ) : friends.length === 0 ? (
              <EmptyState
                icon={Users}
                title="You haven't added any friends yet."
                description="Search for users by email above to send your first friend request."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {friends.map((friend) => (
                  <FriendCard
                    key={friend._id}
                    friend={friend}
                    onUnfriend={handleUnfriendClick}
                  />
                ))}
              </div>
            )}
          </section>

        </div>
      </main>

      {/* DYNAMIC CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        loading={actionLoading}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.onCancel}
        confirmText={confirmModal.confirmText}
      />

      {/* FLOATING TOASTS NOTIFICATIONS */}
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