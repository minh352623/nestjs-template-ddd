// Value Object ensures invariants at the core domain without leaking framework concerns
export class Email {
  private readonly value: string;

  constructor(value: string) {
    const normalized = value.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalized)) {
      throw new Error("Invalid email");
    }
    this.value = normalized;
  }

  toString(): string {
    return this.value;
  }
}
