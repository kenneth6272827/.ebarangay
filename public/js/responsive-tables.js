// Adds data-label attributes to table cells and applies a mobile-friendly class when screen is small
(function(){
  function applyResponsiveTables() {
    const isSmall = window.innerWidth <= 768;
    document.querySelectorAll('table').forEach(table => {
      const thead = table.querySelector('thead');
      if (!thead) return;
      const headers = Array.from(thead.querySelectorAll('th')).map(th => th.innerText.trim());
      const tbody = table.querySelector('tbody');
      if (!tbody) return;
      Array.from(tbody.querySelectorAll('tr')).forEach(row => {
        Array.from(row.querySelectorAll('td')).forEach((td, i) => {
          td.setAttribute('data-label', headers[i] || '');
        });
      });
      if (isSmall) table.classList.add('table-card'); else table.classList.remove('table-card');
    });
  }
  window.addEventListener('DOMContentLoaded', applyResponsiveTables);
  window.addEventListener('resize', () => { /* debounce small */ clearTimeout(window._rt); window._rt = setTimeout(applyResponsiveTables, 150); });
})();
