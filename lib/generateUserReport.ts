interface ReportUser {
  name: string;
  verification_status: string;
  is_suspended: boolean;
  is_admin: boolean;
  total_rides: number;
  rating: number;
  bio: string;
  created_at: string;
}

export function generateUserReportPDF(users: ReportUser[]) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const total = users.length;
  const verified = users.filter(u => u.verification_status === 'verified').length;
  const suspended = users.filter(u => u.is_suspended).length;
  const admins = users.filter(u => u.is_admin).length;
  const avgRides = total ? (users.reduce((s, u) => s + (u.total_rides ?? 0), 0) / total).toFixed(1) : '0';

  const rows = users.map((u, i) => {
    const joined = new Date(u.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const statusBg = u.is_suspended ? '#fee2e2' : u.verification_status === 'verified' ? '#d1fae5' : '#f1f5f9';
    const statusColor = u.is_suspended ? '#dc2626' : u.verification_status === 'verified' ? '#059669' : '#64748b';
    const statusLabel = u.is_suspended ? 'Suspended' : u.verification_status === 'verified' ? 'Verified' : 'Pending';

    return `
      <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8fafc'}">
        <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#1e293b">${i + 1}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0">
          <div style="font-size:13px;font-weight:600;color:#1e293b">${u.name}</div>
          ${u.bio ? `<div style="font-size:11px;color:#94a3b8;margin-top:2px">${u.bio.slice(0, 60)}${u.bio.length > 60 ? '…' : ''}</div>` : ''}
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0">
          <span style="background:${statusBg};color:${statusColor};padding:3px 8px;border-radius:12px;font-size:11px;font-weight:600">${statusLabel}</span>
          ${u.is_admin ? '<span style="background:#ede9fe;color:#7c3aed;padding:3px 8px;border-radius:12px;font-size:11px;font-weight:600;margin-left:4px">Admin</span>' : ''}
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#475569;text-align:center">${u.total_rides ?? 0}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#475569;text-align:center">${u.rating ? u.rating.toFixed(1) : '—'}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#94a3b8">${joined}</td>
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Ridemate — User Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #1e293b; }
    @page { size: A4 landscape; margin: 15mm 15mm 15mm 15mm; }
    @media print {
      .no-print { display: none !important; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body style="padding:32px">

  <!-- Print button -->
  <div class="no-print" style="margin-bottom:24px;display:flex;gap:12px">
    <button onclick="window.print()" style="background:#7c3aed;color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">⬇ Save as PDF</button>
    <button onclick="window.close()" style="background:#f1f5f9;color:#475569;border:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">Close</button>
  </div>

  <!-- Header -->
  <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:28px;padding-bottom:20px;border-bottom:2px solid #e2e8f0">
    <div style="display:flex;align-items:center;gap:14px">
      <div style="width:44px;height:44px;background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:12px;display:flex;align-items:center;justify-content:center">
        <span style="color:white;font-size:22px">🚗</span>
      </div>
      <div>
        <div style="font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.5px">Ridemate</div>
        <div style="font-size:12px;color:#94a3b8;font-weight:500;letter-spacing:2px;text-transform:uppercase;margin-top:1px">Admin · User Report</div>
      </div>
    </div>
    <div style="text-align:right">
      <div style="font-size:13px;font-weight:600;color:#475569">${dateStr}</div>
      <div style="font-size:12px;color:#94a3b8;margin-top:2px">Generated at ${timeStr}</div>
    </div>
  </div>

  <!-- Summary cards -->
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:28px">
    ${[
      { label: 'Total Users', value: total, color: '#4f46e5', bg: '#eef2ff' },
      { label: 'Verified', value: verified, color: '#059669', bg: '#d1fae5' },
      { label: 'Pending', value: total - verified - suspended, color: '#d97706', bg: '#fef3c7' },
      { label: 'Suspended', value: suspended, color: '#dc2626', bg: '#fee2e2' },
      { label: 'Avg. Rides', value: avgRides, color: '#7c3aed', bg: '#ede9fe' },
    ].map(s => `
      <div style="background:${s.bg};border-radius:12px;padding:14px 16px">
        <div style="font-size:24px;font-weight:800;color:${s.color}">${s.value}</div>
        <div style="font-size:11px;color:${s.color};font-weight:600;margin-top:2px;opacity:0.8">${s.label}</div>
      </div>`).join('')}
  </div>

  <!-- Table -->
  <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
    <thead>
      <tr style="background:linear-gradient(90deg,#7c3aed,#4f46e5)">
        <th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:#fff;letter-spacing:0.5px;text-transform:uppercase">#</th>
        <th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:#fff;letter-spacing:0.5px;text-transform:uppercase">Name</th>
        <th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:#fff;letter-spacing:0.5px;text-transform:uppercase">Status</th>
        <th style="padding:11px 14px;text-align:center;font-size:11px;font-weight:700;color:#fff;letter-spacing:0.5px;text-transform:uppercase">Rides</th>
        <th style="padding:11px 14px;text-align:center;font-size:11px;font-weight:700;color:#fff;letter-spacing:0.5px;text-transform:uppercase">Rating</th>
        <th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:#fff;letter-spacing:0.5px;text-transform:uppercase">Joined</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <!-- Footer -->
  <div style="margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center">
    <div style="font-size:11px;color:#94a3b8">Ridemate Admin Dashboard · Confidential</div>
    <div style="font-size:11px;color:#94a3b8">${total} user${total !== 1 ? 's' : ''} · ridemate-chi.vercel.app</div>
  </div>

</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
