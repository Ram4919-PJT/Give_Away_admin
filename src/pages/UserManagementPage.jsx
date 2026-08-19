import React, { useEffect, useState } from "react";
import { Users, Search, RefreshCw } from "lucide-react";
import { adminApi } from "../api/adminClient";

const STATUS_TABS = ["ALL", "ACTIVE", "PENDING", "SUSPENDED", "INACTIVE"];
const ROLE_TABS = ["ALL", "DONOR", "RECEIVER", "NGO"];

function roleName(user) {
  return user.role?.role_name || "USER";
}

function kycStatusForUser(user, kycByUserId) {
  return kycByUserId[user.user_id] || "NOT_STARTED";
}

export default function UserManagementPage({ initialRoleFilter = "ALL", onOpenKyc }) {
  const [users, setUsers] = useState([]);
  const [kycByUserId, setKycByUserId] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState(initialRoleFilter);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [userRows, receivers, ngos] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getReceiverProfiles().catch(() => []),
        adminApi.getNgoProfiles().catch(() => []),
      ]);
      const kycMap = {};
      [...(receivers || []), ...(ngos || [])].forEach((profile) => {
        if (profile?.user_id) kycMap[profile.user_id] = profile.verification_status || "REGISTERED";
      });
      setKycByUserId(kycMap);
      setUsers(Array.isArray(userRows) ? userRows : []);
    } catch (err) {
      console.error("Failed loading users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setRoleFilter(initialRoleFilter);
  }, [initialRoleFilter]);

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const role = roleName(u);
    const matchesStatus = statusFilter === "ALL" || u.status === statusFilter;
    const matchesRole = roleFilter === "ALL" || role === roleFilter;
    const matchesSearch =
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.mobile?.includes(search);
    return matchesStatus && matchesRole && matchesSearch;
  });

  const handleActivate = async (user) => {
    setActionLoading(user.user_id);
    try {
      await adminApi.activateAccount(user.user_id);
      await loadUsers();
    } catch (err) {
      alert(err.message || "Activation failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleAccount = async (user) => {
    setActionLoading(user.user_id);
    try {
      if (user.status === "ACTIVE") {
        await adminApi.suspendAccount(user.user_id, "Suspended by administrator");
      } else {
        await adminApi.activateAccount(user.user_id);
      }
      await loadUsers();
    } catch (err) {
      alert(err.message || "Update failed");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-400" /> Platform Users
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            IAM account management. KYC verification is separate under KYC Verification.
          </p>
        </div>
        <button type="button" onClick={loadUsers} className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white font-bold text-xs rounded-lg">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="flex flex-col gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, mobile" className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200" />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((st) => (
            <button key={st} type="button" onClick={() => setStatusFilter(st)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-800 ${statusFilter === st ? "bg-sky-600 text-white" : "bg-slate-950 text-slate-400"}`}>
              Account: {st}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {ROLE_TABS.map((role) => (
            <button key={role} type="button" onClick={() => setRoleFilter(role)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-800 ${roleFilter === role ? "bg-purple-600 text-white" : "bg-slate-950 text-slate-400"}`}>
              {role}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 text-[11px] uppercase font-extrabold border-b border-slate-800">
              <th className="p-4">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">Account</th>
              <th className="p-4">KYC</th>
              <th className="p-4">Registered</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-xs">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-500">Loading users…</td></tr>
            ) : !filteredUsers.length ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-500">No users match filters.</td></tr>
            ) : (
              filteredUsers.map((user) => {
                const kyc = kycStatusForUser(user, kycByUserId);
                const isPending = user.status === "PENDING";
                return (
                  <tr key={user.user_id}>
                    <td className="p-4">
                      <strong className="text-white block">{user.full_name}</strong>
                      <span className="text-slate-500">{user.email}</span>
                    </td>
                    <td className="p-4">{roleName(user)}</td>
                    <td className="p-4"><span className={user.status === "ACTIVE" ? "badge-verified" : "badge-review"}>{user.status}</span></td>
                    <td className="p-4"><span className="badge-review">{kyc}</span></td>
                    <td className="p-4 text-slate-400">{user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</td>
                    <td className="p-4 text-right space-x-2">
                      {isPending && (
                        <button type="button" disabled={actionLoading === user.user_id} onClick={() => handleActivate(user)} className="px-3 py-1 bg-emerald-700 text-white rounded text-[10px] font-bold">
                          Activate Account
                        </button>
                      )}
                      {user.status !== "PENDING" && roleName(user) !== "SUPER_ADMIN" && (
                        <button type="button" disabled={actionLoading === user.user_id} onClick={() => handleToggleAccount(user)} className="px-3 py-1 bg-slate-700 text-white rounded text-[10px] font-bold">
                          {user.status === "ACTIVE" ? "Suspend Account" : "Activate Account"}
                        </button>
                      )}
                      {(roleName(user) === "RECEIVER" || roleName(user) === "NGO") && onOpenKyc && (
                        <button type="button" onClick={() => onOpenKyc(roleName(user))} className="px-3 py-1 bg-sky-700 text-white rounded text-[10px] font-bold">
                          Open KYC
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
