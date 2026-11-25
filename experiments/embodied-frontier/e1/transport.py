"""Stateful in-memory mock transport. No ROS, network or actuator I/O."""
from dataclasses import dataclass
from sim import Frame, Request, Result, run

@dataclass(frozen=True)
class Envelope:
    sequence: int
    sent_ms: int
    frame: Frame
    request: Request

class MockTransport:
    def __init__(self, max_age_ms=250):
        if type(max_age_ms) is not int or max_age_ms <= 0:
            raise ValueError('invalid max age')
        self.max_age_ms = max_age_ms
        self.last_sequence = -1
        self.last_now_ms = -1
        self.latched_stop = False

    def reset(self):
        """Simulated operator reset; does not restore consent."""
        self.latched_stop = False

    def deliver(self, envelope, now_ms):
        def stop(reason):
            self.latched_stop = True
            return Result(0.0, reason, False)
        if type(now_ms) is not int or now_ms < 0 or now_ms < self.last_now_ms:
            return stop('clock_invalid')
        self.last_now_ms = now_ms
        if self.latched_stop:
            return Result(0.0, 'latched_stop', False)
        if type(envelope) is not Envelope or type(envelope.sequence) is not int or type(envelope.sent_ms) is not int:
            return stop('malformed_envelope')
        if envelope.sequence <= self.last_sequence:
            return stop('replay')
        self.last_sequence = envelope.sequence
        if envelope.sent_ms < 0 or envelope.sent_ms > now_ms or now_ms - envelope.sent_ms > self.max_age_ms:
            return stop('transport_timeout')
        result = run(envelope.frame, envelope.request)
        if not result.accepted:
            self.latched_stop = True
        return result
