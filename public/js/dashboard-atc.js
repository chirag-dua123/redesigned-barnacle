/**
 * dashboard-atc.js — AeroCommand Air Traffic Control client
 *
 * Handles:
 *   • Loading flight data        (GET  /api/traffic/flights)
 *   • Updating flight status     (PATCH /api/traffic/status/:id)
 *   • Logout                     (POST /api/auth/logout)
 *   • Auto-refresh every 30 s
 *   • Toast notifications
 */

document.addEventListener('DOMContentLoaded', () => {
  // ── DOM References ──────────────────────────────────────────────────
  const flightsTbody     = document.getElementById('flights-tbody');
  const flightSelect     = document.getElementById('flight-select');
  const statusSelect     = document.getElementById('status-select');
  const updateStatusBtn  = document.getElementById('update-status-btn');
  const logoutBtn        = document.getElementById('logout-btn');
  const toastContainer   = document.getElementById('toast-container');

  // ── Helpers ─────────────────────────────────────────────────────────

  /**
   * Return the appropriate CSS pill class string for a flight status.
   * @param {string} status
   * @returns {string}
   */
  function getPillClass(status) {
    switch (status) {
      case 'boarding':   return 'pill pill-warn';
      case 'departed':   return 'pill pill-info';
      case 'arrived':    return 'pill pill-success';
      case 'cancelled':  return 'pill pill-danger';
      case 'scheduled':
      default:           return 'pill';
    }
  }

  /**
   * Format an ISO date string into a short, readable time.
   * @param {string} isoStr
   * @returns {string}
   */
  function formatETD(isoStr) {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr; // fallback if date parsing fails
    return d.toLocaleString('en-US', {
      month: 'short',
      day:   'numeric',
      hour:  '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Display a temporary toast notification.
   * @param {string} message — text to display
   * @param {'success'|'error'|'info'} type — visual style
   */
  function showToast(message, type = 'info') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  // ── Flight loading & rendering ──────────────────────────────────────

  /**
   * Fetch all flights from the API and render them into the table
   * and the flight-select dropdown.
   */
  async function loadFlights() {
    try {
      const res = await fetch('/api/traffic/flights', {
        credentials: 'same-origin',
      });
      const data = await res.json();

      if (!data.success) {
        showToast(data.message || 'Failed to load flights.', 'error');
        return;
      }

      const flights = data.flights || [];

      // ── Render table rows ──────────────────────────────────────────
      if (flightsTbody) {
        flightsTbody.innerHTML = flights.length
          ? flights.map((f) => `
              <tr>
                <td>${escapeHtml(f.flightNumber)}</td>
                <td>${escapeHtml(f.origin)} → ${escapeHtml(f.destination)}</td>
                <td><span class="${getPillClass(f.status)}">${capitalize(f.status)}</span></td>
                <td>${formatETD(f.etd)}</td>
              </tr>
            `).join('')
          : '<tr><td colspan="4" style="text-align:center">No flights found</td></tr>';
      }

      // ── Populate flight selector ───────────────────────────────────
      if (flightSelect) {
        // Preserve a placeholder option at the top
        flightSelect.innerHTML = '<option value="">— select flight —</option>'
          + flights.map((f) =>
              `<option value="${f._id}">${escapeHtml(f.flightNumber)}</option>`
            ).join('');
      }
    } catch (err) {
      console.error('loadFlights error:', err);
      showToast('Network error — could not load flights.', 'error');
    }
  }

  // ── Update flight status ────────────────────────────────────────────
  if (updateStatusBtn) {
    updateStatusBtn.addEventListener('click', async () => {
      const flightId = flightSelect ? flightSelect.value : '';
      const status   = statusSelect ? statusSelect.value : '';

      if (!flightId) {
        showToast('Please select a flight first.', 'error');
        return;
      }
      if (!status) {
        showToast('Please select a status.', 'error');
        return;
      }

      try {
        const res = await fetch(`/api/traffic/status/${flightId}`, {
          method: 'PATCH',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });

        const data = await res.json();

        if (data.success) {
          showToast(data.message || 'Status updated!', 'success');
          await loadFlights(); // refresh the board
        } else {
          showToast(data.message || 'Update failed.', 'error');
        }
      } catch (err) {
        console.error('updateStatus error:', err);
        showToast('Network error — could not update status.', 'error');
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

  // ── Utility ─────────────────────────────────────────────────────────

  /** Basic HTML-escape to prevent XSS in dynamic content. */
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

  // ── Initial load & auto-refresh ─────────────────────────────────────
  loadFlights();
  setInterval(loadFlights, 30000);
});
