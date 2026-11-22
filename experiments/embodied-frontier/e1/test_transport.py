"""Mock transport fault injection, no sockets or physical effects."""
import unittest
from sim import Frame, Request
from transport import Envelope, MockTransport

class TransportTests(unittest.TestCase):
    def setUp(self):
        self.t = MockTransport()
    def packet(self, seq=1, sent=100, consent=True, heartbeat=10):
        return Envelope(seq, sent, Frame(2.0, True), Request(.2, heartbeat, consent))
    def test_fresh_command(self):
        self.assertTrue(self.t.deliver(self.packet(), 110).accepted)
    def test_replay_latches_stop(self):
        self.t.deliver(self.packet(), 110)
        self.assertEqual(self.t.deliver(self.packet(), 120).reason, 'replay')
        self.assertEqual(self.t.deliver(self.packet(2, 130), 140).reason, 'latched_stop')
    def test_transport_loss(self):
        self.assertEqual(self.t.deliver(self.packet(), 351).reason, 'transport_timeout')
    def test_future_timestamp(self):
        self.assertEqual(self.t.deliver(self.packet(sent=200), 100).reason, 'transport_timeout')
    def test_clock_rollback(self):
        self.t.deliver(self.packet(), 110)
        self.assertEqual(self.t.deliver(self.packet(2, 100), 109).reason, 'clock_invalid')
    def test_consent_denial_latched(self):
        self.assertEqual(self.t.deliver(self.packet(consent=False), 110).reason, 'no_consent')
        self.assertEqual(self.t.deliver(self.packet(2, 120), 130).reason, 'latched_stop')
    def test_reset_does_not_restore_consent(self):
        self.t.deliver(self.packet(consent=False), 110)
        self.t.reset()
        self.assertEqual(self.t.deliver(self.packet(2, 120, consent=False), 130).reason, 'no_consent')
    def test_malformed_envelope(self):
        self.assertEqual(self.t.deliver(None, 100).reason, 'malformed_envelope')
    def test_boolean_sequence_rejected(self):
        self.assertEqual(self.t.deliver(self.packet(seq=True), 110).reason, 'malformed_envelope')
    def test_bad_heartbeat_latched(self):
        self.assertEqual(self.t.deliver(self.packet(heartbeat=None), 110).reason, 'heartbeat')
        self.assertEqual(self.t.deliver(self.packet(2, 120), 130).simulated_speed_mps, 0)

if __name__ == '__main__': unittest.main()
