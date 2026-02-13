# Web3Modal Setup Guide (FREE Alternative to Privy)

## ✅ Migration Complete!

Your app has been successfully migrated from Privy to **Web3Modal** (now Reown AppKit).

### **Why Web3Modal?**
- ✅ **100% FREE** - No monthly costs, no user limits
- ✅ **Email login** - Users can sign in with email (Web3Modal Auth)
- ✅ **Social logins** - Google, Discord, etc. (via WalletConnect)
- ✅ **WalletConnect** - Connect any mobile wallet app
- ✅ **Beautiful pre-built UI** - Professional wallet connection modal
- ✅ **Multi-wallet support** - MetaMask, Coinbase Wallet, Trust Wallet, Rainbow, and 300+ more

---

## 🚀 Quick Start - Get Your FREE Project ID (2 minutes)

### **Step 1: Get WalletConnect Project ID**
1. Go to **https://cloud.walletconnect.com/**
2. Sign up (free, no credit card required)
3. Click "Create Project"
4. Give it a name (e.g., "Phantasma Betting")
5. Copy your **Project ID** (looks like `abc123...`)

### **Step 2: Add to `.env` File**
```bash
# Replace this line in your .env file:
VITE_WALLETCONNECT_PROJECT_ID=abc123yourprojectid456
```

### **Step 3: Test It!**
```bash
npm run dev
```

That's it! 🎉

---

## What Changed

### **Files Modified:**
1. ✅ **Removed Privy** - Uninstalled `@privy-io/react-auth` and `@privy-io/wagmi`
2. ✅ **Installed Web3Modal** - Added `@web3modal/wagmi`
3. ✅ **Created `lib/web3modal.ts`** - New wagmi config with Web3Modal
4. ✅ **Updated App.tsx** - Using Web3Modal instead of PrivyProvider
5. ✅ **Updated WalletButton** - Using Web3Modal hooks
6. ✅ **Updated Sidebar & MainLayout** - Using wagmi hooks

### **Old Code (Privy):**
```typescript
// ❌ This was expensive
import { usePrivy, useWallets } from '@privy-io/react-auth';
const { authenticated, login, logout } = usePrivy();
const { wallets } = useWallets();
```

### **New Code (Web3Modal):**
```typescript
// ✅ This is FREE
import { useAccount } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
const { address, isConnected } = useAccount();
const { open } = useWeb3Modal();
```

---

## Features You Get with Web3Modal

### **1. Email Login** (FREE)
- Users enter email → Receive verification code → Wallet created
- No browser extension needed
- Works on all devices

### **2. Social Logins** (Coming Soon to Web3Modal)
- Currently supports email
- Social logins (Google, Discord, etc.) coming in future updates
- Check WalletConnect docs for latest: https://docs.walletconnect.com

### **3. WalletConnect**
- QR code on desktop → Scan with mobile wallet app
- Deep linking on mobile → Opens wallet app directly
- Supports 300+ wallet apps

### **4. Browser Wallets**
- MetaMask
- Coinbase Wallet
- Brave Wallet
- And all EIP-6963 compatible wallets

---

## Testing Your Integration

### **Desktop Flow:**
1. Start dev server: `npm run dev`
2. Go to dashboard
3. Click "Connect Wallet" in sidebar
4. See Web3Modal popup with options:
   - **Email** - Enter email, get code, create wallet
   - **WalletConnect** - Scan QR with mobile wallet
   - **Browser** - Use MetaMask/Coinbase extension

### **Mobile Flow:**
1. Open app on phone
2. Tap hamburger menu (☰)
3. Tap "Connect Wallet" at bottom
4. Choose connection method:
   - **Email** - Quick sign-up
   - **WalletConnect** - Opens your wallet app
   - **Browser** - If using MetaMask mobile browser

---

## Web3Modal Configuration

Location: `client/src/lib/web3modal.ts`

