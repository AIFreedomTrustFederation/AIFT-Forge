import unittest
from sim import Frame, Request, run

class PipelineTests(unittest.TestCase):
    def setUp(self):
        self.f = Frame(2.0, True)
        self.r = Request(.2, 10, True)
    def test_bounded_mock_action(self): self.assertEqual(run(self.f,self.r).simulated_speed_mps,.2)
    def test_estop(self): self.assertEqual(run(self.f,Request(.2,10,True,True)).reason,'estop')
    def test_consent(self): self.assertEqual(run(self.f,Request(.2,10,False)).reason,'no_consent')
    def test_heartbeat(self): self.assertEqual(run(self.f,Request(.2,251,True)).reason,'heartbeat')
    def test_negative_heartbeat(self): self.assertEqual(run(self.f,Request(.2,-1,True)).simulated_speed_mps,0)
    def test_speed(self): self.assertEqual(run(self.f,Request(.26,10,True)).reason,'speed_limit')
    def test_obstacle(self): self.assertEqual(run(Frame(.1,True),self.r).reason,'obstacle')
    def test_sensor_staleness(self): self.assertEqual(run(Frame(2,False),self.r).reason,'stale_sensor')
    def test_nan(self): self.assertEqual(run(Frame(float('nan'),True),self.r).reason,'invalid_numeric')
    def test_malformed(self): self.assertEqual(run(self.f,Request('fast',10,True)).reason,'invalid_numeric')
    def test_confidence_not_authority(self): self.assertTrue(run(self.f,Request(.2,10,True,confidence=0)).accepted)
    def test_confidence_cannot_override(self): self.assertFalse(run(Frame(.1,True),Request(.2,10,True,confidence=1)).accepted)
    def test_boolean_speed(self): self.assertFalse(run(self.f,Request(True,10,True)).accepted)
    def test_boolean_heartbeat(self): self.assertFalse(run(self.f,Request(.2,True,True)).accepted)
    def test_invalid_estop(self): self.assertFalse(run(self.f,Request(.2,10,True,'false')).accepted)

if __name__=='__main__': unittest.main()
