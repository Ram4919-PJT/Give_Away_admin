import React, { useState, useEffect } from "react";
import { Users, Search, RefreshCw } from "lucide-react";
import { adminApi } from "../api/adminClient";

const STATUS_TABS = ["ALL", "PENDING", "ACTIVE", "SUSPENDED"];
const ROLE_TABS = ["ALL", "DONOR", "RECEIVER", "NGO", "SUPER_ADMIN"];

function roleName(user) {
  return user.role?.role_name || "USER";
}

function statusClass(status) {
  if (status === "ACTIVE") return "badge-verified";
  if (status === "PENDING") return "badge-review";
  return "badge-rejected";
}

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed loading users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleApprove = async (user) => {
    setActionLoading(user.user_id);
    try {
      await adminApi.approveAccount(user.user_id);
      await loadUsers();
    } catch (err) {
      alert("Failed approving user: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (user) => {
    const reason = window.prompt("Optional rejection reason:", "") ?? "";
    setActionLoading(user.user_id);
    try {
      await adminApi.rejectAccount(user.user_id, null, reason);
      await loadUsers();
    } catch (err) {
      alert("Failed rejecting user: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setActionLoading(user.user_id);
    try {
      await adminApi.updateUserStatus(user.user_id, nextStatus);
      await loadUsers();
    } catch (err) {
      alert("Failed updating user status: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const role = roleName(u);
    const matchesStatus = statusFilter === "ALL" || u.status === statusFilter;
    const matchesRole = roleFilter === "ALL" || role === roleFilter || (roleFilter === "NGO" && role.includes("NGO"));
    const matchesSearch =
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.mobile?.includes(search);
    return matchesStatus && matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-400" /> Users
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Approve pending Donor, Receiver, and NGO accounts. Suspend or reactivate users.
          </p>
        </div>
        <button
          onClick={loadUsers}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg border border-slate-800 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Users
        </button>
      </div>

      <div className="flex flex-col gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or mobile..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border border-slate-800 ${
                statusFilter === st ? "bg-sky-600 text-white" : "bg-slate-950 text-slate-400 hover:text-white"
              }`}
            >
              {st} ({users.filter((u) => st === "ALL" || u.status === st).length})
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {ROLE_TABS.map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border border-slate-800 ${
                roleFilter === role ? "bg-purple-600 text-white" : "bg-slate-950 text-slate-400 hover:text-white"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 text-[11px] uppercase font-extrabold border-b border-slate-800">
                <th className="p-4">User ID</th>
                <th className="p-4">Full Name</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Mobile</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500 font-semibold">
                    No platform users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.user_id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-black text-sky-400">#{u.user_id}</td>
                    <td className="p-4 font-bold text-white">{u.full_name}</td>
                    <td className="p-4 text-slate-300 font-mono">{u.email}</td>
                    <td className="p-4 text-slate-400 font-mono">{u.mobile}</td>
                    <td className="p-4 font-bold">
                      <span className="px-2.5 py-1 bg-slate-800 text-sky-300 rounded border border-slate-700 text-[10px]">
                        {roleName(u)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${statusClass(u.status)}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {u.status === "PENDING" ? (
                        <div className="flex justify-end gap-2">
                          <button
                            disabled={actionLoading === u.user_id}
                            onClick={() => handleApprove(u)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded border border-black disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            disabled={actionLoading === u.user_id}
                            onClick={() => handleReject(u)}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded border border-black disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <button
                          disabled={actionLoading === u.user_id || roleName(u) === "SUPER_ADMIN"}
                          onClick={() => handleToggleStatus(u)}
                          className={`px-3 py-1.5 font-bold text-xs rounded border border-black transition disabled:opacity-50 ${
                            u.status === "ACTIVE"
                              ? "bg-amber-600/20 text-amber-300 hover:bg-amber-600 hover:text-white border-amber-500/50"
                              : "bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white border-emerald-500/50"
                          }`}
                        >
                          {u.status === "ACTIVE" ? "Suspend Account" : "Activate Account"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
