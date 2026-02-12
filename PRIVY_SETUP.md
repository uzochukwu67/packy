# Privy Integration Setup Guide

## Overview
Privy has been successfully integrated into Phantasma to enable:
- ✅ Social login (Email, Google, Twitter, Discord)
- ✅ Embedded wallets (users without crypto wallets)
- ✅ External wallet connection (MetaMask, WalletConnect, Coinbase Wallet)
- ✅ Mobile-first UX with deep linking
- ✅ Seamless onboarding for Web2 users

## What Changed

### 1. Dependencies Added
```json
"@privy-io/react-auth": "^3.13.1"
"@privy-io/wagmi": "^4.0.1"
```

### 2. Files Modified
- ✅ `client/src/App.tsx` - Added PrivyProvider wrapper
- ✅ `client/src/lib/wagmi.ts` - Added WalletConnect & Coinbase connectors
- ✅ `client/src/components/wallet/WalletButton.tsx` - New component for wallet connection
- ✅ `client/src/components/layout/Sidebar.tsx` - Updated to use Privy hooks
- ✅ `client/src/components/layout/MainLayout.tsx` - Added mobile wallet UI

### 3. New Features
- **Desktop**: Wallet connection in sidebar (existing location)
- **Mobile**: Full wallet UI in hamburger menu with balance, points, and faucet
- **Social Login**: Users can sign in with email, Google, Twitter, or Discord
- **Embedded Wallets**: Auto-created for users without existing wallets
- **Multi-Wallet**: Supports injected, WalletConnect, and Coinbase Wallet

## Setup Instructions

### Step 1: Get Your Privy App ID
1. Go to [Privy Dashboard](https://dashboard.privy.io/)
2. Sign up or log in
3. Create a new app
4. Copy your **App ID** (looks like `clxxx...`)

### Step 2: Add Environment Variables
Add to your `.env` file:
```bash
# Privy Configuration
VITE_PRIVY_APP_ID=your_privy_app_id_here

# WalletConnect Project ID (optional but recommended)
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here
```

**To get WalletConnect Project ID** (optional but recommended for mobile):
1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a project
3. Copy the Project ID

### Step 3: Configure Privy Settings
In your Privy Dashboard:

1. **Allowed Domains**:
   - Add your development URL: `http://localhost:5000`
   - Add your production URL: `https://your-domain.com`

2. **Login Methods** (already configured in code):
   - Email ✅
   - Google ✅
   - Twitter ✅
   - Discord ✅
   - Wallet (MetaMask, WalletConnect, Coinbase) ✅

3. **Embedded Wallets**:
   - Enabled for users without wallets ✅

4. **Supported Networks**:
   - Add BNB Smart Chain Testnet (Chain ID: 97)

### Step 4: Update Branding (Optional)
Update in `client/src/App.tsx`:
```typescript
appearance: {
  theme: 'dark',
  accentColor: '#06b6d4', // Change to your brand color
  logo: 'https://your-domain.com/logo.png', // Your logo URL
}
```

## Testing

### Desktop Testing
1. Start your dev server: `npm run dev`
2. Open the app in browser
3. Click "Connect Wallet" in sidebar
4. Try different login methods:
   - Email
   - Google
   - External wallet (MetaMask)

### Mobile Testing
1. Open app on mobile device or use browser DevTools mobile view
2. Click hamburger menu (top-left)
3. Scroll to bottom to see wallet section
4. Click "Connect Wallet"
5. Try:
   - Email login → Auto-creates embedded wallet
   - WalletConnect → Opens your mobile wallet app (Trust, MetaMask, etc.)
   - Social login → Google, Twitter, Discord

## How It Works

### For Users Without Wallets (Web2)
1. User clicks "Connect Wallet"
2. Chooses email/Google/Twitter/Discord
3. Privy auto-creates an embedded wallet
4. User can immediately start betting
5. Wallet is secured by their social login

### For Crypto Users (Web3)
1. User clicks "Connect Wallet"
2. Chooses external wallet option
3. Connects MetaMask, WalletConnect, or Coinbase Wallet
4. Uses their existing wallet

### Mobile Users
1. Open app on mobile
2. Click hamburger menu
3. Connect via:
   - **WalletConnect**: Opens their wallet app (Trust, Rainbow, etc.)
   - **Social**: Creates embedded wallet
   - **MetaMask Mobile**: Uses in-app browser

## Troubleshooting

### Issue: "Invalid App ID"
**Solution**: Make sure you've set `VITE_PRIVY_APP_ID` in `.env` file

### Issue: WalletConnect not working
**Solution**:
1. Get a WalletConnect Project ID from cloud.walletconnect.com
2. Add `VITE_WALLETCONNECT_PROJECT_ID` to `.env`

### Issue: Social login redirects failing
**Solution**: Add your domain to Privy Dashboard → Settings → Allowed Domains

### Issue: Network not supported
**Solution**: In Privy Dashboard, add BNB Testnet (Chain ID: 97) to supported networks

## Migration from Old Wallet System

### Before (Old Code)
```typescript
// Only injected wallets
const { connect } = useConnect();
const { address } = useAccount();
connect({ connector: injected() });
```

### After (New Code)
```typescript
// Multi-wallet + social login
const { login, authenticated, user } = usePrivy();
const { wallets } = useWallets();
const address = wallets[0]?.address;
```

## Production Checklist
- [ ] Set production `VITE_PRIVY_APP_ID`
- [ ] Set production `VITE_WALLETCONNECT_PROJECT_ID`
- [ ] Add production domain to Privy Dashboard
- [ ] Update logo URL in App.tsx
- [ ] Test all login methods
- [ ] Test on real mobile devices
- [ ] Add BNB Mainnet when deploying to production

## Support
- Privy Docs: https://docs.privy.io/
- WalletConnect Docs: https://docs.walletconnect.com/
- Support: Contact Privy team via dashboard

## Next Steps
1. Get your Privy App ID
2. Add to `.env` file
3. Test the integration
4. Customize branding
5. Deploy to production

---

🎉 **You're all set!** Users can now connect with email, social login, or crypto wallets on both desktop and mobile.
