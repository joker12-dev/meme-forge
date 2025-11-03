# Contract Verification Guide

## Otomatik Kontrat Doğrulama

BSC Testnet veya Mainnet'te deploy edilen kontratları otomatik olarak doğrulamak için iki yöntem:

### Yöntem 1: Deploy Sırasında Otomatik Doğrulama

Deploy script'i artık otomatik olarak kontratları doğrular:

```bash
# BSC Testnet'e deploy (otomatik verification ile)
npx hardhat run scripts/deploy.js --network bscTestnet

# BSC Mainnet'e deploy (otomatik verification ile)
npx hardhat run scripts/deploy.js --network bsc
```

Deploy script:
- 30 saniye bekler (BSCScan indexing için)
- MemeToken Template'i doğrular
- TokenFactory'yi doğrular
- LiquidityAdder'ı doğrular
- BSCScan linklerini gösterir

### Yöntem 2: Manuel Verification (Deploy'dan sonra)

Eğer deploy sırasında verification başarısız olduysa veya daha sonra doğrulamak isterseniz:

```bash
# Otomatik verification script'i çalıştır
npx hardhat run scripts/verify.js --network bscTestnet
```

Bu script:
- `.env` dosyasından contract adreslerini okur
- Her kontrat için 3 deneme yapar
- Başarısız denemeler arasında 10 saniye bekler
- Detaylı log çıktısı verir
- BSCScan linklerini gösterir

### Yöntem 3: Tek Kontrat Manuel Doğrulama

Belirli bir kontratı manuel olarak doğrulamak için:

```bash
# MemeToken Template
npx hardhat verify --network bscTestnet CONTRAT_ADRESI "Template" "TEMP" "1000000000000000000000000" ROUTER_ADRESI

# TokenFactory
npx hardhat verify --network bscTestnet FACTORY_ADRESI PLATFORM_WALLET MARKETING_WALLET DEV_WALLET COMMISSION_WALLET ROUTER_ADRESI

# LiquidityAdder
npx hardhat verify --network bscTestnet LIQUIDITY_ADDER_ADRESI ROUTER_ADRESI "100000000000000000000" "10000000000000000" 500 FEE_WALLET
```

## Gereksinimler

### 1. BscScan API Key

`.env` dosyasında BscScan API key'iniz olmalı:

```env
BSCSCAN_API_KEY=your_api_key_here
```

API key almak için:
1. https://bscscan.com/register (Mainnet için)
2. https://testnet.bscscan.com/register (Testnet için)
3. API-KEYs sekmesinden yeni key oluştur

### 2. Hardhat Config

`hardhat.config.js` dosyasında etherscan ayarları doğru yapılmış olmalı:

```javascript
etherscan: {
  apiKey: {
    bsc: process.env.BSCSCAN_API_KEY,
    bscTestnet: process.env.BSCSCAN_API_KEY,
  }
}
```

### 3. Contract Adresleri

`.env` dosyasında deploy edilmiş contract adresleri olmalı:

```env
REACT_APP_FACTORY_ADDRESS=0x...
REACT_APP_MEME_TOKEN_ADDRESS=0x...
REACT_APP_LIQUIDITY_ADDER_ADDRESS=0x...
REACT_APP_PANCAKE_ROUTER_ADDRESS=0x...
```

## Verification Süreci

1. **Deploy** → Kontratlar blockchain'e deploy edilir
2. **Bekleme (30s)** → BSCScan'in kontratları indexlemesi için
3. **Verification** → Kaynak kodu BSCScan'e gönderilir
4. **Doğrulama** → BSCScan kodu derler ve bytecode'u karşılaştırır
5. **Yayınlama** → Başarılıysa, kaynak kodu BSCScan'de görünür hale gelir

## Başarı Kontrolü

Doğrulamanın başarılı olup olmadığını kontrol edin:

1. **BSCScan'de kontrol:**
   - Testnet: https://testnet.bscscan.com/address/CONTRACT_ADDRESS#code
   - Mainnet: https://bscscan.com/address/CONTRACT_ADDRESS#code

2. **"Contract Source Code Verified"** yazısını görmelisiniz
3. **Code** sekmesinde Solidity kodunu görebilmelisiniz
4. **Read Contract** ve **Write Contract** sekmeleri aktif olmalı

## Sorun Giderme

### "Already Verified" Hatası
Kontrat zaten doğrulanmış. Sorun yok! ✅

### "Invalid API Key" Hatası
- `.env` dosyasında `BSCSCAN_API_KEY` doğru mu?
- API key aktif mi? (BscScan'de kontrol edin)

### "Unable to locate ContractCode" Hatası
- 30 saniye beklediniz mi?
- Kontrat gerçekten deploy edildi mi?
- Doğru network'te misiniz?

### "Constructor arguments" Hatası
- Constructor parametreleri doğru mu?
- Parametre tipleri eşleşiyor mu?
- Büyük sayılar için `ethers.parseEther()` kullanıldı mı?

### Retry Script
Eğer verification başarısız olursa, 5 dakika sonra tekrar deneyin:

```bash
# 5 dakika bekle, sonra tekrar dene
sleep 300; npx hardhat run scripts/verify.js --network bscTestnet
```

## Avantajlar

✅ **Şeffaflık:** Kullanıcılar kaynak kodunu görebilir
✅ **Güven:** Kontratın ne yaptığı açıkça görülür
✅ **Etkileşim:** BSCScan üzerinden doğrudan read/write fonksiyonları
✅ **Denetim:** Kod denetimi yapılabilir
✅ **DApp Entegrasyon:** DApp'ler verified kontratları tercih eder

## Notlar

- localhost (Hardhat node) için verification atlanır
- Testnet için ücretsiz
- Mainnet için de ücretsiz ama rate limit var
- Verification genellikle 30-60 saniye sürer
- Büyük kontratlar daha uzun sürebilir
