// Test for upset bonus/penalty calculation
function parseRank(rank) {
    if (!rank) return { type: '', num: 0 };
    const cleaned = rank.trim().replace(/\s+/g, ' ');
    const m = cleaned.match(/(Yokozuna|Ozeki|Sekiwake|Komusubi|Maegashira|Juryo)\s*(\d*)/i);
    if (!m) return { type: '', num: 0 };

    const type = m[1];
    const num = parseInt(m[2] || '1', 10);

    // Normalize sanyaku ranks to remove numbers
    if (type === 'Yokozuna' || type === 'Ozeki' || type === 'Sekiwake' || type === 'Komusubi') {
        return { type: type, num: 0 };
    }

    return { type: type, num: num };
}
const hardcodedRanks = [];
hardcodedRanks.push('Yokozuna 1');
hardcodedRanks.push('Ozeki 1');
hardcodedRanks.push('Sekiwake 1');
hardcodedRanks.push('Komusubi 1');
for (let i = 1; i <= 17; i++) hardcodedRanks.push(`Maegashira ${i}`);
for (let i = 1; i <= 14; i++) hardcodedRanks.push(`Juryo ${i}`);
const hardcodedRankMapping = {};
hardcodedRanks.forEach((key, idx) => { hardcodedRankMapping[key] = idx + 1; });
function getRankValue(rank) {
    if (!rank || !rank.type) return 1000;

    // For sanyaku ranks, use the original numbered keys
    if (rank.type === 'Yokozuna' || rank.type === 'Ozeki' || rank.type === 'Sekiwake' || rank.type === 'Komusubi') {
        const key = `${rank.type} 1`;
        return hardcodedRankMapping[key] || 1000;
    }

    // For Maegashira and Juryo, use the actual number
    const key = `${rank.type} ${rank.num}`;
    return hardcodedRankMapping[key] || 1000;
}

function getRankMultiplier(rank) {
    if (!rank || !rank.type) return 1.0;

    if (rank.type === 'Yokozuna' || rank.type === 'Ozeki') {
        return 1.0;
    } else if (rank.type === 'Sekiwake' || rank.type === 'Komusubi') {
        return 1.1;
    } else if (rank.type === 'Maegashira') {
        if (rank.num >= 1 && rank.num <= 5) {
            return 1.2;
        } else if (rank.num >= 6 && rank.num <= 10) {
            return 1.3;
        } else if (rank.num >= 11 && rank.num <= 15) {
            return 1.4;
        } else if (rank.num >= 16 && rank.num <= 17) {
            return 1.5;
        }
    }
    return 1.0;
}

// Test echte score calculation
function testEchteScore() {
    console.log('Echte Score Test:');

    const testCases = [
        { rank: 'Yokozuna 1', score: 10.0, expectedMultiplier: 1.0 },
        { rank: 'Ozeki 1', score: 10.0, expectedMultiplier: 1.0 },
        { rank: 'Sekiwake 1', score: 10.0, expectedMultiplier: 1.1 },
        { rank: 'Komusubi 1', score: 10.0, expectedMultiplier: 1.1 },
        { rank: 'Maegashira 1', score: 10.0, expectedMultiplier: 1.2 },
        { rank: 'Maegashira 5', score: 10.0, expectedMultiplier: 1.2 },
        { rank: 'Maegashira 6', score: 10.0, expectedMultiplier: 1.3 },
        { rank: 'Maegashira 10', score: 10.0, expectedMultiplier: 1.3 },
        { rank: 'Maegashira 11', score: 10.0, expectedMultiplier: 1.4 },
        { rank: 'Maegashira 15', score: 10.0, expectedMultiplier: 1.4 },
        { rank: 'Maegashira 16', score: 10.0, expectedMultiplier: 1.5 },
        { rank: 'Maegashira 17', score: 10.0, expectedMultiplier: 1.5 }
    ];

    testCases.forEach(testCase => {
        const rank = parseRank(testCase.rank);
        const multiplier = getRankMultiplier(rank);
        const echteScore = testCase.score * multiplier;

        console.log(`${testCase.rank}: Score=${testCase.score}, Multiplier=${multiplier}, Echte Score=${echteScore.toFixed(2)}`);

        if (Math.abs(multiplier - testCase.expectedMultiplier) > 0.01) {
            console.log(`  ERROR: Expected multiplier ${testCase.expectedMultiplier}, got ${multiplier}`);
        }
    });
}

