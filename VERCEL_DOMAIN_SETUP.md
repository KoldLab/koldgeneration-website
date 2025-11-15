# Setting Up Custom Domain on Vercel

This guide will help you configure your custom domain (`www.koldgeneration.com`) on Vercel.

## Step 1: Add Domain in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (`koldgeneration-website`)
3. Go to **Settings** → **Domains** (left sidebar)
4. Click **"Add Domain"** button
5. Enter your domain: `www.koldgeneration.com`
6. Click **"Add"**

## Step 2: Configure DNS Records

Vercel will show you DNS records to add. You'll need to add these at your domain registrar (where you bought the domain).

### If Vercel Shows These Records:

**Option A: CNAME Record (Recommended)**
- **Type**: `CNAME`
- **Name**: `www`
- **Value**: `cname.vercel-dns.com` (or similar - Vercel will show you the exact value)
- **TTL**: 3600 (or default)

**Option B: A Record (Alternative)**
- **Type**: `A`
- **Name**: `www`
- **Value**: `76.76.21.21` (Vercel will show you the exact IPs)
- **TTL**: 3600 (or default)

### Adding DNS Records at Your Registrar:

1. Go to your domain registrar (where you bought `koldgeneration.com`)
   - Examples: GoDaddy, Namecheap, Cloudflare, Google Domains, etc.
2. Find **DNS Management** or **DNS Settings**
3. Look for **DNS Records** or **Records**
4. Add the CNAME or A record Vercel provided:
   - Click **"Add Record"** or **"Add"**
   - Select the Type (CNAME or A)
   - Enter the Name (`www`)
   - Enter the Value (what Vercel gave you)
   - Save

### Common Registrars:

**GoDaddy:**
1. Go to "DNS" → "Records"
2. Click "Add" → Select Type → Enter Name/Value → Save

**Namecheap:**
1. Go to "Advanced DNS"
2. Click "Add New Record" → Enter details → Save

**Cloudflare:**
1. Go to DNS → Records
2. Click "Add record" → Enter details → Save

## Step 3: Wait for DNS Propagation

- DNS changes can take 5 minutes to 48 hours
- Usually takes 5-15 minutes
- Vercel will show "Pending" until DNS propagates
- Check status in Vercel Dashboard → Domains

## Step 4: Vercel Provisions SSL Certificate

Once DNS is configured correctly:
- Vercel automatically provisions an SSL certificate
- Takes 1-5 minutes after DNS propagation
- Status will change from "Pending" → "Valid" in Vercel

## Step 5: Verify Domain Works

1. Visit `https://www.koldgeneration.com`
2. You should see your site!
3. Check that HTTPS is working (padlock icon in browser)

## Step 6: Update Firebase Authorized Domains

Since you're using Firebase Auth, you need to add your custom domain:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **koldgeneration-website**
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Click **"Add domain"**
5. Enter: `www.koldgeneration.com`
6. Click **"Add"**

✅ Firebase Auth will now work from your custom domain!

## Optional: Root Domain (koldgeneration.com without www)

If you also want `koldgeneration.com` (without www) to work:

### Option A: Redirect to www (Recommended)

1. In Vercel Dashboard → Domains
2. Add domain: `koldgeneration.com`
3. Vercel will show DNS records (usually A records pointing to IPs)
4. Add those records at your registrar
5. Vercel will automatically redirect `koldgeneration.com` → `www.koldgeneration.com`

### Option B: Use Both

1. Add both domains in Vercel:
   - `www.koldgeneration.com`
   - `koldgeneration.com`
2. Configure DNS for both
3. Both will work (same content)

## Troubleshooting

### Issue: Domain shows "Pending" for a long time
**Solution**: 
- Check DNS records are correct at your registrar
- Wait up to 48 hours (usually much faster)
- Use a DNS checker tool like [whatsmydns.net](https://www.whatsmydns.net)

### Issue: SSL certificate not provisioning
**Solution**:
- Wait for DNS to fully propagate
- Make sure DNS records are correct
- Contact Vercel support if stuck

### Issue: Domain works but Firebase Auth doesn't
**Solution**: 
- Make sure you added `www.koldgeneration.com` to Firebase Authorized Domains
- Check that you're using `https://` not `http://`

### Issue: "Domain already in use" error
**Solution**:
- Remove the domain from Firebase Hosting first
- Go to Firebase Console → Hosting → Remove domain
- Then add it to Vercel

## After Domain is Set Up

✅ Your site is live at: `https://www.koldgeneration.com`
✅ HTTPS is automatic (SSL certificate)
✅ Firebase Auth works
✅ Firestore works
✅ All routes work (SPA routing)

## Next Steps

- Remove domain from Firebase Hosting (if you haven't already)
- Update any hardcoded URLs in your code/docs
- Test all functionality on the custom domain
- Celebrate! 🎉

