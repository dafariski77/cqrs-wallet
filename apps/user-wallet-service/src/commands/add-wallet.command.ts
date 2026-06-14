export class AddWalletCommand {
  constructor(
    public readonly userId: string,
    public readonly address: string,
    public readonly chainType: 'ETHEREUM' | 'POLYGON' | 'SOLANA',
  ) {}
}
