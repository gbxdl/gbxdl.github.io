const fetch = require('node-fetch');

describe('sumo-api.com winner logic', () => {
    it('fetches Hatsu 2024 Day 1 and checks winnerId/shikona logic', async () => {
        const resp = await fetch('https://sumo-api.com/api/basho/202401/torikumi/makuuchi/1');
        expect(resp.ok).toBe(true);
        const data = await resp.json();
        expect(data).toHaveProperty('torikumi');
        expect(Array.isArray(data.torikumi)).toBe(true);
        expect(data.torikumi.length).toBeGreaterThan(0);
        // Check at least one bout has a winnerId matching eastId or westId, and shikona matches
        const found = data.torikumi.some(bout => {
            if (bout.winnerId === bout.eastId) {
                return bout.winnerEn === bout.eastShikona;
            } else if (bout.winnerId === bout.westId) {
                return bout.winnerEn === bout.westShikona;
            }
            return false;
        });
        expect(found).toBe(true);
    });
}); 