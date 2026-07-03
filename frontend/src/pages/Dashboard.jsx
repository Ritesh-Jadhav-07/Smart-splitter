import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../api/axios";
import {
  loadSmartSplitterStore,
  newId,
  saveSmartSplitterStore,
} from "../utils/smartSplitterStore";

const formatCurrency = (value) => {
  const n = Number(value);
  if (Number.isNaN(n)) return "₹ 0";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const createGroupRequested = searchParams.get("createGroup") === "1" || searchParams.get("createGroup") === "true";
  const inviteFromQuery = searchParams.get("invite");

  const [user, setUser] = useState(null);
  const selfMemberKey = user?.email || user?.name || "";
  const selfMember = selfMemberKey ? { id: selfMemberKey, name: user?.name || "You" } : null;

  const [store, setStore] = useState(() => loadSmartSplitterStore());
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  const selectedGroup = useMemo(() => {
    if (!selectedGroupId) return null;
    return store.groups.find((g) => g.id === selectedGroupId) || null;
  }, [selectedGroupId, store.groups]);

  const selectedGroupExpenses = useMemo(() => {
    if (!selectedGroupId) return [];
    return store.expenses
      .filter((e) => e.groupId === selectedGroupId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [selectedGroupId, store.expenses]);

  const totalForSelectedGroup = useMemo(
    () => selectedGroupExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0),
    [selectedGroupExpenses],
  );

  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [createGroupName, setCreateGroupName] = useState("");
  const [draftMembers, setDraftMembers] = useState([]);
  const [newMemberName, setNewMemberName] = useState("");
  const [prefillMemberName, setPrefillMemberName] = useState(null);

  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [paidByMemberId, setPaidByMemberId] = useState("");
  const [shares, setShares] = useState({});
  const [sharesInitialized, setSharesInitialized] = useState(false);
  const [expenseError, setExpenseError] = useState("");

  const [createGroupError, setCreateGroupError] = useState("");

  const fetchUser = async () => {
    try {
      const res = await API.get("/users/current-user");
      setUser(res.data.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Open create-group modal when requested via query param.
  useEffect(() => {
    if (!createGroupRequested) return;

    setPrefillMemberName(inviteFromQuery?.trim() || null);
    setCreateGroupOpen(true);
    setSearchParams({}, { replace: true });
  }, [createGroupRequested, inviteFromQuery, setSearchParams]);

  // Ensure selected group exists.
  useEffect(() => {
    if (selectedGroupId) return;
    if (store.groups.length) setSelectedGroupId(store.groups[0].id);
  }, [selectedGroupId, store.groups]);

  // Initialize draft members when modal opens / user loads.
  useEffect(() => {
    if (!createGroupOpen) return;
    if (!selfMember) return;

    setDraftMembers((prev) => {
      const alreadyHasSelf = prev.some((m) => m.id === selfMember.id);
      if (alreadyHasSelf) return prev;
      return [selfMember, ...prev];
    });
  }, [createGroupOpen, selfMember]);

  useEffect(() => {
    if (!createGroupOpen) return;
    if (!prefillMemberName) return;

    const trimmed = prefillMemberName.trim();
    if (!trimmed) return;

    setDraftMembers((prev) => {
      const exists = prev.some((m) => (m.name || "").toLowerCase() === trimmed.toLowerCase());
      if (exists) return prev;
      return [...prev, { id: trimmed.toLowerCase(), name: trimmed }];
    });
  }, [createGroupOpen, prefillMemberName]);

  const initials = useMemo(() => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [user?.name]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    API.post("/users/logout").catch(() => {});
    navigate("/login");
  };

  const openCreateGroup = () => {
    setPrefillMemberName(null);
    setCreateGroupError("");
    setCreateGroupName("");
    setDraftMembers(selfMember ? [selfMember] : []);
    setNewMemberName("");
    setCreateGroupOpen(true);
  };

  const closeCreateGroup = () => {
    setCreateGroupOpen(false);
    setPrefillMemberName(null);
    setCreateGroupError("");
  };

  const addDraftMember = () => {
    const trimmed = newMemberName.trim();
    if (!trimmed) return;

    setDraftMembers((prev) => {
      const exists = prev.some((m) => (m.name || "").toLowerCase() === trimmed.toLowerCase());
      if (exists) return prev;
      return [...prev, { id: trimmed.toLowerCase(), name: trimmed }];
    });
    setNewMemberName("");
  };

  const removeDraftMember = (memberId) => {
    setDraftMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  const handleCreateGroup = (e) => {
    e.preventDefault();
    setCreateGroupError("");

    const groupName = createGroupName.trim();
    if (!groupName) {
      setCreateGroupError("Please enter a group name.");
      return;
    }

    const members = (draftMembers || []).filter(Boolean);
    if (members.length < 2) {
      setCreateGroupError("Add at least one more member to split expenses.");
      return;
    }

    const group = {
      id: newId(),
      name: groupName,
      members,
      createdAt: new Date().toISOString(),
      createdBy: selfMember?.id || null,
    };

    const updated = {
      ...store,
      groups: [group, ...store.groups],
    };

    saveSmartSplitterStore(updated);
    setStore(updated);
    setSelectedGroupId(group.id);
    setCreateGroupOpen(false);

    setCreateGroupName("");
    setPrefillMemberName(null);
  };

  const openAddExpense = () => {
    if (!selectedGroup) return;
    setExpenseError("");
    setExpenseTitle("");
    setExpenseAmount("");

    const firstMemberId = selectedGroup.members?.[0]?.id || "";
    const defaultPaidBy = selfMember && selectedGroup.members.some((m) => m.id === selfMember.id) ? selfMember.id : firstMemberId;
    setPaidByMemberId(defaultPaidBy);

    setShares({});
    setSharesInitialized(false);
    setAddExpenseOpen(true);
  };

  const roundToTwo = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

  useEffect(() => {
    if (!addExpenseOpen) return;
    if (!selectedGroup) return;

    const amt = Number(expenseAmount || 0);
    if (!sharesInitialized && amt > 0) {
      const count = selectedGroup.members.length || 1;
      const per = amt / count;

      const nextShares = {};
      selectedGroup.members.forEach((m) => {
        nextShares[m.id] = roundToTwo(per);
      });
      setShares(nextShares);
      setSharesInitialized(true);
    }
  }, [addExpenseOpen, expenseAmount, selectedGroup, sharesInitialized]);

  const sharesSum = useMemo(() => {
    const values = Object.values(shares || {});
    return values.reduce((acc, v) => acc + Number(v || 0), 0);
  }, [shares]);

  const computeBalances = useMemo(() => {
    if (!selectedGroup) return [];
    const members = selectedGroup.members || [];

    const map = new Map(members.map((m) => [m.id, { paid: 0, share: 0, net: 0, member: m }]));

    selectedGroupExpenses.forEach((exp) => {
      if (map.has(exp.paidByMemberId)) {
        map.get(exp.paidByMemberId).paid += Number(exp.amount || 0);
      }
      (exp.participants || []).forEach((p) => {
        if (map.has(p.memberId)) {
          map.get(p.memberId).share += Number(p.share || 0);
        }
      });
    });

    members.forEach((m) => {
      const row = map.get(m.id);
      if (!row) return;
      row.net = row.paid - row.share; // + means should receive, - means owes
    });

    return members.map((m) => ({ ...map.get(m.id), member: m }));
  }, [selectedGroup, selectedGroupExpenses]);

  const handleAddExpense = (e) => {
    e.preventDefault();
    setExpenseError("");

    if (!selectedGroup) {
      setExpenseError("Please select or create a group first.");
      return;
    }

    const amt = Number(expenseAmount || 0);
    if (!expenseTitle.trim()) {
      setExpenseError("Expense title is required.");
      return;
    }
    if (!amt || amt <= 0) {
      setExpenseError("Amount must be greater than 0.");
      return;
    }
    const sum = sharesSum;
    if (Math.abs(sum - amt) > 0.01) {
      setExpenseError(`Shares must sum to ${formatCurrency(amt)}. Currently: ${formatCurrency(sum)}.`);
      return;
    }

    const participants = (selectedGroup.members || []).map((m) => ({
      memberId: m.id,
      share: Number(shares[m.id] || 0),
    }));

    if (!participants.length) {
      setExpenseError("No participants found for this group.");
      return;
    }

    const expense = {
      id: newId(),
      groupId: selectedGroup.id,
      title: expenseTitle.trim(),
      amount: amt,
      paidByMemberId,
      participants,
      createdAt: new Date().toISOString(),
    };

    const updated = {
      ...store,
      expenses: [expense, ...store.expenses],
    };

    saveSmartSplitterStore(updated);
    setStore(updated);
    setAddExpenseOpen(false);
    setExpenseTitle("");
    setExpenseAmount("");
    setShares({});
    setSharesInitialized(false);
    setPaidByMemberId("");
  };

  const groupEmpty = store.groups.length === 0;

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0d1120]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4H9l3-6 3 6h-2v4z" />
              </svg>
            </div>
            <span className="text-base font-semibold tracking-tight">
              Smart<span className="text-emerald-400">Splitter</span>
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/friends")}
              className="px-4 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/[0.07] transition-all"
            >
              Friends
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="px-4 py-1.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/[0.07] transition-all"
            >
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-1.5 rounded-lg text-sm text-red-300 hover:text-red-100 hover:bg-red-500/[0.08] transition-all"
            >
              Logout
            </button>

            {user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-white/[0.08]">
                {user?.profilePhoto ? (
                  <img src={user.profilePhoto} alt="user" className="w-9 h-9 rounded-xl object-cover border border-white/[0.10]" />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center font-bold border border-white/[0.08]">
                    {initials}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-start gap-6 flex-wrap mb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1 text-xs font-medium text-emerald-400 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Expense splitting, simplified
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-slate-400 mt-2 max-w-xl leading-relaxed">
              Create a multi-member group, add expenses, and instantly see who owes what.
            </p>
          </div>

          <div className="ml-auto flex gap-3 items-center">
            <button
              onClick={openCreateGroup}
              className="px-5 py-2.5 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 transition-colors font-semibold text-sm"
            >
              + Create Group
            </button>
            <button
              onClick={openAddExpense}
              disabled={!selectedGroup}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 transition-colors font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              + Add Expense
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: groups */}
          <aside className="lg:col-span-4 rounded-2xl border border-white/[0.08] bg-[#0d1120]/60 p-4 shadow-xl shadow-black/30">
            <h2 className="text-sm font-semibold text-slate-200 px-2">Your groups</h2>

            {groupEmpty ? (
              <div className="mt-4">
                <div className="rounded-2xl border border-white/[0.10] bg-white/[0.04] p-4">
                  <div className="text-slate-200 font-semibold">No groups yet</div>
                  <div className="text-slate-400 text-sm mt-1">
                    Create your first group to start splitting expenses.
                  </div>
                  <button
                    onClick={openCreateGroup}
                    className="mt-4 w-full px-4 py-2.5 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 transition-colors font-semibold text-sm"
                  >
                    Create group
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {store.groups.map((g) => {
                  const isActive = g.id === selectedGroupId;
                  const groupExpensesCount = store.expenses.filter((e) => e.groupId === g.id).length;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGroupId(g.id)}
                      className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
                        isActive
                          ? "border-emerald-400/40 bg-emerald-500/[0.10]"
                          : "border-white/[0.10] bg-white/[0.03] hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold">{g.name}</div>
                          <div className="text-xs text-slate-400 mt-1">
                            {(g.members || []).length} members • {groupExpensesCount} expense(s)
                          </div>
                        </div>
                        <div className={`text-xs font-semibold ${isActive ? "text-emerald-200" : "text-slate-400"}`}>
                          {isActive ? "Active" : ""}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {!groupEmpty && selectedGroup ? (
              <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                <div className="text-sm font-semibold">Group overview</div>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/[0.08] bg-[#0b0f1a]/40 p-3">
                    <div className="text-xs text-slate-400">Total</div>
                    <div className="text-lg font-bold">{formatCurrency(totalForSelectedGroup)}</div>
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-[#0b0f1a]/40 p-3">
                    <div className="text-xs text-slate-400">Members</div>
                    <div className="text-lg font-bold">{selectedGroup.members.length}</div>
                  </div>
                </div>
              </div>
            ) : null}
          </aside>

          {/* RIGHT: expenses */}
          <section className="lg:col-span-8 rounded-2xl border border-white/[0.08] bg-[#0d1120]/60 p-6 shadow-xl shadow-black/30">
            {groupEmpty || !selectedGroup ? (
              <div className="py-10">
                <div className="text-slate-200 font-semibold text-lg">Pick a group</div>
                <div className="text-slate-400 mt-2">
                  Create a group to enable expense splitting.
                </div>
                <button
                  onClick={openCreateGroup}
                  className="mt-6 px-5 py-2.5 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 transition-colors font-semibold text-sm"
                >
                  Create group
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-sm text-slate-300">Selected group</div>
                    <h2 className="text-2xl font-bold tracking-tight mt-1">{selectedGroup.name}</h2>
                    <div className="text-slate-400 mt-1">
                      Add expenses with custom per-member shares.
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={openAddExpense}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 transition-colors font-semibold text-sm"
                    >
                      + Add Expense
                    </button>
                  </div>
                </div>

                {/* Balances */}
                <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
                    <div className="text-sm font-semibold">Balances</div>
                    <div className="text-xs text-slate-400">
                      Net = paid - share (+ means should receive)
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {computeBalances.map((row) => {
                      const net = Number(row.net || 0);
                      const isPositive = net >= 0;
                      const netColor = isPositive ? "text-emerald-300" : "text-red-300";
                      return (
                        <div key={row.member.id} className="rounded-xl border border-white/[0.08] bg-[#0b0f1a]/40 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-semibold">{row.member.name}</div>
                            <div className={`text-sm font-semibold ${netColor}`}>
                              {isPositive ? "+" : "-"}
                              {formatCurrency(Math.abs(net))}
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-3">
                            <div>
                              <div className="text-xs text-slate-400">Paid</div>
                              <div className="font-semibold">{formatCurrency(row.paid)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-400">Share</div>
                              <div className="font-semibold">{formatCurrency(row.share)}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Expenses list */}
                <div className="mt-6">
                  <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                    <div className="text-sm font-semibold">Expenses</div>
                    <div className="text-xs text-slate-400">{selectedGroupExpenses.length} total</div>
                  </div>

                  {selectedGroupExpenses.length === 0 ? (
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
                      <div className="text-slate-200 font-semibold">No expenses yet</div>
                      <div className="text-slate-400 mt-2">Add an expense to start splitting.</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedGroupExpenses.map((exp) => (
                        <div key={exp.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                              <div className="font-semibold text-lg">{exp.title}</div>
                              <div className="text-xs text-slate-400 mt-1">
                                {new Date(exp.createdAt).toLocaleString()}
                              </div>
                              <div className="text-xs text-slate-400 mt-1">
                                Paid by{" "}
                                <span className="text-slate-200 font-semibold">
                                  {(selectedGroup.members || []).find((m) => m.id === exp.paidByMemberId)?.name || "Unknown"}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-slate-400">Total</div>
                              <div className="text-xl font-bold text-emerald-200">{formatCurrency(exp.amount)}</div>
                            </div>
                          </div>

                          <div className="mt-4 border-t border-white/[0.08] pt-4">
                            <div className="text-sm font-semibold text-slate-200 mb-3">Shares</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {(exp.participants || []).map((p) => {
                                const memberName =
                                  (selectedGroup.members || []).find((m) => m.id === p.memberId)?.name || "Member";
                                return (
                                  <div key={p.memberId} className="rounded-xl border border-white/[0.08] bg-[#0b0f1a]/40 p-3">
                                    <div className="text-sm font-semibold">{memberName}</div>
                                    <div className="text-sm text-slate-400 mt-1">Share: {formatCurrency(p.share)}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      {/* CREATE GROUP MODAL */}
      {createGroupOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex justify-center items-center px-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/[0.10] bg-[#0d1120] shadow-2xl shadow-black/60 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Create Group</h2>
                <p className="text-slate-400 mt-1">
                  Add multiple members so you can split expenses fairly.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCreateGroup}
                className="px-3 py-2 rounded-xl border border-white/[0.10] bg-white/[0.04] hover:bg-white/[0.07] transition-colors text-sm font-semibold"
              >
                Close
              </button>
            </div>

            {createGroupError ? (
              <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/[0.08] px-4 py-3 text-sm text-red-200">
                {createGroupError}
              </div>
            ) : null}

            <form onSubmit={handleCreateGroup} className="mt-5 space-y-4">
              <div>
                <label className="text-sm text-slate-300">Group name</label>
                <input
                  value={createGroupName}
                  onChange={(e) => setCreateGroupName(e.target.value)}
                  placeholder="e.g. Trip to Goa"
                  className="mt-2 w-full rounded-xl border border-white/[0.10] bg-white/[0.05] px-4 py-2.5 text-sm outline-none focus:border-fuchsia-400/60"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-slate-300">Members</label>
                <div className="mt-3 flex items-end gap-3 flex-wrap">
                  <div className="flex-1 min-w-[220px]">
                    <input
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="Type a member name and press Add"
                      className="w-full rounded-xl border border-white/[0.10] bg-white/[0.05] px-4 py-2.5 text-sm outline-none focus:border-fuchsia-400/60"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addDraftMember();
                        }
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addDraftMember}
                    className="px-5 py-2.5 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 transition-colors font-semibold text-sm"
                  >
                    Add
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  {(draftMembers || []).length === 0 ? (
                    <div className="text-sm text-slate-400">Add members to continue.</div>
                  ) : (
                    (draftMembers || []).map((m) => (
                      <div key={m.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                        <div>
                          <div className="font-semibold">{m.name}</div>
                          <div className="text-xs text-slate-400">{m.id === selfMember?.id ? "You" : "Member"}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDraftMember(m.id)}
                          disabled={m.id === selfMember?.id}
                          className="px-3 py-2 rounded-xl border border-white/[0.10] bg-white/[0.04] hover:bg-white/[0.07] transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    // Reset to only self.
                    setDraftMembers(selfMember ? [selfMember] : []);
                    setCreateGroupError("");
                  }}
                  className="px-4 py-2.5 rounded-xl border border-white/[0.10] bg-white/[0.04] hover:bg-white/[0.07] transition-colors font-semibold text-sm"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 transition-colors font-semibold text-sm"
                >
                  Create group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD EXPENSE MODAL */}
      {addExpenseOpen && selectedGroup ? (
        <div className="fixed inset-0 z-[60] bg-black/50 flex justify-center items-center px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/[0.10] bg-[#0d1120] shadow-2xl shadow-black/60 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Add Expense</h2>
                <p className="text-slate-400 mt-1">
                  Split the amount across all group members.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddExpenseOpen(false)}
                className="px-3 py-2 rounded-xl border border-white/[0.10] bg-white/[0.04] hover:bg-white/[0.07] transition-colors text-sm font-semibold"
              >
                Close
              </button>
            </div>

            {expenseError ? (
              <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/[0.08] px-4 py-3 text-sm text-red-200">
                {expenseError}
              </div>
            ) : null}

            <form onSubmit={handleAddExpense} className="mt-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-300">Title</label>
                  <input
                    value={expenseTitle}
                    onChange={(e) => setExpenseTitle(e.target.value)}
                    placeholder="e.g. Dinner"
                    className="mt-2 w-full rounded-xl border border-white/[0.10] bg-white/[0.05] px-4 py-2.5 text-sm outline-none focus:border-emerald-400/60"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300">Amount</label>
                  <input
                    type="number"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="mt-2 w-full rounded-xl border border-white/[0.10] bg-white/[0.05] px-4 py-2.5 text-sm outline-none focus:border-emerald-400/60"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-300">Paid by</label>
                <select
                  value={paidByMemberId}
                  onChange={(e) => setPaidByMemberId(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/[0.10] bg-white/[0.05] px-4 py-2.5 text-sm outline-none focus:border-emerald-400/60"
                >
                  {(selectedGroup.members || []).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-sm font-semibold text-slate-200">Shares</div>
                    <div className="text-xs text-slate-400 mt-1">
                      Total shares must match the expense amount.
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Shares sum</div>
                    <div className={`font-bold ${Math.abs(sharesSum - Number(expenseAmount || 0)) < 0.01 ? "text-emerald-200" : "text-red-300"}`}>
                      {formatCurrency(sharesSum)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {(selectedGroup.members || []).map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-3 flex-wrap rounded-xl border border-white/[0.08] bg-[#0b0f1a]/40 px-4 py-3">
                      <div>
                        <div className="font-semibold">{m.name}</div>
                        <div className="text-xs text-slate-400">Share amount</div>
                      </div>
                      <div className="w-[220px] max-w-full">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={shares[m.id] ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setShares((prev) => ({ ...prev, [m.id]: v }));
                          }}
                          className="w-full rounded-xl border border-white/[0.10] bg-white/[0.05] px-4 py-2 text-sm outline-none focus:border-emerald-400/60"
                          placeholder="0"
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const amt = Number(expenseAmount || 0);
                    if (!selectedGroup || !amt) return;
                    const count = selectedGroup.members.length || 1;
                    const per = amt / count;
                    const nextShares = {};
                    selectedGroup.members.forEach((m) => (nextShares[m.id] = roundToTwo(per)));
                    setShares(nextShares);
                    setSharesInitialized(true);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-white/[0.10] bg-white/[0.04] hover:bg-white/[0.07] transition-colors font-semibold text-sm"
                >
                  Set equal shares
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 transition-colors font-semibold text-sm"
                >
                  Save expense
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}