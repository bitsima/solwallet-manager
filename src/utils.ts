import * as chalk from 'chalk';
import * as readline from 'readline';
import * as fs from 'fs/promises';
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
import { WalletJson } from './models/interfaces';

/**
 * Reads the wallets.json if it exists.
 * @returns wallets array -read from the wallets.json and deserialized into Wallet instances-
 */
export async function readWallets(): Promise<Wallet[]> {
    let parsedWalletData: Wallet[] = [];

    try {
        const walletData = await fs.readFile('./wallets.json', 'utf8');
        const jsonData: WalletJson[] = JSON.parse(walletData).data;

        // Deserializing the JSON data
        parsedWalletData = jsonData.map(walletJson => {
            return new Wallet(
                walletJson.walletName,
                walletJson.publicKey,
                Uint8Array.from(walletJson.secretKey),
                walletJson.balance
            );
        });

        parsedWalletData.forEach(walletObj => {
            updateBalance(walletObj)
        });
    } catch (error) {
        // Handle file not found or invalid JSON
        console.log(`Error reading or parsing wallets.json: ${error.message}\nA new wallets.json file will be created.`);
    }
    return parsedWalletData;
}


export async function selectWallet(): Promise<Wallet> {
    let selectedWallet: Wallet;

    let wallets = await readWallets();

    if (wallets.length > 0) {
        console.log(chalk.yellow('Detected existing wallets:'));

        // Iterate though the wallets in the wallets.json
        let index: number = 0;
        wallets.forEach(wallet => {
            console.log(`[${++index}] - Wallet Name: ${wallet.walletName}, Public Key: ${wallet.publicKey}`);
        });

        // Let the user choose which wallet to use for this instance 
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question('Please enter the order number of the wallet you want to interact with: ', (orderNumber) => {

            selectedWallet = wallets[parseInt(orderNumber, 10) - 1];

            if (selectedWallet) {
                console.log(`You selected: Wallet Name: ${selectedWallet.walletName}, Public Key: ${selectedWallet.publicKey}`);
            } else {
                console.log('Invalid order number. Please try again.');
            }

            // Close the readline interface
            rl.close();

            return selectedWallet;
        });
    } else {
        console.log(chalk.gray('No existing wallets detected. If you want to create one or provide it yourself, check command "new".'));
    }
    return selectedWallet;
}

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

    // Serializing the data back to JSON
    const jsonData = {
        'data': parsedWalletData.map(wallet => ({
            walletName: wallet.walletName,
            balance: wallet.balance,
            publicKey: wallet.publicKey,
            secretKey: Array.from(wallet.secretKey)
        }))
    };

    // Update wallets.json with the new wallet info
    try {
        await fs.writeFile("./wallets.json", JSON.stringify(jsonData, null, 4), 'utf8');
        console.log('wallets.json file has been updated successfully.');
    } catch (error) {
        console.error(`Error writing to JSON file: ${error.message}`);
    }
}


export async function handleAirdrop(walletObj: Wallet, amount: number) {
    try {
        const myAddress = new PublicKey(walletObj.publicKey);
        const signature = await CONNECTION.requestAirdrop(myAddress, amount * LAMPORTS_PER_SOL);
        await CONNECTION.confirmTransaction(signature);
    } catch (error) {
        console.error('Error while handling airdrop:', error);
    }

    await updateBalance(walletObj);
}


async function updateBalance(walletObj: Wallet) {
    const oldBalance = walletObj.balance;

    try {
        await walletObj.checkBalance();
    } catch (error) {
        console.log(`Your balance on the wallet named '${walletObj.walletName}'\nhas been updated from '${oldBalance / LAMPORTS_PER_SOL}' SOL to '${walletObj.balance / LAMPORTS_PER_SOL}' SOL.`)
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