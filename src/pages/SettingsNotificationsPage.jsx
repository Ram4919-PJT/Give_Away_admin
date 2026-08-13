import React, { useState, useEffect } from "react";
import { Bell, Plus, Send, RefreshCw, CheckCircle2 } from "lucide-react";
import { adminApi } from "../api/adminClient";

export default function SettingsNotificationsPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Template Modal State
  const [showTmplModal, setShowTmplModal] = useState(false);
  const [tmplName, setTmplName] = useState("");
  const [channel, setChannel] = useState("EMAIL");
  const [content, setContent] = useState("");

  // Alert Modal State
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [targetUserId, setTargetUserId] = useState("1");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const tmplData = await adminApi.getNotificationTemplates().catch(() => []);
      setTemplates(tmplData);
    } catch (err) {
      console.error("Failed loading templates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!tmplName.trim() || !content.trim()) return;
    try {
      await adminApi.createNotificationTemplate(tmplName, channel, content);
      setShowTmplModal(false);
      setTmplName("");
      setContent("");
      await loadData();
    } catch (err) {
      alert("Failed creating template: " + err.message);
    }
  };

  const handleSendAlert = async (e) => {
    e.preventDefault();
    if (!alertTitle.trim() || !alertMessage.trim()) return;
    try {
      await adminApi.sendNotification(Number(targetUserId), alertTitle, alertMessage);
      setShowAlertModal(false);
      setAlertTitle("");
      setAlertMessage("");
      alert("System notification sent successfully!");
    } catch (err) {
      alert("Failed sending notification: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-sky-400" /> Notifications
          </h2>
          <p className="text-sm text-slate-400 mt-1">Manage templates and send alerts to donors, receivers, and NGOs.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTmplModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg border border-slate-800 transition"
          >
            <Plus className="w-4 h-4" /> Create Template
          </button>
          <button
            onClick={() => setShowAlertModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg border border-slate-800 transition"
          >
            <Send className="w-4 h-4" /> Send Alert
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-white">System Notification Templates</h3>
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-[11px] uppercase font-extrabold border-b border-slate-800">
                  <th className="p-4">ID</th>
                  <th className="p-4">Template Name</th>
                  <th className="p-4">Channel</th>
                  <th className="p-4">Content</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {templates.map((t) => (
                  <tr key={t.template_id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-black text-sky-400">#{t.template_id}</td>
                    <td className="p-4 font-bold text-white">{t.template_name}</td>
                    <td className="p-4 font-bold text-purple-400">{t.channel}</td>
                    <td className="p-4 text-slate-300 max-w-md truncate">{t.content}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Template Modal */}
      {showTmplModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateTemplate} className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">Create Notification Template</h3>
              <button type="button" onClick={() => setShowTmplModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Template Name:</label>
              <input
                type="text"
                required
                value={tmplName}
                onChange={(e) => setTmplName(e.target.value)}
                placeholder="e.g. ASSISTANCE_APPROVED"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Channel:</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="EMAIL">EMAIL</option>
                <option value="SMS">SMS</option>
                <option value="PUSH">PUSH</option>
                <option value="IN_APP">IN_APP</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Content:</label>
              <textarea
                rows="3"
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter template message text with placeholders..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-black">
              <button type="button" onClick={() => setShowTmplModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded border border-black">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded border border-black">Save Template</button>
            </div>
          </form>
        </div>
      )}

      {/* Send Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSendAlert} className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">Send Direct System Alert Notification</h3>
              <button type="button" onClick={() => setShowAlertModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Target User ID:</label>
              <input
                type="number"
                required
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Alert Title:</label>
              <input
                type="text"
                required
                value={alertTitle}
                onChange={(e) => setAlertTitle(e.target.value)}
                placeholder="e.g. Account Verification Update"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Message Text:</label>
              <textarea
                rows="3"
                required
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                placeholder="Enter alert notification message..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-black">
              <button type="button" onClick={() => setShowAlertModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded border border-black">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded border border-black">Send Alert</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
