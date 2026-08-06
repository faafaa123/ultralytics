import { graphics } from '../classes/graphics';
import { createPolygonFromExtendedBounds } from './util';
import polygonClipping from 'polygon-clipping';

export interface intersection { indexI: number, indexJ: number }
interface featureGroup { indexes: number[], features: any[] }

export function segmentize(intersectingPolygons: any[], intersectionsOnly?: boolean) {

    let intersections: intersection[] = findIntersections(intersectingPolygons)

    if (intersectionsOnly) return intersections

    let groups = group(intersections, intersectingPolygons.length)

    // console.log(groups)

    // let featureGroups: featureGroup[] = groups.map(indexes => ({
    //     indexes,
    //     features: indexes.map(index => highways[index])
    // }))

    // console.log('intersections', intersections)
    // console.log('groups', featureGroups)

    return groups

}

function findIntersections(intersectingPolygons: any[]) {

    let intersections: intersection[] = []

    for (let i = 0; i < intersectingPolygons.length; i++) {

        for (let j = i + 1; j < intersectingPolygons.length; j++) {

            let poly1 = intersectingPolygons[i]

            let poly2 = intersectingPolygons[j]

            const intersectionResult = polygonClipping.intersection(poly1, poly2);

            if (!intersectionIsEmpty(intersectionResult)) {
                intersections.push({ indexI: i, indexJ: j })
            }

        }

    }

    return intersections

}

function group(intersections: intersection[], itemCount: number) {

    const adjacency = new Map<number, Set<number>>()

    for (let i = 0; i < itemCount; i++) {
        adjacency.set(i, new Set())
    }

    for (const { indexI, indexJ } of intersections) {
        adjacency.get(indexI)?.add(indexJ)
        adjacency.get(indexJ)?.add(indexI)
    }

    const visited = new Set<number>()
    const groups: number[][] = []

    for (let origin = 0; origin < itemCount; origin++) {
        if (visited.has(origin)) {
            continue
        }

        const stack = [origin]
        const component: number[] = []
        visited.add(origin)

        while (stack.length > 0) {
            const node = stack.pop()!
            component.push(node)

            const neighbors = adjacency.get(node)
            if (!neighbors) {
                continue
            }

            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor)
                    stack.push(neighbor)
                }
            }
        }

        groups.push(component.sort((a, b) => a - b))
    }

    return groups.sort((a, b) => b.length - a.length)

}

export function intersectionIsEmpty(result: any): boolean {
    if (!Array.isArray(result) || result.length === 0) return true;

    for (const poly of result) {
        if (!Array.isArray(poly) || poly.length === 0) continue;

        for (const ring of poly) {
            if (Array.isArray(ring) && ring.length > 0) {
                return false; // gültiges Polygon gefunden
            }
        }
    }

    return true; // alle leer
}