"""E2 deterministic mock-only integration and fault injection. Zero I/O."""
import random
import unittest
from types import SimpleNamespace
from sim import Frame, Request, run
from transport import Envelope, MockTransport
from watchdog import MockWatchdog
from pipeline import MockSafetyPipeline

class E2FailClosed(unittest.TestCase):
    def packet(self, seq=1, sent=100, frame=None, request=None):
        return Envelope(seq, sent,
                        Frame(2.0, True) if frame is None else frame,
                        Request(.2, 10, True) if request is None else request)

    def test_missing_frame(self):
        r = run(None, Request(.2, 10, True))
        self.assertEqual((r.accepted, r.simulated_speed_mps, r.reason), (False, 0, 'invalid_frame'))

    def test_missing_request(self):
        r = run(Frame(2.0, True), None)
        self.assertEqual((r.accepted, r.simulated_speed_mps, r.reason), (False, 0, 'invalid_request'))

    def test_wrong_types_fail_closed(self):
        for frame, req, reason in [(object(), Request(.2, 10, True), 'invalid_frame'),
                                   (Frame(2, True), object(), 'invalid_request')]:
            with self.subTest(reason=reason):
                r = run(frame, req)
                self.assertEqual((r.reason, r.simulated_speed_mps), (reason, 0))

    def test_missing_nested_frame_latches_transport(self):
        t = MockTransport()
        r = t.deliver(Envelope(1, 100, None, Request(.2, 10, True)), 101)
        self.assertEqual((r.reason, r.simulated_speed_mps), ('invalid_frame', 0))
        self.assertEqual(t.deliver(self.packet(2, 110), 111).reason, 'latched_stop')

    def test_missing_nested_request_latches_transport(self):
        t = MockTransport()
        r = t.deliver(Envelope(1, 100, Frame(2, True), None), 101)
        self.assertEqual((r.reason, r.simulated_speed_mps), ('invalid_request', 0))
        self.assertEqual(t.deliver(self.packet(2, 110), 111).reason, 'latched_stop')

    def test_transport_invalid_constructor_timeout(self):
        for value in (0, -1, True, '250', None):
            with self.subTest(value=value), self.assertRaises(ValueError):
                MockTransport(value)

    def test_watchdog_missing_result_latches(self):
        w = MockWatchdog()
        r = w.observe(None, 100)
        self.assertEqual((r.reason, r.simulated_speed_mps), ('invalid_result', 0))
        self.assertEqual(w.tick(101).reason, 'latched_stop')

    def test_watchdog_incomplete_result_latches(self):
        for candidate in (SimpleNamespace(accepted=True), SimpleNamespace(accepted='yes'), object()):
            with self.subTest(candidate=candidate):
                w = MockWatchdog()
                r = w.observe(candidate, 100)
                self.assertEqual((r.reason, r.simulated_speed_mps), ('invalid_result', 0))

    def test_pipeline_nominal_and_silent_timeout(self):
        p = MockSafetyPipeline()
        self.assertFalse(p.tick(0).accepted)
        self.assertTrue(p.submit(self.packet(), 110).accepted)
        self.assertEqual(p.tick(360).simulated_speed_mps, .2)
        self.assertEqual(p.tick(361).reason, 'command_silence')
        self.assertEqual(p.submit(self.packet(2, 370), 371).reason, 'latched_stop')

    def test_pipeline_replay_stops_and_stays_stopped(self):
        p = MockSafetyPipeline()
        self.assertTrue(p.submit(self.packet(), 110).accepted)
        self.assertEqual(p.submit(self.packet(), 120).reason, 'upstream_rejected')
        self.assertEqual(p.submit(self.packet(2, 130), 131).simulated_speed_mps, 0)

    def test_pipeline_consent_and_reset(self):
        p = MockSafetyPipeline()
        self.assertTrue(p.submit(self.packet(), 110).accepted)
        self.assertEqual(p.submit(Envelope(2, 120, Frame(2, True), Request(.2, 10, False)), 121).reason, 'upstream_rejected')
        self.assertEqual(p.reset().reason, 'reset_denied')
        self.assertEqual(p.reset(operator_confirmed=True).simulated_speed_mps, 0)
        self.assertFalse(p.tick(122).accepted)
        self.assertEqual(p.submit(Envelope(3, 130, Frame(2, True), Request(.2, 10, False)), 131).simulated_speed_mps, 0)
        self.assertEqual(p.reset(operator_confirmed=True).simulated_speed_mps, 0)
        self.assertTrue(p.submit(self.packet(4, 140), 141).accepted)

    def test_pipeline_estop_wins_over_high_confidence(self):
        p = MockSafetyPipeline()
        packet = Envelope(1, 100, Frame(.05, False), Request(.2, 10, True, estop=True, confidence=1))
        result = p.submit(packet, 110)
        self.assertFalse(result.accepted)
        self.assertEqual(result.simulated_speed_mps, 0)
        self.assertEqual(p.submit(self.packet(2, 120), 121).reason, 'latched_stop')

    def test_pipeline_stale_timestamp(self):
        p = MockSafetyPipeline(max_age_ms=20)
        self.assertEqual(p.submit(self.packet(sent=100), 121).reason, 'upstream_rejected')
        self.assertEqual(p.tick(122).simulated_speed_mps, 0)

    def test_pipeline_clock_rollback(self):
        p = MockSafetyPipeline()
        self.assertTrue(p.submit(self.packet(), 110).accepted)
        self.assertEqual(p.tick(109).reason, 'clock_invalid')
        self.assertEqual(p.submit(self.packet(2, 130), 131).simulated_speed_mps, 0)

    def test_pipeline_malformed_payload(self):
        p = MockSafetyPipeline()
        self.assertEqual(p.submit(Envelope(1, 100, None, None), 110).reason, 'upstream_rejected')
        self.assertEqual(p.tick(120).simulated_speed_mps, 0)

    def test_deterministic_fault_matrix(self):
        rng = random.Random(721)
        for i in range(75):
            p = MockSafetyPipeline()
            obstacle = rng.choice([-.01, .1, .49, float('nan'), float('inf'), None])
            speed = rng.choice([-.1, .26, 1.0, 'fast'])
            heartbeat = rng.choice([-1, 251, None, True])
            frame = Frame(obstacle, True)
            request = Request(speed, heartbeat, True, confidence=1.0)
            result = p.submit(Envelope(1, 100, frame, request), 110)
            self.assertFalse(result.accepted, i)
            self.assertEqual(result.simulated_speed_mps, 0.0, i)
            self.assertEqual(p.tick(111).simulated_speed_mps, 0.0, i)

if __name__ == '__main__': unittest.main()
