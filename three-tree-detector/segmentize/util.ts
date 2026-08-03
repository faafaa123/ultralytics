import * as THREE from 'three';
import polygonClipping, { Geom } from 'polygon-clipping';
import { createLeftVertices, createRightVertices } from '../../utils';

export function createPolygonFromExtendedBounds(extendedBounds: highwayBound[]) {

    const poly2: Geom = []

    let poly2_: any[] = [[]]

    let allLeftVertices = createLeftVertices(extendedBounds)

    for (let leftVertex of allLeftVertices) {

        poly2_[0].push(leftVertex)

    }

    let allRightVertices = createRightVertices(extendedBounds)

    for (let i = allRightVertices.length - 1; i >= 0; i--) {

        poly2_[0].push(allRightVertices[i])

    }

    poly2.push(poly2_)

    return poly2

}

export function wasAlreadyIntersectedOnce(intersections: { indexI: number, indexJ: number }[], indexI: number, indexJ: number) {

    for (let intersection of intersections) {

        if (intersection.indexI === indexI && intersection.indexJ === indexJ) {

            return true

        }

    }

    return false

}