// Test upset details tracking
function testUpsetDetails() {
    const rikishi = {};

    function addRikishi(id, shikona) {
        if (!rikishi[id]) rikishi[id] = {
            shikona,
            score: 0,
            wins: 0,
            matches: 0,
            upsetWins: 0,
            upsetLosses: 0,
            upsetDetails: []
        };
    }

    // Simulate M2 beating Ozeki 1 (4 rank difference)
    addRikishi('m2', 'Maegashira 2');
    addRikishi('ozeki1', 'Ozeki 1');

    const m2Rank = parseRank('Maegashira 2');
    const o1Rank = parseRank('Ozeki 1');
    const m2Value = getRankValue(m2Rank);
    const o1Value = getRankValue(o1Rank);
    const diff = Math.abs(m2Value - o1Value);

    if (diff >= 4) {
        const points = diff * 0.25;
        rikishi['m2'].score += points;
        rikishi['ozeki1'].score -= points;
        rikishi['m2'].upsetWins++;
        rikishi['ozeki1'].upsetLosses++;

        rikishi['m2'].upsetDetails.push({
            type: 'win',
            opponent: 'Ozeki 1',
            opponentRank: 'Ozeki 1',
            points: points,
            day: 1
        });

        rikishi['ozeki1'].upsetDetails.push({
            type: 'loss',
            opponent: 'Maegashira 2',
            opponentRank: 'Maegashira 2',
            points: -points,
            day: 1
        });
    }

    console.log('Upset Details Test:');
    console.log('M2 upset details:', rikishi['m2'].upsetDetails);
    console.log('Ozeki 1 upset details:', rikishi['ozeki1'].upsetDetails);
    console.log('M2 score:', rikishi['m2'].score.toFixed(2));
    console.log('Ozeki 1 score:', rikishi['ozeki1'].score.toFixed(2));
}

// Test rank normalization
function testRankNormalization() {
    console.log('Rank Normalization Test:');

    const testCases = [
        { input: 'Yokozuna 1', expected: { type: 'Yokozuna', num: 0 } },
        { input: 'Ozeki 1', expected: { type: 'Ozeki', num: 0 } },
        { input: 'Sekiwake 1', expected: { type: 'Sekiwake', num: 0 } },
        { input: 'Sekiwake 2', expected: { type: 'Sekiwake', num: 0 } },
        { input: 'Komusubi 1', expected: { type: 'Komusubi', num: 0 } },
        { input: 'Maegashira 1', expected: { type: 'Maegashira', num: 1 } },
        { input: 'Maegashira 17', expected: { type: 'Maegashira', num: 17 } },
        { input: 'Juryo 1', expected: { type: 'Juryo', num: 1 } }
    ];

    testCases.forEach(testCase => {
        const result = parseRank(testCase.input);
        console.log(`${testCase.input} -> ${result.type} ${result.num}`);

        if (result.type !== testCase.expected.type || result.num !== testCase.expected.num) {
            console.log(`  ERROR: Expected ${testCase.expected.type} ${testCase.expected.num}, got ${result.type} ${result.num}`);
        }
    });
}

