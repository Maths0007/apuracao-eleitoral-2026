export class ContratoInesperado extends Error {
  constructor(message: string) { super(message); this.name = 'ContratoInesperado'; }
}
export class NaoConfirmado extends Error {
  constructor(public readonly referencia: string) {
    super(`Não confirmado: ${referencia}`); this.name = 'NaoConfirmado';
  }
}
