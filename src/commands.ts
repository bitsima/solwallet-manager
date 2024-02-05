import {
    Keypair,
    Connection,
    Transaction,
    SystemProgram,
    sendAndConfirmTransaction,
    PublicKey,
    LAMPORTS_PER_SOL
} from "@solana/web3.js";

import { CONNECTION } from './index';
import { Wallet } from './models/classes';
import { readWallets, writeWallets } from './helpers';



/**
 * Allows the user to provide a key pair manually or generates a new key pair if they are not given, 
 * either way, this function saves the new wallet info to the wallets.json.
 * @param walletName the chosen arbitrary name to be given to the new wallet
 */
export async function createWallet(walletName: string): Promise<void> {

    // New key pair generated
    const keypair = Keypair.generate();

    const publicKey = keypair.publicKey.toBase58();
    console.log('Your generated public key is: ', publicKey);

    const secretKeyUint8Array = keypair.secretKey;


    const parsedWalletData = await readWallets();
    const newWallet = new Wallet(walletName, publicKey, secretKeyUint8Array, 0);

    parsedWalletData.push(newWallet);

    await writeWallets(parsedWalletData);
}


export async function handleAirdrop(walletObj: Wallet, amount: number) {
    try {
        const myAddress = new PublicKey(walletObj.publicKey);
        const signature = await CONNECTION.requestAirdrop(myAddress, amount * LAMPORTS_PER_SOL);
        await CONNECTION.confirmTransaction(signature);
    } catch (error) {
        console.error('Error while handling airdrop:', error);
    }
}



/*

export async function handleBalanceCommand() {
    await checkBalance();
}

export async function handleTransferCommand(otherPublicKey: string, amount: number) {
    await transfer(otherPublicKey, amount);
}

export async function handleStatisticsCommand() {
    await getStatistics();
}

*/