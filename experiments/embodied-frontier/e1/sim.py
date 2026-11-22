"""AIFT mock-only E1 pipeline. No ROS middleware, sockets, or hardware interfaces."""
from dataclasses import dataclass
import math

@dataclass(frozen=True)
class Frame:
    obstacle_m: object
    sensor_fresh: bool

@dataclass(frozen=True)
class Request:
    speed_mps: object
    heartbeat_ms: object
    consent: bool
    estop: bool = False
    confidence: object = 1.0

@dataclass(frozen=True)
class Result:
    simulated_speed_mps: float
    reason: str
    accepted: bool

def finite_number(value):
    return type(value) in (float, int) and math.isfinite(value)

def run(frame: Frame, request: Request) -> Result:
    """Perception -> proposed plan -> deterministic gate -> mock action."""
    def stop(reason):
        return Result(0.0, reason, False)
    if request.estop is not False and request.estop is not True:
        return stop('invalid_estop')
    if request.estop:
        return stop('estop')
    if request.consent is not True:
        return stop('no_consent')
    if frame.sensor_fresh is not True:
        return stop('stale_sensor')
    if not all(finite_number(x) for x in (frame.obstacle_m, request.speed_mps, request.confidence)):
        return stop('invalid_numeric')
    if type(request.heartbeat_ms) is not int or not 0 <= request.heartbeat_ms <= 250:
        return stop('heartbeat')
    if not 0 <= request.confidence <= 1:
        return stop('invalid_confidence')
    if not 0 <= request.speed_mps <= 0.25:
        return stop('speed_limit')
    if frame.obstacle_m < 0.5:
        return stop('obstacle')
    return Result(float(request.speed_mps), 'simulated_only', True)
