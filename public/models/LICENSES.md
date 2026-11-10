# Robot models in this folder

These are simplified versions of the robots' official 3D models, converted for the web by
[`scripts/robot-models.mjs`](../../scripts/robot-models.mjs) (`npm run models -- <dir with the
three source clones>`). The conversion keeps each robot's own parts, colours and joints, merges
and simplifies the meshes, and compresses them. They are modified versions of the originals.

| File | Robot | Source (commit) | Licence |
|---|---|---|---|
| `microduck.glb` | Microduck | [pollen-robotics/microduck_rl](https://github.com/pollen-robotics/microduck_rl) (`develop`, 0daab16) | Meshes © Pollen Robotics, [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). This adaptation is shared under the same licence. Robot description: Apache-2.0. |
| `open-duck-mini.glb` | Open Duck Mini v2 | [apirrone/Open_Duck_Mini](https://github.com/apirrone/Open_Duck_Mini) (`v2`, b23317a) | [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0), © Antoine Pirrone and contributors |
| `rebot-arm.glb` | reBot Arm B601-DM | [Seeed-Projects/reBot-DevArm](https://github.com/Seeed-Projects/reBot-DevArm) (`main`, d9d28a0), `Rebot_Arm_description/DM` | [CERN-OHL-W-2.0](https://cern-ohl.web.cern.ch/), © Seeed Studio. Modified: meshes merged per part and colour, simplified and compressed. |

The site is a personal, non-commercial wedding website. The Star Arm 102 leader arm in the room
is a stylized stand-in drawn in code; no public model of it was available.
