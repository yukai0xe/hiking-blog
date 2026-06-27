import vineFlowerRaw  from '../assets/gpx-card/vine-flower.svg?raw'
import threeLeavesRaw from '../assets/gpx-card/three-leaves.svg?raw'
import waterfallRaw   from '../assets/gpx-card/waterfall.svg?raw'
import fireTwoRaw     from '../assets/gpx-card/fire-two.svg?raw'
import starSkullRaw   from '../assets/gpx-card/star-skull.svg?raw'

export function toCurrentColor(raw: string): string {
  return raw
    .replace(/fill="#000000"/g, 'fill="currentColor"')
    .replace(/stroke="#000000"/g, 'stroke="currentColor"')
    .replace(/<svg([^>]*)\swidth="[^"]*"/, '<svg$1')
    .replace(/<svg([^>]*)\sheight="[^"]*"/, '<svg$1')
}

export const natureSvgs = {
  flower:    toCurrentColor(vineFlowerRaw),
  leaves:    toCurrentColor(threeLeavesRaw),
  waterfall: toCurrentColor(waterfallRaw),
  fire:      toCurrentColor(fireTwoRaw),
  skull:     toCurrentColor(starSkullRaw),
}

export function difficultyNature(stars?: number | null): string {
  if (!stars)     return natureSvgs.flower
  if (stars <= 2) return natureSvgs.flower
  if (stars <= 4) return natureSvgs.leaves
  if (stars <= 6) return natureSvgs.waterfall
  if (stars <= 8) return natureSvgs.fire
  return                 natureSvgs.skull
}
