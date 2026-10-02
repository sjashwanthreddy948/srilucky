export type Pose = {
  x: number;
  y: number;
  scale: number;
  rx: number;
  ry: number;
  rz: number;
  camera: number;
  light: number;
  opacity: number;
};
// One uninterrupted timeline. Coordinates are viewport-relative, rotations are radians.
export const desktopPoses: Pose[] = [
  {
    x: 0,
    y: 0,
    scale: 1,
    rx: 0,
    ry: 0,
    rz: 0,
    camera: 10,
    light: 1,
    opacity: 1,
  },
  {
    x: 0.27,
    y: 0.1,
    scale: 0.84,
    rx: 0.2,
    ry: 0.48,
    rz: 0.22,
    camera: 10.3,
    light: 1,
    opacity: 1,
  },
  {
    x: -0.23,
    y: 0.08,
    scale: 0.8,
    rx: -0.1,
    ry: -0.74,
    rz: -0.3,
    camera: 10,
    light: 1.05,
    opacity: 1,
  },
  {
    x: 0.19,
    y: 0.05,
    scale: 0.92,
    rx: 0.15,
    ry: 1.38,
    rz: 0.2,
    camera: 9.7,
    light: 1.1,
    opacity: 1,
  },
  {
    x: -0.01,
    y: 0.08,
    scale: 2.1,
    rx: -0.05,
    ry: 0.05,
    rz: -0.12,
    camera: 9.2,
    light: 1,
    opacity: 1,
  },
  {
    x: 0.23,
    y: 0.07,
    scale: 0.92,
    rx: 0.3,
    ry: -0.45,
    rz: 0.55,
    camera: 10,
    light: 1.15,
    opacity: 1,
  },
  {
    x: 0.22,
    y: 0.04,
    scale: 0.94,
    rx: 0.15,
    ry: 0.22,
    rz: -0.12,
    camera: 10.2,
    light: 1,
    opacity: 1,
  },
  {
    x: -0.21,
    y: 0.13,
    scale: 0.72,
    rx: 0.1,
    ry: -0.6,
    rz: -0.24,
    camera: 10,
    light: 1.05,
    opacity: 1,
  },
  {
    x: 0,
    y: 0.02,
    scale: 0.87,
    rx: 0.08,
    ry: -0.22,
    rz: 0.03,
    camera: 10,
    light: 1.9,
    opacity: 1,
  },
];
export const mobilePoses: Pose[] = desktopPoses.map((p, i) => ({
  ...p,
  x: [0, 0.06, -0.06, 0.04, 0, 0.07, 0, -0.06, 0][i],
  y: [0, 0.08, 0.06, 0.04, 0.05, 0.08, 0.06, -0.06, 0.04][i],
  scale: [1, 0.88, 0.85, 0.92, 1.65, 0.86, 0.86, 0.88, 0.86][i],
  rx: p.rx * 0.5,
  ry: p.ry * 0.6,
  rz: p.rz * 0.6,
}));
export function interpolatePose(a: Pose, b: Pose, t: number): Pose {
  const u = t * t * (3 - 2 * t);
  return Object.fromEntries(
    Object.keys(a).map((k) => [
      k,
      a[k as keyof Pose] + (b[k as keyof Pose] - a[k as keyof Pose]) * u,
    ]),
  ) as Pose;
}
export function samplePose(anchors: number[], scroll: number, mobile: boolean) {
  const poses = mobile ? mobilePoses : desktopPoses;
  let index = 0;
  while (index < anchors.length - 2 && scroll > anchors[index + 1]) index++;
  const a = anchors[index] || 0,
    b = anchors[index + 1] || a + 1;
  return interpolatePose(
    poses[index],
    poses[Math.min(index + 1, poses.length - 1)],
    Math.max(0, Math.min(1, (scroll - a) / (b - a))),
  );
}
