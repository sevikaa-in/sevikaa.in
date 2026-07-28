"use client";

import React from 'react';
import { useSuperAdminDashboard } from '../layout';
import { PlusCircle, Clock, Check, X } from 'lucide-react';

export default function SmsPage() {
  const {
    smsTemplates,
    smsLogs,
    smsLoading,
    previewTemplate,
    setPreviewTemplate,
    previewVariables,
    setPreviewVariables,
    previewOutput,
    previewValid,
    previewMissing,
    showAddModal,
    setShowAddModal,
    newTemplate,
    setNewTemplate,
    handleToggleSmsActive,
    handleUpdateDltDetails,
    handleAddTemplateVersion
  } = useSuperAdminDashboard();

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-6xl">
      {/* Header section with Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">SMS &amp; DLT Gateway Registry</h3>
          <p className="text-[10px] text-slate-400 font-bold px-1 mt-0.5">TRAI DLT Template ID mapping, Fast2SMS / Twilio API gateway console.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="py-2.5 px-4 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-xs font-black shadow-sm shadow-[#1A73E8]/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shrink-0"
        >
          <PlusCircle size={14} />
          <span>Create DLT Template Mapping</span>
        </button>
      </div>

      {/* DLT TELECOM COMPLIANCE EXPLANATORY BANNER */}
      <div className="bg-[#1A73E8]/5 p-4 rounded-2xl border border-blue-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <h4 className="font-black text-[#1A73E8] text-xs flex items-center gap-1.5">
            <span>ℹ️ Why is DLT Template Mapping Needed Here?</span>
          </h4>
          <p className="text-[10.5px] text-slate-600 font-medium leading-relaxed max-w-3xl">
            While actual SMS template registration is performed on your DLT Portal (e.g. <em>Fast2SMS, Jio DLT, or Airtel DLT</em>), 
            <strong>Sevikaa's notification API</strong> requires these approved <strong>DLT PE IDs &amp; Template IDs</strong> mapped in this database. 
            When automated OTPs, interview reminders, or worker match alerts are sent, our API automatically attaches these DLT IDs for 100% TRAI compliance and instant delivery.
          </p>
        </div>
      </div>

      {/* Statistics Counters Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <span className="block text-[9px] font-bold text-gray-400 uppercase">Total Templates</span>
          <span className="block text-2xl font-black text-slate-800 mt-1">{new Set(smsTemplates.map(t => t.template_key)).size} Keys</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <span className="block text-[9px] font-bold text-gray-400 uppercase">Registered Versions</span>
          <span className="block text-2xl font-black text-slate-800 mt-1">{smsTemplates.length} Loaded</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <span className="block text-[9px] font-bold text-gray-400 uppercase">Active Providers</span>
          <span className="block text-2xl font-black text-[#1A73E8] mt-1">AWS & Twilio</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <span className="block text-[9px] font-bold text-gray-400 uppercase">Gateway Delivery</span>
          <span className="block text-2xl font-black text-[#34A853] mt-1">
            {smsLogs.length > 0
              ? `${Math.round((smsLogs.filter(l => l.status === 'success').length / smsLogs.length) * 100)}%`
              : '100%'}
          </span>
        </div>
      </div>

      {/* Central Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Area: Templates List - Grid Col 7 */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-50 flex items-center justify-between">
            <span className="text-xs font-black text-slate-800">Available Templates ({smsTemplates.length})</span>
            {smsLoading && <Clock className="animate-spin text-gray-400" size={14} />}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-black text-gray-400 uppercase border-b border-slate-50">
                  <th className="p-3">Key / ID</th>
                  <th className="p-3">Provider</th>
                  <th className="p-3">DLT Info</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {smsTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400 font-bold">
                      No SMS templates found in database. Seed them or create one.
                    </td>
                  </tr>
                ) : (
                  smsTemplates.map((template) => {
                    const isSelected = previewTemplate?.id === template.id;
                    return (
                      <tr 
                        key={template.id} 
                        className={`hover:bg-slate-50/30 transition-colors ${isSelected ? 'bg-blue-50/10' : ''}`}
                      >
                        <td className="p-3 align-top">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-slate-800 text-[11px]">{template.template_key}</span>
                              <span className="bg-slate-100 text-slate-600 text-[8px] font-black px-1.5 py-0.5 rounded-full">
                                v{template.version}
                              </span>
                            </div>
                            <span className="block text-[9px] text-gray-400 font-bold capitalize">
                              {template.category.replace('_', ' ')} • {template.language}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 align-top font-bold text-slate-600 capitalize">
                          {template.provider}
                        </td>
                        <td className="p-3 align-top">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-[10px] text-slate-600 font-bold">
                              <span className="text-[9px] text-gray-400 font-semibold">Header:</span>
                              <span className="bg-slate-50 px-1 py-0.2 rounded font-black border border-slate-100 text-slate-700">{template.sender_id || 'SEVKAA'}</span>
                            </div>
                            <div className="text-[10px] text-slate-600">
                              <span className="text-[9px] text-gray-400 font-semibold">DLT ID:</span>
                              {template.dlt_template_id ? (
                                <span className="ml-1 font-mono text-[9px] bg-slate-50 p-0.5 rounded border border-slate-100">{template.dlt_template_id}</span>
                              ) : (
                                <span className="ml-1 text-[8px] bg-amber-50 text-amber-600 font-black px-1.5 py-0.2 rounded">Pending DLT</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 align-top text-center">
                          <button
                            onClick={() => handleToggleSmsActive(template.id, template.is_active)}
                            className={`py-1 px-2.5 rounded-full text-[9px] font-black cursor-pointer transition-all border ${
                              template.is_active
                                ? 'bg-[#34A853]/10 text-[#34A853] border-[#34A853]/20 hover:bg-[#34A853]/20'
                                : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'
                            }`}
                          >
                            {template.is_active ? 'Active' : 'Disabled'}
                          </button>
                        </td>
                        <td className="p-3 align-top text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setPreviewTemplate(template);
                                if (template.template_key.includes('OTP')) {
                                  setPreviewVariables(JSON.stringify({ otp: '581029' }, null, 2));
                                } else if (template.template_key === 'JOB_APPLIED') {
                                  setPreviewVariables(JSON.stringify({ job_title: 'Full Time Cook' }, null, 2));
                                } else if (template.template_key === 'JOB_ACCEPTED') {
                                  setPreviewVariables(JSON.stringify({ job_title: 'Infant Nanny', company: 'Goel Family' }, null, 2));
                                } else if (template.template_key === 'INTERVIEW_SCHEDULED') {
                                  setPreviewVariables(JSON.stringify({ date: '2026-07-28', time: '11:00 AM' }, null, 2));
                                } else if (template.template_key === 'NEW_APPLICATION') {
                                  setPreviewVariables(JSON.stringify({ job_title: 'House Maid' }, null, 2));
                                } else if (template.template_key === 'SUBSCRIPTION_ACTIVATED') {
                                  setPreviewVariables(JSON.stringify({ plan_name: 'Premium Unlocks' }, null, 2));
                                } else if (template.template_key === 'PAYMENT_SUCCESS') {
                                  setPreviewVariables(JSON.stringify({ amount: '999', transaction_id: 'TXN_9918204' }, null, 2));
                                } else {
                                  setPreviewVariables('{}');
                                }
                              }}
                              className="py-1 px-2 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-black cursor-pointer transition-colors"
                            >
                              Test & Preview
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Area: Dynamic Preview & Validation - Grid Col 5 */}
        <div className="lg:col-span-5 space-y-6">
          {previewTemplate ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                <div className="space-y-0.5">
                  <span className="block text-xs font-black text-slate-800">Dynamic Previewer</span>
                  <span className="block text-[10px] text-gray-400 font-bold">Testing: {previewTemplate.template_key} (v{previewTemplate.version})</span>
                </div>
                <span className="bg-blue-50 text-[#1A73E8] text-[8px] font-black px-2 py-0.5 rounded uppercase">
                  {previewTemplate.provider} Adapter
                </span>
              </div>

              {/* Original Template */}
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Original DB Template</span>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                  {previewTemplate.message}
                </div>
              </div>

              {/* Variables JSON editor */}
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">JSON Variables Editor</span>
                <textarea
                  rows={4}
                  value={previewVariables}
                  onChange={(e) => setPreviewVariables(e.target.value)}
                  className="w-full p-3 bg-slate-900 text-green-400 font-mono text-xs rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1A73E8] leading-relaxed resize-y"
                />
              </div>

              {/* Live Interpolated Output */}
              <div className="space-y-2 pt-2 border-t border-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Live Render Preview</span>
                  <div className="flex items-center gap-1.5">
                    {previewValid ? (
                      <span className="bg-[#34A853]/10 text-[#34A853] text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check size={10} /> Valid
                      </span>
                    ) : (
                      <span className="bg-[#EA4335]/10 text-[#EA4335] text-[9px] font-black px-2 py-0.5 rounded-full">
                        Missing: {previewMissing.join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 bg-blue-50/10 text-slate-800 rounded-xl border border-blue-100/30 text-xs font-bold leading-relaxed whitespace-pre-wrap">
                  {previewOutput || 'No output rendered'}
                </div>
              </div>

              {/* DLT compliant text representation */}
              <div className="p-3 bg-amber-50/20 rounded-2xl border border-amber-100/50 space-y-1">
                <span className="block text-[9px] font-bold text-amber-700 uppercase">Jio TrueConnect Registration Format:</span>
                <span className="block text-[10px] font-mono text-amber-800 leading-relaxed font-semibold select-all cursor-pointer" title="Double click to select all">
                  {previewTemplate.message
                    .replace(/\{\{\s*otp\s*\}\}/g, '{#number#}')
                    .replace(/\{\{\s*expiry\s*\}\}/g, '{#number#}')
                    .replace(/\{\{\s*amount\s*\}\}/g, '{#number#}')
                    .replace(/\{\{\s*job_title\s*\}\}/g, '{#alphanumeric#}')
                    .replace(/\{\{\s*company\s*\}\}/g, '{#alphanumeric#}')
                    .replace(/\{\{\s*plan_name\s*\}\}/g, '{#alphanumeric#}')
                    .replace(/\{\{\s*transaction_id\s*\}\}/g, '{#alphanumeric#}')
                    .replace(/\{\{\s*date\s*\}\}/g, '{#alphanumeric#}')
                    .replace(/\{\{\s*time\s*\}\}/g, '{#alphanumeric#}')
                  }
                </span>
              </div>

              {/* Quick Admin DLT ID update form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  handleUpdateDltDetails(previewTemplate.id, fd.get('dltId') as string, fd.get('senderId') as string);
                }}
                className="pt-3 border-t border-slate-50 grid grid-cols-2 gap-3"
              >
                <div className="space-y-1">
                  <label className="block text-[9px] text-gray-400 font-bold uppercase">DLT Template ID</label>
                  <input
                    name="dltId"
                    type="text"
                    defaultValue={previewTemplate.dlt_template_id || ''}
                    placeholder="e.g. 1207161829..."
                    className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold focus:outline-none focus:border-[#1A73E8]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] text-gray-400 font-bold uppercase">Header / Mask</label>
                  <input
                    name="senderId"
                    type="text"
                    defaultValue={previewTemplate.sender_id || 'SEVKAA'}
                    className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold focus:outline-none focus:border-[#1A73E8]"
                  />
                </div>
                <div className="col-span-2">
                  <button
                    type="submit"
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Update Template Identifiers
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center text-gray-400 font-bold text-xs">
              Select a template from the list on the left to test variables and view rendering validation.
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Audit logs */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-50">
          <span className="text-xs font-black text-slate-800">Recent Template SMS Dispatches</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-gray-400 uppercase border-b border-slate-50">
                <th className="p-3">Timestamp</th>
                <th className="p-3">Template</th>
                <th className="p-3">Recipient</th>
                <th className="p-3">Rendered Message</th>
                <th className="p-3 text-center">Provider</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {smsLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400 font-bold">
                    No dispatch audit trails recorded.
                  </td>
                </tr>
              ) : (
                smsLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/20">
                    <td className="p-3 whitespace-nowrap text-gray-400 font-bold">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-slate-700">
                      {log.template_key || 'Direct Message'}
                    </td>
                    <td className="p-3 font-bold text-slate-800">
                      {log.recipient_phone}
                    </td>
                    <td className="p-3 max-w-sm break-words font-medium text-slate-600">
                      {log.message}
                    </td>
                    <td className="p-3 text-center font-bold text-slate-600 capitalize">
                      {log.provider}
                    </td>
                    <td className="p-3 text-right">
                      {log.status === 'success' ? (
                        <span className="bg-[#34A853]/10 text-[#34A853] text-[9px] font-black px-2 py-0.5 rounded-full inline-block">
                          Success
                        </span>
                      ) : (
                        <div className="space-y-0.5 flex flex-col items-end">
                          <span className="bg-[#EA4335]/10 text-[#EA4335] text-[9px] font-black px-2 py-0.5 rounded-full inline-block">
                            Failed
                          </span>
                          {log.error_message && (
                            <span className="text-[8px] text-[#EA4335] font-semibold block">{log.error_message}</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Template Creation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#202124]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl max-w-lg w-full overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-slate-50 flex justify-between items-center">
              <span className="text-sm font-black text-slate-800">Create New Template Version</span>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTemplateVersion} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-400 font-bold uppercase">Template Key</label>
                  <select
                    value={newTemplate.templateKey}
                    onChange={(e) => setNewTemplate((prev: any) => ({ ...prev, templateKey: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none"
                  >
                    <option value="LOGIN_OTP">LOGIN_OTP</option>
                    <option value="REGISTER_OTP">REGISTER_OTP</option>
                    <option value="FORGOT_PASSWORD_OTP">FORGOT_PASSWORD_OTP</option>
                    <option value="CHANGE_MOBILE_OTP">CHANGE_MOBILE_OTP</option>
                    <option value="JOB_APPLIED">JOB_APPLIED</option>
                    <option value="JOB_ACCEPTED">JOB_ACCEPTED</option>
                    <option value="INTERVIEW_SCHEDULED">INTERVIEW_SCHEDULED</option>
                    <option value="WORKER_VERIFIED">WORKER_VERIFIED</option>
                    <option value="NEW_APPLICATION">NEW_APPLICATION</option>
                    <option value="SUBSCRIPTION_ACTIVATED">SUBSCRIPTION_ACTIVATED</option>
                    <option value="PAYMENT_SUCCESS">PAYMENT_SUCCESS</option>
                    <option value="SECURITY_ALERT">SECURITY_ALERT</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-400 font-bold uppercase">Category</label>
                  <select
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate((prev: any) => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none"
                  >
                    <option value="authentication">Authentication</option>
                    <option value="worker_notification">Worker Notification</option>
                    <option value="employer_notification">Employer Notification</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-400 font-bold uppercase">Provider</label>
                  <select
                    value={newTemplate.provider}
                    onChange={(e) => setNewTemplate((prev: any) => ({ ...prev, provider: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none"
                  >
                    <option value="aws">AWS</option>
                    <option value="msg91">MSG91</option>
                    <option value="twilio">Twilio</option>
                    <option value="gupshup">Gupshup</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-400 font-bold uppercase">Language</label>
                  <select
                    value={newTemplate.language}
                    onChange={(e) => setNewTemplate((prev: any) => ({ ...prev, language: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none"
                  >
                    <option value="en">English (en)</option>
                    <option value="hi">Hindi (hi)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-400 font-bold uppercase">Sender ID / Mask</label>
                  <input
                    type="text"
                    value={newTemplate.senderId}
                    onChange={(e) => setNewTemplate((prev: any) => ({ ...prev, senderId: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-400 font-bold uppercase">DLT Template ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 120716182..."
                    value={newTemplate.dltTemplateId}
                    onChange={(e) => setNewTemplate((prev: any) => ({ ...prev, dltTemplateId: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-400 font-bold uppercase">Title Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Login OTP Template"
                    value={newTemplate.title}
                    onChange={(e) => setNewTemplate((prev: any) => ({ ...prev, title: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-gray-400 font-bold uppercase">Message Template (Use double brackets like &#123;&#123;otp&#125;&#125;)</label>
                <textarea
                  rows={4}
                  placeholder="Welcome to Sevikaa. Your registration verification code is {{otp}}. Valid for 10 minutes."
                  value={newTemplate.message}
                  onChange={(e) => setNewTemplate((prev: any) => ({ ...prev, message: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#1A73E8] leading-relaxed resize-none"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-4 bg-[#1A73E8] hover:bg-[#1557b0] text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-all"
                >
                  Submit Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
