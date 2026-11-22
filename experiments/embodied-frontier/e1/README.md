# Embodied Frontier E1: mock-only pipeline

**Classification:** Python-only mock simulation; not ROS 2 simulation, real-time supervision, or certified robotics safety.

The experiment models sensor input, proposed commands, deterministic gate decisions, a mock-only transport and a polled command-silence watchdog. It performs no motor control, ROS publication, camera capture, network access or device I/O. All reported motion is a simulated value.

Run from this directory: `python -m unittest discover -p 'test_*.py' -v`. The historical E0 baseline covered 9 tests; E1 initially covered 15, then added transport and watchdog regressions for a reported inventory of 37. The historical pre-merge E1 workflow and Forge Local QA passed for PR #18; that is **not** proof of a test run on the actual main merge commit. See [PR #18](https://github.com/AIFreedomTrustFederation/AIFT-Forge/pull/18) and [pre-merge E1 run](https://github.com/AIFreedomTrustFederation/AIFT-Forge/actions/runs/45028268749).

**Verification gap:** Merge commit `e4921dd12aa002a2b21f77e99e0400e0a2283f58` was not independently verified by the dedicated E1 workflow after merge. This follow-up proposes running the E1 workflow on changes to `main`, with manual dispatch for the currently checked-out revision. A new successful run would establish evidence only for its recorded checkout SHA, not retroactively for an older merge SHA.

Acceptance cases include stale or invalid sensors, missing/revoked consent, emergency stop, malformed commands, heartbeat/transport timeouts, replay, clock rollback, and silence watchdog behavior. A model confidence value cannot bypass deterministic gate constraints. Low confidence alone is not a stop criterion; uncertainty policy remains open. The watchdog is software-polled in simulation and is not an independent physical safety controller. Reset authorization is not authenticated.

**Performance:** No representative latency, energy, thermal or hardware measurements. **Non-goals:** physical actuation, mobile installation, real robot control and safety certification.

**Rollback:** Close the unmerged verification PR, or revert only its workflow and README changes after merge.

**Next:** Obtain a successful exact-checkout E1 run on the updated main-branch workflow, then propose a pinned ROS 2 mock-only transport adapter with reproducible fault injection.
