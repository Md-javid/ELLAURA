import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, Lock, Eye, Database, Mail } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white/70 transition-colors mb-10">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#b76e79]/30 to-purple-700/30 border border-[#b76e79]/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#b76e79]" />
          </div>
          <p className="text-[10px] tracking-[0.3em] text-white/30 uppercase">Legal</p>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white/90 mb-3">Privacy Policy</h1>
        <p className="text-[13px] text-white/35 mb-10">Last updated: March 2026 · Ellaura, Coimbatore, India</p>

        <div className="space-y-8">

          {/* Section */}
          {[
            {
              icon: Eye,
              title: '1. Information We Collect',
              content: [
                'When you create an account or place an order, we collect: your name, email address, phone number, and delivery address.',
                'When you order a Custom Fit garment, we collect your body measurements (bust, waist, hips, etc.) solely to stitch your garment.',
                'We collect payment confirmation data (Razorpay transaction IDs). We never store raw card numbers, UPI PINs, or banking credentials — these are handled entirely by Razorpay\'s PCI-DSS–compliant payment gateway.',
                'We may collect basic analytics (page visits, browser type) through standard web technology to improve our website.',
              ]
            },
            {
              icon: Database,
              title: '2. How We Use Your Information',
              content: [
                'To process and fulfil your orders (including Custom Fit stitching).',
                'To send you order confirmations and shipping updates via WhatsApp or email.',
                'To pre-fill your shipping address for faster repeat checkout.',
                'To contact you if there is an issue with your order.',
                'We do NOT sell, rent, or share your personal information with third parties for marketing purposes.',
              ]
            },
            {
              icon: Lock,
              title: '3. Data Storage & Security',
              content: [
                'Your data is stored securely in Supabase (PostgreSQL), hosted on AWS infrastructure. Supabase is SOC 2 Type II compliant.',
                'All data is transmitted over HTTPS (TLS 1.2+). Passwords are never stored in plain text.',
                'Payments are processed by Razorpay, which is PCI-DSS Level 1 certified. We receive only a payment confirmation token, never your payment credentials.',
                'We apply Row Level Security (RLS) policies in our database so that you can only access your own orders, cart, and profile.',
              ]
            },
            {
              icon: Shield,
              title: '4. Cookies',
              content: [
                'We use essential cookies and browser localStorage to maintain your shopping cart and login session.',
                'We do not use tracking cookies, advertising cookies, or third-party analytics cookies.',
                'You can clear cookies at any time through your browser settings. This will log you out and clear your cart.',
              ]
            },
            {
              icon: Mail,
              title: '5. Contact & Data Requests',
              content: [
                'To request access to, correction of, or deletion of your personal data, email us at ellauraoffi@gmail.com.',
                'We will respond within 30 days of receiving your request.',
                'You may also contact us via WhatsApp at +91 90879 15193.',
              ]
            },
          ].map(({ icon: Icon, title, content }) => (
            <div key={title} className="glass rounded-[24px] border border-white/8 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-[#b76e79]/10 border border-[#b76e79]/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[#b76e79]" />
                </div>
                <h2 className="font-serif text-base font-semibold text-white/85">{title}</h2>
              </div>
              <ul className="space-y-3">
                {content.map((line, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13px] text-white/50 leading-relaxed">
                    <span className="text-[#b76e79] mt-1.5 flex-shrink-0">✦</span>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="glass rounded-[24px] border border-purple-500/15 p-6 text-center">
            <p className="text-[13px] text-white/40 leading-relaxed">
              By using Ellaura's website and services, you agree to this Privacy Policy.<br />
              For any questions, write to us at{' '}
              <a href="mailto:ellauraoffi@gmail.com" className="text-[#b76e79] hover:text-[#e8a0a8] transition-colors">
                ellauraoffi@gmail.com
              </a>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
