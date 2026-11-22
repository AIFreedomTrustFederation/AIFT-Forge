# Embodied Frontier E1: mock-only pipeline

**Classification:** integration draft, not ROS 2 simulation or certified robotics safety.

This standalone Python proof models a sensor frame, a proposed motion command, a deterministic safety decision and a mock action result. It performs no I/O, motor control, ROS publication, camera capture, networking or device access. The returned speed is a simulated value only.

Run from this directory: `python -m unittest discover -v`. In a local Python execution on 2026-11-22, 15 tests passed; repository CI and exact-head verification are pending.

Acceptance: stale sensors, missing consent, e-stop, invalid heartbeat, malformed numbers, obstacle proximity and overspeed yield a zero-speed result. A confidence value cannot bypass constraints. Low model confidence is not itself a stop criterion in this prototype and needs a separate uncertainty policy.

Baseline: prior E0 gate tested 9 cases without sensor-freshness or full pipeline result. After: 15 tests, still pure Python. No latency/energy benchmark. No URDF, ROS 2 middleware, independent watchdog, authenticated capability or physical e-stop. Do not connect this module to real actuator endpoints.

Rollback: close the draft PR without merging or revert the added `experiments/embodied-frontier/e1/` directory.

Next: add a pinned ROS 2 virtual robot and mock-only topic adapter with fault injection; keep all physical effect endpoints unavailable.
