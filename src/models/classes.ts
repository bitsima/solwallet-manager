import { PublicKey } from "@solana/web3.js";
import { CONNECTION } from '../index';

export class Wallet {
    walletName: string;
    balance: number;
    publicKey: string;
    secretKey: Uint8Array

    constructor(walletName: string, publicKey: string, secretKey: Uint8Array, balance?: number) {
        this.walletName = walletName;
        this.publicKey = publicKey;
        this.secretKey = secretKey;

        if (balance) {
            this.balance = balance;
        }
        else {
            const address = new PublicKey(publicKey);
            CONNECTION.getBalance(address).then(latest => {
                this.balance = latest;
            });
        }
    }


    /**
     * Checks if the current balance is the same with the one provided in the wallets.json.
     * If not, updates the balance value and throws an error to alert the user of the update.
     */
    public checkBalance(): void {
        const address = new PublicKey(this.publicKey);
        CONNECTION.getBalance(address).then(latest => {
            this.balance = latest;
            if (latest != this.balance) {
                throw new Error('Balance mismatch. System balance differs from provided balance.');
            }
        });
    }
}