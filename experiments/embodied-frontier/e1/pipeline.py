"""E2 in-memory coordination only. Poll tick() to model an independent watchdog.

This module is not a physical safety system, real scheduler, ROS bridge, or actuator.
"""
from transport import MockTransport
from watchdog import MockWatchdog, WatchdogResult

class MockSafetyPipeline:
    def __init__(self, max_age_ms=250, max_silence_ms=250):
        self.transport = MockTransport(max_age_ms)
        self.watchdog = MockWatchdog(max_silence_ms)

    def submit(self, envelope, now_ms):
        """Pass one mock command through transport, gate, then mock watchdog."""
        prior = self.watchdog.tick(now_ms)
        if self.watchdog.latched_stop:
            return prior
        result = self.transport.deliver(envelope, now_ms)
        return self.watchdog.observe(result, now_ms)

    def tick(self, now_ms):
        """Explicit simulated polling; no background thread or real-time guarantee."""
        return self.watchdog.tick(now_ms)

    def reset(self, operator_confirmed=False):
        """Mock operator flag only, NOT authenticated real-world authorization."""
        if operator_confirmed is not True:
            return self.watchdog._stop('reset_denied')
        self.transport.reset()
        self.watchdog.reset()
        return WatchdogResult(0.0, 'reset_waiting_for_fresh_command', False)
