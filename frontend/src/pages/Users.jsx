import { useState, useEffect } from "react";
import {
  UserPlus,
  Shield,
  UserCircle,
  Trash2,
  Pencil,
  CheckCircle2,
  XCircle,
  Lock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../api/client";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Input, Select, Toggle } from "../components/ui/Input";
import { formatDateTime } from "../utils/format";

const EMPTY_FORM = {
  username: "",
  password: "",
  fullName: "",
  email: "",
  phone: "",
  role: "staff",
  isActive: true,
};

export default function Users() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  const isAdmin = currentUser?.role === "admin";

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (err) {
      toast.error(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({
      username: u.username,
      password: "",
      fullName: u.fullName,
      email: u.email || "",
      phone: u.phone || "",
      role: u.role,
      isActive: u.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.username.trim() || (!editing && !form.password.trim())) {
      toast.error("Username and password are required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/users/${editing.id}`, form);
        toast.success("User updated");
      } else {
        await api.post("/users", form);
        toast.success("User created");
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.message || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/users/${confirmDelete.id}`);
      toast.success("User deleted");
      load();
    } catch (err) {
      toast.error(err.message || "Failed to delete user");
    }
    setConfirmDelete(null);
  };

  const handleToggleActive = async (u) => {
    try {
      await api.put(`/users/${u.id}`, { isActive: !u.isActive });
      toast.success(u.isActive ? "User deactivated" : "User activated");
      load();
    } catch (err) {
      toast.error(err.message || "Failed to update user");
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }
    try {
      await api.put(`/users/${passwordTarget.id}/password`, { newPassword });
      toast.success("Password updated");
      setShowPasswordModal(false);
      setNewPassword("");
      setPasswordTarget(null);
    } catch (err) {
      toast.error(err.message || "Failed to update password");
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto">
        <EmptyState
          icon={Shield}
          title="Admins only"
          description="You need administrator privileges to manage users."
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <PageHeader
        title="User Management"
        description="Manage staff and administrator accounts"
        actions={
          <Button onClick={openCreate}>
            <UserPlus className="w-4 h-4" /> Add User
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 card animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={UserCircle}
          title="No users"
          description="Create the first user account."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/5 text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${u.role === "admin" ? "bg-accent-500/10 text-accent-500" : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300"}`}
                        >
                          {(u.fullName || u.username).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                            {u.fullName}
                            {u.id === currentUser?.id && (
                              <span className="text-[10px] text-gray-400">
                                (you)
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">
                            @{u.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${u.role === "admin" ? "bg-accent-500/10 text-accent-500" : "bg-purple-500/10 text-purple-500"}`}
                      >
                        {u.role === "admin" ? (
                          <Shield className="w-3 h-3 inline" />
                        ) : (
                          <UserCircle className="w-3 h-3 inline" />
                        )}{" "}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {u.email || "—"}
                      <div className="text-xs text-gray-400">
                        {u.phone || ""}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.isActive ? (
                        <span className="badge bg-green-500/10 text-green-600">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="badge bg-red-500/10 text-danger">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {formatDateTime(u.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Edit"
                          onClick={() => openEdit(u)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Change password"
                          onClick={() => {
                            setPasswordTarget(u);
                            setNewPassword("");
                            setShowPasswordModal(true);
                          }}
                        >
                          <Lock className="w-4 h-4" />
                        </Button>
                        {u.id !== currentUser?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title={u.isActive ? "Deactivate" : "Activate"}
                            onClick={() => handleToggleActive(u)}
                          >
                            {u.isActive ? (
                              <XCircle className="w-4 h-4 text-gray-400" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            )}
                          </Button>
                        )}
                        {u.id !== currentUser?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger hover:text-danger"
                            title="Delete"
                            onClick={() => setConfirmDelete(u)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? `Edit ${editing.username}` : "Add User"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {saving ? "Saving…" : "Save User"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="username"
            />
            <Input
              label="Full Name"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="e.g. Jane Smith"
            />
          </div>
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder={
              editing ? "Leave blank to keep current" : "Min 4 characters"
            }
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="user@shop.com"
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 555 000 0000"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </Select>
            <div className="flex items-end pb-1">
              <Toggle
                label="Active Account"
                checked={form.isActive}
                onChange={(v) => setForm({ ...form, isActive: v })}
              />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title={`Change Password — ${passwordTarget?.username || ""}`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowPasswordModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleChangePassword}>Update Password</Button>
          </>
        }
      >
        <Input
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Min 4 characters"
        />
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete User"
        message={`Delete "${confirmDelete?.username}"? This will remove their access and can't be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
