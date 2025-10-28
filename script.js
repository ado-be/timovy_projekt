(async function () {
    // Nastav „Posledná aktualizácia“ na dnešok (ak chceš ručne, prepis v HTML)
    const today = new Date();
    const fmt = (d) => new Date(d).toLocaleDateString('sk-SK', { year:'numeric', month:'2-digit', day:'2-digit' });
    const lastUpdatedEl = document.getElementById('lastUpdated');
    if (lastUpdatedEl) lastUpdatedEl.textContent = `Aktualizované: ${fmt(today)}`;

    try {
        const res = await fetch('zapisnice/list.json', { cache: 'no-store' });
        if (!res.ok) throw new Error('list.json not found');
        const items = await res.json();

        ///sort dates
        items.sort((a,b)=> new Date(b.date) - new Date(a.date));

        // Vyplniť „Výsledné zápisnice“
        const body = document.getElementById('resultsList');
        if (body) {
            body.innerHTML = items.map(x => {
                const publishedOk = (() => {
                    if (!x.published || !x.nextMeeting) return false;
                    const p = new Date(x.published);
                    const n = new Date(x.nextMeeting);
                    const ONE = 24 * 60 * 60 * 1000;
                    return (n - p) >= ONE; // min. 1 deň pred ďalším stretnutím
                })();
                const badge = x.published
                    ? `<span class="badge ${publishedOk ? 'ok' : 'late'}">${publishedOk ? 'OK' : 'NESKORO'}</span>`
                    : `<span class="badge late">NEZVEREJNENÉ</span>`;
                const link = x.file ? `zapisnice/${x.file}` : '#';
                return `
          <li>
            <span class="min-date">${fmt(x.date)}</span>
            <a class="min-link" href="${link}">${x.title || 'Zápisnica'}</a>
            ${badge}
          </li>`;
            }).join('');
        }

        // „Plánované zápisnice“ – zober najbližšie (z poslednej položky berieme nextMeeting)
        const planBox = document.getElementById('planBox');
        if (planBox) {
            const upcoming = items.find(Boolean); // po zoradení je to najnovší záznam
            if (upcoming?.nextMeeting) {
                const next = new Date(upcoming.nextMeeting);
                const deadline = new Date(next.getTime() - 24 * 60 * 60 * 1000);
                planBox.innerHTML = `
          <div class="plan-grid">
            <div class="plan-item"><strong>Najbližšie stretnutie:</strong> ${fmt(next)}</div>
            <div class="plan-item"><strong>Deadline na zverejnenie:</strong> ${fmt(deadline)} (min. deň vopred)</div>
          </div>
        `;
            }
        }

    } catch (e) {
        // Bez JSONu nech zostane aspoň statické UI
        console.warn('Nepodarilo sa načítať list.json:', e.message);
    }
})();
