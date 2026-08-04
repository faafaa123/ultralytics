

export function findRemainingPolygons(edges, polygonCount) {
    // Nachbarschaftsliste
    const neighbors = Array.from({ length: polygonCount }, () => new Set());

    for (const { indexI, indexJ } of edges) {
        neighbors[indexI].add(indexJ);
        neighbors[indexJ].add(indexI);
    }

    const removed = new Set();

    while (true) {
        let maxDegree = 0;
        let worstNode = -1;

        for (let i = 0; i < polygonCount; i++) {
            if (removed.has(i)) continue;

            let degree = 0;
            for (const n of neighbors[i]) {
                if (!removed.has(n))
                    degree++;
            }

            if (degree > maxDegree) {
                maxDegree = degree;
                worstNode = i;
            }
        }

        if (maxDegree === 0)
            break;

        removed.add(worstNode);
    }

    const remaining = [];
    for (let i = 0; i < polygonCount; i++) {
        if (!removed.has(i))
            remaining.push(i);
    }

    return remaining;
}