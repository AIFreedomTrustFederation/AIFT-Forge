"""E1 mock-only fault-injection regression: no ROS, I/O, or actuators."""
import unittest
from sim import Frame, Request, run

class FaultInjection(unittest.TestCase):
    def test_network_loss_fails_closed(self):
        # Missing heartbeat represented by None, not a live network probe.
        r = run(Frame(2.0, True), Request(.2, None, True))
        self.assertFalse(r.accepted)
        self.assertEqual((r.simulated_speed_mps, r.reason), (0.0, 'heartbeat'))

    def test_recovery_requires_fresh_consent_and_heartbeat(self):
        sequence = [
            (Frame(2, True), Request(.2, 10, True), True),
            (Frame(2, True), Request(.2, None, True), False),
            (Frame(2, True), Request(.2, 10, False), False),
            (Frame(2, True), Request(.2, 10, True), True),
        ]
        for frame, request, expected in sequence:
            with self.subTest(request=request):
                self.assertEqual(run(frame, request).accepted, expected)

    def test_sensor_failure_cannot_be_overridden_by_confidence(self):
        for obstacle in (float('nan'), float('inf'), -float('inf'), None):
            with self.subTest(obstacle=obstacle):
                result = run(Frame(obstacle, True), Request(.2, 10, True, confidence=1))
                self.assertFalse(result.accepted)
                self.assertEqual(result.simulated_speed_mps, 0.0)

    def test_estop_dominates_other_faults(self):
        result = run(Frame(None, False), Request('bad', None, False, estop=True))
        self.assertEqual(result.reason, 'estop')
        self.assertEqual(result.simulated_speed_mps, 0.0)

if __name__ == '__main__':
    unittest.main()
