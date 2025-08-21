export const prettyKW = (w) =>
  w == null ? '--' : `${(Number(w) / 1000).toFixed(2)} kW`;
export const prettyV = (v) => (v == null ? '--' : `${Number(v).toFixed(1)} V`);
export const prettyA = (a) => (a == null ? '--' : `${Number(a).toFixed(2)} A`);
