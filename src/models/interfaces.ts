export interface WalletJson {
    walletName: string;
    balance: number;
    publicKey: string;
    secretKey: Array<number>;
}