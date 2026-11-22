import unittest
from types import SimpleNamespace
from watchdog import MockWatchdog

class WatchdogTests(unittest.TestCase):
    def good(self): return SimpleNamespace(accepted=True, simulated_speed_mps=0.2)
    def test_initially_stopped(self):
        self.assertEqual(MockWatchdog().tick(0).simulated_speed_mps, 0)
    def test_command_then_silence(self):
        w=MockWatchdog(); self.assertTrue(w.observe(self.good(), 100).accepted)
        self.assertEqual(w.tick(350).simulated_speed_mps, .2)
        self.assertEqual(w.tick(351).reason, 'command_silence')
        self.assertEqual(w.tick(352).reason, 'latched_stop')
    def test_rejected_upstream_latches(self):
        w=MockWatchdog(); w.observe(self.good(), 100)
        self.assertEqual(w.observe(SimpleNamespace(accepted=False,simulated_speed_mps=0),110).reason,'upstream_rejected')
        self.assertFalse(w.observe(self.good(),120).accepted)
    def test_clock_rollback_latches(self):
        w=MockWatchdog(); w.observe(self.good(), 100)
        self.assertEqual(w.tick(99).reason,'clock_invalid')
    def test_invalid_speed_rejected(self):
        for speed in (True, -1, 0.26, float('nan'), float('inf')):
            w=MockWatchdog(); self.assertEqual(w.observe(SimpleNamespace(accepted=True,simulated_speed_mps=speed),100).reason,'invalid_speed')
    def test_reset_requires_new_command(self):
        w=MockWatchdog(); w.observe(self.good(),100); w.tick(400); w.reset()
        self.assertEqual(w.tick(401).simulated_speed_mps,0)
        self.assertFalse(w.tick(401).accepted)
        self.assertTrue(w.observe(self.good(),402).accepted)
    def test_bad_time(self):
        w=MockWatchdog(); self.assertEqual(w.tick(True).reason,'clock_invalid')
    def test_invalid_timeout(self):
        with self.assertRaises(ValueError): MockWatchdog(0)
if __name__ == '__main__': unittest.main()
