/**
 * Low-precision solar position, used to pick the default color theme from
 * whether the sun is currently above or below the user's horizon.
 *
 * Formulas are the standard low-precision equations from the Astronomical
 * Almanac ("Approximate Solar Coordinates"). Accuracy is well under a degree —
 * far more than enough to answer a yes/no day-vs-night question — while staying
 * small enough to run in the browser with no dependencies.
 */

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/**
 * Returns true when the sun is above the horizon at the given coordinates and
 * moment. Longitude is east-positive. The threshold is -0.833°, the standard
 * sunrise/sunset altitude for the sun's upper limb accounting for atmospheric
 * refraction, so the light/dark switch lines up with civil sunrise and sunset.
 */
export function isSunUp(
  latitude: number,
  longitude: number,
  date: Date = new Date()
): boolean {
  const rad = Math.PI / 180;

  // Julian date, then days since the J2000.0 epoch.
  const jd = date.getTime() / 86_400_000 + 2_440_587.5;
  const n = jd - 2_451_545.0;

  // Sun's mean longitude and mean anomaly (degrees).
  const meanLongitude = mod(280.46 + 0.985_647_4 * n, 360);
  const meanAnomaly = mod(357.528 + 0.985_600_3 * n, 360) * rad;

  // Ecliptic longitude and obliquity of the ecliptic.
  const eclipticLongitude =
    (meanLongitude +
      1.915 * Math.sin(meanAnomaly) +
      0.02 * Math.sin(2 * meanAnomaly)) *
    rad;
  const obliquity = (23.439 - 0.000_000_4 * n) * rad;

  // Sun's declination and right ascension.
  const declination = Math.asin(
    Math.sin(obliquity) * Math.sin(eclipticLongitude)
  );
  const rightAscension = Math.atan2(
    Math.cos(obliquity) * Math.sin(eclipticLongitude),
    Math.cos(eclipticLongitude)
  );

  // Greenwich mean sidereal time → local sidereal time → hour angle.
  const gmst = mod(280.460_618_37 + 360.985_647_366_29 * n, 360);
  const localSiderealTime = mod(gmst + longitude, 360) * rad;
  const hourAngle = localSiderealTime - rightAscension;

  // Solar altitude above the horizon (degrees).
  const phi = latitude * rad;
  const sinAltitude =
    Math.sin(phi) * Math.sin(declination) +
    Math.cos(phi) * Math.cos(declination) * Math.cos(hourAngle);
  const altitude = Math.asin(sinAltitude) / rad;

  return altitude > -0.833;
}