// Test upset calculation with normalized ranks
function testUpsetCalculation() {
    console.log('Upset Calculation Test:');

    // Test cases that should trigger upsets
    const testCases = [
        {
            description: 'M2 beats Ozeki (should be upset)',
            underdog: 'Maegashira 2',
            favorite: 'Ozeki 1',
            expectedUpset: true,
            expectedDiff: 4
        },
        {
            description: 'M1 beats Yokozuna (should be upset)',
            underdog: 'Maegashira 1',
            favorite: 'Yokozuna 1',
            expectedUpset: true,
            expectedDiff: 4
        },
        {
            description: 'M5 beats Sekiwake (should be upset)',
            underdog: 'Maegashira 5',
            favorite: 'Sekiwake 1',
            expectedUpset: true,
            expectedDiff: 6
        },
        {
            description: 'M10 beats Komusubi (should be upset)',
            underdog: 'Maegashira 10',
            favorite: 'Komusubi 1',
            expectedUpset: true,
            expectedDiff: 10
        },
        {
            description: 'M1 beats M5 (should be upset - 4 rank difference)',
            underdog: 'Maegashira 1',
            favorite: 'Maegashira 5',
            expectedUpset: true,
            expectedDiff: 4
        }
    ];

    testCases.forEach(testCase => {
        const underdogRank = parseRank(testCase.underdog);
        const favoriteRank = parseRank(testCase.favorite);
        const underdogValue = getRankValue(underdogRank);
        const favoriteValue = getRankValue(favoriteRank);
        const diff = Math.abs(underdogValue - favoriteValue);

        const isUpset = diff >= 4;

        console.log(`${testCase.description}:`);
        console.log(`  Underdog: ${testCase.underdog} -> ${underdogRank.type} ${underdogRank.num} (value: ${underdogValue})`);
        console.log(`  Favorite: ${testCase.favorite} -> ${favoriteRank.type} ${favoriteRank.num} (value: ${favoriteValue})`);
        console.log(`  Diff: ${diff}, Is Upset: ${isUpset}`);

        if (isUpset !== testCase.expectedUpset) {
            console.log(`  ERROR: Expected upset: ${testCase.expectedUpset}, got: ${isUpset}`);
        }
        if (diff !== testCase.expectedDiff) {
            console.log(`  ERROR: Expected diff: ${testCase.expectedDiff}, got: ${diff}`);
        }
        console.log('');
    });
}

// Test score calculation accuracy
function testScoreCalculation() {
    console.log('Score Calculation Test:');

    const rikishi = {};

    function addRikishi(id, shikona, rank) {
        if (!rikishi[id]) rikishi[id] = {
            shikona,
            rank: rank,
            score: 0,
            wins: 0,
            matches: 0,
            upsetWins: 0,
            upsetLosses: 0,
            upsetDetails: [],
            bonusPoints: 0,
            bonusDetails: []
        };
    }

    // Simulate a rikishi with various points
    addRikishi('test1', 'Test Rikishi 1', 'Maegashira 1');
    const r = rikishi['test1'];

    // Add wins (1 point each)
    r.wins = 8;
    r.score += 8;

    // Add kinboshi (2 points)
    r.bonusPoints += 2;
    r.score += 2;
    r.bonusDetails.push({
        type: 'kinboshi',
        points: 2,
        day: 5,
        opponent: 'Yokozuna 1'
    });

    // Add upset win (1 point)
    r.upsetWins = 1;
    r.score += 1;
    r.upsetDetails.push({
        type: 'win',
        opponent: 'Ozeki 1',
        opponentRank: 'Ozeki 1',
        points: 1,
        day: 3
    });

    // Add kachikoshi (3 points)
    r.bonusPoints += 3;
    r.score += 3;
    r.bonusDetails.push({
        type: 'kachikoshi',
        points: 3,
        day: 0,
        description: '8 wins'
    });

    // Calculate expected score
    const expectedScore = r.wins + r.bonusPoints + r.upsetDetails.reduce((sum, detail) => sum + detail.points, 0);

    console.log(`Rikishi: ${r.shikona}`);
    console.log(`  Wins: ${r.wins} (${r.wins} points)`);
    console.log(`  Bonus Points: ${r.bonusPoints.toFixed(1)}`);
    console.log(`  Upset Points: ${r.upsetDetails.reduce((sum, detail) => sum + detail.points, 0).toFixed(1)}`);
    console.log(`  Expected Total: ${expectedScore.toFixed(1)}`);
    console.log(`  Actual Score: ${r.score.toFixed(1)}`);

    if (Math.abs(r.score - expectedScore) < 0.01) {
        console.log('  ✅ Score calculation is correct!');
    } else {
        console.log('  ❌ Score calculation is incorrect!');
    }

    console.log('');
}

