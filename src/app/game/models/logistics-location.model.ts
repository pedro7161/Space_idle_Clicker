export type LogisticsLocationKind = 'planet' | 'station';

export interface LogisticsLocation {
  planetId: string;
  kind: LogisticsLocationKind;
}

export function createPlanetLocation(planetId: string): LogisticsLocation {
  return {
    planetId,
    kind: 'planet',
  };
}

export function createStationLocation(planetId: string): LogisticsLocation {
  return {
    planetId,
    kind: 'station',
  };
}

export function encodeLogisticsLocation(location: LogisticsLocation): string {
  return `${location.kind}:${location.planetId}`;
}

export function parseLogisticsLocation(value: string): LogisticsLocation | null {
  const [kind, planetId] = value.split(':', 2);
  if (!planetId || (kind !== 'planet' && kind !== 'station')) {
    return null;
  }

  return {
    planetId,
    kind,
  };
}

export function isSameLogisticsLocation(
  left: LogisticsLocation | null | undefined,
  right: LogisticsLocation | null | undefined,
): boolean {
  return !!left
    && !!right
    && left.planetId === right.planetId
    && left.kind === right.kind;
}
