"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return; }
        setUsers(d.users || []);
        setTotals(d.totals || null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const changeRole = async (id, role) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error || "Could not update role."); return; }
    load();
  };

  const deleteUser = async (id, name) => {
    if (!confirm(`Delete ${name}'s account and all their papers, notes, and drafts? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { alert(data.error || "Could not delete user."); return; }
    load();
  };

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-10 text-ink/60">Loading…</div>;
  if (error) return <div className="max-w-5xl mx-auto px-4 py-10 text-red-600">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="font-serif text-2xl font-bold mb-2">Admin panel</h1>
      <p className="text-sm text-ink/60 mb-6">Manage every account on this deployment.</p>

      {totals && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <Stat label="Users" value={totals.users} />
          <Stat label="Library papers" value={totals.papers} />
          <Stat label="Notes" value={totals.notes} />
          <Stat label="Paper drafts" value={totals.drafts} />
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-ink/10">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-left text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Email</th>
              <th className="px-4 py-2.5">Role</th>
              <th className="px-4 py-2.5">Library</th>
              <th className="px-4 py-2.5">Notes</th>
              <th className="px-4 py-2.5">Drafts</th>
              <th className="px-4 py-2.5">Joined</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {users.map((u) => (
              <tr key={u._id}>
                <td className="px-4 py-2.5 font-medium">{u.name}</td>
                <td className="px-4 py-2.5 text-ink/60">{u.email}</td>
                <td className="px-4 py-2.5">
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u._id, e.target.value)}
                    disabled={u._id === currentUser?._id && u.role === "admin"}
                    className="rounded border border-ink/20 px-2 py-1 text-xs bg-transparent"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="px-4 py-2.5">{u.counts.papers}</td>
                <td className="px-4 py-2.5">{u.counts.notes}</td>
                <td className="px-4 py-2.5">{u.counts.drafts}</td>
                <td className="px-4 py-2.5 text-ink/50">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => deleteUser(u._id, u.name)}
                    className="text-xs rounded border border-red-200 text-red-600 px-2 py-1 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-ink/40 mt-4">
        Role changes take effect the next time that person logs in (their current session keeps its old role for up to 7 days).
      </p>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-ink/10 p-4 text-center">
      <div className="text-2xl font-serif font-bold">{value}</div>
      <div className="text-xs text-ink/50 mt-1">{label}</div>
    </div>
  );
}
