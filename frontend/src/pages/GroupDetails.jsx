import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  UserPlus,
  Shield,
  Trash2,
  LogOut,
  DollarSign,
  CreditCard,
  Briefcase,
  Search,
  Check,
  X,
  Loader2,
  AlertCircle,
  Plus,
  Eye,
  Pencil,
  Calendar,
  Utensils,
  Plane,
  ShoppingBag,
  Film,
  Zap,
  HeartPulse,
  GraduationCap,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  FileText
} from "lucide-react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import Toast from "../components/Toast";
import ConfirmationModal from "../components/ConfirmationModal";
import EmptyState from "../components/EmptyState";
import LoadingSkeleton from "../components/LoadingSkeleton";

const TAB_CONFIGS = [
  { id: "expenses", label: "Expenses", icon: DollarSign },
  { id: "members", label: "Members", icon: Users },
  { id: "balances", label: "Balances", icon: CreditCard },
  { id: "settlements", label: "Settlements", icon: Briefcase }
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

const CURRENCIES = ["INR", "USD", "EUR", "GBP"];

const PRESET_GRADIENTS = [
  { value: "gradient:emerald-teal", classes: "from-emerald-400 via-teal-500 to-emerald-600" },
  { value: "gradient:blue-indigo", classes: "from-blue-400 via-indigo-500 to-blue-600" },
  { value: "gradient:purple-pink", classes: "from-purple-400 via-pink-500 to-rose-500" },
  { value: "gradient:orange-red", classes: "from-orange-400 via-red-500 to-rose-600" }
];

export default function GroupDetails() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [group, setGroup] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("expenses");

  // Group Expenses State
  const [expenses, setExpenses] = useState([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [viewingExpense, setViewingExpense] = useState(null);

  // Group Settlements State
  const [settlements, setSettlements] = useState([]);
  const [settlementsLoading, setSettlementsLoading] = useState(false);

  // Add Member Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [selectedFriendIds, setSelectedFriendIds] = useState([]);
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [addMembersLoading, setAddMembersLoading] = useState(false);

  // Add/Edit Expense Form States
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [expenseStep, setExpenseStep] = useState(1);
  const [expenseIsEditing, setExpenseIsEditing] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [formSubmitLoading, setFormSubmitLoading] = useState(false);

  // Expense Form Fields (Step 1)
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Food");
  const [expenseCurrency, setExpenseCurrency] = useState("INR");
  const [expenseNotes, setExpenseNotes] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);

  // Who Paid? Fields (Step 2)
  const [payerType, setPayerType] = useState("single"); // 'single' | 'multiple'
  const [singlePayerId, setSinglePayerId] = useState("");
  const [multiplePayersAmount, setMultiplePayersAmount] = useState({}); // userId -> amount string

  // Participants Fields (Step 3)
  const [participantIds, setParticipantIds] = useState([]);

  // Split Type Fields (Step 4)
  const [splitType, setSplitType] = useState("EQUAL"); // 'EQUAL' | 'EXACT' | 'PERCENTAGE'
  const [exactAmounts, setExactAmounts] = useState({}); // userId -> exact amount share
  const [percentages, setPercentages] = useState({}); // userId -> percentage share

  // Create Settlement Modal State
  const [createSettlementOpen, setCreateSettlementOpen] = useState(false);
  const [settlementFromUser, setSettlementFromUser] = useState(null);
  const [settlementToUser, setSettlementToUser] = useState(null);
  const [settlementAmount, setSettlementAmount] = useState("");
  const [settlementNote, setSettlementNote] = useState("");
  const [settlementMaxLimit, setSettlementMaxLimit] = useState(0);
  const [createSettlementLoading, setCreateSettlementLoading] = useState(false);

  // Confirmation Modals State
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

  // Notifications State
  const [toasts, setToasts] = useState([]);

  // Toast Helpers
  const addToast = (message, type = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch current logged-in user
  const fetchCurrentUser = async () => {
    try {
      const res = await API.get("/users/current-user");
      setCurrentUser(res.data.data);
    } catch (err) {
      console.error("Error fetching current user", err);
    }
  };

  // Fetch group details
  const fetchGroupDetails = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/groups/${groupId}`);
      setGroup(res.data.data);
    } catch (err) {
      console.error("Error fetching group details", err);
      addToast(err.response?.data?.message || "Failed to load group details.", "error");
      setTimeout(() => navigate("/groups"), 2000);
    } finally {
      setLoading(false);
    }
  };

  // Fetch expenses of the group
  const fetchExpenses = async () => {
    setExpensesLoading(true);
    try {
      const res = await API.get(`/expenses/group/${groupId}`);
      setExpenses(res.data.data || []);
    } catch (err) {
      console.error("Error fetching group expenses", err);
      addToast("Failed to load group expenses.", "error");
    } finally {
      setExpensesLoading(false);
    }
  };

  // Fetch settlements history
  const fetchSettlements = async () => {
    setSettlementsLoading(true);
    try {
      const res = await API.get(`/settlements/history/${groupId}`);
      setSettlements(res.data.data || []);
    } catch (err) {
      console.error("Error fetching settlements", err);
      addToast("Failed to load group settlements.", "error");
    } finally {
      setSettlementsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchGroupDetails();
    fetchExpenses();
    fetchSettlements();
  }, [groupId]);

  // Determine permissions
  const { isCreator, isAdmin, isUserInGroup } = useMemo(() => {
    if (!group || !currentUser) {
      return { isCreator: false, isAdmin: false, isUserInGroup: false };
    }
    const creatorId = group.createdBy?._id || group.createdBy;
    const isCreator = creatorId?.toString() === currentUser._id?.toString();
    
    const userMember = group.members?.find(
      (m) => (m.user?._id || m.user)?.toString() === currentUser._id?.toString()
    );
    
    return {
      isCreator,
      isAdmin: userMember?.role === "ADMIN",
      isUserInGroup: !!userMember
    };
  }, [group, currentUser]);

  // Friends selection modal for adding members
  const openAddMembersModal = async () => {
    setAddModalOpen(true);
    setFriendsLoading(true);
    setSelectedFriendIds([]);
    setFriendSearchQuery("");
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

  // Friend selection checkbox toggle (Google Pay style)
  const handleFriendSelectionToggle = (friendId) => {
    setSelectedFriendIds((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  // Filter friends: must not already be members of the group
  const addableFriends = useMemo(() => {
    if (!group?.members || !friends) return [];
    const memberUserIds = new Set(
      group.members.map((m) => (m.user?._id || m.user)?.toString())
    );
    return friends.filter(
      (f) =>
        !memberUserIds.has(f._id?.toString()) &&
        (f.name.toLowerCase().includes(friendSearchQuery.toLowerCase()) ||
          f.email.toLowerCase().includes(friendSearchQuery.toLowerCase()))
    );
  }, [friends, group?.members, friendSearchQuery]);

  // Submit adding members
  const handleAddMembersSubmit = async () => {
    if (selectedFriendIds.length === 0) {
      addToast("Select at least 1 friend to add.", "error");
      return;
    }
    setAddMembersLoading(true);
    try {
      await API.post(`/groups/${groupId}/members`, { members: selectedFriendIds });
      addToast("Members added successfully!", "success");
      setAddModalOpen(false);
      fetchGroupDetails();
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || "Failed to add members.", "error");
    } finally {
      setAddMembersLoading(false);
    }
  };

  // Promote Member to Admin
  const handleMakeAdminClick = (memberUser) => {
    setConfirmModal({
      isOpen: true,
      title: "Promote to Admin",
      message: `Are you sure you want to promote ${memberUser.name} to Admin? This action cannot be undone.`,
      confirmText: "Promote",
      type: "info",
      loading: false,
      onConfirm: () => handleMakeAdminConfirm(memberUser._id),
      onCancel: () => setConfirmModal((prev) => ({ ...prev, isOpen: false }))
    });
  };

  const handleMakeAdminConfirm = async (userId) => {
    setConfirmModal((prev) => ({ ...prev, loading: true }));
    try {
      await API.patch(`/groups/${groupId}/admin/${userId}`);
      addToast("Member promoted to Admin successfully!", "success");
      fetchGroupDetails();
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || "Failed to promote member.", "error");
    } finally {
      setConfirmModal({ isOpen: false });
    }
  };

  // Remove Member from Group
  const handleRemoveMemberClick = (memberUser) => {
    setConfirmModal({
      isOpen: true,
      title: "Remove Member",
      message: `Are you sure you want to remove ${memberUser.name} from the group?`,
      confirmText: "Remove Member",
      type: "danger",
      loading: false,
      onConfirm: () => handleRemoveMemberConfirm(memberUser._id),
      onCancel: () => setConfirmModal((prev) => ({ ...prev, isOpen: false }))
    });
  };

  const handleRemoveMemberConfirm = async (userId) => {
    setConfirmModal((prev) => ({ ...prev, loading: true }));
    try {
      await API.delete(`/groups/${groupId}/members/${userId}`);
      addToast("Member removed successfully!", "success");
      fetchGroupDetails();
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || "Failed to remove member.", "error");
    } finally {
      setConfirmModal({ isOpen: false });
    }
  };

  // Leave Group
  const handleLeaveGroupClick = () => {
    setConfirmModal({
      isOpen: true,
      title: "Leave Group",
      message: "Are you sure you want to leave this group? You will no longer see shared balances.",
      confirmText: "Leave Group",
      type: "danger",
      loading: false,
      onConfirm: handleLeaveGroupConfirm,
      onCancel: () => setConfirmModal((prev) => ({ ...prev, isOpen: false }))
    });
  };

  const handleLeaveGroupConfirm = async () => {
    setConfirmModal((prev) => ({ ...prev, loading: true }));
    try {
      await API.post(`/groups/${groupId}/leave`);
      addToast("You left the group successfully.", "success");
      setTimeout(() => navigate("/groups"), 1000);
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || "Failed to leave group.", "error");
    } finally {
      setConfirmModal({ isOpen: false });
    }
  };

  // Delete Expense
  const handleDeleteExpenseClick = (expense) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Expense",
      message: `Are you sure you want to delete "${expense.title}"? This cannot be undone.`,
      confirmText: "Delete",
      type: "danger",
      loading: false,
      onConfirm: () => handleDeleteExpenseConfirm(expense._id),
      onCancel: () => setConfirmModal((prev) => ({ ...prev, isOpen: false }))
    });
  };

  const handleDeleteExpenseConfirm = async (expenseId) => {
    setConfirmModal((prev) => ({ ...prev, loading: true }));
    try {
      await API.delete(`/expenses/${expenseId}`);
      addToast("Expense deleted successfully!", "success");
      fetchExpenses();
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || "Failed to delete expense.", "error");
    } finally {
      setConfirmModal({ isOpen: false });
    }
  };

  // Open Expense Modal (Add workflow)
  const openAddExpenseModal = () => {
    setExpenseIsEditing(false);
    setEditingExpenseId(null);
    setExpenseTitle("");
    setExpenseDescription("");
    setExpenseAmount("");
    setExpenseCategory("Food");
    setExpenseCurrency("INR");
    setExpenseNotes("");
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setPayerType("single");
    
    const selfInGroup = group.members.some((m) => (m.user?._id || m.user)?.toString() === currentUser?._id?.toString());
    setSinglePayerId(selfInGroup ? currentUser?._id : (group.members[0]?.user?._id || ""));
    setMultiplePayersAmount({});
    setParticipantIds(group.members.map((m) => m.user?._id).filter(Boolean));
    setSplitType("EQUAL");
    setExactAmounts({});
    setPercentages({});
    setExpenseStep(1);
    setExpenseFormOpen(true);
  };

  useEffect(() => {
    if (searchParams.get("addExpense") === "true" && group) {
      openAddExpenseModal();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, group]);

  // Open Expense Modal (Edit workflow)
  const openEditExpenseModal = (expense) => {
    setExpenseIsEditing(true);
    setEditingExpenseId(expense._id);
    setExpenseTitle(expense.title);
    setExpenseDescription(expense.description || "");
    setExpenseAmount(expense.totalAmount.toString());
    setExpenseCategory(expense.category || "Food");
    setExpenseCurrency(expense.currency || "INR");
    setExpenseNotes(expense.notes || "");
    setExpenseDate(new Date(expense.expenseDate || expense.createdAt).toISOString().split("T")[0]);
    
    const payersList = expense.paidBy || [];
    if (payersList.length === 1) {
      setPayerType("single");
      setSinglePayerId(payersList[0].user?._id || payersList[0].user);
      setMultiplePayersAmount({});
    } else {
      setPayerType("multiple");
      setSinglePayerId("");
      const mapping = {};
      payersList.forEach((p) => {
        const uid = p.user?._id || p.user;
        mapping[uid] = p.amount.toString();
      });
      setMultiplePayersAmount(mapping);
    }

    const participantList = expense.participants || [];
    setParticipantIds(participantList.map((p) => p.user?._id || p.user).filter(Boolean));

    setSplitType(expense.splitType || "EQUAL");
    if (expense.splitType === "EXACT") {
      const exacts = {};
      participantList.forEach((p) => {
        const uid = p.user?._id || p.user;
        exacts[uid] = p.share.toString();
      });
      setExactAmounts(exacts);
      setPercentages({});
    } else if (expense.splitType === "PERCENTAGE") {
      const percs = {};
      participantList.forEach((p) => {
        const uid = p.user?._id || p.user;
        percs[uid] = p.percentage.toString();
      });
      setPercentages(percs);
      setExactAmounts({});
    } else {
      setExactAmounts({});
      setPercentages({});
    }

    setExpenseStep(1);
    setExpenseFormOpen(true);
  };

  // Live totals calculations helpers
  const multiplePayersTotalSum = useMemo(() => {
    return Object.values(multiplePayersAmount).reduce((sum, amt) => sum + Number(amt || 0), 0);
  }, [multiplePayersAmount]);

  const exactSplitTotalSum = useMemo(() => {
    return Object.values(exactAmounts).reduce((sum, amt) => sum + Number(amt || 0), 0);
  }, [exactAmounts]);

  const percentageSplitTotalSum = useMemo(() => {
    return Object.values(percentages).reduce((sum, pct) => sum + Number(pct || 0), 0);
  }, [percentages]);

  const isStepValid = (currentStep) => {
    const amtNum = Number(expenseAmount);
    if (currentStep === 1) {
      return expenseTitle.trim() !== "" && !isNaN(amtNum) && amtNum > 0;
    }
    if (currentStep === 2) {
      if (payerType === "single") {
        return singlePayerId !== "";
      } else {
        return Math.abs(multiplePayersTotalSum - amtNum) < 0.01;
      }
    }
    if (currentStep === 3) {
      return participantIds.length >= 2;
    }
    if (currentStep === 4) {
      if (splitType === "EQUAL") return true;
      if (splitType === "EXACT") {
        return Math.abs(exactSplitTotalSum - amtNum) < 0.01;
      }
      if (splitType === "PERCENTAGE") {
        return Math.abs(percentageSplitTotalSum - 100) < 0.01;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    const amtNum = Number(expenseAmount);
    if (expenseStep === 1 && !isStepValid(1)) {
      addToast("Please enter a valid title and amount greater than 0.", "error");
      return;
    }
    if (expenseStep === 2) {
      if (!isStepValid(2)) {
        addToast(`Payers sum must equal the total expense amount (₹${amtNum}).`, "error");
        return;
      }
    }
    if (expenseStep === 3) {
      const activePayers = payerType === "single"
        ? [singlePayerId]
        : Object.entries(multiplePayersAmount)
            .filter(([_, amt]) => Number(amt) > 0)
            .map(([uid]) => uid);
            
      const missingPayers = activePayers.filter((uid) => !participantIds.includes(uid));
      let finalParticipants = [...participantIds];
      if (missingPayers.length > 0) {
        finalParticipants = [...participantIds, ...missingPayers];
        setParticipantIds(finalParticipants);
        addToast("Payers were automatically included as split participants.", "info");
      }
      if (finalParticipants.length < 2) {
        addToast("Please select at least 2 participants to split this expense.", "error");
        return;
      }
    }
    if (expenseStep === 4 && !isStepValid(4)) {
      if (splitType === "EXACT") {
        addToast(`Sum of exact splits (₹${exactSplitTotalSum}) must equal total expense amount (₹${amtNum}).`, "error");
      } else if (splitType === "PERCENTAGE") {
        addToast(`Sum of percentages (${percentageSplitTotalSum}%) must equal exactly 100%.`, "error");
      }
      return;
    }
    setExpenseStep((prev) => prev + 1);
  };

  const handleExpenseFormSubmit = async () => {
    if (!isStepValid(4)) return;
    setFormSubmitLoading(true);
    try {
      const amtNum = Number(expenseAmount);
      let paidBy = [];
      if (payerType === "single") {
        paidBy = [{ user: singlePayerId, amount: amtNum }];
      } else {
        paidBy = Object.entries(multiplePayersAmount)
          .filter(([_, amt]) => Number(amt) > 0)
          .map(([uid, amt]) => ({ user: uid, amount: Number(amt) }));
      }

      let participants = [];
      if (splitType === "EQUAL") {
        const perPersonShare = Number((amtNum / participantIds.length).toFixed(2));
        participants = participantIds.map((uid, index) => {
          let share = perPersonShare;
          if (index === participantIds.length - 1) {
            share = Number((amtNum - perPersonShare * (participantIds.length - 1)).toFixed(2));
          }
          return { user: uid, share, percentage: 0 };
        });
      } else if (splitType === "EXACT") {
        participants = participantIds.map((uid) => ({
          user: uid,
          share: Number(exactAmounts[uid] || 0),
          percentage: 0
        }));
      } else if (splitType === "PERCENTAGE") {
        let assignedShare = 0;
        participants = participantIds.map((uid, index) => {
          const pct = Number(percentages[uid] || 0);
          let share;
          if (index === participantIds.length - 1) {
            share = Number((amtNum - assignedShare).toFixed(2));
          } else {
            share = Number(((amtNum * pct) / 100).toFixed(2));
            assignedShare += share;
          }
          return { user: uid, share, percentage: pct };
        });
      }

      const payload = {
        title: expenseTitle.trim(),
        description: expenseDescription.trim(),
        totalAmount: amtNum,
        splitType,
        group: groupId,
        paidBy,
        participants,
        category: expenseCategory,
        currency: expenseCurrency,
        notes: expenseNotes.trim(),
        expenseDate: new Date(expenseDate).toISOString()
      };

      if (expenseIsEditing) {
        await API.put(`/expenses/${editingExpenseId}`, payload);
        addToast("Expense updated successfully!", "success");
      } else {
        await API.post("/expenses", payload);
        addToast("Expense created successfully!", "success");
      }

      setExpenseFormOpen(false);
      fetchExpenses();
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || "Failed to save expense.", "error");
    } finally {
      setFormSubmitLoading(false);
    }
  };

  // GREEDY CASH FLOW MINIMIZATION UTILITY
  const cashFlowDetails = useMemo(() => {
    if (!group?.members || !expenses || !settlements) {
      return { memberBalances: {}, suggestions: [] };
    }

    const roundVal = (v) => Number(Number(v).toFixed(2));
    
    // Initialize map
    const balMap = {};
    group.members.forEach((m) => {
      const uid = (m.user?._id || m.user)?.toString();
      if (uid) balMap[uid] = 0;
    });

    // Process expenses net balances
    expenses.forEach((exp) => {
      if (exp.isDeleted) return;
      exp.paidBy?.forEach((payer) => {
        const uid = (payer.user?._id || payer.user)?.toString();
        if (uid in balMap) {
          balMap[uid] = roundVal(balMap[uid] + payer.amount);
        }
      });
      exp.participants?.forEach((p) => {
        const uid = (p.user?._id || p.user)?.toString();
        if (uid in balMap) {
          balMap[uid] = roundVal(balMap[uid] - p.share);
        }
      });
    });

    // Separate debtors/creditors
    const creditors = [];
    const debtors = [];
    Object.entries(balMap).forEach(([uid, val]) => {
      if (val > 0.01) {
        creditors.push({ user: uid, amount: val });
      } else if (val < -0.01) {
        debtors.push({ user: uid, amount: Math.abs(val) });
      }
    });

    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const rawSuggestions = [];
    let cIdx = 0;
    let dIdx = 0;
    const credClone = creditors.map((c) => ({ ...c }));
    const debtClone = debtors.map((d) => ({ ...d }));

    while (cIdx < credClone.length && dIdx < debtClone.length) {
      const cred = credClone[cIdx];
      const debt = debtClone[dIdx];
      const settled = roundVal(Math.min(cred.amount, debt.amount));

      rawSuggestions.push({
        from: debt.user,
        to: cred.user,
        amount: settled
      });

      cred.amount = roundVal(cred.amount - settled);
      debt.amount = roundVal(debt.amount - settled);

      if (cred.amount <= 0.01) cIdx++;
      if (debt.amount <= 0.01) dIdx++;
    }

    // Apply completed settlements to suggestions
    const completedMap = {};
    settlements.forEach((s) => {
      if (s.status !== "COMPLETED") return;
      const key = `${(s.from?._id || s.from).toString()}-${(s.to?._id || s.to).toString()}`;
      completedMap[key] = roundVal((completedMap[key] || 0) + s.amount);
    });

    const suggestions = rawSuggestions
      .map((t) => {
        const key = `${t.from}-${t.to}`;
        const completed = completedMap[key] || 0;
        return {
          ...t,
          amount: roundVal(t.amount - completed)
        };
      })
      .filter((t) => t.amount > 0.01);

    return {
      memberBalances: balMap,
      suggestions
    };
  }, [group, expenses, settlements]);

  // Settle Debt Button trigger inside Settlements tab
  const handleOpenSettleModal = (suggestion) => {
    const fromMember = group.members.find((m) => (m.user?._id || m.user)?.toString() === suggestion.from.toString())?.user;
    const toMember = group.members.find((m) => (m.user?._id || m.user)?.toString() === suggestion.to.toString())?.user;
    
    if (!fromMember || !toMember) {
      addToast("Failed to identify transaction members.", "error");
      return;
    }

    setSettlementFromUser(fromMember);
    setSettlementToUser(toMember);
    setSettlementAmount(suggestion.amount.toString());
    setSettlementMaxLimit(suggestion.amount);
    setSettlementNote("");
    setCreateSettlementOpen(true);
  };

  // Submit Settlement request
  const handleCreateSettlementSubmit = async (e) => {
    e.preventDefault();
    const val = Number(settlementAmount);
    if (isNaN(val) || val <= 0) {
      addToast("Amount must be greater than zero.", "error");
      return;
    }
    if (val > settlementMaxLimit) {
      addToast(`Max settlement amount allowed is ₹${settlementMaxLimit}`, "error");
      return;
    }

    setCreateSettlementLoading(true);
    try {
      await API.post("/settlements", {
        from: settlementFromUser._id,
        to: settlementToUser._id,
        group: groupId,
        amount: val,
        note: settlementNote.trim()
      });
      addToast("Settlement request recorded successfully!", "success");
      setCreateSettlementOpen(false);
      fetchSettlements();
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || "Failed to create settlement.", "error");
    } finally {
      setCreateSettlementLoading(false);
    }
  };

  // Accept settlement request (creditor action)
  const handleAcceptSettlement = async (settlementId) => {
    setConfirmModal({
      isOpen: true,
      title: "Accept Payment",
      message: "Are you sure you received this payment? Outstanding balances will update.",
      confirmText: "Accept Payment",
      type: "info",
      loading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          await API.patch(`/settlements/${settlementId}/accept`);
          addToast("Settlement accepted successfully!", "success");
          fetchSettlements();
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

  // Reject settlement request (creditor action)
  const handleRejectSettlement = async (settlementId) => {
    setConfirmModal({
      isOpen: true,
      title: "Reject Payment",
      message: "Are you sure you want to reject this payment record?",
      confirmText: "Reject",
      type: "danger",
      loading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          await API.patch(`/settlements/${settlementId}/reject`);
          addToast("Settlement rejected successfully.", "success");
          fetchSettlements();
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

  // Cancel settlement request (debtor action)
  const handleCancelSettlement = async (settlementId) => {
    setConfirmModal({
      isOpen: true,
      title: "Cancel Settlement",
      message: "Are you sure you want to cancel this pending payment request?",
      confirmText: "Cancel Request",
      type: "danger",
      loading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          await API.patch(`/settlements/${settlementId}/cancel`);
          addToast("Settlement request cancelled successfully.", "success");
          fetchSettlements();
        } catch (err) {
          console.error(err);
          addToast(err.response?.data?.message || "Failed to cancel settlement.", "error");
        } finally {
          setConfirmModal({ isOpen: false });
        }
      },
      onCancel: () => setConfirmModal((prev) => ({ ...prev, isOpen: false }))
    });
  };

  // Category Icon Resolver
  const renderCategoryIcon = (category) => {
    const data = CATEGORY_MAP[category] || CATEGORY_MAP.Other;
    const IconComp = data.icon;
    return (
      <div className={`p-3 rounded-2xl border ${data.bg} flex-shrink-0 flex items-center justify-center`}>
        <IconComp className="w-5 h-5" />
      </div>
    );
  };

  // Group Header Avatar Resolver
  const renderHeaderAvatar = () => {
    if (group.groupPhoto && !group.groupPhoto.startsWith("gradient:")) {
      return (
        <img
          src={group.groupPhoto}
          alt={group.name}
          className="w-16 h-16 rounded-3xl object-cover border border-slate-200 bg-slate-50 flex-shrink-0"
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
        className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${gradientClasses} flex items-center justify-center font-black text-lg text-white shadow-lg shadow-slate-200/50 flex-shrink-0`}
      >
        {initials}
      </div>
    );
  };

  // Member Card Avatar Resolver
  const renderMemberAvatar = (memberUser) => {
    if (memberUser.profilePhoto) {
      return (
        <img
          src={memberUser.profilePhoto}
          alt={memberUser.name}
          className="w-9 h-9 rounded-full object-cover border border-slate-200 bg-white flex-shrink-0"
        />
      );
    }

    const initials = memberUser.name
      ? memberUser.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "U";

    return (
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center font-bold text-xs text-white border border-emerald-200 shadow-inner flex-shrink-0">
        {initials}
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
            <p className="text-slate-500 text-xs font-semibold">Loading group details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!group) return null;

  const creatorId = group.createdBy?._id || group.createdBy;

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
      className="min-h-screen bg-[#f8fafc] text-slate-800 relative pb-24"
    >
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* BACK TO GROUPS BUTTON */}
        <button
          onClick={() => navigate("/groups")}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-950 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Groups
        </button>

        {/* HEADER BLOCK */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-xl shadow-slate-200/35 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start md:items-center gap-5 min-w-0">
            {renderHeaderAvatar()}
            <div className="min-w-0">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 truncate">
                {group.name}
              </h1>
              {group.description && (
                <p className="text-slate-500 text-sm mt-1 leading-relaxed line-clamp-2">
                  {group.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-3.5">
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-lg border border-emerald-200/40">
                  <Users className="w-3.5 h-3.5" />
                  {group.members?.length || 0} Members
                </span>
                <span className="text-slate-400 text-xs font-medium">
                  Created by {group.createdBy?.name || "unknown"}
                </span>
              </div>
            </div>
          </div>

          {/* Group Level Action Button */}
          {isUserInGroup && !isCreator && (
            <button
              onClick={handleLeaveGroupClick}
              className="md:self-start flex-shrink-0 flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/70 text-rose-600 font-bold text-xs px-4 py-2.5 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Leave Group
            </button>
          )}
        </div>

        {/* NAVIGATION TABS */}
        <div className="border-b border-slate-200 mb-8">
          <div className="flex flex-wrap gap-2">
            {TAB_CONFIGS.map((t) => {
              const IconComp = t.icon;
              const isSelected = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-4.5 py-3 border-b-2 font-bold text-xs transition-all ${
                    isSelected
                      ? "border-emerald-600 text-emerald-700 font-extrabold"
                      : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                  }`}
                >
                  <IconComp className={`w-4 h-4 ${isSelected ? "text-emerald-600" : "text-slate-400"}`} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB WORKSPACE */}
        <div className="min-h-[300px]">
          {/* EXPENSES TAB */}
          {activeTab === "expenses" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Group Expenses</h2>
                  <p className="text-slate-400 text-[11px] font-semibold uppercase mt-0.5 tracking-wider">
                    Logged Bills & Splits
                  </p>
                </div>
                <button
                  onClick={openAddExpenseModal}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs px-4 py-2.5 shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Expense
                </button>
              </div>

              {expensesLoading ? (
                <LoadingSkeleton variant="card" count={2} />
              ) : expenses.length === 0 ? (
                <EmptyState
                  icon={DollarSign}
                  title="No expenses logged yet."
                  description="Split shared receipts, restaurant bills, and household dues. Keep tracking simple."
                  actionLabel="Log Your First Expense"
                  onAction={openAddExpenseModal}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {expenses.map((expense) => {
                    const formattedDate = new Date(expense.expenseDate || expense.createdAt).toLocaleDateString(
                      "en-IN",
                      { month: "short", day: "numeric", year: "numeric" }
                    );

                    const mainPayer = expense.paidBy?.[0]?.user?.name || "Someone";
                    const paidByLabel =
                      expense.paidBy?.length > 1
                        ? `${mainPayer} and ${expense.paidBy.length - 1} others`
                        : `${mainPayer}`;

                    return (
                      <div
                        key={expense._id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between shadow-sm hover:border-slate-300 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-start gap-4">
                          {renderCategoryIcon(expense.category)}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="font-extrabold text-sm text-slate-800 truncate">{expense.title}</h3>
                              <span className="font-black text-slate-900 font-mono text-sm">
                                ₹{expense.totalAmount}
                              </span>
                            </div>
                            
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {expense.category} &bull; {formattedDate}
                            </p>

                            <div className="flex flex-wrap gap-2 mt-3.5">
                              <span className="inline-flex items-center text-[10px] font-bold bg-slate-100 border border-slate-200/50 text-slate-600 px-2 py-0.5 rounded-md">
                                Paid by: {paidByLabel}
                              </span>
                              <span className="inline-flex items-center text-[10px] font-bold bg-emerald-50 border border-emerald-200/50 text-emerald-700 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                {expense.splitType} SPLIT
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* ACTIONS FOOTER */}
                        <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => setViewingExpense(expense)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-650 font-bold text-[10px] transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                          <button
                            onClick={() => openEditExpenseModal(expense)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-650 font-bold text-[10px] transition-colors flex items-center gap-1"
                          >
                            <Pencil className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteExpenseClick(expense)}
                            className="px-3 py-1.5 rounded-lg border border-rose-200 hover:border-rose-300 bg-rose-50/20 text-rose-600 hover:text-rose-700 font-bold text-[10px] transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MEMBERS TAB */}
          {activeTab === "members" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Group Members
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-extrabold">
                    {group.members?.length || 0}
                  </span>
                </h2>
                {isAdmin && (
                  <button
                    onClick={openAddMembersModal}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs px-3.5 py-2.5 shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Add Members
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.members?.map((m) => {
                  const memberUser = m.user;
                  if (!memberUser) return null;
                  
                  const isMemberSelf = memberUser._id?.toString() === currentUser?._id?.toString();
                  const isMemberAdmin = m.role === "ADMIN";
                  const isMemberCreator = memberUser._id?.toString() === creatorId?.toString();

                  return (
                    <div
                      key={memberUser._id}
                      className="rounded-2xl border border-slate-200 bg-white p-4.5 flex items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {renderMemberAvatar(memberUser)}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-extrabold text-sm text-slate-800 truncate">
                              {memberUser.name} {isMemberSelf && <span className="text-slate-400 font-semibold">(You)</span>}
                            </h4>
                            {isMemberCreator && (
                              <span className="flex-shrink-0 inline-block bg-indigo-50 border border-indigo-200 text-indigo-700 text-[9px] font-extrabold px-1.5 py-0.2 rounded-md uppercase">
                                Creator
                              </span>
                            )}
                            {isMemberAdmin && (
                              <span className="flex-shrink-0 inline-block bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-extrabold px-1.5 py-0.2 rounded-md uppercase">
                                Admin
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{memberUser.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isAdmin && !isMemberSelf && (
                          <>
                            {!isMemberAdmin && (
                              <button
                                onClick={() => handleMakeAdminClick(memberUser)}
                                className="p-2 rounded-xl border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 text-slate-400 transition-colors"
                                title="Make Admin"
                              >
                                <Shield className="w-4 h-4" />
                              </button>
                            )}

                            {!isMemberCreator && (
                              <button
                                onClick={() => handleRemoveMemberClick(memberUser)}
                                className="p-2 rounded-xl border border-slate-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-colors"
                                title="Remove Member"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                        
                        {isMemberSelf && !isMemberCreator && (
                          <button
                            onClick={handleLeaveGroupClick}
                            className="flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50/30 px-3 py-1.5 hover:bg-rose-50 text-rose-600 font-bold text-xs transition-colors"
                            title="Leave Group"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            Leave
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* BALANCES TAB */}
          {activeTab === "balances" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-base font-bold text-slate-900">Outstanding Balances</h2>
                <p className="text-slate-400 text-[11px] font-semibold uppercase mt-0.5 tracking-wider">
                  Net Group Debts
                </p>
              </div>

              {/* Prominent net balance header card for current user */}
              {(() => {
                const myBal = cashFlowDetails.memberBalances[currentUser?._id] || 0;
                if (myBal > 0.01) {
                  return (
                    <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 shadow-sm flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-black text-emerald-800">You are owed in total</h3>
                        <p className="text-xs text-emerald-600/90 mt-1 font-semibold">Other members need to reimburse you.</p>
                      </div>
                      <span className="text-2xl font-black font-mono text-emerald-700">₹{myBal.toFixed(2)}</span>
                    </div>
                  );
                } else if (myBal < -0.01) {
                  return (
                    <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/60 shadow-sm flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-black text-amber-800">You owe in total</h3>
                        <p className="text-xs text-amber-600/90 mt-1 font-semibold">Please settle up your outstanding dues.</p>
                      </div>
                      <span className="text-2xl font-black font-mono text-amber-700">₹{Math.abs(myBal).toFixed(2)}</span>
                    </div>
                  );
                } else {
                  return (
                    <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4 shadow-inner">
                      <div>
                        <h3 className="text-sm font-black text-slate-700">All Settled Up</h3>
                        <p className="text-xs text-slate-400 mt-1 font-semibold">You do not owe anything and are not owed in this group.</p>
                      </div>
                      <span className="text-2xl font-black font-mono text-slate-400">₹0.00</span>
                    </div>
                  );
                }
              })()}

              {/* Members Net Balances Grid */}
              <div className="space-y-3.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Member Standings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.members.map((m) => {
                    const u = m.user || {};
                    const bal = cashFlowDetails.memberBalances[u._id] || 0;
                    return (
                      <div
                        key={u._id}
                        className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 shadow-sm"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {u.profilePhoto ? (
                            <img src={u.profilePhoto} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-500">
                              {u.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-700 truncate block">
                              {u.name} {u._id === currentUser?._id && "(You)"}
                            </span>
                          </div>
                        </div>
                        {bal > 0.01 ? (
                          <span className="text-xs font-black font-mono text-emerald-600">+₹{bal.toFixed(2)}</span>
                        ) : bal < -0.01 ? (
                          <span className="text-xs font-black font-mono text-rose-500">-₹{Math.abs(bal).toFixed(2)}</span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">Settled</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Relationships list (e.g. Rahul owes Amit ₹150) */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Debit Lines</h3>
                {cashFlowDetails.suggestions.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-200 bg-white rounded-2xl text-slate-400 text-xs font-semibold">
                    No active debit relationships. Everything is settled!
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {cashFlowDetails.suggestions.map((suggestion, idx) => {
                      const fromUser = group.members.find((m) => (m.user?._id || m.user)?.toString() === suggestion.from.toString())?.user;
                      const toUser = group.members.find((m) => (m.user?._id || m.user)?.toString() === suggestion.to.toString())?.user;

                      if (!fromUser || !toUser) return null;

                      const fromLabel = fromUser._id === currentUser?._id ? "You" : fromUser.name;
                      const toLabel = toUser._id === currentUser?._id ? "You" : toUser.name;
                      const owesLabel = fromUser._id === currentUser?._id ? "owe" : "owes";

                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl border border-slate-150 bg-white shadow-sm flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
                            <TrendingDown className={`w-4.5 h-4.5 ${fromUser._id === currentUser?._id ? "text-rose-500" : "text-slate-400"}`} />
                            <span>
                              {fromLabel} {owesLabel} <span className="text-emerald-700">{toLabel}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-sm font-mono text-slate-900">
                              ₹{suggestion.amount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SETTLEMENTS TAB */}
          {activeTab === "settlements" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* SUGGESTED SETTLEMENTS */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Suggested Settlements</h3>
                {cashFlowDetails.suggestions.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-200 bg-white rounded-2xl text-slate-400 text-xs font-semibold">
                    No suggestions available. The group is fully balanced.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cashFlowDetails.suggestions.map((s, idx) => {
                      const fromUser = group.members.find((m) => (m.user?._id || m.user)?.toString() === s.from.toString())?.user;
                      const toUser = group.members.find((m) => (m.user?._id || m.user)?.toString() === s.to.toString())?.user;

                      if (!fromUser || !toUser) return null;

                      const payerName = fromUser._id === currentUser?._id ? "You" : fromUser.name;
                      const payeeName = toUser._id === currentUser?._id ? "You" : toUser.name;

                      return (
                        <div
                          key={idx}
                          className="rounded-2xl border border-slate-250 bg-white p-4.5 flex flex-col justify-between shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-xs font-bold text-slate-700 truncate">
                                {payerName} &rarr; {payeeName}
                              </span>
                            </div>
                            <span className="font-extrabold text-slate-900 font-mono text-sm">
                              ₹{s.amount.toFixed(2)}
                            </span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleOpenSettleModal(s)}
                            className="w-full text-center py-2.5 rounded-xl border border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 hover:text-emerald-800 text-emerald-700 text-xs font-extrabold transition-all"
                          >
                            Record Settlement
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* PENDING CONFIRMATIONS */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Pending Confirmations</h3>
                {(() => {
                  const pendingList = settlements.filter((s) => s.status === "PENDING");
                  if (pendingList.length === 0) {
                    return (
                      <div className="p-6 text-center border border-dashed border-slate-200 bg-white rounded-2xl text-slate-400 text-xs font-semibold">
                        No pending settlement requests.
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-3">
                      {pendingList.map((s) => {
                        const fromUser = s.from || {};
                        const toUser = s.to || {};
                        const isUserReceiver = toUser._id === currentUser?._id;
                        const isUserSender = fromUser._id === currentUser?._id;

                        return (
                          <div
                            key={s._id}
                            className="rounded-2xl border border-amber-200 bg-amber-50/10 p-4.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm"
                          >
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex text-[9px] font-extrabold bg-amber-150 border border-amber-300 text-amber-800 px-2 py-0.5 rounded uppercase tracking-wider">
                                  Pending confirmation
                                </span>
                                {s.note && (
                                  <span className="text-[10px] text-slate-400 font-semibold italic truncate">
                                    "{s.note}"
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-bold text-slate-750">
                                {fromUser.name} paid {toUser.name} &bull; <span className="font-mono text-slate-900 text-sm font-extrabold">₹{s.amount}</span>
                              </p>
                              <p className="text-[10px] text-slate-400 font-semibold">
                                Logged on {new Date(s.createdAt).toLocaleString("en-IN")}
                              </p>
                            </div>

                            {/* DYNAMIC PERMISSION BUTTONS */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {isUserReceiver && (
                                <>
                                  <button
                                    onClick={() => handleAcceptSettlement(s._id)}
                                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow shadow-emerald-600/10"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleRejectSettlement(s._id)}
                                    className="px-3.5 py-2 rounded-xl border border-rose-250 hover:bg-rose-50 text-rose-600 font-bold text-xs transition-colors"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {isUserSender && (
                                <button
                                  onClick={() => handleCancelSettlement(s._id)}
                                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 font-bold text-xs transition-colors"
                                >
                                  Cancel Request
                                </button>
                              )}
                              {!isUserReceiver && !isUserSender && (
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                                  Awaiting approval from {toUser.name}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* SETTLEMENT HISTORY */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-bold">Settlement Logs</h3>
                {(() => {
                  const historyList = settlements.filter((s) => s.status !== "PENDING");
                  if (historyList.length === 0) {
                    return (
                      <div className="p-6 text-center border border-dashed border-slate-200 bg-white rounded-2xl text-slate-400 text-xs font-semibold">
                        No historical settlement transactions recorded.
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-3">
                      {historyList.map((s) => {
                        const fromUser = s.from || {};
                        const toUser = s.to || {};
                        
                        // Status styling config
                        const badgeConfigs = {
                          COMPLETED: "bg-emerald-50 border-emerald-200 text-emerald-700",
                          REJECTED: "bg-rose-50 border-rose-200 text-rose-700",
                          CANCELLED: "bg-slate-100 border-slate-200 text-slate-500"
                        };
                        const configClass = badgeConfigs[s.status] || "bg-slate-50 text-slate-500";

                        return (
                          <div
                            key={s._id}
                            className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-between gap-4"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                <span className={`inline-block text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase ${configClass}`}>
                                  {s.status}
                                </span>
                                {s.note && (
                                  <span className="text-[10px] text-slate-400 italic font-semibold truncate">
                                    "{s.note}"
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-bold text-slate-700">
                                {fromUser.name} settled with {toUser.name} &bull; <span className="font-mono text-slate-900 font-extrabold">₹{s.amount}</span>
                              </p>
                              <p className="text-[9px] text-slate-400 mt-0.5 font-semibold">
                                {new Date(s.confirmedAt || s.rejectedAt || s.cancelledAt || s.createdAt).toLocaleString("en-IN")}
                              </p>
                            </div>
                            <div className="flex-shrink-0 text-slate-450 p-2 rounded-xl bg-slate-50 border border-slate-100">
                              <Check className={`w-4 h-4 ${s.status === "COMPLETED" ? "text-emerald-500" : "text-slate-400"}`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FLOATING ACTION BUTTON */}
      {activeTab === "expenses" && (
        <button
          onClick={openAddExpenseModal}
          className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xl shadow-emerald-600/30 hover:scale-105 active:scale-95 transition-all duration-200 border border-emerald-400/20"
          title="Add Expense"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      {/* VIEW EXPENSE MODAL */}
      {viewingExpense && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center px-4 py-8 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-200 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <h2 className="text-lg font-black text-slate-900">Expense Details</h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase mt-0.5 tracking-wider">
                  Category: {viewingExpense.category}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingExpense(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4.5 p-4 rounded-2xl bg-slate-50 border border-slate-150">
                {renderCategoryIcon(viewingExpense.category)}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-extrabold text-slate-800 truncate">{viewingExpense.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(viewingExpense.expenseDate || viewingExpense.createdAt).toLocaleDateString("en-IN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-slate-900 font-mono">₹{viewingExpense.totalAmount}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    {viewingExpense.splitType} split
                  </p>
                </div>
              </div>

              {(viewingExpense.description || viewingExpense.notes) && (
                <div className="space-y-3.5">
                  {viewingExpense.description && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</h4>
                      <p className="text-sm text-slate-600 mt-1 leading-relaxed">{viewingExpense.description}</p>
                    </div>
                  )}
                  {viewingExpense.notes && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Notes</h4>
                      <p className="text-sm text-slate-650 bg-slate-50 border border-slate-100 rounded-xl p-3 mt-1 text-xs leading-relaxed italic">
                        {viewingExpense.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Paid By</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {viewingExpense.paidBy?.map((payer) => {
                    const u = payer.user || {};
                    return (
                      <div key={u._id} className="flex items-center justify-between py-1 border-b border-slate-50">
                        <div className="flex items-center gap-2.5">
                          {u.profilePhoto ? (
                            <img src={u.profilePhoto} alt={u.name} className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[9px] text-slate-500">
                              {u.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </div>
                          )}
                          <span className="text-xs font-bold text-slate-700">{u.name}</span>
                        </div>
                        <span className="text-xs font-bold font-mono text-slate-800">₹{payer.amount}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Split Breakdown</h4>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {viewingExpense.participants?.map((p) => {
                    const u = p.user || {};
                    return (
                      <div key={u._id} className="flex items-center justify-between py-1 border-b border-slate-50">
                        <div className="flex items-center gap-2.5">
                          {u.profilePhoto ? (
                            <img src={u.profilePhoto} alt={u.name} className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[9px] text-slate-500">
                              {u.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </div>
                          )}
                          <span className="text-xs font-bold text-slate-750">{u.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold font-mono text-slate-800">₹{p.share}</span>
                          {viewingExpense.splitType === "PERCENTAGE" && p.percentage > 0 && (
                            <span className="text-[10px] text-slate-400 font-semibold block font-mono">
                              ({p.percentage}%)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end border-t border-slate-100 pt-4.5">
              <button
                type="button"
                onClick={() => setViewingExpense(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE SETTLEMENT MODAL */}
      {createSettlementOpen && settlementFromUser && settlementToUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center px-4 py-8 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl p-6 md:p-7 animate-in zoom-in-95 duration-200 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <div>
                <h2 className="text-lg font-black text-slate-900">Record a Settlement</h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase mt-0.5 tracking-wider">
                  Outstanding: ₹{settlementMaxLimit.toFixed(2)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateSettlementOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSettlementSubmit} className="space-y-4">
              {/* Debt path visualization */}
              <div className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-3 text-xs font-bold text-slate-700 shadow-inner">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-500" />
                  <span>{settlementFromUser._id === currentUser?._id ? "You" : settlementFromUser.name}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span>{settlementToUser._id === currentUser?._id ? "You" : settlementToUser.name}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Settled Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 font-mono font-bold text-slate-400 text-sm">₹</span>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    max={settlementMaxLimit}
                    value={settlementAmount}
                    onChange={(e) => setSettlementAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-4 py-2.5 text-sm font-bold font-mono text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 font-semibold">
                  Must be less than or equal to outstanding balance.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Note / Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid via GPay, cash given"
                  value={settlementNote}
                  onChange={(e) => setSettlementNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-850 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setCreateSettlementOpen(false)}
                  className="px-4.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSettlementLoading}
                  className="px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center gap-1.5"
                >
                  {createSettlementLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5-STEP EXPENSE FORM MODAL */}
      {expenseFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center px-4 py-8 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-200 my-auto flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4.5 flex-shrink-0">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {expenseIsEditing ? "Edit Expense" : "Add Expense"}
                </h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase mt-0.5 tracking-wider">
                  Step {expenseStep} of 5 &bull; {expenseStep === 1 && "Details"}
                  {expenseStep === 2 && "Payers"}
                  {expenseStep === 3 && "Split Participants"}
                  {expenseStep === 4 && "Split Method"}
                  {expenseStep === 5 && "Review"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExpenseFormOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full bg-slate-100 h-1.5 rounded-full mb-6 flex-shrink-0 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full transition-all duration-300"
                style={{ width: `${(expenseStep / 5) * 100}%` }}
              />
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4.5 custom-scrollbar">
              {expenseStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Expense Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pizza dinner, Uber ride, Airbnb share"
                      value={expenseTitle}
                      onChange={(e) => setExpenseTitle(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Total Amount <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-4 font-mono font-bold text-slate-400 text-sm">₹</span>
                        <input
                          type="number"
                          required
                          min="0.01"
                          step="0.01"
                          placeholder="0.00"
                          value={expenseAmount}
                          onChange={(e) => setExpenseAmount(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-4 py-3 text-sm font-bold font-mono text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Category
                      </label>
                      <select
                        value={expenseCategory}
                        onChange={(e) => setExpenseCategory(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                      >
                        {Object.keys(CATEGORY_MAP).map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Currency
                      </label>
                      <select
                        value={expenseCurrency}
                        onChange={(e) => setExpenseCurrency(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                      >
                        {CURRENCIES.map((cur) => (
                          <option key={cur} value={cur}>
                            {cur}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Expense Date
                      </label>
                      <input
                        type="date"
                        value={expenseDate}
                        onChange={(e) => setExpenseDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-750 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Add brief details..."
                      value={expenseDescription}
                      onChange={(e) => setExpenseDescription(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      placeholder="Receipt details, split exceptions..."
                      rows={2}
                      value={expenseNotes}
                      onChange={(e) => setExpenseNotes(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm resize-none"
                    />
                  </div>
                </div>
              )}

              {expenseStep === 2 && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPayerType("single");
                        const selfInGroup = group.members.some((m) => (m.user?._id || m.user)?.toString() === currentUser?._id?.toString());
                        setSinglePayerId(selfInGroup ? currentUser?._id : (group.members[0]?.user?._id || ""));
                        setMultiplePayersAmount({});
                      }}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                        payerType === "single"
                          ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Single Payer
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPayerType("multiple");
                        setSinglePayerId("");
                        const initial = {};
                        if (singlePayerId) {
                          initial[singlePayerId] = expenseAmount;
                        }
                        setMultiplePayersAmount(initial);
                      }}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                        payerType === "multiple"
                          ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Multiple Payers
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    {payerType === "single" ? (
                      <div className="space-y-2 max-h-72 overflow-y-auto p-1 custom-scrollbar">
                        {group.members.map((m) => {
                          const userObj = m.user || {};
                          const isSelected = singlePayerId === userObj._id;
                          return (
                            <button
                              key={userObj._id}
                              type="button"
                              onClick={() => setSinglePayerId(userObj._id)}
                              className={`w-full p-3 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all ${
                                isSelected
                                  ? "bg-emerald-50/60 border-emerald-200 text-emerald-800 shadow-sm"
                                  : "bg-white border-slate-100 hover:bg-slate-50 text-slate-700"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {userObj.profilePhoto ? (
                                  <img
                                    src={userObj.profilePhoto}
                                    alt={userObj.name}
                                    className="w-8 h-8 rounded-full object-cover border border-slate-200 bg-white"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-500">
                                    {userObj.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                                  </div>
                                )}
                                <span className="text-xs font-bold truncate">
                                  {userObj.name}
                                  {userObj._id === currentUser?._id && " (You)"}
                                </span>
                              </div>
                              <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                  isSelected
                                    ? "bg-emerald-600 border-emerald-600 text-white shadow-inner"
                                    : "bg-white border-slate-300"
                                }`}
                              >
                                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-72 overflow-y-auto p-1 custom-scrollbar">
                        {group.members.map((m) => {
                          const userObj = m.user || {};
                          const userVal = multiplePayersAmount[userObj._id] || "";
                          return (
                            <div
                              key={userObj._id}
                              className="p-3 rounded-2xl border border-slate-150 bg-white flex items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {userObj.profilePhoto ? (
                                  <img
                                    src={userObj.profilePhoto}
                                    alt={userObj.name}
                                    className="w-8 h-8 rounded-full object-cover border border-slate-200 bg-white"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-500">
                                    {userObj.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                                  </div>
                                )}
                                <span className="text-xs font-bold truncate text-slate-700">
                                  {userObj.name}
                                </span>
                              </div>
                              <div className="relative flex items-center max-w-[120px]">
                                <span className="absolute left-3 font-mono text-[10px] font-bold text-slate-450">₹</span>
                                <input
                                  type="number"
                                  placeholder="0.00"
                                  value={userVal}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setMultiplePayersAmount((prev) => ({
                                      ...prev,
                                      [userObj._id]: val
                                    }));
                                  }}
                                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-6 pr-2.5 py-1.5 text-xs text-right font-bold font-mono text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl border flex items-center justify-between text-xs font-bold mt-2 shadow-sm bg-slate-50 border-slate-200">
                    <span className="text-slate-500">Validation Status</span>
                    {payerType === "single" ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Checked Payer
                      </span>
                    ) : (
                      (() => {
                        const amtNum = Number(expenseAmount);
                        const diff = amtNum - multiplePayersTotalSum;
                        if (Math.abs(diff) < 0.01) {
                          return (
                            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-150 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Sum Balanced: ₹{multiplePayersTotalSum}
                            </span>
                          );
                        } else {
                          return (
                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                              {diff > 0 ? `₹${diff.toFixed(2)} Remaining` : `Over split by ₹${Math.abs(diff).toFixed(2)}`}
                            </span>
                          );
                        }
                      })()
                    )}
                  </div>
                </div>
              )}

              {expenseStep === 3 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs text-slate-500">Check who shares in this expense amount.</p>
                    <button
                      type="button"
                      onClick={() => setParticipantIds(group.members.map((m) => m.user?._id).filter(Boolean))}
                      className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider"
                    >
                      Select All
                    </button>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto p-1 custom-scrollbar">
                    {group.members.map((m) => {
                      const userObj = m.user || {};
                      const isSelected = participantIds.includes(userObj._id);
                      const isMemberPayer = payerType === "single"
                        ? singlePayerId === userObj._id
                        : Number(multiplePayersAmount[userObj._id] || 0) > 0;

                      return (
                        <div
                          key={userObj._id}
                          onClick={() => {
                            setParticipantIds((prev) =>
                              prev.includes(userObj._id)
                                ? prev.filter((id) => id !== userObj._id)
                                : [...prev, userObj._id]
                            );
                          }}
                          className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all cursor-pointer ${
                            isSelected
                              ? "bg-emerald-50/60 border-emerald-200 text-emerald-800 shadow-sm"
                              : "bg-white border-slate-100 hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {userObj.profilePhoto ? (
                              <img
                                src={userObj.profilePhoto}
                                alt={userObj.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 bg-white"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-500">
                                {userObj.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="text-xs font-bold truncate block">
                                {userObj.name}
                                {userObj._id === currentUser?._id && " (You)"}
                              </span>
                              {isMemberPayer && (
                                <span className="inline-block mt-0.5 text-[9px] font-bold bg-amber-50 border border-amber-100 text-amber-700 px-1 rounded uppercase tracking-wider">
                                  Payer (Must participate)
                                </span>
                              )}
                            </div>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                              isSelected
                                ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                                : "bg-white border-slate-300"
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3 rounded-2xl border flex items-center justify-between text-xs font-bold mt-2 shadow-sm bg-slate-50 border-slate-200">
                    <span className="text-slate-500 font-bold">Total Participants</span>
                    <span className={`px-2 py-0.5 rounded-md border text-[10px] uppercase ${
                      participantIds.length >= 2
                        ? "text-emerald-700 bg-emerald-50 border-emerald-100"
                        : "text-rose-700 bg-rose-50 border-rose-100"
                    }`}>
                      {participantIds.length} Checked (Min: 2)
                    </span>
                  </div>
                </div>
              )}

              {expenseStep === 4 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: "EQUAL", label: "Equally", desc: "Divide equal shares" },
                      { id: "EXACT", label: "Exact", desc: "Enter cash values" },
                      { id: "PERCENTAGE", label: "Percent", desc: "Enter percentages" }
                    ].map((typeItem) => {
                      const isSelected = splitType === typeItem.id;
                      return (
                        <button
                          key={typeItem.id}
                          type="button"
                          onClick={() => {
                            setSplitType(typeItem.id);
                            setExactAmounts({});
                            setPercentages({});
                          }}
                          className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${
                            isSelected
                              ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-md ring-2 ring-emerald-500/5 font-extrabold"
                              : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          <span className="text-xs block font-bold mb-1">{typeItem.label}</span>
                          <span className="text-[9px] text-slate-400 font-semibold block leading-tight">{typeItem.desc}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    {splitType === "EQUAL" ? (
                      <div className="space-y-2.5 max-h-72 overflow-y-auto p-1 custom-scrollbar">
                        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 text-center shadow-inner">
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Per Person Share</p>
                          <p className="text-2xl font-black font-mono text-emerald-700 mt-1.5">
                            ₹{(Number(expenseAmount) / participantIds.length).toFixed(2)}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-relaxed">
                            Splitting ₹{expenseAmount} evenly among {participantIds.length} members.
                          </p>
                        </div>

                        <div className="space-y-2 mt-4">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sharing Members</p>
                          {group.members
                            .filter((m) => participantIds.includes(m.user?._id))
                            .map((m) => {
                              const userObj = m.user || {};
                              return (
                                <div key={userObj._id} className="flex items-center justify-between p-2 rounded-xl border border-slate-100 bg-white">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {userObj.profilePhoto ? (
                                      <img src={userObj.profilePhoto} alt={userObj.name} className="w-6.5 h-6.5 rounded-full object-cover" />
                                    ) : (
                                      <div className="w-6.5 h-6.5 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[8px] text-slate-500">
                                        {userObj.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                                      </div>
                                    )}
                                    <span className="text-xs font-bold text-slate-700 truncate">{userObj.name}</span>
                                  </div>
                                  <span className="text-xs font-bold font-mono text-slate-500">
                                    ₹{(Number(expenseAmount) / participantIds.length).toFixed(2)}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ) : splitType === "EXACT" ? (
                      <div className="space-y-2 max-h-72 overflow-y-auto p-1 custom-scrollbar">
                        {group.members
                          .filter((m) => participantIds.includes(m.user?._id))
                          .map((m) => {
                            const userObj = m.user || {};
                            const userShare = exactAmounts[userObj._id] || "";
                            return (
                              <div
                                key={userObj._id}
                                className="p-3 rounded-2xl border border-slate-150 bg-white flex items-center justify-between gap-4"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  {userObj.profilePhoto ? (
                                    <img
                                      src={userObj.profilePhoto}
                                      alt={userObj.name}
                                      className="w-8 h-8 rounded-full object-cover border border-slate-200 bg-white"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-500">
                                      {userObj.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                                    </div>
                                  )}
                                  <span className="text-xs font-bold truncate text-slate-700">
                                    {userObj.name}
                                  </span>
                                </div>
                                <div className="relative flex items-center max-w-[120px]">
                                  <span className="absolute left-3 font-mono text-[10px] font-bold text-slate-450">₹</span>
                                  <input
                                    type="number"
                                    placeholder="0.00"
                                    value={userShare}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setExactAmounts((prev) => ({
                                        ...prev,
                                        [userObj._id]: val
                                      }));
                                    }}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-6 pr-2.5 py-1.5 text-xs text-right font-bold font-mono text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto p-1 custom-scrollbar">
                        {group.members
                          .filter((m) => participantIds.includes(m.user?._id))
                          .map((m) => {
                            const userObj = m.user || {};
                            const userPct = percentages[userObj._id] || "";
                            const calculatedShare = Number(expenseAmount)
                              ? ((Number(expenseAmount) * Number(userPct || 0)) / 100).toFixed(2)
                              : "0.00";

                            return (
                              <div
                                key={userObj._id}
                                className="p-3 rounded-2xl border border-slate-155 bg-white flex items-center justify-between gap-4"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  {userObj.profilePhoto ? (
                                    <img
                                      src={userObj.profilePhoto}
                                      alt={userObj.name}
                                      className="w-8 h-8 rounded-full object-cover border border-slate-200 bg-white"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-500">
                                      {userObj.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <span className="text-xs font-bold truncate text-slate-705 block">
                                      {userObj.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono font-semibold block">
                                      Share: ₹{calculatedShare}
                                    </span>
                                  </div>
                                </div>
                                <div className="relative flex items-center max-w-[120px]">
                                  <input
                                    type="number"
                                    placeholder="0"
                                    value={userPct}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setPercentages((prev) => ({
                                        ...prev,
                                        [userObj._id]: val
                                      }));
                                    }}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pr-7 pl-3 py-1.5 text-xs text-right font-bold font-mono text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
                                  />
                                  <span className="absolute right-3.5 font-bold text-slate-400 text-xs font-mono">%</span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {splitType !== "EQUAL" && (
                    <div className="p-3.5 rounded-2xl border flex items-center justify-between text-xs font-bold mt-2 bg-slate-50 border-slate-200 shadow-sm animate-in zoom-in-95">
                      <span className="text-slate-500">Splitting Calculator</span>
                      {splitType === "EXACT" ? (
                        (() => {
                          const amtNum = Number(expenseAmount);
                          const diff = amtNum - exactSplitTotalSum;
                          if (Math.abs(diff) < 0.01) {
                            return (
                              <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-150 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Split Balanced: ₹{exactSplitTotalSum}
                              </span>
                            );
                          } else {
                            return (
                              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                {diff > 0 ? `₹${diff.toFixed(2)} Remaining` : `Over split by ₹${Math.abs(diff).toFixed(2)}`}
                              </span>
                            );
                          }
                        })()
                      ) : (
                        (() => {
                          const diff = 100 - percentageSplitTotalSum;
                          if (Math.abs(diff) < 0.01) {
                            return (
                              <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-150 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Total: 100%
                              </span>
                            );
                          } else {
                            return (
                              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                {diff > 0 ? `${diff.toFixed(1)}% Remaining` : `Over split by ${Math.abs(diff).toFixed(1)}%`}
                              </span>
                            );
                          }
                        })()
                      )}
                    </div>
                  )}
                </div>
              )}

              {expenseStep === 5 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5 shadow-inner">
                    <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/50">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Expense Item</span>
                      <span className="text-xs font-bold text-slate-400">{expenseCategory} Category</span>
                    </div>
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="font-extrabold text-base text-slate-800 leading-tight">{expenseTitle}</h3>
                      <div className="text-right flex-shrink-0">
                        <span className="text-lg font-black text-slate-900 font-mono">₹{expenseAmount}</span>
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider mt-0.5">
                          {splitType} Split
                        </span>
                      </div>
                    </div>
                    {expenseDescription && (
                      <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-105 pt-2.5">
                        {expenseDescription}
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 mb-2">Paid By Breakdown</h4>
                    <div className="border border-slate-100 rounded-2xl p-3 bg-white space-y-2 shadow-sm max-h-36 overflow-y-auto">
                      {payerType === "single" ? (
                        (() => {
                          const payerObj = group.members.find((m) => (m.user?._id || m.user)?.toString() === singlePayerId.toString())?.user || {};
                          return (
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-700">{payerObj.name || "Someone"}</span>
                              <span className="font-bold font-mono text-slate-800">₹{expenseAmount}</span>
                            </div>
                          );
                        })()
                      ) : (
                        Object.entries(multiplePayersAmount)
                          .filter(([_, amt]) => Number(amt) > 0)
                          .map(([uid, amt]) => {
                            const nameObj = group.members.find((m) => (m.user?._id || m.user)?.toString() === uid.toString())?.user?.name || "Someone";
                            return (
                              <div key={uid} className="flex items-center justify-between text-xs py-0.5">
                                <span className="font-semibold text-slate-700">{nameObj}</span>
                                <span className="font-bold font-mono text-slate-800">₹{Number(amt).toFixed(2)}</span>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 mb-2">Split Shares Breakdown</h4>
                    <div className="border border-slate-100 rounded-2xl p-3 bg-white space-y-2 shadow-sm max-h-48 overflow-y-auto custom-scrollbar">
                      {group.members
                        .filter((m) => participantIds.includes(m.user?._id))
                        .map((m, index) => {
                          const userObj = m.user || {};
                          let userShare = 0;

                          if (splitType === "EQUAL") {
                            const perPersonShare = Number((Number(expenseAmount) / participantIds.length).toFixed(2));
                            userShare = index === participantIds.length - 1
                              ? Number(Number(expenseAmount) - perPersonShare * (participantIds.length - 1))
                              : perPersonShare;
                          } else if (splitType === "EXACT") {
                            userShare = Number(exactAmounts[userObj._id] || 0);
                          } else if (splitType === "PERCENTAGE") {
                            const pct = Number(percentages[userObj._id] || 0);
                            const perPersonShare = Number(((Number(expenseAmount) * pct) / 100).toFixed(2));
                            userShare = index === participantIds.length - 1
                              ? Number(Number(expenseAmount) - (Number(expenseAmount) * (100 - pct)) / 100)
                              : perPersonShare;
                          }

                          return (
                            <div key={userObj._id} className="flex items-center justify-between text-xs py-0.5">
                              <span className="font-semibold text-slate-700">
                                {userObj.name}
                                {splitType === "PERCENTAGE" && (
                                  <span className="text-[10px] text-slate-400 font-mono ml-1 font-normal">
                                    ({percentages[userObj._id] || 0}%)
                                  </span>
                                )}
                              </span>
                              <span className="font-bold font-mono text-slate-800">₹{userShare.toFixed(2)}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4 flex-shrink-0">
              {expenseStep > 1 && (
                <button
                  type="button"
                  onClick={() => setExpenseStep((prev) => prev - 1)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-650 transition-all"
                >
                  Back
                </button>
              )}
              
              <button
                type="button"
                onClick={() => setExpenseFormOpen(false)}
                className="mr-auto px-4 py-2.5 rounded-xl text-slate-400 hover:text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>

              {expenseStep < 5 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  disabled={formSubmitLoading}
                  onClick={handleExpenseFormSubmit}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center gap-1.5"
                >
                  {formSubmitLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {expenseIsEditing ? "Save Changes" : "Create Expense"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD MEMBER MODAL (GOOGLE PAY STYLE) */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center px-4 py-8 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl p-6 animate-in zoom-in-95 duration-200 my-auto flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Add Members</h2>
                <p className="text-slate-400 text-[11px] font-semibold mt-0.5 uppercase tracking-wider">
                  {selectedFriendIds.length} Friends Selected
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative mb-4 flex items-center">
              <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search friends by name or email..."
                value={friendSearchQuery}
                onChange={(e) => setFriendSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-9 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-inner"
              />
              {friendSearchQuery && (
                <button
                  type="button"
                  onClick={() => setFriendSearchQuery("")}
                  className="absolute right-3.5 p-1 rounded-md hover:bg-slate-200 text-slate-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {selectedFriendIds.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-3 border-b border-slate-100/60 custom-scrollbar flex-shrink-0">
                {friends
                  .filter((f) => selectedFriendIds.includes(f._id))
                  .map((friend) => {
                    const label = friend.name.split(" ")[0];
                    return (
                      <div
                        key={friend._id}
                        onClick={() => handleFriendSelectionToggle(friend._id)}
                        className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold cursor-pointer hover:bg-emerald-100 transition-all flex-shrink-0 animate-in zoom-in-75"
                      >
                        <span>{label}</span>
                        <X className="w-3 h-3 text-emerald-600" />
                      </div>
                    );
                  })}
              </div>
            )}

            <div className="flex-1 overflow-y-auto min-h-[150px] pr-1 space-y-1.5 custom-scrollbar">
              {friendsLoading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400 text-xs font-semibold">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                  Loading friends list...
                </div>
              ) : addableFriends.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-medium">
                  {friendSearchQuery
                    ? "No matching friends available to add."
                    : "All friends are already members of this group."}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-1.5">
                  {addableFriends.map((friend) => {
                    const isSelected = selectedFriendIds.includes(friend._id);
                    return (
                      <div
                        key={friend._id}
                        onClick={() => handleFriendSelectionToggle(friend._id)}
                        className={`w-full p-2.5 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-50/60 border-emerald-200 text-emerald-800 shadow-sm"
                            : "bg-white border-slate-105 hover:bg-slate-55 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative">
                            {friend.profilePhoto ? (
                              <img
                                src={friend.profilePhoto}
                                alt={friend.name}
                                className="w-9 h-9 rounded-full object-cover border border-slate-200 bg-white"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500 border border-slate-200 shadow-inner">
                                {friend.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                              </div>
                            )}
                            {isSelected && (
                              <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-emerald-600 border border-white flex items-center justify-center text-white shadow animate-in zoom-in-90 duration-200">
                                <Check className="w-2.5 h-2.5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{friend.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{friend.email}</p>
                          </div>
                        </div>
                        
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-600/10"
                              : "bg-white border-slate-300 hover:border-slate-400"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end gap-3 border-t border-slate-100 pt-4 flex-shrink-0">
              <button
                type="button"
                disabled={addMembersLoading}
                onClick={() => setAddModalOpen(false)}
                className="px-4.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={addMembersLoading || selectedFriendIds.length === 0}
                onClick={handleAddMembersSubmit}
                className="px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center gap-1.5"
              >
                {addMembersLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Add Members {selectedFriendIds.length > 0 && `(${selectedFriendIds.length})`}
              </button>
            </div>
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
