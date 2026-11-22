# Embodied Frontier E1: mock-only pipeline

**Classification:** integration draft, not ROS 2 simulation or certified robotics safety.

This standalone Python proof models a sensor frame, a proposed motion command, a deterministic safety decision and a mock action result. It performs no I/O, motor control, ROS publication, camera capture, networking or device access. The returned speed is a simulated value only.

Run from this directory: `python -m unittest discover -v`. In a local Python execution on 2026-11-22, 15 tests passed; repository CI and exact-head verification are pending.

Acceptance: stale sensors, missing consent, e-stop, invalid heartbeat, malformed numbers, obstacle proximity and overspeed yield a zero-speed result. A confidence value cannot bypass constraints. Low model confidence is not itself a stop criterion in this prototype and needs a separate uncertainty policy.

Baseline: prior E0 gate tested 9 cases without sensor-freshness or full pipeline result. After: 15 tests, still pure Python. No latency/energy benchmark. No URDF, ROS 2 middleware, independent watchdog, authenticated capability or physical e-stop. Do not connect this module to real actuator endpoints.

Rollback: close the draft PR without merging or revert the added `experiments/embodied-frontier/e1/` directory.

Next: add a pinned ROS 2 virtual robot and mock-only topic adapter with fault injection; keep all physical effect endpoints unavailable.

## E2 mock-only safety hardening (draft)

E2 adds strict fail-closed rejection for missing or wrong-type sensor frames and command requests, validates the mock transport timeout, and rejects absent/incomplete watchdog observations without uncaught attribute errors. These changes close identified exception paths; they **do not** establish safety certification.

`pipeline.py` connects the existing in-memory transport/gate/watchdog to a simulated command path. `submit(envelope, now_ms)` returns a simulated result, and `tick(now_ms)` models watchdog polling when commands cease. **Polling is explicit**, not an independently scheduled process: this is neither a real-time failsafe nor a physical control system. The mock reset requires `operator_confirmed=True`, then returns zero and requires a new, valid sequence, consent, and heartbeat. The flag is not authenticated operator identity.

Run E1 and E2 together from this directory with `python -m unittest discover -p 'test_*.py' -v`. E2's new tests include missing nested fields, stop latching, replay, delayed transport, clock rollback, consent/reset behavior, emergency-stop priority, silent-command timeout, and 75 deterministic randomized invalid-input probes. The original 15-test baseline was extended to 37 E1 tests before E2; the total is validated by CI, not by a claim in this document.

The GitHub mock-only workflow now checks out the **actual PR head SHA** (or push SHA), asserts exact checkout identity and a clean tree, and runs the complete E1/E2 Python test suite. A separate Forge Local QA workflow retains its repository-wide verification. No ROS 2 adapter, hardware, motors, sockets, cameras, physical e-stop, attested authorization, or deployment is included. Do **not** connect this experiment to real actuators.

Review gate: inspect fail-closed semantics, state transition and reset authorization model, exact-head CI and Forge Local QA before any future scope promotion. Keep this PR draft and do not merge or deploy without explicit authorization.
