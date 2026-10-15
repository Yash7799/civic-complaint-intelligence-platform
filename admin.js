// Admin dashboard interactions
async function fetchComplaints() {
  const res = await fetch('/api/complaints');
  if (!res.ok) throw new Error('Failed to load');
  return res.json();
}

function renderComplaints(rows) {
  const tbody = document.querySelector('#complaints-table tbody');
  tbody.innerHTML = '';
  rows.forEach(r => {
    const tr = document.createElement('tr');
    const imagesHtml = (r.images || []).map(src => `<img class="thumb" src="${src}" />`).join('');
    const location = (r.lat && r.lng) ? `${r.lat}, ${r.lng}` : (r.address || '-');
    const statusClass = r.status === 'resolved' ? 'status-resolved' : (r.status === 'escalated' ? 'status-escalated' : 'status-open');

    tr.innerHTML = `
      <td>${r.id}</td>
      <td><strong>${escapeHtml(r.title)}</strong><div style="color:var(--muted);font-size:0.9rem;margin-top:6px;">${escapeHtml(r.description||'')}</div></td>
      <td>${escapeHtml(r.name||'-')}</td>
      <td>${escapeHtml(r.contact||'-')}</td>
      <td>${escapeHtml(location)}</td>
      <td>${imagesHtml}</td>
      <td class="${statusClass}">${escapeHtml(r.status||'open')}</td>
      <td>${new Date(r.created_at).toLocaleString()}</td>
      <td class="actions">
        <select class="assign-select small-input" data-id="${r.id}">
          <option value="">Assign dept</option>
          <option value="Public Works">Public Works</option>
          <option value="Sanitation">Sanitation</option>
          <option value="Roads">Roads</option>
          <option value="Health">Health</option>
          <option value="Police">Police</option>
        </select>
        <button class="btn set-status" data-id="${r.id}" data-status="in-progress">In progress</button>
        <button class="btn set-status" data-id="${r.id}" data-status="resolved">Resolve</button>
        <button class="btn set-status" data-id="${r.id}" data-status="escalated">Escalate</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function escapeHtml(s){ if(!s) return ''; return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

async function loadAndRender() {
  try {
    let rows = await fetchComplaints();
    // apply filters
    const statusFilter = document.getElementById('filter-status').value;
    const search = document.getElementById('filter-search').value.toLowerCase();
    if (statusFilter) rows = rows.filter(r => (r.status||'open') === statusFilter);
    if (search) rows = rows.filter(r => (r.title||'').toLowerCase().includes(search) || (r.description||'').toLowerCase().includes(search));
    renderComplaints(rows);
  } catch (err) {
    console.error(err);
    alert('Unable to load complaints');
  }
}

async function assignDepartment(id, dept) {
  await fetch(`/api/complaints/${id}/assign`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ department: dept }) });
}

async function updateStatus(id, status) {
  await fetch(`/api/complaints/${id}/status`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status }) });
}

document.addEventListener('click', async (e) => {
  if (e.target.matches('.set-status')) {
    const id = e.target.dataset.id;
    const status = e.target.dataset.status;
    await updateStatus(id, status);
    await loadAndRender();
  }
});

document.addEventListener('change', async (e) => {
  if (e.target.matches('.assign-select')) {
    const id = e.target.dataset.id;
    const dept = e.target.value;
    if (!dept) return;
    await assignDepartment(id, dept);
    await loadAndRender();
  }
});

document.getElementById('apply-filters').addEventListener('click', loadAndRender);

// initial load
loadAndRender();
