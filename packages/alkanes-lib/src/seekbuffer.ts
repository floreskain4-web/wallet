export class SeekBuffer {
  public seekIndex = 0

  constructor(private readonly buffer: { length: number; [index: number]: number }) {}

  readUInt8(): number | undefined {
    if (this.isFinished()) return undefined
    return this.buffer[this.seekIndex++]
  }

  isFinished(): boolean {
    return this.seekIndex >= this.buffer.length
  }
}
