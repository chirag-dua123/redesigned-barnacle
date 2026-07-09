/**
 * dashboard-ground.js — AeroCommand Ground Operations client
 *
 * Handles:
 *   • Loading gate matrix         (GET  /api/ground/gates)
 *   • Loading flights             (GET  /api/traffic/flights)
 *   • Assigning gate to flight    (POST /api/ground/assign-gate)
 *   • Logging refueling           (POST /api/ground/refuel)
 *   • Logout                      (POST /api/auth/logout)
 *   • Auto-refresh every 30 s
 *   • Toast notifications
 */

document.addEventListener('DOMContentLoaded', () => {
  // ── DOM References ──────────────────────────────────────────────────
  const gateGrid            = document.getElementById('gate-grid');
  const assignGateSelect    = document.getElementById('assign-gate-select');
  const assignFlightSelect  = document.getElementById('assign-flight-select');
  const assignGateBtn       = document.getElementById('assign-gate-btn');
  const refuelFlightSelect  = document.getElementById('refuel-flight-select');
  const refuelGallonsInput  = document.getElementById('refuel-gallons');
  const refuelBtn           = document.getElementById('refuel-btn');
  const logoutBtn           = document.getElementById('logout-btn');
  const toastContainer      = document.getElementById('toast-container');

  // ── Helpers ─────────────────────────────────────────────────────────

  /**
   * Return the CSS pill class string for a gate status.
   * @param {string} status
   * @returns {string}
   */
  function getPillClass(status) {
    switch (status) {
      case 'occupied':     return 'pill pill-warn';
      case 'maintenance':  return 'pill pill-danger';
      case 'available':
      default:             return 'pill';
    }
  }

  /**
   * Display a temporary toast notification.
   * @param {string} message
   * @param {'success'|'error'|'info'} type
   */
  function showToast(message, type = 'info') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  /** Basic HTML-escape to prevent XSS. */
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Capitalize the first letter of a string. */
  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ── Data loading ────────────────────────────────────────────────────

  /**
   * Fetch gates and flights in parallel, then render the UI.
   */
  async function loadData() {
    try {
      const [gatesRes, flightsRes] = await Promise.all([
        fetch('/api/ground/gates',    { credentials: 'same-origin' }),
        fetch('/api/traffic/flights', { credentials: 'same-origin' }),
      ]);

      const gatesData   = await gatesRes.json();
      const flightsData = await flightsRes.json();

      if (!gatesData.success) {
        showToast(gatesData.message || 'Failed to load gates.', 'error');
      }
      if (!flightsData.success) {
        showToast(flightsData.message || 'Failed to load flights.', 'error');
      }

      const gates   = gatesData.gates   || [];
      const flights = flightsData.flights || [];

      renderGates(gates);
      populateSelectors(gates, flights);
    } catch (err) {
      console.error('loadData error:', err);
      showToast('Network error — could not load dashboard data.', 'error');
    }
  }

  // ── Gate rendering ──────────────────────────────────────────────────

  /**
   * Render gate cards into the #gate-grid container.
   * @param {Array} gates
   */
  function renderGates(gates) {
    if (!gateGrid) return;

    if (gates.length === 0) {
      gateGrid.innerHTML = '<p class="muted">No gates configured.</p>';
      return;
    }

    gateGrid.innerHTML = gates.map((g) => {
      const pillClass = getPillClass(g.status);
      const statusLabel = capitalize(g.status);
      const flight = g.currentFlight;

      let flightInfo = '';
      if (flight && g.status === 'occupied') {
        flightInfo = `
          <div class="gate-flight">
            <span class="gate-flight-number">${escapeHtml(flight.flightNumber)}</span>
            <span class="gate-flight-route">${escapeHtml(flight.origin)} → ${escapeHtml(flight.destination)}</span>
          </div>
        `;
      }

      return `
        <div class="gate-card">
          <span class="gate-title">${escapeHtml(g.gateId)}</span>
          <span class="gate-terminal muted">Terminal ${escapeHtml(g.terminal)}</span>
          <span class="${pillClass}">${statusLabel}</span>
          ${flightInfo}
        </div>
      `;
    }).join('');
  }

  // ── Selector population ─────────────────────────────────────────────

  /**
   * Populate the gate and flight dropdowns.
   * @param {Array} gates
   * @param {Array} flights
   */
  function populateSelectors(gates, flights) {
    // Gate selector (for gate assignment)
    if (assignGateSelect) {
      assignGateSelect.innerHTML = '<option value="">— select gate —</option>'
        + gates.map((g) =>
            `<option value="${escapeHtml(g.gateId)}">${escapeHtml(g.gateId)} (Terminal ${escapeHtml(g.terminal)})</option>`
          ).join('');
    }

    // Flight selector for gate assignment
    if (assignFlightSelect) {
      assignFlightSelect.innerHTML = '<option value="">— select flight —</option>'
        + flights.map((f) =>
            `<option value="${f._id}">${escapeHtml(f.flightNumber)}</option>`
          ).join('');
    }

    // Flight selector for refueling
    if (refuelFlightSelect) {
      refuelFlightSelect.innerHTML = '<option value="">— select flight —</option>'
        + flights.map((f) =>
            `<option value="${f._id}">${escapeHtml(f.flightNumber)}</option>`
          ).join('');
    }
  }

  // ── Gate assignment ─────────────────────────────────────────────────
  if (assignGateBtn) {
    assignGateBtn.addEventListener('click', async () => {
      const gateId   = assignGateSelect   ? assignGateSelect.value   : '';
      const flightId = assignFlightSelect ? assignFlightSelect.value : '';

      if (!gateId) {
        showToast('Please select a gate.', 'error');
        return;
      }
      if (!flightId) {
        showToast('Please select a flight.', 'error');
        return;
      }

      try {
        const res = await fetch('/api/ground/assign-gate', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gateId, flightId }),
        });

        const data = await res.json();

        if (data.success) {
          showToast(data.message || 'Gate assigned!', 'success');
          await loadData(); // refresh everything
        } else {
          showToast(data.message || 'Assignment failed.', 'error');
        }
      } catch (err) {
        console.error('assignGate error:', err);
        showToast('Network error — could not assign gate.', 'error');
      }
    });
  }

  // ── Refueling ───────────────────────────────────────────────────────
  if (refuelBtn) {
    refuelBtn.addEventListener('click', async () => {
      const flightId     = refuelFlightSelect ? refuelFlightSelect.value : '';
      const gallonsValue = refuelGallonsInput ? refuelGallonsInput.value : '';
      const gallons      = Number(gallonsValue);

      if (!flightId) {
        showToast('Please select a flight to refuel.', 'error');
        return;
      }
      if (!gallonsValue || isNaN(gallons) || gallons <= 0) {
        showToast('Please enter a valid amount of gallons (> 0).', 'error');
        return;
      }

      try {
        const res = await fetch('/api/ground/refuel', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ flightId, gallonsFueled: gallons }),
        });

        const data = await res.json();

        if (data.success) {
          showToast(data.message || 'Refueling logged!', 'success');
          if (refuelGallonsInput) refuelGallonsInput.value = '';
          await loadData();
        } else {
          showToast(data.message || 'Refueling failed.', 'error');
        }
      } catch (err) {
        console.error('refuel error:', err);
        showToast('Network error — could not log refueling.', 'error');
      }
    });
  }

  // ── Logout ──────────────────────────────────────────────────────────
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();

      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'same-origin',
        });
      } catch (err) {
        console.error('Logout error:', err);
      }

      window.location.href = '/login';
    });
  }

  // ── Initial load & auto-refresh ─────────────────────────────────────
  loadData();
  setInterval(loadData, 30000);
});