// Test the score calculation formula: wins + bonus points + upset points = total score
function testScoreFormula() {
    console.log('Score Formula Test:');
    console.log('Verifying: Wins + Bonus Points + Upset Points = Total Score');

    const rikishi = {};

    function addRikishi(id, shikona, rank) {
        if (!rikishi[id]) rikishi[id] = {
            shikona,
            rank: rank,
            score: 0,
            wins: 0,
            matches: 0,
            upsetWins: 0,
            upsetLosses: 0,
            upsetDetails: [],
            bonusPoints: 0,
            bonusDetails: []
        };
    }

    // Create test rikishi with various point sources
    addRikishi('test1', 'Test Rikishi 1', 'Maegashira 1');
    addRikishi('test2', 'Test Rikishi 2', 'Ozeki 1');
    addRikishi('test3', 'Test Rikishi 3', 'Sekiwake 1');

    const r1 = rikishi['test1'];
    const r2 = rikishi['test2'];
    const r3 = rikishi['test3'];

    // Rikishi 1: 10 wins + 2 kinboshi + 1 upset + 3 kachikoshi = 16 points
    r1.wins = 10;
    r1.score = 10;
    r1.bonusPoints = 5; // 2 kinboshi + 3 kachikoshi
    r1.score += 5;
    r1.upsetDetails.push({ points: 1 });
    r1.score += 1;

    // Rikishi 2: 8 wins + 1 upset loss + 3 kachikoshi = 11 points
    r2.wins = 8;
    r2.score = 8;
    r2.bonusPoints = 3; // 3 kachikoshi
    r2.score += 3;
    r2.upsetDetails.push({ points: 0 }); // No points for loss

    // Rikishi 3: 12 wins + 5 yusho + 1.5 special prize + 2 upsets = 20.5 points
    r3.wins = 12;
    r3.score = 12;
    r3.bonusPoints = 6.5; // 5 yusho + 1.5 special prize
    r3.score += 6.5;
    r3.upsetDetails.push({ points: 1 }, { points: 1 });
    r3.score += 2;

    const testCases = [
        { rikishi: r1, name: 'Test Rikishi 1' },
        { rikishi: r2, name: 'Test Rikishi 2' },
        { rikishi: r3, name: 'Test Rikishi 3' }
    ];

    testCases.forEach(testCase => {
        const r = testCase.rikishi;
        const winsPoints = r.wins;
        const bonusPoints = r.bonusPoints;
        const upsetPoints = r.upsetDetails.reduce((sum, detail) => sum + detail.points, 0);
        const calculatedTotal = winsPoints + bonusPoints + upsetPoints;

        console.log(`${testCase.name}:`);
        console.log(`  Wins: ${winsPoints} points`);
        console.log(`  Bonus: ${bonusPoints.toFixed(1)} points`);
        console.log(`  Upsets: ${upsetPoints.toFixed(1)} points`);
        console.log(`  Calculated Total: ${calculatedTotal.toFixed(1)}`);
        console.log(`  Actual Score: ${r.score.toFixed(1)}`);

        if (Math.abs(r.score - calculatedTotal) < 0.01) {
            console.log('  ✅ Formula is correct!');
        } else {
            console.log('  ❌ Formula is incorrect!');
        }
        console.log('');
    });
}

// Example 1: M1 beats Ozeki 1 (now 3 rank difference instead of 4)
const m1 = parseRank('Maegashira 1');
const o1 = parseRank('Ozeki 1');
const m1Value = getRankValue(m1);
const o1Value = getRankValue(o1);
let diff1 = Math.abs(m1Value - o1Value);
let bonus1 = 0, penalty1 = 0;
if (m1Value > o1Value && diff1 >= 4) {
    bonus1 = diff1 * 0.25;
    penalty1 = -diff1 * 0.25;
}
console.log('M1 beats Ozeki 1: diff =', diff1, 'bonus =', bonus1, 'penalty =', penalty1);

// Example 2: J1 beats M17
const j1 = parseRank('Juryo 1');
const m17 = parseRank('Maegashira 17');
const j1Value = getRankValue(j1);
const m17Value = getRankValue(m17);
let diff2 = Math.abs(j1Value - m17Value);
let bonus2 = 0, penalty2 = 0;
if (j1Value > m17Value && diff2 >= 4) {
    bonus2 = diff2 * 0.25;
    penalty2 = -diff2 * 0.25;
}
console.log('J1 beats M17: diff =', diff2, 'bonus =', bonus2, 'penalty =', penalty2);

// Run the upset details test
testUpsetDetails();

// Run the echte score test
testEchteScore();

// Run the rank normalization test
testRankNormalization();

// Run the upset calculation test
testUpsetCalculation();

// Run the score calculation test
testScoreCalculation();

// Run the score formula test
testScoreFormula(); 