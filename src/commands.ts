import * as readline from 'readline';
import {
    Keypair,
    Transaction,
    SystemProgram,
    sendAndConfirmTransaction,
    PublicKey,
    LAMPORTS_PER_SOL
} from "@solana/web3.js";

import { CONNECTION, WALLETS_MAP } from './index';
import { Wallet } from './models/classes';
import { updateBalance, writeWallets } from './helpers';
import chalk = require('chalk');

/**
 * Generates a new key pair and saves the new wallet info to the wallets.json.
 * @param walletName the chosen arbitrary name to be given to the new wallet
 */
export async function createWallet(walletName: string): Promise<void> {

    // New key pair generated
    const keypair = Keypair.generate();

    const publicKey = keypair.publicKey.toBase58();
    console.log('Your generated public key is: ', publicKey);

    const secretKeyUint8Array = keypair.secretKey;

    const newWallet = new Wallet(walletName, publicKey, secretKeyUint8Array, 0);

    // Add the new wallet to the global wallets map
    WALLETS_MAP.set(newWallet.walletName, newWallet);

    // Update wallets.json
    await writeWallets();
}

/**
 * Requests the specified amount of SOL from the network for the managed wallet.
 * @param walletObj Wallet instance to request airdrop on 
 * @param amount amount to be requested in SOL
 */
export async function handleAirdrop(walletObj: Wallet, amount: number) {
    try {
        const myAddress = new PublicKey(walletObj.publicKey);
        const signature = await CONNECTION.requestAirdrop(myAddress, amount * LAMPORTS_PER_SOL);
        await CONNECTION.confirmTransaction(signature);
    } catch (error) {
        console.error(chalk.redBright('Error while handling airdrop:'), error);
    }
    await updateBalance(walletObj);
}

/**
 * Transfers the specified amount of SOL to the specified wallet, also paying a fee in the process.
 * @param selectedWalletObj managed wallet to transfer SOL from
 * @param otherPublicKey the address to send SOL to
 * @param amount amount of SOL to send
 */
export async function transferSOL(selectedWalletObj: Wallet, otherPublicKey: string, amount: number): Promise<void> {

    // Create a transaction 
    const tx = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: new PublicKey(selectedWalletObj.publicKey),
            toPubkey: new PublicKey(otherPublicKey),
            lamports: amount * LAMPORTS_PER_SOL,
        })
    );

    const keypair = Keypair.fromSecretKey(selectedWalletObj.secretKey)

    // Set recent blockhash 
    let blockhash = (await CONNECTION.getLatestBlockhash('finalized')).blockhash;
    tx.recentBlockhash = blockhash;

    // Set feepayer for the transaction
    tx.feePayer = new PublicKey(selectedWalletObj.publicKey);

    const estimatedFee = await tx.getEstimatedFee(CONNECTION);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    // Create a Promise to wrap the rl.question
    const questionPromise = new Promise<string>((resolve) => {
        rl.question(chalk.bgCyanBright(`Estimated fee for this transaction will be: ${estimatedFee / LAMPORTS_PER_SOL} SOL. Do you want to proceed with it? [Y, n]  `), (answer = "Y") => {
            resolve(answer.trim() || "Y"); // Trim to remove leading/trailing whitespaces, set "Y" as the default
        });
    });
    // Wait for the user's input
    const answer = await questionPromise;
    // Close the readline interface
    rl.close();

    if (answer.toLowerCase() === "y") {
        console.log("Proceeding with the operation...");
    }
    else if (answer.toLowerCase() === "n") {
        console.log(chalk.magenta("Exiting the function..."));
        return;
    }
    else {
        // Handle other cases
        console.log("Invalid input. Please try again.");
        return;
    }
    // Sign and send the confirmed transaction to the network 
    try {
        const signature = await sendAndConfirmTransaction(CONNECTION, tx, [keypair]);
        console.log("Transaction successfully sent! Here is the signature: ", signature);
        // Update balance of the sender wallet in the wallets.json
        await updateBalance(selectedWalletObj);
    } catch (error) {
        console.error(chalk.redBright("There was an error while sending the transaction: "), error);
    }
}