/* ============================================================
   LivUp Invoice Generator — state, rendering, PDF export
   ============================================================ */
(function () {
  "use strict";

  // ---- Date helpers ----
  function isoToday() {
    const dt = new Date();
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }
  function ordinal(d) {
    const t = d % 100;
    if (t >= 11 && t <= 13) return "th";
    switch (d % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  }
  // "2026-07-11" -> "11th July 2026"
  function formatDate(iso) {
    if (!iso) return "";
    const p = String(iso).split("-");
    if (p.length !== 3) return iso;
    const y = +p[0], m = +p[1], d = +p[2];
    const months = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    if (!y || !m || !d || m < 1 || m > 12) return iso;
    return d + ordinal(d) + " " + months[m - 1] + " " + y;
  }

  // ---- Default data (from the supplied sample invoice) ----
  const state = {
    logo: window.LIVUP_LOGO || "",
    website: "www.livup.ae",
    email: "hi@livup.ae",
    phone: "+971-54-505-9320",
    date: isoToday(), // ISO yyyy-mm-dd; displayed as "11th July 2026"
    invoiceNumber: "07102026-0718J",
    clientName: "Suelen Oliveira",
    items: [
      { desc: "Ajman New Ventures Centre Free Zone Company Setup Package", qty: 1, price: 12995 },
      { desc: "Special Discount", qty: 1, price: -5120 },
    ],
    paymentMethod: "BANK TRANSFER",
    bankAccountName: "LIVUP LLC",
    bankName: "EMIRATES NBD",
    accountNo: "1015937231301",
    iban: "AE320260001015937231301",
    currency: "AED",
    footerAddress: "Al Barsha. Sheikh Zayed Road. Dubai. UAE.",
    footerPhone: "+971-54-505-9320",
  };

  // ---- Helpers ----
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));

  function money(value, currency) {
    const neg = value < 0;
    const abs = Math.abs(Number(value) || 0);
    const formatted = abs.toLocaleString("en-US", { maximumFractionDigits: 2 });
    return (neg ? "-" : "") + currency + " " + formatted;
  }

  function hrefFor(type, value) {
    const v = String(value || "").trim();
    if (!v) return "";
    if (type === "url") return "https://" + v.replace(/^https?:\/\//i, "");
    if (type === "mailto") return "mailto:" + v;
    if (type === "tel") return "tel:" + v.replace(/[^+\d]/g, "");
    return v;
  }

  function pad2(n) {
    const num = Math.round(Number(n) || 0);
    return num < 10 && num >= 0 ? "0" + num : String(num);
  }

  function totals() {
    let subtotal = 0;
    let discount = 0;
    let qty = 0;
    state.items.forEach((it) => {
      const q = Number(it.qty) || 0;
      const line = q * (Number(it.price) || 0);
      if (line >= 0) { subtotal += line; qty += q; } // count service qty only
      else discount += -line;
    });
    return { subtotal: subtotal, discount: discount, total: subtotal - discount, qty: qty };
  }

  // ---- Render preview ----
  function setText(field, value) {
    $$('[data-preview="' + field + '"]').forEach((el) => (el.textContent = value));
  }

  function renderPreview() {
    // logo
    $("#invLogo").src = state.logo;

    // simple text fields
    [
      "website", "email", "phone", "invoiceNumber", "clientName",
      "paymentMethod", "bankAccountName", "bankName", "accountNo", "iban",
      "currency", "footerAddress", "footerPhone",
    ].forEach((f) => setText(f, state[f]));

    // date shows the picker's ISO value formatted as "11th July 2026"
    setText("date", formatDate(state.date));

    // make contact links clickable
    $$("[data-link]").forEach((a) => {
      const f = a.getAttribute("data-preview");
      a.setAttribute("href", hrefFor(a.getAttribute("data-link"), state[f]));
    });

    // line items
    const rows = $("#invRows");
    rows.innerHTML = "";
    state.items.forEach((it) => {
      const line = (Number(it.qty) || 0) * (Number(it.price) || 0);
      const row = document.createElement("div");
      row.className = "inv-item";
      row.innerHTML =
        '<div class="it-desc"></div>' +
        '<div class="it-qty"></div>' +
        '<div class="it-price"></div>' +
        '<div class="it-total"></div>';
      row.querySelector(".it-desc").textContent = it.desc;
      row.querySelector(".it-qty").textContent = pad2(it.qty);
      row.querySelector(".it-price").textContent = money(it.price, state.currency);
      row.querySelector(".it-total").textContent = money(line, state.currency);
      rows.appendChild(row);
    });

    // totals
    const t = totals();
    setText("subtotal", money(t.subtotal, state.currency));
    setText("discount", money(t.discount, state.currency));
    setText("total", money(t.total, state.currency));
    setText("totalQty", pad2(t.qty));

    // discount is optional — hide the row when there is none
    $("#discountRow").classList.toggle("is-hidden", t.discount === 0);
  }

  // ---- Render line-item editor ----
  function renderItemsEditor() {
    const list = $("#itemsList");
    list.innerHTML = "";
    state.items.forEach((it, i) => {
      const row = document.createElement("div");
      row.className = "item-row";
      row.innerHTML =
        '<textarea data-item="desc" data-i="' + i + '" placeholder="Service description"></textarea>' +
        '<input type="number" step="1" data-item="qty" data-i="' + i + '" placeholder="Qty" />' +
        '<input type="number" step="0.01" data-item="price" data-i="' + i + '" placeholder="Price" />' +
        '<button type="button" class="item-del" data-del="' + i + '" title="Remove">&times;</button>';
      row.querySelector('[data-item="desc"]').value = it.desc;
      row.querySelector('[data-item="qty"]').value = it.qty;
      row.querySelector('[data-item="price"]').value = it.price;
      list.appendChild(row);
    });
  }

  // ---- Bind form ----
  function bindForm() {
    // pre-fill simple fields
    $$("[data-field]").forEach((input) => {
      const f = input.getAttribute("data-field");
      if (f in state) input.value = state[f];
      input.addEventListener("input", () => {
        state[f] = input.value;
        renderPreview();
      });
    });

    // line-item edits (delegated)
    $("#itemsList").addEventListener("input", (e) => {
      const el = e.target;
      const key = el.getAttribute("data-item");
      if (!key) return;
      const i = Number(el.getAttribute("data-i"));
      if (key === "desc") state.items[i].desc = el.value;
      else state.items[i][key] = el.value === "" ? "" : Number(el.value);
      renderPreview();
    });

    // remove item
    $("#itemsList").addEventListener("click", (e) => {
      const del = e.target.closest("[data-del]");
      if (!del) return;
      state.items.splice(Number(del.getAttribute("data-del")), 1);
      renderItemsEditor();
      renderPreview();
    });

    // add item
    $("#addItem").addEventListener("click", () => {
      state.items.push({ desc: "", qty: 1, price: 0 });
      renderItemsEditor();
      renderPreview();
    });

    // logo upload
    $("#logoUpload").addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        state.logo = reader.result;
        renderPreview();
      };
      reader.readAsDataURL(file);
    });

    // download
    $("#downloadBtn").addEventListener("click", downloadPDF);
  }

  // ---- PDF export ----
  async function downloadPDF() {
    const btn = $("#downloadBtn");
    const node = $("#invoice");
    btn.disabled = true;
    const original = btn.textContent;
    btn.textContent = "Generating…";

    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;

      const canvas = await html2canvas(node, {
        scale: 3,
        backgroundColor: "#ffffff",
        useCORS: true,
        windowWidth: node.scrollWidth,
        windowHeight: node.scrollHeight,
      });

      const jsPDF = window.jspdf.jsPDF;
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageW = pdf.internal.pageSize.getWidth();   // 210
      const pageH = pdf.internal.pageSize.getHeight();  // 297
      const img = canvas.toDataURL("image/jpeg", 0.98);

      // Always fit the invoice on a single A4 page: scale to fit, center.
      const mmPerPx = Math.min(pageW / canvas.width, pageH / canvas.height);
      const w = canvas.width * mmPerPx;
      const h = canvas.height * mmPerPx;
      const x = (pageW - w) / 2;
      const y = (pageH - h) / 2;
      pdf.addImage(img, "JPEG", x, y, w, h);

      // Overlay real clickable link areas so the PDF links work too.
      const nodeRect = node.getBoundingClientRect();
      const mmPerCssPx = w / nodeRect.width; // image width in mm ÷ node width in css px
      $$("[data-link]", node).forEach((a) => {
        const url = a.getAttribute("href");
        if (!url) return;
        const r = a.getBoundingClientRect();
        pdf.link(
          x + (r.left - nodeRect.left) * mmPerCssPx,
          y + (r.top - nodeRect.top) * mmPerCssPx,
          r.width * mmPerCssPx,
          r.height * mmPerCssPx,
          { url: url }
        );
      });

      const safe = (s) => String(s || "").replace(/[^a-z0-9\-]+/gi, "-").replace(/^-+|-+$/g, "");
      pdf.save("Invoice-" + safe(state.invoiceNumber) + "-" + safe(state.clientName) + ".pdf");
    } catch (err) {
      console.error(err);
      alert("Sorry — PDF generation failed. See the browser console for details.");
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  }

  // ---- Init ----
  document.addEventListener("DOMContentLoaded", () => {
    const panelLogo = $("#panelLogo");
    if (panelLogo && window.LIVUP_LOGO) panelLogo.src = window.LIVUP_LOGO;
    renderItemsEditor();
    bindForm();
    renderPreview();
  });
})();
