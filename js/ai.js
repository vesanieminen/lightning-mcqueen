// AI driver behavior - deliberately easy for a 4-year-old to beat

export class AIDriver {
    constructor(racer) {
        this.racer = racer;
        this.wobblePhase = Math.random() * Math.PI * 2;
        this.wobbleFrequency = 0.5 + Math.random() * 1.0;
        this.wobbleAmplitude = 0.3 + Math.random() * 0.4;

        // Each AI has slightly different behavior
        this.speedFactor = 0.6 + Math.random() * 0.25; // 60-85% of max speed
        this.reactionDelay = 0.5 + Math.random() * 0.5;

        // Target lane position
        this.targetLane = (Math.random() - 0.5) * 0.6; // stay somewhat centered
        this.laneChangeTimer = 0;
        this.laneChangeInterval = 3 + Math.random() * 5; // change lane every few seconds

        // Slow-down moments (to make it extra easy for the player)
        this.slowdownTimer = 0;
        this.slowdownInterval = 8 + Math.random() * 8;
        this.isSlowingDown = false;
        this.slowdownDuration = 1 + Math.random() * 2;
    }

    update(dt, elapsed) {
        const racer = this.racer;

        // Cap AI speed to be slower than player
        racer.maxSpeed = racer.isPlayer ? 0.0012 : (0.0009 * this.speedFactor);

        // Periodic slowdowns
        this.slowdownTimer += dt;
        if (this.isSlowingDown) {
            racer.speed *= 0.97; // brake
            if (this.slowdownTimer > this.slowdownDuration) {
                this.isSlowingDown = false;
                this.slowdownTimer = 0;
            }
        } else if (this.slowdownTimer > this.slowdownInterval) {
            this.isSlowingDown = true;
            this.slowdownTimer = 0;
        }

        // Lane changing
        this.laneChangeTimer += dt;
        if (this.laneChangeTimer > this.laneChangeInterval) {
            this.targetLane = (Math.random() - 0.5) * 0.6;
            this.laneChangeTimer = 0;
            this.laneChangeInterval = 3 + Math.random() * 5;
        }

        // Wobble effect - makes AI look less perfect
        const wobble = Math.sin(elapsed * this.wobbleFrequency + this.wobblePhase) * this.wobbleAmplitude;
        const targetOffset = this.targetLane + wobble * 0.1;

        // Steer towards target position
        const diff = targetOffset - racer.lateralOffset;
        let steerInput = 0;
        if (Math.abs(diff) > 0.02) {
            steerInput = Math.sign(diff) * Math.min(Math.abs(diff) * 2, 1);
        }

        racer.update(dt, steerInput);
    }
}
