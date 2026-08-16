(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const byId = (id) => document.getElementById(id);
  const value = (id) => (byId(id)?.value || '').trim();
  const currentJobNumbers = {};
  const signaturePads = {};
  let currentType = null;
  let currentPreviewCanvases = [];

  const tripChecks = [
    'Inspect Hydraulic pistons',
    'Check all reflectors and reflective tape',
    'Accident damage',
    'Check chevron, under run and side protection',
    'Check fenders and mudguards',
    'Check landing legs condition and grease (make & model)',
    'Check chassis and cross members for cracks',
    'Check and record License Expiry Date',
    'Check suspension for condition',
    'Check all electrical lights, cables, junction boxes, wiring & plugs',
    'Check air pipes',
    'Grease all greasing points on chassis, suspension & S cams',
    'Check brake adjustment',
    'Check all brake components for tightness and condition',
    'Check air leaks brakes released and applied.',
    'Check air tank condition and drainage',
    'Inspect loading bins condition',
    'Inspect hydraulic pipes',
    'Check hydraulic fittings and couplings',
    'Check hydraulic fluid level on truck',
    'Operate hydraulics and check function',
    'Check load bin tarp'
  ];

  class SignaturePadLite {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.drawing = false;
      this.empty = true;
      this.enabled = false;
      this.last = null;
      this.bind();
    }

    resize() {
      const data = this.empty ? null : this.toDataURL();
      const rect = this.canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      this.canvas.width = Math.round(rect.width * ratio);
      this.canvas.height = Math.round(rect.height * ratio);
      this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      this.ctx.lineWidth = 2.4;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.strokeStyle = '#111';
      if (data) this.setDataURL(data);
    }

    point(e) {
      const rect = this.canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    setEnabled(enabled) {
      this.enabled = Boolean(enabled);
      if (!this.enabled) {
        this.drawing = false;
        this.last = null;
      }
    }

    bind() {
      this.canvas.addEventListener('pointerdown', (e) => {
        if (!this.enabled) return;
        e.preventDefault();
        this.drawing = true;
        this.last = this.point(e);
        this.canvas.setPointerCapture?.(e.pointerId);
      });
      this.canvas.addEventListener('pointermove', (e) => {
        if (!this.enabled || !this.drawing) return;
        e.preventDefault();
        const p = this.point(e);
        this.ctx.beginPath();
        this.ctx.moveTo(this.last.x, this.last.y);
        this.ctx.lineTo(p.x, p.y);
        this.ctx.stroke();
        this.last = p;
        this.empty = false;
        updateSignatureControls(this.canvas.id);
      });
      const stop = () => { this.drawing = false; this.last = null; };
      this.canvas.addEventListener('pointerup', stop);
      this.canvas.addEventListener('pointercancel', stop);
      this.canvas.addEventListener('pointerleave', stop);
    }

    clear() {
      const rect = this.canvas.getBoundingClientRect();
      this.ctx.clearRect(0, 0, rect.width, rect.height);
      this.empty = true;
      updateSignatureControls(this.canvas.id);
    }

    toDataURL() {
      if (this.empty) return '';
      return this.canvas.toDataURL('image/png');
    }

    setDataURL(data) {
      if (!data) { this.clear(); return; }
      const img = new Image();
      img.onload = () => {
        const rect = this.canvas.getBoundingClientRect();
        this.ctx.clearRect(0, 0, rect.width, rect.height);
        this.ctx.drawImage(img, 0, 0, rect.width, rect.height);
        this.empty = false;
        updateSignatureControls(this.canvas.id);
      };
      img.src = data;
    }
  }

  function updateSignatureControls(id) {
    const pad = signaturePads[id];
    const box = document.querySelector(`[data-signature-box="${id}"]`);
    if (!pad || !box) return;
    const editing = box.classList.contains('is-editing');
    const editBtn = box.querySelector('[data-edit-sig]');
    const clearBtn = box.querySelector('[data-clear-sig]');
    const doneBtn = box.querySelector('[data-done-sig]');
    if (editBtn) {
      editBtn.textContent = pad.empty ? 'Add Signature' : 'Edit Signature';
      editBtn.disabled = editing;
    }
    if (clearBtn) clearBtn.disabled = !editing || pad.empty;
    if (doneBtn) doneBtn.disabled = !editing;
    box.classList.toggle('has-signature', !pad.empty);
  }

  function enableSignature(id) {
    const pad = signaturePads[id];
    const box = document.querySelector(`[data-signature-box="${id}"]`);
    if (!pad || !box) return;
    box.classList.add('is-editing');
    pad.setEnabled(true);
    updateSignatureControls(id);
  }

  function lockSignature(id) {
    const pad = signaturePads[id];
    const box = document.querySelector(`[data-signature-box="${id}"]`);
    if (!pad || !box) return;
    pad.setEnabled(false);
    box.classList.remove('is-editing');
    updateSignatureControls(id);
  }

  function lockAllSignatures() {
    Object.keys(signaturePads).forEach(lockSignature);
  }

  function initSignatures() {
    $$('.signature-canvas').forEach((canvas) => {
      signaturePads[canvas.id] = new SignaturePadLite(canvas);
      updateSignatureControls(canvas.id);
    });
    $$('[data-edit-sig]').forEach((btn) => {
      btn.addEventListener('click', () => enableSignature(btn.dataset.editSig));
    });
    $$('[data-clear-sig]').forEach((btn) => {
      btn.addEventListener('click', () => signaturePads[btn.dataset.clearSig]?.clear());
    });
    $$('[data-done-sig]').forEach((btn) => {
      btn.addEventListener('click', () => lockSignature(btn.dataset.doneSig));
    });
  }

  function resizeVisibleSignatures() {
    requestAnimationFrame(() => {
      Object.values(signaturePads).forEach((pad) => {
        if (pad.canvas.offsetParent !== null) pad.resize();
      });
    });
  }

  function showScreen(name) {
    lockAllSignatures();
    $$('.screen').forEach((s) => s.classList.remove('active'));
    byId(`screen-${name}`).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'instant' });
    resizeVisibleSignatures();
  }

  function todayISO() {
    const d = new Date();
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function nowTime() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  function formatDate(iso) {
    if (!iso) return '';
    const p = iso.split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso;
  }

  function safeFilePart(s) {
    return (s || '')
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 65) || 'Job';
  }

  function makeJobNumber(type) {
    if (currentJobNumbers[type]) return currentJobNumbers[type];
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}${String(d.getSeconds()).padStart(2,'0')}`;
    currentJobNumbers[type] = `HZA-${stamp}`;
    return currentJobNumbers[type];
  }

  function setDefaultDates() {
    ['n_date','t_date','p_inspection_date','p_supplier_date','p_customer_date'].forEach((id) => {
      if (byId(id) && !value(id)) byId(id).value = todayISO();
    });
    if (!value('n_time')) byId('n_time').value = nowTime();
  }

  function addNormalPart(data = {}) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="n-part-qty" inputmode="decimal" value="${escapeAttr(data.qty || '')}"></td>
      <td><input class="n-part-desc" value="${escapeAttr(data.desc || '')}"></td>
      <td><input class="n-part-book" value="${escapeAttr(data.book || '')}"></td>
      <td><button class="icon-btn" type="button" aria-label="Remove row">×</button></td>`;
    $('button', tr).addEventListener('click', () => tr.remove());
    byId('n_parts_rows').appendChild(tr);
  }

  function addTruckPart(data = {}) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="t-part-desc" value="${escapeAttr(data.desc || '')}"></td>
      <td><input class="t-part-amount" inputmode="decimal" value="${escapeAttr(data.amount || '')}"></td>
      <td><button class="icon-btn" type="button" aria-label="Remove row">×</button></td>`;
    $('button', tr).addEventListener('click', () => tr.remove());
    byId('t_parts_rows').appendChild(tr);
  }

  function escapeAttr(s) {
    return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function getNormalParts() {
    return $$('#n_parts_rows tr').map((tr) => ({
      qty: $('.n-part-qty', tr).value.trim(),
      desc: $('.n-part-desc', tr).value.trim(),
      book: $('.n-part-book', tr).value.trim()
    })).filter((x) => x.qty || x.desc || x.book);
  }

  function getTruckParts() {
    return $$('#t_parts_rows tr').map((tr) => ({
      desc: $('.t-part-desc', tr).value.trim(),
      amount: $('.t-part-amount', tr).value.trim()
    })).filter((x) => x.desc || x.amount);
  }

  function buildTripChecklist() {
    const root = byId('trip-check-list');
    tripChecks.forEach((label, i) => {
      const div = document.createElement('div');
      div.className = 'check-item';
      div.innerHTML = `<span>${label}</span><select id="p_check_${i}"><option value="">Not marked</option><option value="Checked">Checked</option><option value="Replaced">Replaced</option><option value="Repaired/Adjusted">Repaired / Adjusted</option></select>`;
      root.appendChild(div);
    });
  }

  function setPdf(id, text) {
    const el = byId(id);
    if (el) el.textContent = text || '';
  }

  function setPdfImg(id, dataUrl) {
    const el = byId(id);
    if (!el) return;
    if (dataUrl) { el.src = dataUrl; el.style.display = 'block'; }
    else { el.removeAttribute('src'); el.style.display = 'none'; }
  }

  function removeGeneratedPages(type) {
    $$(`.pdf-generated-page[data-pdf-type="${type}"]`).forEach((page) => page.remove());
  }

  function pageOverflows(page) {
    return page.scrollHeight > page.clientHeight + 2;
  }

  function normalPartRow(part = {}) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(part.qty || '')}</td><td>${escapeHtml(part.desc || '')}</td><td>${escapeHtml(part.book || '')}</td>`;
    return tr;
  }

  function truckPartRow(part = {}) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(part.desc || '')}</td><td class="pdf-amount">${escapeHtml(part.amount || '')}</td>`;
    return tr;
  }

  function fillRowsThatFit(page, tbody, items, startIndex, rowBuilder) {
    let index = startIndex;
    while (index < items.length) {
      const row = rowBuilder(items[index]);
      tbody.appendChild(row);
      if (pageOverflows(page)) {
        row.remove();
        break;
      }
      index += 1;
    }
    return index;
  }

  function addBlankRowsWhileTheyFit(page, tbody, rowBuilder, currentRows, minimumRows) {
    let rows = currentRows;
    while (rows < minimumRows) {
      const row = rowBuilder({});
      tbody.appendChild(row);
      if (pageOverflows(page)) {
        row.remove();
        break;
      }
      rows += 1;
    }
  }

  function signatureImageMarkup(dataUrl) {
    return dataUrl ? `<img class="pdf-sign-image" src="${escapeAttr(dataUrl)}" alt="">` : '';
  }

  function normalFooterMarkup() {
    return `
      <div class="pdf-spacer"></div>
      <table class="pdf-table pdf-compact">
        <tr><td class="pdf-label" style="width:24%">Tech name</td><td style="width:28%">${escapeHtml(value('n_tech'))}</td><td class="pdf-label" style="width:22%">Hours used</td><td>${escapeHtml(value('n_hours'))}</td></tr>
        <tr><td class="pdf-label">Time Start</td><td>${escapeHtml(value('n_start'))}</td><td class="pdf-label">Time end</td><td>${escapeHtml(value('n_end'))}</td></tr>
      </table>
      <div class="pdf-signatures">
        <div><div style="font-weight:700">Driver Signature:</div>${signatureImageMarkup(signaturePads.n_driver_sig.toDataURL())}</div>
        <div><div style="font-weight:700">Technician Signature:</div>${signatureImageMarkup(signaturePads.n_tech_sig.toDataURL())}</div>
      </div>`;
  }

  function createNormalContinuationPage(pageNumber) {
    const page = document.createElement('section');
    page.className = 'pdf-page pdf-generated-page pdf-continuation-page';
    page.dataset.pdfType = 'normal';
    page.innerHTML = `
      <div class="pdf-continuation-header">
        <img src="hz-auto-logo.png" alt="HZ Auto">
        <div>
          <div class="pdf-continuation-title">Breakdown Job Card</div>
          <div class="pdf-continuation-subtitle">Parts used and returned — continued</div>
        </div>
        <div class="pdf-continuation-meta">${escapeHtml(makeJobNumber('normal'))}<br>Page ${pageNumber}</div>
      </div>
      <table class="pdf-table pdf-compact pdf-continuation-table">
        <thead><tr><th style="width:10%">QTY</th><th>Description</th><th style="width:24%">Book No.</th></tr></thead>
        <tbody class="pdf-generated-parts"></tbody>
      </table>
      <div class="pdf-generated-footer-slot">${normalFooterMarkup()}</div>
      <div class="pdf-continue-note pdf-generated-continue-note" hidden>Parts used and returned continue on the next page.</div>`;
    return page;
  }

  function paginateNormalParts(parts) {
    removeGeneratedPages('normal');
    const page = byId('pdf-normal-1');
    const tbody = byId('pdf_n_parts');
    const footer = byId('pdf_n_footer');
    const continueNote = byId('pdf_n_continue_note');

    tbody.innerHTML = '';
    page.classList.remove('pdf-has-continue-note');
    footer.hidden = false;
    continueNote.hidden = true;
    parts.forEach((part) => tbody.appendChild(normalPartRow(part)));
    addBlankRowsWhileTheyFit(page, tbody, normalPartRow, parts.length, 6);

    if (!pageOverflows(page)) return;

    // The original first page is full. Keep its normal fields and move the
    // technician/signature section to the final continuation page.
    tbody.innerHTML = '';
    footer.hidden = true;
    continueNote.hidden = false;
    page.classList.add('pdf-has-continue-note');

    let index = fillRowsThatFit(page, tbody, parts, 0, normalPartRow);
    if (index === 0 && parts.length) {
      tbody.appendChild(normalPartRow(parts[0]));
      index = 1;
    }

    // If hiding the footer made every part fit on page 1, move a few of the
    // final rows to page 2. This avoids a continuation page containing only
    // signatures and keeps the document reading naturally.
    if (index >= parts.length && parts.length) {
      const moveCount = Math.min(4, tbody.children.length);
      for (let i = 0; i < moveCount; i += 1) tbody.lastElementChild?.remove();
      index = Math.max(0, parts.length - moveCount);
    }

    let anchor = page;
    let pageNumber = 2;
    let needsFinalFooterPage = true;
    while (index < parts.length || needsFinalFooterPage) {
      needsFinalFooterPage = false;
      const continuation = createNormalContinuationPage(pageNumber);
      anchor.insertAdjacentElement('afterend', continuation);
      anchor = continuation;
      const contBody = $('.pdf-generated-parts', continuation);
      const footerSlot = $('.pdf-generated-footer-slot', continuation);
      const note = $('.pdf-generated-continue-note', continuation);

      // Reserve enough space for technician details/signatures so the final
      // page can never be cut off, even when descriptions wrap to more lines.
      footerSlot.style.visibility = 'hidden';
      let next = fillRowsThatFit(continuation, contBody, parts, index, normalPartRow);
      if (next === index) {
        contBody.appendChild(normalPartRow(parts[index]));
        next += 1;
      }

      if (next < parts.length) {
        note.hidden = false;
      } else {
        footerSlot.style.visibility = 'visible';
        addBlankRowsWhileTheyFit(continuation, contBody, normalPartRow, next - index, 4);
      }

      index = next;
      pageNumber += 1;
    }
  }



  // =========================================================
  // V5 PROFESSIONAL PDF DOCUMENT BUILDER
  // =========================================================
  // The phone forms remain familiar, but the exported document is composed
  // as a real paginated business report. Variable-height sections move as a
  // whole, parts tables only break between rows, table headings repeat on each
  // continuation page, and every page repeats the document identity.

  function removeV5Pages(type) {
    $$(`.pdf-v5-page[data-pdf-type="${type}"]`).forEach((page) => page.remove());
  }

  function businessMeta(type) {
    if (type === 'normal') {
      return {
        type,
        title: 'BREAKDOWN JOB CARD',
        documentNo: makeJobNumber('normal'),
        date: formatDate(value('n_date')),
        customer: value('n_customer'),
        vehicle: value('n_reg_tt') || value('n_reg_t1') || value('n_reg_t2'),
        contactLine1: 'Haaike@hzauto.co.za',
        contactLine2: '083 55 55 788'
      };
    }
    return {
      type,
      title: 'BREAKDOWN TECHNICIAN REPORT',
      documentNo: `AML${makeJobNumber('truck').slice(-4)}`,
      date: formatDate(value('t_date')),
      customer: value('t_customer'),
      vehicle: value('t_reg') || value('t_trailer_a') || value('t_trailer_b'),
      contactLine1: 'Haaike@hzauto.co.za',
      contactLine2: '083 55 55 788'
    };
  }

  function createV5Page(type, subtitle = '') {
    const meta = businessMeta(type);
    const page = document.createElement('section');
    page.className = 'pdf-page pdf-v5-page pdf-business-page';
    page.dataset.pdfType = type;
    page.innerHTML = `
      <header class="pdf-business-header">
        <div class="pdf-business-logo-wrap">
          <img src="hz-auto-logo.png" alt="HZ Auto">
        </div>
        <div class="pdf-business-heading">
          <div class="pdf-business-company">HZ AUTO PTY LTD</div>
          <div class="pdf-business-title">${escapeHtml(meta.title)}</div>
          ${subtitle ? `<div class="pdf-business-subtitle">${escapeHtml(subtitle)}</div>` : ''}
        </div>
        <div class="pdf-business-meta">
          <div><strong>${escapeHtml(meta.documentNo)}</strong></div>
          <div>${escapeHtml(meta.date)}</div>
          <div>${escapeHtml(meta.contactLine1)}</div>
          <div>${escapeHtml(meta.contactLine2)}</div>
        </div>
      </header>
      <div class="pdf-business-context">
        <div><span>Customer</span><strong>${escapeHtml(meta.customer || '-')}</strong></div>
        <div><span>Vehicle / Reg.</span><strong>${escapeHtml(meta.vehicle || '-')}</strong></div>
      </div>
      <main class="pdf-business-body"></main>
      <footer class="pdf-business-footer">
        <span>HZ Auto Pty Ltd &nbsp;|&nbsp; ${escapeHtml(meta.title)} &nbsp;|&nbsp; ${escapeHtml(meta.documentNo)}</span>
        <strong class="pdf-business-page-number"></strong>
      </footer>`;
    byId('print-root').appendChild(page);
    return page;
  }

  function createBusinessContext(type) {
    removeV5Pages(type);
    const first = createV5Page(type);
    return {
      type,
      pages: [first],
      page: first,
      body: $('.pdf-business-body', first)
    };
  }

  function addBusinessPage(ctx, subtitle = '') {
    const page = createV5Page(ctx.type, subtitle);
    ctx.pages.push(page);
    ctx.page = page;
    ctx.body = $('.pdf-business-body', page);
    return page;
  }

  function finalizeBusinessPages(ctx) {
    const total = ctx.pages.length;
    ctx.pages.forEach((page, index) => {
      const el = $('.pdf-business-page-number', page);
      if (el) el.textContent = `Page ${index + 1} of ${total}`;
    });
  }

  function sectionShell(title, extraClass = '') {
    const section = document.createElement('section');
    section.className = `pdf-business-section ${extraClass}`.trim();
    section.innerHTML = `<div class="pdf-business-section-title">${escapeHtml(title)}</div><div class="pdf-business-section-content"></div>`;
    return section;
  }

  function keyValueTable(rows) {
    const table = document.createElement('table');
    table.className = 'pdf-business-table pdf-key-value-table';
    const tbody = document.createElement('tbody');
    rows.forEach((row) => {
      const tr = document.createElement('tr');
      const pairs = row.filter(Boolean);
      pairs.forEach((pair) => {
        const th = document.createElement('th');
        th.textContent = pair[0];
        const td = document.createElement('td');
        td.textContent = pair[1] || '';
        tr.appendChild(th);
        tr.appendChild(td);
      });
      if (pairs.length === 1) {
        tr.lastElementChild.colSpan = 3;
      }
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    return table;
  }

  function makeTableSection(title, rows) {
    const section = sectionShell(title);
    $('.pdf-business-section-content', section).appendChild(keyValueTable(rows));
    return section;
  }

  function makeTextSection(title, text, continued = false) {
    const section = sectionShell(`${title}${continued ? ' - CONTINUED' : ''}`);
    const body = document.createElement('div');
    body.className = 'pdf-business-text';
    body.textContent = text || '';
    $('.pdf-business-section-content', section).appendChild(body);
    return section;
  }

  function appendWholeBlock(ctx, block, newPageSubtitle = '') {
    ctx.body.appendChild(block);
    if (!pageOverflows(ctx.page)) return block;

    block.remove();
    addBusinessPage(ctx, newPageSubtitle);
    ctx.body.appendChild(block);
    return block;
  }

  function appendPaginatedText(ctx, title, text) {
    const clean = String(text || '').replace(/\r\n/g, '\n');
    const whole = makeTextSection(title, clean);
    ctx.body.appendChild(whole);
    if (!pageOverflows(ctx.page)) return;

    whole.remove();
    addBusinessPage(ctx, `${title} - continued`);

    // Build the section a token at a time only when the complete section is
    // genuinely too large for a page. Normal job descriptions take the fast
    // path above, so this is only used for unusually long notes.
    const tokens = clean.match(/\S+\s*|\n/g) || [''];
    let index = 0;
    let continued = false;
    while (index < tokens.length) {
      const section = makeTextSection(title, '', continued);
      const body = $('.pdf-business-text', section);
      ctx.body.appendChild(section);
      let chunk = '';
      let added = 0;

      while (index < tokens.length) {
        const candidate = chunk + tokens[index];
        body.textContent = candidate;
        if (pageOverflows(ctx.page)) {
          body.textContent = chunk;
          break;
        }
        chunk = candidate;
        index += 1;
        added += 1;
      }

      if (added === 0 && index < tokens.length) {
        // A single pathological token can be longer than an entire page.
        // Split it into conservative character chunks rather than clipping it.
        const token = tokens[index];
        let used = 0;
        for (let cut = 40; cut <= token.length; cut += 40) {
          body.textContent = token.slice(0, cut);
          if (pageOverflows(ctx.page)) break;
          used = cut;
        }
        if (!used) used = Math.min(40, token.length);
        body.textContent = token.slice(0, used);
        tokens[index] = token.slice(used);
        if (!tokens[index]) index += 1;
      }

      if (index < tokens.length) {
        addBusinessPage(ctx, `${title} - continued`);
        continued = true;
      }
    }
  }

  function normalPartsSection(title = 'PARTS USED AND RETURNED') {
    const section = sectionShell(title, 'pdf-business-parts-section');
    const table = document.createElement('table');
    table.className = 'pdf-business-table pdf-business-parts-table';
    table.innerHTML = `<thead><tr><th style="width:12%">QTY</th><th>DESCRIPTION</th><th style="width:24%">BOOK NO.</th></tr></thead><tbody></tbody>`;
    $('.pdf-business-section-content', section).appendChild(table);
    return section;
  }

  function truckPartsSection(title = 'PARTS USED') {
    const section = sectionShell(title, 'pdf-business-parts-section');
    const table = document.createElement('table');
    table.className = 'pdf-business-table pdf-business-parts-table';
    table.innerHTML = `<thead><tr><th>DESCRIPTION</th><th style="width:25%">AMOUNT</th></tr></thead><tbody></tbody>`;
    $('.pdf-business-section-content', section).appendChild(table);
    return section;
  }

  function normalBusinessPartRow(part) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(part.qty || '')}</td><td>${escapeHtml(part.desc || '')}</td><td>${escapeHtml(part.book || '')}</td>`;
    return tr;
  }

  function truckBusinessPartRow(part) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(part.desc || '')}</td><td class="pdf-amount">${escapeHtml(part.amount || '')}</td>`;
    return tr;
  }

  function partsTableBody(section) {
    return $('tbody', section);
  }


  function splitReadableText(text, maxChars = 260) {
    const source = String(text || '').trim();
    if (!source || source.length <= maxChars) return [source];
    const words = source.split(/\s+/);
    const chunks = [];
    let current = '';
    words.forEach((word) => {
      if (!current) {
        current = word;
      } else if ((current.length + 1 + word.length) <= maxChars) {
        current += ` ${word}`;
      } else {
        chunks.push(current);
        current = word;
      }
    });
    if (current) chunks.push(current);
    return chunks.length ? chunks : [source];
  }

  function expandPartRows(type, parts) {
    const expanded = [];
    parts.forEach((part) => {
      const chunks = splitReadableText(part.desc || '', 260);
      chunks.forEach((chunk, index) => {
        if (type === 'normal') {
          expanded.push({
            qty: index === 0 ? part.qty : '',
            desc: index === 0 ? chunk : `(continued) ${chunk}`,
            book: index === 0 ? part.book : ''
          });
        } else {
          expanded.push({
            desc: index === 0 ? chunk : `(continued) ${chunk}`,
            amount: index === 0 ? part.amount : ''
          });
        }
      });
    });
    return expanded;
  }

  function paginatePartsOnDedicatedPages(ctx, type, parts) {
    const makeSection = type === 'normal' ? normalPartsSection : truckPartsSection;
    const makeRow = type === 'normal' ? normalBusinessPartRow : truckBusinessPartRow;
    const baseTitle = type === 'normal' ? 'PARTS USED AND RETURNED' : 'PARTS USED';

    const displayParts = expandPartRows(type, parts);

    addBusinessPage(ctx, baseTitle);
    let section = makeSection(baseTitle);
    ctx.body.appendChild(section);
    let tbody = partsTableBody(section);

    if (!displayParts.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = type === 'normal' ? 3 : 2;
      td.className = 'pdf-business-empty-row';
      td.textContent = 'No parts recorded.';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    for (let i = 0; i < displayParts.length; i += 1) {
      const row = makeRow(displayParts[i]);
      tbody.appendChild(row);

      if (!pageOverflows(ctx.page)) continue;

      row.remove();
      addBusinessPage(ctx, `${baseTitle} - continued`);
      section = makeSection(`${baseTitle} - CONTINUED`);
      ctx.body.appendChild(section);
      tbody = partsTableBody(section);
      tbody.appendChild(row);

      // A part description should normally be concise. If a single row is
      // still taller than a fresh page, keep it visible and mark it rather
      // than silently clipping the document.
      if (pageOverflows(ctx.page)) {
        row.classList.add('pdf-business-oversize-row');
      }
    }
  }

  function makeNormalCompletionBlock() {
    const wrapper = document.createElement('div');
    wrapper.className = 'pdf-business-completion-group';

    const tech = makeTableSection('TECHNICIAN / TIME', [
      [['Tech name', value('n_tech')], ['Hours used', value('n_hours')]],
      [['Time Start', value('n_start')], ['Time end', value('n_end')]]
    ]);
    wrapper.appendChild(tech);

    const sig = sectionShell('SIGN-OFF');
    const grid = document.createElement('div');
    grid.className = 'pdf-business-sign-grid';
    grid.innerHTML = `
      <div class="pdf-business-sign-cell"><strong>Driver Signature</strong>${signatureImageMarkup(signaturePads.n_driver_sig.toDataURL())}</div>
      <div class="pdf-business-sign-cell"><strong>Technician Signature</strong>${signatureImageMarkup(signaturePads.n_tech_sig.toDataURL())}</div>`;
    $('.pdf-business-section-content', sig).appendChild(grid);
    wrapper.appendChild(sig);
    return wrapper;
  }

  function makeTruckCompletionBlock() {
    const wrapper = document.createElement('div');
    wrapper.className = 'pdf-business-completion-group';

    const time = sectionShell('TIME REPORTED');
    const table = document.createElement('table');
    table.className = 'pdf-business-table pdf-time-table';
    table.innerHTML = `
      <thead><tr><th>ITEM</th><th style="width:22%">TIME / VALUE</th><th style="width:22%">KM</th></tr></thead>
      <tbody>
        <tr><td>Time started</td><td>${escapeHtml(value('t_time_started'))}</td><td>${escapeHtml(value('t_time_started_km'))}</td></tr>
        <tr><td>Time arrived at site</td><td>${escapeHtml(value('t_time_arrived'))}</td><td>${escapeHtml(value('t_time_arrived_km'))}</td></tr>
        <tr><td>Time of completion</td><td>${escapeHtml(value('t_time_completed'))}</td><td>${escapeHtml(value('t_time_completed_km'))}</td></tr>
        <tr><td>Time back base</td><td>${escapeHtml(value('t_time_back'))}</td><td>${escapeHtml(value('t_time_back_km'))}</td></tr>
        <tr><td>Normal time</td><td>${escapeHtml(value('t_normal_time'))}</td><td></td></tr>
        <tr><td>Over time</td><td>${escapeHtml(value('t_over_time'))}</td><td></td></tr>
        <tr><td>Toll fees</td><td>${escapeHtml(value('t_toll_fees'))}</td><td></td></tr>
      </tbody>`;
    $('.pdf-business-section-content', time).appendChild(table);
    wrapper.appendChild(time);

    const report = makeTextSection('TECHNICIAN REPORT', value('t_tech_report'));
    wrapper.appendChild(report);

    const sig = sectionShell('TECHNICIAN / DRIVER SIGN-OFF');
    const grid = document.createElement('div');
    grid.className = 'pdf-business-sign-grid';
    grid.innerHTML = `
      <div class="pdf-business-sign-cell"><div class="pdf-business-sign-name"><span>Technician</span><strong>${escapeHtml(value('t_technician'))}</strong></div>${signatureImageMarkup(signaturePads.t_tech_sig.toDataURL())}</div>
      <div class="pdf-business-sign-cell"><div class="pdf-business-sign-name"><span>Driver</span><strong>${escapeHtml(value('t_driver'))}</strong></div>${signatureImageMarkup(signaturePads.t_driver_sig.toDataURL())}</div>`;
    $('.pdf-business-section-content', sig).appendChild(grid);
    wrapper.appendChild(sig);

    return wrapper;
  }


  function makeTruckTimeBlock() {
    const time = sectionShell('TIME REPORTED');
    const table = document.createElement('table');
    table.className = 'pdf-business-table pdf-time-table';
    table.innerHTML = `
      <thead><tr><th>ITEM</th><th style="width:22%">TIME / VALUE</th><th style="width:22%">KM</th></tr></thead>
      <tbody>
        <tr><td>Time started</td><td>${escapeHtml(value('t_time_started'))}</td><td>${escapeHtml(value('t_time_started_km'))}</td></tr>
        <tr><td>Time arrived at site</td><td>${escapeHtml(value('t_time_arrived'))}</td><td>${escapeHtml(value('t_time_arrived_km'))}</td></tr>
        <tr><td>Time of completion</td><td>${escapeHtml(value('t_time_completed'))}</td><td>${escapeHtml(value('t_time_completed_km'))}</td></tr>
        <tr><td>Time back base</td><td>${escapeHtml(value('t_time_back'))}</td><td>${escapeHtml(value('t_time_back_km'))}</td></tr>
        <tr><td>Normal time</td><td>${escapeHtml(value('t_normal_time'))}</td><td></td></tr>
        <tr><td>Over time</td><td>${escapeHtml(value('t_over_time'))}</td><td></td></tr>
        <tr><td>Toll fees</td><td>${escapeHtml(value('t_toll_fees'))}</td><td></td></tr>
      </tbody>`;
    $('.pdf-business-section-content', time).appendChild(table);
    return time;
  }

  function makeTruckSignoffBlock() {
    const sig = sectionShell('TECHNICIAN / DRIVER SIGN-OFF');
    const grid = document.createElement('div');
    grid.className = 'pdf-business-sign-grid';
    grid.innerHTML = `
      <div class="pdf-business-sign-cell"><div class="pdf-business-sign-name"><span>Technician</span><strong>${escapeHtml(value('t_technician'))}</strong></div>${signatureImageMarkup(signaturePads.t_tech_sig.toDataURL())}</div>
      <div class="pdf-business-sign-cell"><div class="pdf-business-sign-name"><span>Driver</span><strong>${escapeHtml(value('t_driver'))}</strong></div>${signatureImageMarkup(signaturePads.t_driver_sig.toDataURL())}</div>`;
    $('.pdf-business-section-content', sig).appendChild(grid);
    return sig;
  }

  function appendTruckCompletionSafely(ctx, completionBlock) {
    ctx.body.appendChild(completionBlock);
    if (!pageOverflows(ctx.page)) return;

    completionBlock.remove();
    addBusinessPage(ctx, 'Job completion and sign-off');
    ctx.body.appendChild(completionBlock);
    if (!pageOverflows(ctx.page)) return;

    // Extremely long technician notes should never force the signatures off
    // the page. Fall back to three independently paginated, clearly labelled
    // sections while preserving the same information.
    completionBlock.remove();
    appendWholeBlock(ctx, makeTruckTimeBlock(), 'Time reported');
    appendPaginatedText(ctx, 'TECHNICIAN REPORT', value('t_tech_report'));
    appendWholeBlock(ctx, makeTruckSignoffBlock(), 'Technician / driver sign-off');
  }

  function addPartsAndCompletion(ctx, type, parts, completionBlock) {
    const makeSection = type === 'normal' ? normalPartsSection : truckPartsSection;
    const makeRow = type === 'normal' ? normalBusinessPartRow : truckBusinessPartRow;
    const baseTitle = type === 'normal' ? 'PARTS USED AND RETURNED' : 'PARTS USED';

    // A large list always starts cleanly on a new page. For a small list we
    // first test whether the entire parts section AND completion/signatures fit
    // together. If not, both are moved instead of leaving half a table behind.
    const largeList = parts.length > (type === 'normal' ? 9 : 7);
    if (largeList) {
      const note = document.createElement('div');
      note.className = 'pdf-business-next-page-note';
      note.textContent = `${baseTitle.charAt(0)}${baseTitle.slice(1).toLowerCase()} are listed on the following page.`;
      ctx.body.appendChild(note);
      if (pageOverflows(ctx.page)) note.remove();
    }
    if (!largeList) {
      const partsSection = makeSection(baseTitle);
      const tbody = partsTableBody(partsSection);
      if (parts.length) parts.forEach((part) => tbody.appendChild(makeRow(part)));
      else {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = type === 'normal' ? 3 : 2;
        td.className = 'pdf-business-empty-row';
        td.textContent = 'No parts recorded.';
        tr.appendChild(td);
        tbody.appendChild(tr);
      }

      ctx.body.appendChild(partsSection);
      ctx.body.appendChild(completionBlock);
      if (!pageOverflows(ctx.page)) return;

      completionBlock.remove();
      partsSection.remove();
    }

    paginatePartsOnDedicatedPages(ctx, type, parts);

    // Keep the completion/signature group intact. If it cannot fit below the
    // final parts table, it moves as a single clean unit to a new page.
    if (type === 'truck') {
      appendTruckCompletionSafely(ctx, completionBlock);
    } else {
      ctx.body.appendChild(completionBlock);
      if (pageOverflows(ctx.page)) {
        completionBlock.remove();
        addBusinessPage(ctx, 'Job completion and sign-off');
        ctx.body.appendChild(completionBlock);
      }
    }
  }

  function buildNormalBusinessDocument() {
    const ctx = createBusinessContext('normal');

    appendWholeBlock(ctx, makeTableSection('CUSTOMER AND JOB', [
      [['Customer name', value('n_customer')], ['Date', formatDate(value('n_date'))]],
      [['Job received by', value('n_receivedby')], ['Time', value('n_time')]],
      [['Order Number', value('n_order')]],
      [['Location of vehicle', value('n_location')]],
      [['Driver name', value('n_driver')], ['Cell no', value('n_cell')]]
    ]), 'Customer and job');

    appendPaginatedText(ctx, 'JOB DETAILS AND SPECIAL INSTRUCTIONS', value('n_jobdetails'));

    appendWholeBlock(ctx, makeTableSection('VEHICLE AND TRAILERS', [
      [['Registration number T/T', value('n_reg_tt')], ['VIN Number', value('n_vin_tt')]],
      [['Truck make & Model', value('n_make_model')], ['Truck Km', value('n_km')]],
      [['Registration number T1', value('n_reg_t1')], ['VIN Number T1', value('n_vin_t1')]],
      [['Registration number T2', value('n_reg_t2')], ['VIN Number T2', value('n_vin_t2')]]
    ]), 'Vehicle and trailers');

    appendPaginatedText(ctx, 'WORK DONE', value('n_workdone'));
    addPartsAndCompletion(ctx, 'normal', getNormalParts(), makeNormalCompletionBlock());
    finalizeBusinessPages(ctx);
  }

  function buildTruckBusinessDocument() {
    const ctx = createBusinessContext('truck');

    appendWholeBlock(ctx, makeTableSection('CUSTOMER AND VEHICLE', [
      [['Customer name', value('t_customer')], ['Date', formatDate(value('t_date'))]],
      [['Order number', value('t_order')], ['Reg. number', value('t_reg')]],
      [['VIN number', value('t_vin')], ['Fleet number', value('t_fleet')]],
      [['Engine number', value('t_engine')], ['KM', value('t_km')]],
      [['Trailer A Make / Reg', value('t_trailer_a')], ['VIN number', value('t_trailer_a_vin')]],
      [['Trailer B Make / Reg', value('t_trailer_b')], ['VIN number', value('t_trailer_b_vin')]]
    ]), 'Customer and vehicle');

    appendPaginatedText(ctx, 'LOCATION OF BREAKDOWN', value('t_location'));
    appendPaginatedText(ctx, 'CUSTOMER REQUEST', value('t_request'));
    appendPaginatedText(ctx, 'CAUSE OF PROBLEM', value('t_cause'));
    appendPaginatedText(ctx, 'ACTION TAKEN', value('t_action'));

    const charges = sectionShell('CHARGES / DESCRIPTION');
    const chargesTable = document.createElement('table');
    chargesTable.className = 'pdf-business-table pdf-charge-table';
    chargesTable.innerHTML = `
      <thead><tr><th>DESCRIPTION</th><th style="width:28%">AMOUNT</th></tr></thead>
      <tbody>
        <tr><td>Call out</td><td class="pdf-amount">${escapeHtml(value('t_callout'))}</td></tr>
        <tr><td>Travelling</td><td class="pdf-amount">${escapeHtml(value('t_travelling'))}</td></tr>
        <tr><td>Travelling time</td><td class="pdf-amount">${escapeHtml(value('t_travelling_time'))}</td></tr>
        <tr><td>Labour N/T</td><td class="pdf-amount">${escapeHtml(value('t_labour_nt'))}</td></tr>
        <tr><td>Labour O/T</td><td class="pdf-amount">${escapeHtml(value('t_labour_ot'))}</td></tr>
        <tr><td>Consumables</td><td class="pdf-amount">${escapeHtml(value('t_consumables'))}</td></tr>
      </tbody>`;
    $('.pdf-business-section-content', charges).appendChild(chargesTable);
    appendWholeBlock(ctx, charges, 'Charges');

    addPartsAndCompletion(ctx, 'truck', getTruckParts(), makeTruckCompletionBlock());
    finalizeBusinessPages(ctx);
  }
  function buildNormalTemplate() {
    buildNormalBusinessDocument();
  }

  function truckFooterMarkup() {
    return `
      <div class="pdf-spacer"></div>
      <table class="pdf-table pdf-compact">
        <tr><th style="text-align:left;width:43%">TIME REPORTED</th><th style="width:18%">TIME</th><th style="width:18%">KM</th><td style="width:21%" rowspan="9">${escapeHtml(value('t_tech_report'))}</td></tr>
        <tr><td>Time started</td><td>${escapeHtml(value('t_time_started'))}</td><td>${escapeHtml(value('t_time_started_km'))}</td></tr>
        <tr><td>Time arrived at site</td><td>${escapeHtml(value('t_time_arrived'))}</td><td>${escapeHtml(value('t_time_arrived_km'))}</td></tr>
        <tr><td>Time of completion</td><td>${escapeHtml(value('t_time_completed'))}</td><td>${escapeHtml(value('t_time_completed_km'))}</td></tr>
        <tr><td>Time back base</td><td>${escapeHtml(value('t_time_back'))}</td><td>${escapeHtml(value('t_time_back_km'))}</td></tr>
        <tr><td>Normal time</td><td>${escapeHtml(value('t_normal_time'))}</td><td></td></tr>
        <tr><td>Over time</td><td>${escapeHtml(value('t_over_time'))}</td><td></td></tr>
        <tr><td>Toll fees</td><td>${escapeHtml(value('t_toll_fees'))}</td><td></td></tr>
        <tr><td>Technician report</td><td colspan="2"></td></tr>
      </table>
      <div class="pdf-spacer"></div>
      <table class="pdf-table pdf-compact">
        <tr><td class="pdf-label">Technician Name:</td><td>${escapeHtml(value('t_technician'))}</td><td class="pdf-label">Driver name:</td><td>${escapeHtml(value('t_driver'))}</td></tr>
        <tr><td class="pdf-label">Signature</td><td>${signatureImageMarkup(signaturePads.t_tech_sig.toDataURL())}</td><td class="pdf-label">Signature</td><td>${signatureImageMarkup(signaturePads.t_driver_sig.toDataURL())}</td></tr>
      </table>`;
  }

  function createTruckContinuationPage(pageNumber) {
    const page = document.createElement('section');
    page.className = 'pdf-page pdf-generated-page pdf-continuation-page';
    page.dataset.pdfType = 'truck';
    page.innerHTML = `
      <div class="pdf-continuation-header">
        <img src="hz-auto-logo.png" alt="HZ Auto">
        <div>
          <div class="pdf-continuation-title">BREAKDOWN TECHNICIAN REPORT</div>
          <div class="pdf-continuation-subtitle">Parts used — continued</div>
          <div class="pdf-continuation-customer">${escapeHtml(value('t_customer'))}${value('t_reg') ? ` • ${escapeHtml(value('t_reg'))}` : ''}</div>
        </div>
        <div class="pdf-continuation-meta">AML${escapeHtml(makeJobNumber('truck').slice(-4))}<br>${escapeHtml(formatDate(value('t_date')))}<br>Page ${pageNumber}</div>
      </div>
      <table class="pdf-table pdf-compact pdf-continuation-table">
        <thead><tr><th style="text-align:left">PARTS USED</th><th style="width:24%">AMOUNT</th></tr></thead>
        <tbody class="pdf-generated-parts"></tbody>
      </table>
      <div class="pdf-generated-footer-slot">${truckFooterMarkup()}</div>
      <div class="pdf-continue-note pdf-generated-continue-note" hidden>Parts used continue on the next page.</div>`;
    return page;
  }

  function paginateTruckParts(parts) {
    removeGeneratedPages('truck');
    const page = byId('pdf-truck-1');
    const tbody = byId('pdf_t_parts');
    const footer = byId('pdf_t_footer');
    const continueNote = byId('pdf_t_continue_note');

    tbody.innerHTML = '';
    page.classList.remove('pdf-has-continue-note');
    footer.hidden = false;
    continueNote.hidden = true;
    parts.forEach((part) => tbody.appendChild(truckPartRow(part)));
    addBlankRowsWhileTheyFit(page, tbody, truckPartRow, parts.length, 9);

    if (!pageOverflows(page)) return;

    tbody.innerHTML = '';
    footer.hidden = true;
    continueNote.hidden = false;
    page.classList.add('pdf-has-continue-note');

    let index = fillRowsThatFit(page, tbody, parts, 0, truckPartRow);
    if (index === 0 && parts.length) {
      tbody.appendChild(truckPartRow(parts[0]));
      index = 1;
    }

    if (index >= parts.length && parts.length) {
      const moveCount = Math.min(4, tbody.children.length);
      for (let i = 0; i < moveCount; i += 1) tbody.lastElementChild?.remove();
      index = Math.max(0, parts.length - moveCount);
    }

    let anchor = page;
    let pageNumber = 2;
    let needsFinalFooterPage = true;
    while (index < parts.length || needsFinalFooterPage) {
      needsFinalFooterPage = false;
      const continuation = createTruckContinuationPage(pageNumber);
      anchor.insertAdjacentElement('afterend', continuation);
      anchor = continuation;
      const contBody = $('.pdf-generated-parts', continuation);
      const footerSlot = $('.pdf-generated-footer-slot', continuation);
      const note = $('.pdf-generated-continue-note', continuation);

      footerSlot.style.visibility = 'hidden';
      let next = fillRowsThatFit(continuation, contBody, parts, index, truckPartRow);
      if (next === index) {
        contBody.appendChild(truckPartRow(parts[index]));
        next += 1;
      }

      if (next < parts.length) {
        note.hidden = false;
      } else {
        footerSlot.style.visibility = 'visible';
      }

      index = next;
      pageNumber += 1;
    }
  }

  function buildTruckTemplate() {
    buildTruckBusinessDocument();
  }

  function buildTripTemplate() {
    const fields = ['customer','fleet','jobcard','order','vehicle_reg','estimate','vehicle_make','invoice','vehicle_type','parts_yn','cof','warranty','location','vin','km','breakdown','comments','tech_name','foreman_name','brake_1_left','brake_1_right','brake_2_left','brake_2_right','b_comments'];
    fields.forEach((f) => setPdf(`pdf_p_${f}`, value(`p_${f}`)));
    setPdf('pdf_p_inspection_date', formatDate(value('p_inspection_date')));
    setPdf('pdf_p_time_start', value('p_time_start'));
    setPdf('pdf_p_time_finish', value('p_time_finish'));
    setPdf('pdf_p_supplier_date', formatDate(value('p_supplier_date')));
    setPdf('pdf_p_customer_date', formatDate(value('p_customer_date')));
    setPdf('pdf_p_tech_name_b', value('p_tech_name'));

    const sigTech = signaturePads.p_tech_sig.toDataURL();
    const sigCustomer = signaturePads.p_customer_sig.toDataURL();
    setPdfImg('pdf_p_tech_sig_a', sigTech);
    setPdfImg('pdf_p_customer_sig_a', sigCustomer);
    setPdfImg('pdf_p_tech_sig_b', sigTech);

    const tbody = byId('pdf_p_check_rows');
    tbody.innerHTML = '';
    tripChecks.forEach((label, i) => {
      const status = value(`p_check_${i}`);
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${escapeHtml(label)}</td><td>${status === 'Checked' ? '✓' : ''}</td><td>${status === 'Replaced' ? '✓' : ''}</td><td>${status === 'Repaired/Adjusted' ? '✓' : ''}</td>`;
      tbody.appendChild(tr);
    });
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s || '';
    return div.innerHTML;
  }

  function validateForm(type) {
    const form = byId(`form-${type}`);
    return form.reportValidity();
  }

  function buildTemplate(type) {
    if (type === 'normal') buildNormalTemplate();
    if (type === 'truck') buildTruckTemplate();
    if (type === 'trip') buildTripTemplate();
  }

  function templatePages(type) {
    if (type === 'normal') return $$('.pdf-v5-page[data-pdf-type="normal"]');
    if (type === 'truck') return $$('.pdf-v5-page[data-pdf-type="truck"]');
    return [byId('pdf-trip-1'), byId('pdf-trip-2')];
  }

  async function renderCanvases(type) {
    if (!window.html2canvas) throw new Error('PDF preview library did not load. Open the app once while online, then reload it.');
    buildTemplate(type);
    const result = [];
    for (const page of templatePages(type)) {
      const canvas = await html2canvas(page, {
        scale: 1.65,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        windowWidth: 794,
        windowHeight: 1123
      });
      result.push(canvas);
    }
    return result;
  }

  async function openReview(type) {
    lockAllSignatures();
    if (!validateForm(type)) return;
    currentType = type;
    const modal = byId('review-modal');
    const preview = byId('preview-pages');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    preview.innerHTML = '<div class="loading-note">Building your PDF preview…</div>';
    byId('confirm-send').disabled = true;
    byId('download-pdf').disabled = true;

    try {
      currentPreviewCanvases = await renderCanvases(type);
      preview.innerHTML = '';
      currentPreviewCanvases.forEach((canvas, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'preview-page';
        const img = new Image();
        img.src = canvas.toDataURL('image/jpeg', 0.9);
        img.alt = `Job card preview page ${index + 1} of ${currentPreviewCanvases.length}`;
        const label = document.createElement('div');
        label.className = 'preview-page-label';
        label.textContent = `Page ${index + 1} of ${currentPreviewCanvases.length}`;
        wrapper.appendChild(img);
        wrapper.appendChild(label);
        preview.appendChild(wrapper);
      });
      byId('confirm-send').disabled = false;
      byId('download-pdf').disabled = false;
    } catch (err) {
      preview.innerHTML = `<div class="loading-note">${escapeHtml(err.message || 'Could not create the preview.')}</div>`;
      toast(err.message || 'Could not create preview.');
    }
  }

  function closeReview() {
    byId('review-modal').classList.remove('open');
    byId('review-modal').setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function createPdfFromCanvases(canvases) {
    if (!window.jspdf?.jsPDF) throw new Error('PDF library did not load. Open the app once while online, then reload it.');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
    canvases.forEach((canvas, index) => {
      if (index > 0) pdf.addPage('a4', 'portrait');
      const img = canvas.toDataURL('image/jpeg', 0.88);
      pdf.addImage(img, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    });
    return pdf;
  }

  function jobMeta(type) {
    const jobNo = makeJobNumber(type);
    if (type === 'normal') {
      const customer = value('n_customer');
      const reg = value('n_reg_tt') || value('n_reg_t1') || value('n_reg_t2');
      const date = formatDate(value('n_date'));
      return {
        filename: `${jobNo} - Breakdown Job Card - ${safeFilePart(customer)}${reg ? ' - ' + safeFilePart(reg) : ''}.pdf`,
        subject: `HZ Auto Breakdown Job Card - ${customer}${reg ? ' - ' + reg : ''} - ${date}`
      };
    }
    if (type === 'truck') {
      const customer = value('t_customer');
      const reg = value('t_reg') || value('t_trailer_a') || value('t_trailer_b');
      const date = formatDate(value('t_date'));
      return {
        filename: `${jobNo} - Breakdown Technician Report - ${safeFilePart(customer)}${reg ? ' - ' + safeFilePart(reg) : ''}.pdf`,
        subject: `HZ Auto Breakdown Technician Report - ${customer}${reg ? ' - ' + reg : ''} - ${date}`
      };
    }
    const customer = value('p_customer');
    const reg = value('p_vehicle_reg');
    const date = formatDate(value('p_inspection_date'));
    return {
      filename: `${jobNo} - Side Tipper Trip Check - ${safeFilePart(customer)}${reg ? ' - ' + safeFilePart(reg) : ''}.pdf`,
      subject: `HZ Auto Side Tipper Trip Check - ${customer}${reg ? ' - ' + reg : ''} - ${date}`
    };
  }

  function downloadCurrentPdf() {
    if (!currentType || !currentPreviewCanvases.length) return;
    try {
      const pdf = createPdfFromCanvases(currentPreviewCanvases);
      const meta = jobMeta(currentType);
      pdf.save(meta.filename);
    } catch (err) {
      toast(err.message || 'Could not download PDF.');
    }
  }

  async function shareCurrentPdf() {
    if (!currentType || !currentPreviewCanvases.length) return;
    const btn = byId('confirm-send');
    btn.disabled = true;
    const original = btn.textContent;
    btn.textContent = 'Preparing PDF…';

    try {
      const pdf = createPdfFromCanvases(currentPreviewCanvases);
      const meta = jobMeta(currentType);
      const blob = pdf.output('blob');
      const file = new File([blob], meta.filename, { type: 'application/pdf' });
      const shareData = {
        files: [file],
        title: meta.subject,
        text: `HZ Auto completed job card ${makeJobNumber(currentType)}`
      };

      if (navigator.canShare && navigator.share && navigator.canShare({ files: [file] })) {
        btn.textContent = 'Opening Share Menu…';
        await navigator.share(shareData);
        toast('PDF opened in your phone share menu. Choose Gmail, Outlook, WhatsApp or another app.', 6000);
      } else {
        pdf.save(meta.filename);
        toast('Direct PDF sharing is not supported in this browser. The PDF was downloaded instead; share it from your Downloads/Files app.', 7000);
      }
    } catch (err) {
      if (err && err.name === 'AbortError') {
        toast('Sharing cancelled. Your job card is still here.');
      } else {
        toast(err.message || 'Could not share the PDF.', 7000);
      }
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  }

  function toast(message, ms = 3500) {
    const el = byId('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), ms);
  }

  function wireEvents() {
    $$('[data-open-form]').forEach((btn) => {
      btn.addEventListener('click', () => showScreen(btn.dataset.openForm));
    });
    $$('[data-home]').forEach((btn) => btn.addEventListener('click', () => showScreen('home')));
    $$('[data-add-part]').forEach((btn) => btn.addEventListener('click', () => btn.dataset.addPart === 'normal' ? addNormalPart() : addTruckPart()));
    $$('[data-review]').forEach((btn) => btn.addEventListener('click', () => openReview(btn.dataset.review)));
    byId('close-review').addEventListener('click', closeReview);
    byId('edit-review').addEventListener('click', closeReview);
    byId('download-pdf').addEventListener('click', downloadCurrentPdf);
    byId('confirm-send').addEventListener('click', shareCurrentPdf);
    window.addEventListener('resize', () => resizeVisibleSignatures());
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  function init() {
    buildTripChecklist();
    addNormalPart();
    addNormalPart();
    addTruckPart();
    addTruckPart();
    initSignatures();
    setDefaultDates();
    wireEvents();
    registerServiceWorker();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
