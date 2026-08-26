import { getResendClient } from "./resend";
import { getServiceClient } from "../supabase/service";

function buildOrderEmail(order, items) {
  const orderId = `#${order.id.slice(0, 8).toUpperCase()}`;
  const orderDate = new Date(order.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const shippingAddress = [
    order.street,
    order.building ? `Bldg ${order.building}` : "",
    order.floor ? `Fl ${order.floor}` : "",
    order.apartment ? `Apt ${order.apartment}` : "",
    order.area,
    `${order.city}, ${order.governorate}`,
  ]
    .filter(Boolean)
    .join(", ");

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333;">${item.product_name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#666;">${item.size} / ${item.color}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333;text-align:right;">$${Number(item.unit_price).toFixed(2)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333;text-align:right;font-weight:600;">$${Number(item.total_price).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color:#111827;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">DRAPEY</h1>
              <p style="margin:4px 0 0;color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:1px;">New Order Notification</p>
            </td>
          </tr>

          <!-- Order ID Banner -->
          <tr>
            <td style="background-color:#ecfdf5;padding:16px 32px;text-align:center;border-bottom:1px solid #d1fae5;">
              <p style="margin:0;font-size:12px;color:#065f46;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Order</p>
              <p style="margin:4px 0 0;font-size:24px;color:#047857;font-weight:700;">${orderId}</p>
            </td>
          </tr>

          <!-- Customer Info -->
          <tr>
            <td style="padding:24px 32px;">
              <h2 style="margin:0 0 12px;font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;font-weight:600;">Customer</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#6b7280;width:120px;">Name</td>
                  <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:500;">${order.customer_name}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#6b7280;">Email</td>
                  <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:500;">${order.customer_email}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#6b7280;">Phone</td>
                  <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:500;">${order.customer_phone}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Order Details -->
          <tr>
            <td style="padding:0 32px 24px;">
              <h2 style="margin:0 0 12px;font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;font-weight:600;">Order Details</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#6b7280;width:120px;">Date</td>
                  <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:500;">${orderDate}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#6b7280;">Status</td>
                  <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:500;text-transform:capitalize;">${order.status}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#6b7280;">Payment</td>
                  <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:500;">Cash on Delivery</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Shipping Address -->
          <tr>
            <td style="padding:0 32px 24px;">
              <h2 style="margin:0 0 12px;font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;font-weight:600;">Shipping Address</h2>
              <p style="margin:0;font-size:14px;color:#111827;line-height:1.6;">${shippingAddress}</p>
              ${order.notes ? `<p style="margin:8px 0 0;font-size:13px;color:#6b7280;font-style:italic;">Note: ${order.notes}</p>` : ""}
            </td>
          </tr>

          <!-- Products Table -->
          <tr>
            <td style="padding:0 32px 24px;">
              <h2 style="margin:0 0 12px;font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;font-weight:600;">Products</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
                <thead>
                  <tr style="background-color:#f9fafb;">
                    <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;font-weight:600;">Product</th>
                    <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;font-weight:600;">Variant</th>
                    <th style="padding:10px 12px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;font-weight:600;">Qty</th>
                    <th style="padding:10px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;font-weight:600;">Price</th>
                    <th style="padding:10px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;font-weight:600;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Summary -->
          <tr>
            <td style="padding:0 32px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:6px;padding:16px;">
                <tr>
                  <td style="padding:6px 16px;font-size:14px;color:#6b7280;">Subtotal</td>
                  <td style="padding:6px 16px;font-size:14px;color:#111827;text-align:right;font-weight:500;">$${Number(order.subtotal).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding:6px 16px;font-size:14px;color:#6b7280;">Shipping</td>
                  <td style="padding:6px 16px;font-size:14px;color:#111827;text-align:right;font-weight:500;">${Number(order.shipping_fee) === 0 ? "FREE" : "$" + Number(order.shipping_fee).toFixed(2)}</td>
                </tr>
                ${Number(order.discount) > 0 ? `
                <tr>
                  <td style="padding:6px 16px;font-size:14px;color:#6b7280;">Discount</td>
                  <td style="padding:6px 16px;font-size:14px;color:#dc2626;text-align:right;font-weight:500;">-$${Number(order.discount).toFixed(2)}</td>
                </tr>` : ""}
                <tr>
                  <td style="padding:10px 16px 6px;font-size:16px;color:#111827;font-weight:700;border-top:2px solid #d1d5db;">Total</td>
                  <td style="padding:10px 16px 6px;font-size:18px;color:#047857;text-align:right;font-weight:700;border-top:2px solid #d1d5db;">$${Number(order.total_amount).toFixed(2)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">This is an automated notification from Drapey.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return html;
}

export async function sendOrderNotification(order, items) {
  const orderId = `#${order.id.slice(0, 8).toUpperCase()}`;
  console.log(`[Email] Preparing notification for order ${orderId}`);

  // Step 1: Get admin emails using service-role client (bypasses RLS)
  let admins;
  try {
    const serviceClient = getServiceClient();
    console.log("[Email] Service-role client created");

    const result = await serviceClient
      .from("users")
      .select("email, full_name")
      .eq("role", "admin");

    if (result.error) {
      console.error("[Email] Failed to fetch admin users:", {
        message: result.error?.message,
        code: result.error?.code,
        details: result.error?.details,
      });
      return null;
    }

    admins = result.data;
    console.log(`[Email] Admin query returned ${admins?.length || 0} row(s)`);
  } catch (err) {
    console.error("[Email] Exception fetching admin users:", err);
    return null;
  }

  if (!admins || admins.length === 0) {
    console.warn("[Email] No admin users found in database — cannot send notification");
    return null;
  }

  const adminEmails = admins.map((a) => a.email).filter(Boolean);
  console.log(`[Email] Admin emails found: ${adminEmails.join(", ")}`);

  if (adminEmails.length === 0) {
    console.warn("[Email] Admin users exist but none have email addresses");
    return null;
  }

  // Step 2: Check RESEND_API_KEY
  if (!process.env.RESEND_API_KEY) {
    console.error("[Email] RESEND_API_KEY is not set in environment");
    return null;
  }
  console.log("[Email] RESEND_API_KEY is configured");

  // Step 3: Send via Resend
  const emailFrom = process.env.EMAIL_FROM || "Drapey <orders@drapey.com>";
  console.log(`[Email] Sending from: ${emailFrom} → to: ${adminEmails.join(", ")}`);

  try {
    const resend = getResendClient();

    const result = await resend.emails.send({
      from: emailFrom,
      to: adminEmails,
      subject: `New Order ${orderId} — $${Number(order.total_amount).toFixed(2)}`,
      html: buildOrderEmail(order, items),
    });

    if (result.error) {
      console.error("[Email] Resend returned error:", {
        name: result.error?.name,
        message: result.error?.message,
      });
      return null;
    }

    console.log(`[Email] Resend success — id: ${result.data?.id}`);
    return result.data;
  } catch (err) {
    console.error("[Email] Exception calling Resend:", err);
    return null;
  }
}
