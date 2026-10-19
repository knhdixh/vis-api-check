// Own the stream lifecycle separately from the UI, including pending permission prompts.
export class CaptureSession {
  constructor(acquire, onChange) {
    this.acquire = acquire;
    this.onChange = onChange;
    this.stream = null;
    this.pending = false;
    this.generation = 0;
  }
  async start() {
    if (this.pending || this.stream) return;
    const generation = ++this.generation;
    this.pending = true;
    this.onChange('pending');
    let candidate;
    try {
      candidate = await this.acquire();
      if (generation !== this.generation) {
        candidate.getTracks().forEach(track => track.stop());
        return;
      }
      const track = candidate.getVideoTracks()[0];
      if (!track || track.readyState === 'ended') throw new Error('No live video track');
      this.stream = candidate;
      this.pending = false;
      track.addEventListener('ended', () => {
        if (this.stream === candidate) this.stop();
      }, {once: true});
      this.onChange('sharing', candidate);
    } catch (error) {
      candidate?.getTracks().forEach(track => track.stop());
      if (generation !== this.generation) return;
      this.stream = null;
      this.pending = false;
      this.onChange('error', null, error);
    }
  }
  stop() {
    const active = this.pending || this.stream;
    this.generation++;
    const stream = this.stream;
    this.stream = null;
    this.pending = false;
    stream?.getTracks().forEach(track => track.stop());
    if (active) this.onChange('off');
  }
}
