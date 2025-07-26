// Only keep fetchAndDisplayRikishi for fixed basho/day usage
async function fetchAndDisplayRikishi(bashoSelect, daySelect, rikishiContainer, options = {}) {
    const basho = bashoSelect.value;
    const day = daySelect.value;
    rikishiContainer.innerHTML = 'Loading...';
    try {
        const url = `https://sumo-api.com/api/basho/${basho}/torikumi/makuuchi/${day}`;
        const fetchOptions = options.headers ? { headers: options.headers } : {};
        const resp = await fetch(url, fetchOptions);
        if (!resp.ok) {
            throw new Error(`API returned status ${resp.status}`);
        }
        let data;
        try {
            data = await resp.json();
        } catch (jsonErr) {
            throw new Error('Invalid JSON from API');
        }
        if (!data || !Array.isArray(data.torikumi)) {
            rikishiContainer.innerHTML = '<p>No bout data available for this basho/day.</p>';
            return;
        }
        const bouts = data.torikumi;
        // Sort bouts: top ranks (Yokozuna, Ozeki, Sekiwake, Komusubi) first
        const rankOrder = [
            'Yokozuna', 'Ozeki', 'Sekiwake', 'Komusubi',
            'Y', 'O', 'S', 'K' // fallback for abbreviated
        ];
        function getRankIndex(rank) {
            if (!rank) return 100;
            // Try full name first
            const idx = rankOrder.findIndex(r => rank.startsWith(r));
            if (idx !== -1) return idx;
            // Try initial letter fallback
            const initial = rank[0];
            const abbrIdx = rankOrder.findIndex(r => r.length === 1 && r === initial);
            if (abbrIdx !== -1) return abbrIdx;
            return 99;
        }
        bouts.sort((a, b) => {
            // Find the highest rank in each bout
            const aRanks = [a.eastRank, a.westRank].map(getRankIndex);
            const bRanks = [b.eastRank, b.westRank].map(getRankIndex);
            const aMin = Math.min(...aRanks);
            const bMin = Math.min(...bRanks);
            if (aMin !== bMin) return aMin - bMin;
            // If same, keep original order
            return 0;
        });
        if (bouts.length === 0) {
            rikishiContainer.innerHTML = '<p>No top division matches found for this day.</p>';
            return;
        }
        // Collect winners
        const winners = bouts.map(bout => {
            if (bout.winnerId === bout.eastId) return bout.eastShikona || '';
            if (bout.winnerId === bout.westId) return bout.westShikona || '';
            return bout.winnerEn || '';
        }).filter(Boolean);
        let winnerRow = '';
        if (winners.length > 0) {
            winnerRow = `<div><strong>Winners:</strong> ${winners.map(w => `<b>${w}</b>`).join(', ')}</div>`;
        }
        let html = '<table class="rikishi-table"><thead><tr>' +
            '<th>East Rikishi</th><th>East Rank</th><th>West Rikishi</th><th>West Rank</th><th>Winner</th><th>Kimarite</th>' +
            '</tr></thead><tbody>';
        bouts.forEach(bout => {
            let winnerShikona = '';
            if (bout.winnerId === bout.eastId) {
                winnerShikona = bout.eastShikona || '';
            } else if (bout.winnerId === bout.westId) {
                winnerShikona = bout.westShikona || '';
            } else {
                winnerShikona = bout.winnerEn || '';
            }
            html += `<tr>
        <td>${bout.eastShikona || ''}</td>
        <td>${bout.eastRank || ''}</td>
        <td>${bout.westShikona || ''}</td>
        <td>${bout.westRank || ''}</td>
        <td>${winnerShikona}</td>
        <td>${bout.kimarite || ''}</td>
      </tr>`;
        });
        html += '</tbody></table>';
        rikishiContainer.innerHTML = winnerRow + html;
    } catch (e) {
        console.error('Error in fetchAndDisplayRikishi:', e);
        rikishiContainer.innerHTML = `<p>Error loading data: ${e.message}</p>`;
    }
}

// For browser usage
if (typeof window !== 'undefined') {
    window.fetchAndDisplayRikishi = fetchAndDisplayRikishi;
}

// Export for testing
if (typeof module !== 'undefined') {
    module.exports = { fetchAndDisplayRikishi };
} 