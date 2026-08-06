/**
 * Sevikaa Executive-Grade ITR-Compliant Tax Invoice Generator
 * Issuer: YugaYatra Retail (OPC) Pvt.Ltd (GSTIN: 29AABCY8389C1ZT)
 * Optimized for Guaranteed Single A4 Page Print & PDF Export
 */

export interface InvoiceData {
  invoiceNumber: string; // Format: SV/26-27/0004
  invoiceDate: string; // e.g. 15 May 2026
  dueDate: string; // e.g. 15 May 2027
  sacCode?: string; // Default: 998519
  paymentStatus?: 'Paid' | 'Pending';
  paymentMethod?: string; // Online Payment / UPI / Razorpay
  transactionId: string; // e.g. pay_SpiVtl2D1pfJXn
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerAddress?: string;
  buyerSociety?: string;
  buyerCity?: string;
  buyerState?: string;
  buyerPincode?: string;
  buyerGstin?: string;
  planName: string;
  duration: string; // e.g. 30 Days / 60 Days / 90 Days
  totalAmount: number; // e.g. 699.00 (Inclusive of 18% GST)
}

/**
 * Helper to compute Financial Year (e.g. FY 2026-2027 -> "26-27")
 */
export function getFinancialYearString(date: Date = new Date()): string {
  const month = date.getMonth(); // 0 = Jan, 3 = April
  const year = date.getFullYear();
  const startYear = month >= 3 ? year : year - 1;
  const endYear = startYear + 1;
  return `${startYear.toString().slice(-2)}-${endYear.toString().slice(-2)}`;
}

/**
 * Generates formatted ITR-compliant invoice number (e.g. SV/26-27/0004)
 */
export function formatInvoiceNumber(seqNumber: number, date: Date = new Date()): string {
  const fyStr = getFinancialYearString(date);
  const formattedSeq = seqNumber.toString().padStart(4, '0');
  return `SV/${fyStr}/${formattedSeq}`;
}

