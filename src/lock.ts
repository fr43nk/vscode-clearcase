
export class Lock {
  private m_count: number;
  constructor(private m_accessCnt: number) {
    this.m_count = 0;
  }
  public reserve(): boolean {
    const s = this.m_count;
    this.m_count++;
    return (s < this.m_accessCnt);
  }

  public release() {
    this.m_count--;
  }
}
