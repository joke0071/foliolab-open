/**
 * User-supplied 50-asset reference, NOT a claim that these tokens earn staking rewards.
 * mode:
 *  - 'partial': some balances/stakes can be read on-chain, not exhaustive
 *  - 'token': wallet token balance can be read on supported EVMs, protocol locks cannot
 *  - 'manual': no verified keyless watcher
 *  - 'legacy': migration/renaming requires special care
 * Only a verified scanner network ID is set for partial/token entries.
 */
const data=[
 // name | ticker | network | kind | mode | selector | concise limitation
 ['Ethereum','ETH','Ethereum','Native PoS','partial','1','ETH und ERC-20/Liquid-Staking-Tokens; Validatorguthaben auf der Beacon Chain nicht aus EVM-Adresse ableitbar'],
 ['Solana','SOL','Solana','Native PoS','partial','sol','SOL, SPL und eigene Stake-Accounts; RPC muss getProgramAccounts unterstützen'],
 ['BNB','BNB','BNB Smart Chain','Native PoS','partial','56','BNB und BEP-20-Tokens; Staking-Delegationen und DeFi-Vaults nicht vollständig'],
 ['TRON','TRX','TRON','Native DPoS','manual','','Staking 2.0/Votes benötigen einen gesonderten TRON-Adapter'],
 ['Cardano','ADA','Cardano','Ouroboros PoS','manual','','Stake-Key und Kontoadressen; erfordert einen nativen Cardano-Indexer'],
 ['Avalanche','AVAX','Avalanche P-/C-Chain','Native PoS + Liquid Staking','partial','43114','C-Chain inklusive BENQI sAVAX; natives Validator-/Delegator-Staking auf P-Chain nicht abgedeckt'],
 ['Polkadot','DOT','Polkadot','NPoS','manual','','Nominierungs-/Pool-Staking benötigt einen Substrate-Adapter'],
 ['NEAR Protocol','NEAR','NEAR','Native PoS','partial','near','Kontoguthaben und direkt gesperrtes NEAR, externe Staking-Pools nicht vollständig'],
 ['Polygon','POL','Polygon / Ethereum','PoS Delegation','partial','137','Freie POL und ERC-20; Polygon-Staking liegt über Ethereum-Verträge'],
 ['Internet Computer','ICP','ICP','Native Governance/Staking','manual','','NNS-Neuronen sind nicht automatisch Wallet-Token'],
 ['Cosmos','ATOM','Cosmos Hub','Native PoS','partial','cosmos','Liquid, delegiert und Unbonding über Cosmos-LCD; ausstehende Rewards separat'],
 ['Aptos','APT','Aptos','Native PoS','manual','','Staking-Pools verlangen einen Aptos-spezifischen Adapter'],
 ['Sui','SUI','Sui','Native PoS','manual','','Sui Foundation JSON-RPC 2026 eingestellt; gRPC/GraphQL-Adapter fehlt'],
 ['Celestia','TIA','Celestia','Native PoS','manual','','Cosmos-SDK-Verwandtschaft genügt nicht zur verifizierten Endpoint-Abfrage'],
 ['Injective','INJ','Injective','Native PoS','manual','','Separater Chain-ID-/REST-/Denom-Adapter erforderlich'],
 ['Algorand','ALGO','Algorand','PPoS / Staking','manual','','Teilnahme-/Rewards-Modell benötigt Algorand-Indexer'],
 ['Hedera','HBAR','Hedera','Native Staking','partial','hedera','Hedera-Kontosaldo; gestaktes HBAR ist derselbe Saldo, nicht zusätzlich addieren'],
 ['Cronos','CRO','Cronos / Crypto.org','Native PoS','manual','','Unterschiedliche Netzwerke und Staking-Mechanismen'],
 ['MultiversX','EGLD','MultiversX','SPoS','manual','','Native Delegationen brauchen MultiversX-API-Adapter'],
 ['Tezos','XTZ','Tezos','Liquid PoS','manual','','Delegierte und separat gestakte XTZ benötigen Tezos-Indexer'],
 ['Mina Protocol','MINA','Mina','Native PoS','manual','','Delegationen nicht über EVM-Adresse auslesbar'],
 ['Fantom','FTM','Fantom Opera / Sonic','Legacy Migration','legacy','','FTM (Opera) und Sonic S sind verschiedene Assets; keine automatische 1:1-Übernahme'],
 ['Kava','KAVA','Kava','Native PoS','manual','','Spezifisches Cosmos-LCD/Denom nötig'],
 ['Flow','FLOW','Flow','Native PoS','manual','','Flow-spezifischer Staking-Adapter nötig'],
 ['Theta Network','THETA','Theta','Native PoS','manual','','Separater Theta-Indexer erforderlich'],
 ['Synthetix','SNX','Ethereum / Optimism','DeFi Staking','token','1','SNX Token kann erscheinen; Escrow/Debt/Vault-Positionen nicht vollständig'],
 ['Aave','AAVE','Ethereum','DeFi Safety Module','token','1','AAVE Token kann erscheinen; Staking-Contract gesondert'],
 ['Chainlink','LINK','Ethereum','Oracle Staking','token','1','LINK Wallet-Token sichtbar; gestakte LINK in Verträgen nicht automatisch'],
 ['The Graph','GRT','Ethereum / Arbitrum','Protocol Delegation','token','1','GRT Token sichtbar; delegierte Stakes/Rewards protokollspezifisch'],
 ['Quant','QNT','Ethereum','Keine pauschal bestätigte Staking-Funktion','token','1','QNT-Bestand ist kein Nachweis von Staking oder Rewards'],
 ['EOS','EOS','Vaulta (vormals EOS)','Legacy DPoS','legacy','','EOS→Vaulta A Migration; historisches EOS nicht als neues A erfinden'],
 ['Oasis Network','ROSE','Oasis','Native PoS','manual','','Oasis-spezifischer Delegationsadapter erforderlich'],
 ['Neo','NEO','Neo','Governance dBFT','manual','','NEO/GAS Wahlmechanismus; kein klassisches Liquid Staking'],
 ['Chiliz','CHZ','Chiliz Chain','Native PoS','manual','','Chiliz-spezifischer Explorer-Adapter erforderlich'],
 ['Zilliqa','ZIL','Zilliqa','Native Staking','manual','','Chain-spezifischer Staking-Adapter erforderlich'],
 ['Osmosis','OSMO','Osmosis','Native PoS','manual','','Eigenes Cosmos-LCD/Denom und Superfluid Staking beachten'],
 ['dYdX','DYDX','dYdX Chain','Native PoS','manual','','dYdX Chain ist nicht automatisch Ethereum DYDX'],
 ['Maker','MKR','Ethereum / Sky','Legacy Governance/DeFi','legacy','','MKR→SKY Umstellung; heutiges SKY-Staking nicht gleich MKR-Halten'],
 ['Curve DAO','CRV','Ethereum','veCRV Vote-Locking','token','1','CRV Token erkennbar, veCRV-Lock separat'],
 ['Lido DAO','LDO','Ethereum','Governance, nicht ETH-Staking','token','1','LDO ≠ stETH. LDO im Wallet ist keine gestakte ETH-Position'],
 ['Frax Share','FXS','Ethereum','DeFi Staking','token','1','FXS Token nur; Governance-/Staking-Vaults gesondert'],
 ['GMX','GMX','Arbitrum / Avalanche','DeFi Staking','token','42161','GMX Token auf Arbitrum; staked/esGMX separat'],
 ['Pendle','PENDLE','Ethereum / Arbitrum','vePENDLE/DeFi','token','1','PENDLE Token sichtbar, Lock-/PT-/YT-Positionen gesondert'],
 ['Illuvium','ILV','Ethereum','GameFi Staking','token','1','ILV Token erkennbar, gesperrte Position im Staking-Vertrag nicht'],
 ['Axie Infinity','AXS','Ronin','GameFi Staking','manual','','Ronin-Netzwerk nicht als Ethereum-Adresse behandeln'],
 ['Ronin','RON','Ronin','DPoS','manual','','Ronin-spezifischer Staking-Adapter erforderlich'],
 ['Akash Network','AKT','Akash','Native PoS','manual','','Eigenes Cosmos-LCD/Denom nötig'],
 ['Render','RNDR / RENDER','Solana / Ethereum','Netzwerk-/Tokenmigration','partial','sol','RENDER SPL mint nur nach Verifikation; RNDR ERC-20 ist ein anderes Token'],
 ['Band Protocol','BAND','BandChain','Native PoS','manual','','Eigenes Cosmos-LCD/Denom nötig'],
 ['Trust Wallet Token','TWT','BNB Smart Chain','DeFi-Token (Staking optional)','partial','56','BNB und BEP-20-Token-Bestände; TWT-Staking oder Vaults gesondert']
];
export const STAKING_ASSETS=Object.freeze(data.map(([name,ticker,network,kind,mode,scannerNetwork,note],i)=>Object.freeze({id:i+1,name,ticker,network,kind,mode,scannerNetwork,note})));
export const STAKING_MODES=Object.freeze({
 partial:'Teilweise automatisch',
 token:'Token erkennbar, Staking gesondert',
 manual:'Manuelle Position',
 legacy:'Migration / Altbestand prüfen'
});
export function lookupStakingAsset(value){return STAKING_ASSETS.find(a=>String(a.id)===String(value))||null;}
export function stakingCoverageSummary(){
 return Object.fromEntries(Object.keys(STAKING_MODES).map(mode=>[mode,STAKING_ASSETS.filter(a=>a.mode===mode).length]));
}