export function generateInvoiceHtml(data: InvoiceData): string {
  const sacCode = data.sacCode || '998519';
  const paymentStatus = data.paymentStatus || 'Paid';
  const paymentMethod = data.paymentMethod || 'Online Payment';
  
  // Clean Date Only (Strips exact timestamp/IST string for clean invoice presentation)
  const cleanInvoiceDate = (data.invoiceDate || '').split(',')[0].trim();
  const cleanDueDate = (data.dueDate || '').split(',')[0].trim();

  // Clean Phone Number Formatting (Prevents duplicate +91 prefixes)
  const sanitizePhone = (p?: string) => {
    if (!p) return 'N/A';
    const digits = p.replace(/\D/g, '');
    const tenDigits = digits.slice(-10);
    return tenDigits.length === 10 
      ? `+91 ${tenDigits.slice(0, 5)} ${tenDigits.slice(5)}`
      : p;
  };
  const formattedPhone = sanitizePhone(data.buyerPhone);

  // Tax Inclusive Mathematics (18% GST)
  const totalAmount = Number(data.totalAmount || 0);
  const subtotal = Number((totalAmount / 1.18).toFixed(2));
  const totalTax = Number((totalAmount - subtotal).toFixed(2));

  // Determine if Intra-State (Karnataka - CGST/SGST) or Inter-State (IGST)
  const isKarnataka = (data.buyerState || '').toLowerCase().includes('karnataka');
  
  let taxRows = '';
  if (isKarnataka) {
    const cgst = Number((totalTax / 2).toFixed(2));
    const sgst = Number((totalTax - cgst).toFixed(2));
    taxRows = `
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#475569;border-bottom:1px dashed #C8E6C9;">
        <span style="font-weight:600;">CGST (9%)</span>
        <span style="font-weight:700;color:#0F172A;">₹ ${cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#475569;">
        <span style="font-weight:600;">SGST (9%)</span>
        <span style="font-weight:700;color:#0F172A;">₹ ${sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
    `;
  } else {
    taxRows = `
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#475569;">
        <span style="font-weight:600;">IGST (18%)</span>
        <span style="font-weight:700;color:#0F172A;">₹ ${totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
    `;
  }

  // Address assembly
  const fullAddressLines = [
    data.buyerAddress,
    data.buyerSociety,
    data.buyerCity && data.buyerState ? `${data.buyerCity}, ${data.buyerState}` : (data.buyerCity || data.buyerState),
    data.buyerPincode ? `PIN: ${data.buyerPincode}` : ''
  ].filter(Boolean);

  const fullAddressStr = fullAddressLines.length > 0 ? fullAddressLines.join(', ') : 'Not specified';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tax Invoice - ${data.invoiceNumber} | Sevikaa</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
    
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    @page {
      size: A4 portrait;
      margin: 8mm;
    }

    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body {
        width: 210mm !important;
        height: 297mm !important;
        background: white !important;
        padding: 0 !important;
        margin: 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .no-print { display: none !important; }
      .invoice-card { 
        border: none !important; 
        box-shadow: none !important; 
        margin: 0 !important; 
        padding: 24px 30px !important; 
        width: 100% !important; 
        max-width: 100% !important; 
        border-radius: 0 !important; 
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body style="margin:0;padding:25px 15px;background:#F0F4F8;color:#1E293B;">

  <!-- Print Control Header -->
  <div class="no-print" style="width:100%;max-width:800px;margin:0 auto 16px;display:flex;justify-content:space-between;align-items:center;box-sizing:border-box;">
    <a href="javascript:history.back()" style="color:#1B5E20;font-weight:800;text-decoration:none;font-size:14px;display:flex;align-items:center;gap:6px;">
      ← Back to Dashboard
    </a>
    <button onclick="window.print()" style="background:linear-gradient(135deg,#2E7D32,#1B5E20);color:white;border:none;padding:10px 24px;border-radius:10px;font-weight:800;cursor:pointer;font-size:14px;box-shadow:0 4px 14px rgba(46,125,50,0.35);transition:all 0.2s;">
      🖨️ Print / Download PDF Invoice
    </button>
  </div>

  <!-- Executive Invoice Main Card (Single A4 Page Spec) -->
  <div class="invoice-card" style="max-width:800px;margin:0 auto;background:#ffffff;border:1px solid #E2E8F0;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.08);box-sizing:border-box;position:relative;">

    <div style="padding:35px 35px 28px;">
      
      <!-- Top Header Row -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:2px solid #F1F5F9;">
        <div>
          <img src="https://www.sevikaa.in/logo.png" alt="Sevikaa Logo" style="height:52px;width:auto;display:block;margin-bottom:6px;" onerror="this.src='/logo.png'">
          <div style="font-size:12px;color:#2E7D32;font-weight:800;letter-spacing:0.8px;text-transform:uppercase;">Verified Domestic Help &amp; Household Staffing</div>
        </div>

        <div style="text-align:right;">
          <h1 style="margin:0 0 4px 0;font-size:32px;font-weight:900;color:#2E7D32;letter-spacing:1px;line-height:1;text-transform:uppercase;">
            TAX INVOICE
          </h1>
          <div style="margin-bottom:6px;">
            <span style="font-size:14px;font-weight:800;color:#334155;background:#F8FAFC;border:1px solid #CBD5E1;padding:4px 12px;border-radius:6px;display:inline-block;font-family:monospace;">
              ${data.invoiceNumber}
            </span>
          </div>
          <div>
            <span style="background:linear-gradient(135deg,#2E7D32,#1B5E20);color:white;padding:4px 14px;border-radius:20px;font-size:11px;font-weight:900;letter-spacing:0.5px;box-shadow:0 3px 8px rgba(46,125,50,0.25);display:inline-block;">
              ✓ PAID 🟢
            </span>
          </div>
        </div>
      </div>

      <!-- 4-Column Executive Metadata Bar -->
      <div style="display:grid;grid-template-columns:repeat(4, 1fr);background:linear-gradient(135deg, #F1F8E9 0%, #E8F5E9 100%);border-left:4px solid #2E7D32;border-radius:12px;padding:14px;margin:22px 0;text-align:center;">
        <div style="border-right:1px solid #C8E6C9;">
          <div style="font-size:10px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">📅 INVOICE DATE</div>
          <div style="font-size:14.5px;font-weight:900;color:#1B5E20;">${cleanInvoiceDate}</div>
        </div>
        <div style="border-right:1px solid #C8E6C9;">
          <div style="font-size:10px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">⏳ EXPIRY DATE</div>
          <div style="font-size:14.5px;font-weight:900;color:#1B5E20;">${cleanDueDate}</div>
        </div>
        <div style="border-right:1px solid #C8E6C9;">
          <div style="font-size:10px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">🏷️ SAC CODE</div>
          <div style="font-size:14.5px;font-weight:900;color:#1B5E20;">${sacCode}</div>
        </div>
        <div>
          <div style="font-size:10px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">💳 PAYMENT STATUS</div>
          <div style="font-size:14.5px;font-weight:900;color:#2E7D32;">${paymentStatus}</div>
        </div>
      </div>

      <!-- Parties Shaded Cards Grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:22px 0;">
        <!-- Billed To Card -->
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:14px;padding:18px;">
          <div style="font-size:10px;font-weight:900;color:#2E7D32;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;">
            👤 BILLED TO (EMPLOYER)
          </div>
          <div style="font-size:17px;font-weight:900;color:#0F172A;margin-bottom:6px;">${data.buyerName}</div>
          <div style="font-size:12.5px;color:#475569;line-height:20px;">
            ✉ ${data.buyerEmail}<br>
            📞 ${formattedPhone}<br>
            📍 ${fullAddressStr}
            ${data.buyerGstin ? `<br><strong style="color:#0F172A;">GSTIN:</strong> ${data.buyerGstin}` : ''}
          </div>
        </div>

        <!-- From Legal Entity Card -->
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:14px;padding:18px;text-align:right;">
          <div style="font-size:10px;font-weight:900;color:#2E7D32;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;">
            🏢 ISSUER (SERVICE PROVIDER)
          </div>
          <div style="font-size:16px;font-weight:900;color:#0F172A;margin-bottom:6px;">YugaYatra Retail (OPC) Pvt.Ltd</div>
          <div style="font-size:12.5px;color:#475569;line-height:20px;">
            Sanfield raga, Begur - Koppa Rd, near Koppa Gate,<br>
            Bengaluru, Karnataka 560105<br>
            <strong style="color:#0F172A;">GSTIN:</strong> 29AABCY8389C1ZT
          </div>
        </div>
      </div>

      <!-- Line Items Premium Table -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;border-collapse:separate;border-spacing:0;border:1px solid #E2E8F0;border-radius:14px;overflow:hidden;">
        <thead>
          <tr style="background:linear-gradient(135deg, #1B5E20, #2E7D32);color:white;">
            <th align="left" style="padding:12px 18px;font-size:11px;font-weight:900;letter-spacing:0.8px;text-transform:uppercase;">DESCRIPTION &amp; SERVICES</th>
            <th align="center" style="padding:12px 18px;font-size:11px;font-weight:900;letter-spacing:0.8px;text-transform:uppercase;">DURATION</th>
            <th align="right" style="padding:12px 18px;font-size:11px;font-weight:900;letter-spacing:0.8px;text-transform:uppercase;">AMOUNT (INR)</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background:#ffffff;">
            <td style="padding:18px 18px;border-bottom:1px solid #F1F5F9;">
              <div style="font-size:15.5px;font-weight:800;color:#0F172A;display:flex;align-items:center;gap:6px;">
                <span style="color:#2E7D32;">⚡</span> ${data.planName}
              </div>
              <div style="font-size:12.5px;color:#64748B;margin-top:4px;font-weight:500;">
                Household Helper Placement Services &amp; Verified Candidate Access (SAC ${sacCode})
              </div>
            </td>
            <td align="center" style="padding:18px 18px;border-bottom:1px solid #F1F5F9;">
              <span style="background:#F1F5F9;padding:5px 14px;border-radius:20px;font-size:13px;font-weight:800;color:#334155;white-space:nowrap;display:inline-block;">
                ${data.duration}
              </span>
            </td>
            <td align="right" style="padding:18px 18px;font-size:18px;font-weight:900;color:#1B5E20;border-bottom:1px solid #F1F5F9;">
              ₹ ${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Summary Grid: Payment Gateway Ref & Tax Calculation -->
      <div style="display:grid;grid-template-columns:1.1fr 0.9fr;gap:18px;margin:22px 0;">
        <!-- Payment Metadata -->
        <div style="background:#F8FAFC;padding:16px;border-radius:14px;border:1px solid #E2E8F0;">
          <div style="font-size:11px;font-weight:900;color:#334155;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;border-bottom:1px solid #E2E8F0;padding-bottom:6px;">
            💳 TRANSACTION SUMMARY
          </div>
          <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:13px;color:#475569;">
            <span>Payment Status</span>
            <span style="font-weight:800;color:#2E7D32;">${paymentStatus}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:13px;color:#475569;">
            <span>Payment Gateway / Method</span>
            <span style="font-weight:800;color:#1E293B;">${paymentMethod}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:13px;color:#475569;">
            <span>Gateway Ref / Transaction ID</span>
            <span style="font-weight:800;font-family:monospace;color:#1E293B;">${data.transactionId}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:13px;color:#475569;">
            <span>Payment Date</span>
            <span style="font-weight:800;color:#1E293B;">${cleanInvoiceDate}</span>
          </div>
        </div>

        <!-- Tax Calculation Box -->
        <div style="background:linear-gradient(135deg, #F1F8E9, #E8F5E9);padding:16px;border-radius:14px;border:1px solid #C8E6C9;">
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#475569;border-bottom:1px dashed #C8E6C9;">
            <span style="font-weight:600;">Subtotal (Base Price)</span>
            <span style="font-weight:700;color:#0F172A;">₹ ${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          ${taxRows}
          <div style="display:flex;justify-content:space-between;padding:12px 0 0;margin-top:6px;border-top:2px solid #A5D6A7;font-size:18px;font-weight:900;color:#1B5E20;">
            <span>TOTAL PAID</span>
            <span>₹ ${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <!-- Terms & Support QR Callout -->
      <div style="background:linear-gradient(135deg, #FFFDE7 0%, #FFF9C4 100%);border-left:5px solid #F59E0B;border-radius:14px;padding:16px;margin:22px 0;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:13px;font-weight:900;color:#92400E;margin-bottom:4px;display:flex;align-items:center;gap:6px;">
            ⚠️ TERMS &amp; CONDITIONS
          </div>
          <div style="font-size:12px;color:#78350F;line-height:18px;font-weight:500;">
            Subscription fees are non-refundable. Contact support for any queries regarding plan benefits.
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:14px;text-align:right;flex-shrink:0;margin-left:20px;">
          <div>
            <div style="font-size:12px;color:#2E7D32;font-weight:800;">Thank you for choosing</div>
            <div style="font-size:15px;font-weight:900;color:#1B5E20;">Sevikaa! 💚</div>
          </div>
          <img 
            src="https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=https://www.sevikaa.in/contact" 
            alt="Scan for Support" 
            style="width:62px;height:62px;border-radius:8px;border:2px solid #FFFFFF;background:white;padding:2px;box-shadow:0 2px 8px rgba(0,0,0,0.1);"
          />
        </div>
      </div>

      <!-- Footer Powered By -->
      <div style="margin-top:28px;padding-top:16px;border-top:1px solid #E2E8F0;text-align:center;font-size:12.5px;color:#64748B;">
        <div style="margin-bottom:8px;font-weight:600;color:#475569;">
          ✉ support@sevikaa.in &nbsp;|&nbsp; 📞 +91 87577 28679 &nbsp;|&nbsp; 🌐 www.sevikaa.in
        </div>
        <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:8px;font-size:11.5px;color:#94A3B8;font-weight:700;">
          <span>POWERED BY</span>
          <img src="/ygayatra.png" alt="YugaYatra Retail" style="height:26px;width:auto;display:inline-block;vertical-align:middle;" onerror="this.src='https://www.sevikaa.in/ygayatra.png'">
          <span>• ALL RIGHTS RESERVED.</span>
        </div>
      </div>

    </div>

  </div>

</body>
</html>`;
}
