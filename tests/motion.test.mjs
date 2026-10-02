import { test } from "node:test";
import assert from "node:assert/strict";
import { samplePose, desktopPoses, mobilePoses } from "../src/motion.ts";
const anchors = [0, 1000, 2200, 3400, 4700, 6100, 7400, 8700, 10000];
test("frame journey has no transform reset at any scene boundary", () => {
  for (const mobile of [false, true])
    for (const anchor of anchors.slice(1, -1)) {
      const before = samplePose(anchors, anchor - 0.1, mobile),
        after = samplePose(anchors, anchor + 0.1, mobile);
      for (const key of Object.keys(before))
        assert.ok(
          Math.abs(after[key] - before[key]) < 0.001,
          `Discontinuity in ${key} at ${anchor}`,
        );
    }
});
test("journey is reversible, finite, visibly travelling and settles at center", () => {
  for (const mobile of [false, true]) {
    let previous = null;
    let movement = 0;
    for (let y = 0; y <= 10000; y += 10) {
      const pose = samplePose(anchors, y, mobile);
      assert.ok(Object.values(pose).every(Number.isFinite));
      if (previous)
        movement +=
          Math.abs(pose.x - previous.x) + Math.abs(pose.ry - previous.ry);
      previous = pose;
    }
    assert.ok(movement > 1);
    assert.equal(samplePose(anchors, 10000, mobile).x, 0);
    assert.deepEqual(
      samplePose(anchors, 2500, mobile),
      samplePose(anchors, 2500, mobile),
    );
  }
  assert.ok(desktopPoses[4].scale > 2);
  assert.ok(mobilePoses[4].scale < desktopPoses[4].scale);
});
