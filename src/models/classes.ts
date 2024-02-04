import { PublicKey } from "@solana/web3.js";
import { CONNECTION } from '../index';

export class Wallet {
    walletName: string;
    balance: number;
    publicKey: string;
    secretKey: Uint8Array

    constructor(walletName: string, publicKey: string, secretKey: Uint8Array, balance: number) {
        this.walletName = walletName;
        this.balance = balance;
        this.publicKey = publicKey;
        this.secretKey = secretKey;
    }


    /**
     * Checks if the current balance is the same with the one provided in the wallets.json.
     * If not, updates the balance value and throws an error to alert the user of the update.
     */
    public async checkBalance(): Promise<void> {
        const address = new PublicKey(this.publicKey);
        const latest = await CONNECTION.getBalance(address);

        if (latest != this.balance) {
            this.balance = latest;
            throw new Error('Balance mismatch. System balance differs from provided balance.');
        }
    }
}