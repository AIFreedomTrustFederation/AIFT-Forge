# Embodied Frontier E1: mock-only pipeline

**Classification:** Python-only mock simulation; not ROS 2 simulation, real-time supervision, or certified robotics safety.

The experiment models sensor input, proposed commands, deterministic gate decisions, a mock-only transport and a polled command-silence watchdog. It performs no motor control, ROS publication, camera capture, network access or device I/O. All reported motion is a simulated value.

Run from this directory: `python -m unittest discover -p 'test_*.py' -v`. The historical E0 baseline covered 9 tests; E1 initially covered 15, then added transport and watchdog regressions for a reported inventory of 37. The historical pre-merge E1 workflow and Forge Local QA passed for PR #18; that is **not** proof of a test run on the actual main merge commit. See [PR #18](https://github.com/AIFreedomTrustFederation/AIFT-Forge/pull/18) and [pre-merge E1 run](https://github.com/AIFreedomTrustFederation/AIFT-Forge/actions/runs/45028268749).

**Verification gap:** Merge commit `e4921dd12aa002a2b21f77e99e0400e0a2283f58` was not independently verified by the dedicated E1 workflow after merge. The workflow runs on changes to `main` and supports manual dispatch for the selected revision. A successful run establishes evidence only for its recorded checkout SHA, not retroactively for an older merge SHA.

Acceptance cases include stale or invalid sensors, missing/revoked consent, emergency stop, malformed commands, heartbeat/transport timeouts, replay, clock rollback, and silence watchdog behavior. A model confidence value cannot bypass deterministic gate constraints. Low confidence alone is not a stop criterion; uncertainty policy remains open. The watchdog is software-polled in simulation and is not an independent physical safety controller. Reset authorization is not authenticated.

**Performance:** No representative latency, energy, thermal or hardware measurements. **Non-goals:** physical actuation, mobile installation, real robot control and safety certification.

**Rollback:** Close the unmerged E2 PR, or revert its changes after merge.

**Next:** Obtain successful exact-checkout verification, then propose a pinned ROS 2 mock-only transport adapter with reproducible fault injection; keep all physical effect endpoints unavailable.

## E2 mock-only safety hardening (draft)

E2 adds strict fail-closed rejection for missing or wrong-type sensor frames and command requests, validates the mock transport timeout, and rejects absent/incomplete watchdog observations without uncaught attribute errors. These changes close identified exception paths; they **do not** establish safety certification.

`pipeline.py` connects the existing in-memory transport/gate/watchdog to a simulated command path. `submit(envelope, now_ms)` returns a simulated result, and `tick(now_ms)` models watchdog polling when commands cease. **Polling is explicit**, not an independently scheduled process: this is neither a real-time failsafe nor a physical control system. The mock reset requires `operator_confirmed=True`, then returns zero and requires a new, valid sequence, consent, and heartbeat. The flag is not authenticated operator identity.

Run E1 and E2 together from this directory with `python -m unittest discover -p 'test_*.py' -v`. E2's new tests include missing nested fields, stop latching, replay, delayed transport, clock rollback, consent/reset behavior, emergency-stop priority, silent-command timeout, and 75 deterministic randomized invalid-input probes. The original 15-test baseline was extended to 37 E1 tests before E2; the total is validated by CI, not by a claim in this document.

The GitHub mock-only workflow now checks out the **actual PR head SHA** (or event SHA for pushes and manual dispatch), asserts exact checkout identity and a clean tree, and runs the complete E1/E2 Python test suite. A separate Forge Local QA workflow retains its repository-wide verification. No ROS 2 adapter, hardware, motors, sockets, cameras, physical e-stop, attested authorization, or deployment is included. Do **not** connect this experiment to real actuators.

Review gate: inspect fail-closed semantics, state transition and reset authorization model, exact-head CI and Forge Local QA before any future scope promotion. Keep this PR draft and do not merge or deploy without explicit authorization.
