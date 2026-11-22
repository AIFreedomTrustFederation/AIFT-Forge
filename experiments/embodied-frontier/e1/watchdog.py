"""Simulation-only independent polling watchdog; never drives actuators."""
from dataclasses import dataclass

@dataclass(frozen=True)
class WatchdogResult:
    simulated_speed_mps: float
    reason: str
    accepted: bool

class MockWatchdog:
    """A simulated supervisor that stops even when no new commands arrive."""
    def __init__(self, max_silence_ms=250):
        if type(max_silence_ms) is not int or max_silence_ms <= 0:
            raise ValueError('invalid timeout')
        self.max_silence_ms = max_silence_ms
        self.last_time_ms = None
        self.last_command_ms = None
        self.speed = 0.0
        self.latched_stop = False

    def _stop(self, reason):
        self.speed = 0.0
        self.latched_stop = True
        return WatchdogResult(0.0, reason, False)

    def tick(self, now_ms):
        if type(now_ms) is not int or now_ms < 0 or (self.last_time_ms is not None and now_ms < self.last_time_ms):
            return self._stop('clock_invalid')
        self.last_time_ms = now_ms
        if self.latched_stop:
            return WatchdogResult(0.0, 'latched_stop', False)
        if self.last_command_ms is not None and now_ms - self.last_command_ms > self.max_silence_ms:
            return self._stop('command_silence')
        return WatchdogResult(self.speed, 'simulated_only', self.last_command_ms is not None)

    def observe(self, result, now_ms):
        state = self.tick(now_ms)
        if self.latched_stop:
            return state
        try:
            accepted = result.accepted
        except (AttributeError, TypeError):
            return self._stop('invalid_result')
        if type(accepted) is not bool:
            return self._stop('invalid_result')
        if not accepted:
            return self._stop('upstream_rejected')
        try:
            speed = result.simulated_speed_mps
        except (AttributeError, TypeError):
            return self._stop('invalid_result')
        if type(speed) not in (float, int) or not 0 <= speed <= 0.25:
            return self._stop('invalid_speed')
        self.last_command_ms = now_ms
        self.speed = float(speed)
        return WatchdogResult(self.speed, 'simulated_only', True)

    def reset(self):
        """Mock-only reset; clears active command and requires fresh upstream consent."""
        self.latched_stop = False
        self.speed = 0.0
        self.last_command_ms = None
