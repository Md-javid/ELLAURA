import { Link } from 'react-router-dom'
import { ArrowLeft, FileText, ShoppingBag, RotateCcw, Scissors, CreditCard, AlertTriangle } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white/70 transition-colors mb-10">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600/30 to-[#b76e79]/30 border border-purple-500/30 flex items-center justify-center">
            <FileText className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-[10px] tracking-[0.3em] text-white/30 uppercase">Legal</p>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white/90 mb-3">Terms of Service</h1>
        <p className="text-[13px] text-white/35 mb-10">Last updated: March 2026 · Ellaura, Coimbatore, India</p>

        <div className="space-y-8">

          {[
            {
              icon: ShoppingBag,
              title: '1. Orders & Pricing',
              content: [
                'All prices on Ellaura.in are listed in Indian Rupees (₹) and are inclusive of all applicable taxes.',
                'Prices are subject to change without prior notice. The price shown at the time of placing your order is final for that order.',
                'Each order is a confirmation of purchase for the specific items, sizes, and colours selected.',
                'Ellaura reserves the right to cancel orders in the case of pricing errors, stock unavailability, or suspected fraud.',
              ]
            },
            {
              icon: CreditCard,
              title: '2. Payment Policy — Online Only',
              content: [
                'We accept online payments only: UPI, Credit/Debit cards, Net Banking, and digital wallets via Razorpay.',
                'Cash on Delivery (COD) is NOT available. Every Ellaura piece is hand-stitched to order. A last-minute COD cancellation would waste artisan hours and premium fabric.',
                'Your payment is processed securely by Razorpay (PCI-DSS certified). Ellaura never stores your payment credentials.',
                'Payment confirmation is sent via WhatsApp and email after a successful transaction.',
              ]
            },
            {
              icon: Scissors,
              title: '3. Custom Fit & Made-to-Order',
              content: [
                'Most Ellaura garments are made to order — production begins the moment your payment clears.',
                'Custom Fit orders require you to provide accurate body measurements. Ellaura is not responsible for fit issues caused by incorrect measurements provided by the customer.',
                'Standard delivery is 5–10 business days from order confirmation. Custom Fit orders may take 7–14 business days.',
                'Delivery timelines are estimates and may vary due to fabric sourcing, artisan workload, or courier delays.',
              ]
            },
            {
              icon: RotateCcw,
              title: '4. Returns & Exchanges',
              content: [
                'You may request a return or exchange within 7 days of receiving your order, provided the item is unworn, unwashed, and in its original packaging.',
                'Custom Fit garments cannot be returned unless they are defective or were incorrectly stitched.',
                'To initiate a return, contact us on WhatsApp (+91 90879 15193) or email ellauraoffi@gmail.com with photos of the item.',
                'Refunds for eligible returns will be processed to your original payment method within 5–7 business days.',
                'Return shipping costs are borne by the customer unless the return is due to a manufacturing defect.',
              ]
            },
            {
              icon: AlertTriangle,
              title: '5. Limitation of Liability',
              content: [
                'Ellaura\'s liability for any claim arising from a purchase is limited to the value of the order in question.',
                'We are not liable for delays caused by courier partners, natural disasters, or other events beyond our control.',
                'Product colours may appear slightly different on screen due to monitor calibration. We do our best to represent colours accurately.',
                'Ellaura reserves the right to update these Terms at any time. Continued use of the website constitutes acceptance of the updated Terms.',
              ]
            },
            {
              icon: FileText,
              title: '6. Governing Law',
              content: [
                'These Terms are governed by the laws of India and the Consumer Protection Act, 2019.',
                'Any disputes shall be subject to the exclusive jurisdiction of courts in Coimbatore, Tamil Nadu.',
                'For any grievances, contact our team at ellauraoffi@gmail.com or +91 90879 15193.',
              ]
            },
          ].map(({ icon: Icon, title, content }) => (
            <div key={title} className="glass rounded-[24px] border border-white/8 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-purple-400" />
                </div>
                <h2 className="font-serif text-base font-semibold text-white/85">{title}</h2>
              </div>
              <ul className="space-y-3">
                {content.map((line, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13px] text-white/50 leading-relaxed">
                    <span className="text-purple-400 mt-1.5 flex-shrink-0">✦</span>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="glass rounded-[24px] border border-[#b76e79]/15 p-6 text-center">
            <p className="text-[13px] text-white/40 leading-relaxed">
              By purchasing from Ellaura, you agree to these Terms of Service.<br />
              Questions? Reach us at{' '}
              <a href="mailto:ellauraoffi@gmail.com" className="text-[#b76e79] hover:text-[#e8a0a8] transition-colors">
                ellauraoffi@gmail.com
              </a>
              {' '}or WhatsApp{' '}
              <a href="https://wa.me/919087915193" target="_blank" rel="noopener noreferrer" className="text-[#b76e79] hover:text-[#e8a0a8] transition-colors">
                +91 90879 15193
              </a>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