```typescript
export const config = defaultWagmiConfig({
  chains: [bscTestnet],
  projectId, // Your WalletConnect Project ID
  metadata: {
    name: 'Phantasma',
    description: 'Phantasma Betting Platform',
    url: window.location.origin,
    icons: ['https://phantasma.bet/icon.png']
  },
  enableWalletConnect: true,  // Mobile wallet apps
  enableInjected: true,        // Browser extensions
  enableEIP6963: true,         // New wallet standard
  enableCoinbase: true,        // Coinbase Wallet
});
```

### **Customization:**
In `App.tsx`:
```typescript
createWeb3Modal({
  wagmiConfig: config,
  projectId: '...',
  themeMode: 'dark',           // 'light' or 'dark'
  themeVariables: {
    '--w3m-color-mix': '#06b6d4',    // Change accent color
    '--w3m-accent': '#06b6d4',        // Button color
  }
});
```

---

## Comparison: Privy vs Web3Modal

| Feature | Privy | Web3Modal |
|---------|-------|-----------|
| **Price** | Free up to 1K users, then $240/month | **100% FREE** |
| **Email Login** | ✅ Yes | ✅ Yes |
| **Social Login** | ✅ Yes (Google, Twitter, Discord) | ⏳ Coming soon |
| **WalletConnect** | ✅ Yes | ✅ Yes |
| **Browser Wallets** | ✅ Yes | ✅ Yes |
| **Mobile Support** | ✅ Excellent | ✅ Excellent |
| **Embedded Wallets** | ✅ Yes | ✅ Yes (via email) |
| **Open Source** | ❌ No | ✅ Yes |
| **User Limit** | 1,000 free, then paid | ♾️ Unlimited |

---

## Mobile Wallet Apps That Work

With WalletConnect, users can connect:
- **Trust Wallet** (most popular)
- **MetaMask Mobile**
- **Rainbow Wallet**
- **Coinbase Wallet**
- **Argent**
- **Safe**
- **Zerion**
- **imToken**
- **TokenPocket**
- **300+ more wallets!**

---

## Troubleshooting

### **Issue: "Project ID not found"**
**Solution:**
1. Get Project ID from https://cloud.walletconnect.com
2. Add to `.env` file: `VITE_WALLETCONNECT_PROJECT_ID=your_id`
3. Restart dev server

### **Issue: Modal doesn't open**
**Solution:**
- Check browser console for errors
- Make sure Web3Modal is initialized in App.tsx
- Try clearing browser cache

### **Issue: Can't connect on mobile**
**Solution:**
- Make sure you have a wallet app installed (Trust Wallet, MetaMask, etc.)
- Try using email login instead
- Check that your Project ID is valid

### **Issue: Email login not working**
**Solution:**
- Verify Project ID is correct
- Check spam folder for verification code
- Try a different email provider

---

## Production Checklist

Before deploying to production:

- [ ] Get WalletConnect Project ID from cloud.walletconnect.com
- [ ] Add `VITE_WALLETCONNECT_PROJECT_ID` to production environment variables
- [ ] Update `metadata.url` in `lib/web3modal.ts` to your production URL
- [ ] Update `metadata.icons` with your actual logo URL
- [ ] Test on real mobile devices with different wallets
- [ ] Test email login flow
- [ ] Test WalletConnect QR code scanning
- [ ] Monitor WalletConnect dashboard for analytics

---

## Support & Documentation

- **Web3Modal Docs:** https://docs.walletconnect.com/appkit/overview
- **WalletConnect Cloud:** https://cloud.walletconnect.com
- **Wagmi Docs:** https://wagmi.sh
- **GitHub Issues:** https://github.com/WalletConnect/web3modal

---

## Next Steps

1. **Get your Project ID** → https://cloud.walletconnect.com
2. **Add to `.env`** → `VITE_WALLETCONNECT_PROJECT_ID=...`
3. **Test it** → `npm run dev`
4. **Deploy** → Everything is ready!

🎉 **Your app now has FREE, unlimited wallet connections with no monthly fees!**
