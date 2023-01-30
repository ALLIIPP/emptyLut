const web3js = require('@solana/web3.js')
const bs58 = require('bs58')
const dotenv = require('dotenv')


dotenv.config()
 
  

//our wallet
const wallet = web3js.Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY))
const connection = new web3js.Connection(process.env.RPC_URL)

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

 
/**
 *  we sleep before sending a transaction to not overload rpc and get 429`ed
 */

empty()
async function empty() {

    const filters = [
        {
            memcmp: {
                offset: 22,     //location of our query in the account (bytes)
                bytes: wallet.publicKey,  //our search criteria, a base58 encoded string
            }
        }
    ];

    const accounts = await connection.getParsedProgramAccounts(
        new web3js.PublicKey('AddressLookupTab1e1111111111111111111111111'),
        { filters: filters }
    ).then(result => {
        return result.map((account) => {
            return new web3js.PublicKey(account.pubkey);
        })
    })


    if (accounts.length > 0) {
        console.log(accounts.length + ' accounts to empty')
        let i = 0;

        //deactivate account
         for (let account of accounts) {
               await (sleep(1000))
               i++;
               let tx = new web3js.Transaction()
               tx.add(web3js.AddressLookupTableProgram.deactivateLookupTable(
                   {
                       authority: wallet.publicKey,
                       lookupTable: account,
                   }
               ))
               let blockhash = await getConnection()
                   .getLatestBlockhash()
                   .then((res) => res.blockhash);
               tx.recentBlockhash = blockhash
               tx.sign(wallet)
   
               try {
   
                   web3js.sendAndConfirmTransaction(getConnection(), tx, [wallet], { skipPreflight: true }).catch(e => { console.log('i dont care') })
                   console.log('deactivated ' + i + '/' + accounts.length + ' accounts')
               } catch (e) {
                   console.log('send txn error : ' + e)
               }
           }
   


        // await sleep(60000) // ????????? wait till 'deactivatedslot is no longer recent"


        i = 0;
        //close account
        for (let account of accounts) {
            await sleep(1000)
            i++;
            let tx = new web3js.Transaction()
            tx.add(web3js.AddressLookupTableProgram.closeLookupTable(
                {
                    authority: wallet.publicKey,
                    lookupTable: account,
                    recipient: wallet.publicKey
                }
            ))
            let blockhash = await connection
                .getLatestBlockhash()
                .then((res) => res.blockhash);
            tx.recentBlockhash = blockhash
            tx.sign(wallet)

            try {
                connection.sendTransaction(tx, [wallet], { skipPreflight: true })
              
              
                console.log('emptied ' + i + '/' + accounts.length + ' accounts')
            } catch (e) {
                console.log('send txn error : ' + e)
            }

        }

    } else {
        console.log("no accounts to empty")
    }
    return;
}



 