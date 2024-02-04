export interface WalletJson {
    walletName: string;
    publicKey: string;
    secretKey: Array<number>;
    balance: number;
}